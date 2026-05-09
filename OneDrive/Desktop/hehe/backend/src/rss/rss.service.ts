import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import Parser from 'rss-parser';
import { assertSsrfSafe } from '../common/ssrf-guard';
import { PrismaService } from '../prisma/prisma.service';

type CreateRssSourceDto = {
  url: string;
  name?: string;
  platforms: string[];
  autoPublish?: boolean;
};

type FeedItemSummary = {
  title: string;
  link: string;
  contentSnippet: string;
  pubDate?: string;
};

@Injectable()
export class RssService {
  private readonly logger = new Logger(RssService.name);
  private readonly MAX_FEED_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

  private readonly parser = new Parser();

  constructor(private readonly prisma: PrismaService) {}

  async fetchFeed(url: string): Promise<FeedItemSummary[]> {
    await assertSsrfSafe(url);

    // Fetch with a 50 MB size cap before handing off to rss-parser
    const response = await fetch(url);
    if (!response.ok) {
      throw new BadRequestException(`Failed to fetch RSS feed: HTTP ${response.status}`);
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > this.MAX_FEED_SIZE_BYTES) {
      throw new BadRequestException(
        `RSS feed exceeds 50 MB size limit (content-length: ${contentLength})`,
      );
    }

    // Stream response body and abort if it exceeds the cap
    const reader = response.body?.getReader();
    if (!reader) {
      throw new BadRequestException('RSS feed response has no body');
    }

    const chunks: Uint8Array[] = [];
    let totalBytes = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        totalBytes += value.length;
        if (totalBytes > this.MAX_FEED_SIZE_BYTES) {
          reader.cancel().catch(() => undefined);
          throw new BadRequestException('RSS feed exceeds the 50 MB size limit');
        }
        chunks.push(value);
      }
    }

    const xmlString = Buffer.concat(chunks.map((c) => Buffer.from(c))).toString('utf8');
    const feed = await this.parser.parseString(xmlString);
    return (feed.items ?? [])
      .map((item) => ({
        title: item.title?.trim() || 'Untitled RSS item',
        link: item.link?.trim() || '',
        contentSnippet: item.contentSnippet?.trim() || item.content?.trim() || '',
        pubDate: item.pubDate,
      }))
      .filter((item) => item.link);
  }

  async syncSource(sourceId: string, teamId?: string) {
    const source = await this.prisma.rssSource.findFirst({
      where: {
        id: sourceId,
        ...(teamId ? { teamId } : {}),
      },
    });

    if (!source) {
      throw new NotFoundException('RSS source not found');
    }

    const items = await this.fetchFeed(source.url);
    let createdCount = 0;

    for (const item of items) {
      const existingPost = await this.prisma.post.findFirst({
        where: {
          teamId: source.teamId,
          deletedAt: null,
          content: {
            contains: item.link,
          },
        },
        select: { id: true },
      });

      if (existingPost) {
        continue;
      }

      const content = `${item.title}\n\n${item.contentSnippet}\n\n${item.link}`.trim();
      const status = source.autoPublish ? 'scheduled' : 'draft';
      const scheduledAt = source.autoPublish ? new Date() : null;

      await this.prisma.$transaction(async (tx) => {
        const post = await tx.post.create({
          data: {
            teamId: source.teamId,
            title: item.title.slice(0, 120),
            content,
            status,
            scheduledAt,
            mediaUrls: [],
          },
        });

        if (source.platforms.length > 0) {
          await tx.postPlatform.createMany({
            data: source.platforms.map((platform) => ({
              postId: post.id,
              platform,
              status,
            })),
          });
        }
      });

      createdCount += 1;
    }

    await this.prisma.rssSource.update({
      where: { id: source.id },
      data: { lastFetch: new Date() },
    });

    return {
      sourceId: source.id,
      createdCount,
      totalItems: items.length,
    };
  }

  async createSource(teamId: string, dto: CreateRssSourceDto) {
    if (!dto.platforms.length) {
      throw new BadRequestException('At least one platform is required');
    }

    return this.prisma.rssSource.create({
      data: {
        teamId,
        url: dto.url,
        name: dto.name?.trim() || null,
        platforms: dto.platforms,
        autoPublish: dto.autoPublish ?? false,
      },
    });
  }

  async listSources(teamId: string) {
    return this.prisma.rssSource.findMany({
      where: { teamId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteSource(teamId: string, id: string) {
    const source = await this.prisma.rssSource.findFirst({
      where: { id, teamId },
      select: { id: true },
    });

    if (!source) {
      throw new NotFoundException('RSS source not found');
    }

    await this.prisma.rssSource.delete({ where: { id } });
    return { success: true };
  }

  async toggleSource(teamId: string, id: string, isActive: boolean) {
    const source = await this.prisma.rssSource.findFirst({
      where: { id, teamId },
      select: { id: true },
    });

    if (!source) {
      throw new NotFoundException('RSS source not found');
    }

    return this.prisma.rssSource.update({
      where: { id },
      data: { isActive },
    });
  }

  @Cron('0 * * * *')
  async syncActiveSources() {
    const activeSources = await this.prisma.rssSource.findMany({
      where: {
        isActive: true,
      },
      select: { id: true },
    });

    for (const source of activeSources) {
      try {
        await this.syncSource(source.id);
      } catch (error) {
        this.logger.error(`Failed to sync RSS source ${source.id}`, error as Error);
      }
    }
  }
}
