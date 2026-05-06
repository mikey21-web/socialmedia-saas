import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { CronExpressionParser } from 'cron-parser';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedRequestUser } from '../common/interfaces/authenticated-request-user.interface';
import { CreatePostDto } from './dto/create-post.dto';
import { ListPostsDto } from './dto/list-posts.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PublishingService } from '../publishing/publishing.service';
import { TeamsService } from '../teams/teams.service';

const VALID_PLATFORMS = ['twitter', 'instagram', 'linkedin', 'facebook', 'youtube', 'tiktok'] as const;
type SupportedPlatform = (typeof VALID_PLATFORMS)[number];

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly teamsService: TeamsService,
    @Optional() private readonly publishingService?: PublishingService,
  ) {}

  async createPost(user: AuthenticatedRequestUser, dto: CreatePostDto) {
    this.validatePlatforms(dto.platforms);
    this.validateContentLengthByPlatform(dto.content, dto.platforms);

    const teamId = await this.resolveTeamId(user.userId, user.team_id);
    const teamSignature = await this.teamsService.getTeamSignature(teamId);
    const normalizedSignature = teamSignature?.trim();
    const content = normalizedSignature
      ? `${dto.content}\n\n${normalizedSignature}`
      : dto.content;
    const requestedScheduledAt = dto.scheduledAt
      ? this.parseScheduledAt(dto.scheduledAt)
      : null;
    const postDelay = dto.postDelay ?? null;
    const scheduledAt =
      requestedScheduledAt && postDelay && postDelay > 0
        ? new Date(requestedScheduledAt.getTime() + postDelay * 60 * 1000)
        : requestedScheduledAt;
    const recurrenceEndAt = dto.recurrenceEndAt
      ? this.parseScheduledAt(dto.recurrenceEndAt)
      : null;
    const isRecurring = dto.isRecurring ?? false;
    const recurrencePattern = dto.recurrencePattern?.trim() || null;
    if (isRecurring && !recurrencePattern) {
      throw new BadRequestException('recurrencePattern is required when isRecurring is true');
    }
    if (dto.postSetId) {
      const postSet = await this.prisma.postSet.findFirst({
        where: { id: dto.postSetId, teamId, deletedAt: null },
        select: { id: true },
      });
      if (!postSet) {
        throw new BadRequestException('Invalid postSetId for this team');
      }
    }
    const nextPublishAt = this.computeNextPublishAt(
      isRecurring,
      recurrencePattern,
      scheduledAt ?? new Date(),
      recurrenceEndAt,
    );
    const status = scheduledAt ? 'scheduled' : 'draft';
    const title = content.trim().slice(0, 80) || 'Untitled';

    const createdPost = await this.prisma.$transaction(async (tx) => {
      const post = await tx.post.create({
        data: {
          teamId,
          title,
          content,
          mediaUrls: dto.mediaUrls ?? [],
          postDelay,
          isRecurring,
          recurrencePattern,
          recurrenceEndAt,
          nextPublishAt,
          postSetId: dto.postSetId,
          status,
          scheduledAt,
        },
        include: {
          platforms: {
            select: {
              platform: true,
              status: true,
            },
          },
        },
      });

      await tx.postPlatform.createMany({
        data: dto.platforms.map((platform) => ({
          postId: post.id,
          platform,
          status,
        })),
      });

      return tx.post.findUniqueOrThrow({
        where: { id: post.id },
        include: {
          platforms: {
            select: {
              platform: true,
              status: true,
            },
          },
        },
      });
    });

    if (scheduledAt && scheduledAt <= new Date()) {
      await this.publishingService?.publishPost(createdPost.id, teamId);
    }

    return {
      id: createdPost.id,
      content: createdPost.content,
      mediaUrls: createdPost.mediaUrls,
      platforms: createdPost.platforms,
      status: createdPost.status,
      createdAt: createdPost.createdAt,
      scheduledAt: createdPost.scheduledAt,
    };
  }

  async listPosts(user: AuthenticatedRequestUser, query: ListPostsDto) {
    const teamId = await this.resolveTeamId(user.userId, user.team_id);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const posts = await this.prisma.post.findMany({
      where: {
        teamId,
        deletedAt: null,
        ...(query.status ? { status: query.status } : {}),
      },
      include: {
        platforms: {
          select: {
            platform: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      posts: posts.map((post) => ({
        id: post.id,
        title: post.title,
        content: post.content,
        mediaUrls: post.mediaUrls,
        platforms: post.platforms,
        status: post.status,
        createdAt: post.createdAt,
        scheduledAt: post.scheduledAt,
      })),
    };
  }

  async updatePost(
    user: AuthenticatedRequestUser,
    postId: string,
    dto: UpdatePostDto,
  ) {
    const teamId = await this.resolveTeamId(user.userId, user.team_id);
    const post = await this.prisma.post.findFirst({
      where: {
        id: postId,
        deletedAt: null,
      },
      include: {
        platforms: {
          select: {
            platform: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.teamId !== teamId) {
      throw new ForbiddenException('You do not have access to this post');
    }

    if (dto.content) {
      const postPlatforms = post.platforms.map((platform) => platform.platform);
      this.validateContentLengthByPlatform(dto.content, postPlatforms);
    }

    const scheduledAt = dto.scheduledAt ? this.parseScheduledAt(dto.scheduledAt) : undefined;
    const recurrenceEndAt = dto.recurrenceEndAt
      ? this.parseScheduledAt(dto.recurrenceEndAt)
      : dto.recurrenceEndAt === null
        ? null
        : undefined;
    const recurrencePattern = dto.recurrencePattern?.trim();
    const isRecurring = dto.isRecurring;
    const nextPublishAt = isRecurring === undefined
      ? undefined
      : this.computeNextPublishAt(
        isRecurring,
        recurrencePattern ?? post.recurrencePattern,
        scheduledAt ?? post.scheduledAt ?? new Date(),
        recurrenceEndAt ?? post.recurrenceEndAt,
      );

    const updatedPost = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.post.update({
        where: { id: postId },
        data: {
          content: dto.content,
          mediaUrls: dto.mediaUrls,
          status: dto.status,
          scheduledAt,
          isRecurring,
          recurrencePattern,
          recurrenceEndAt,
          nextPublishAt,
        },
      });

      if (dto.status) {
        await tx.postPlatform.updateMany({
          where: { postId },
          data: { status: dto.status },
        });
      }

      return tx.post.findUniqueOrThrow({
        where: { id: updated.id },
        include: {
          platforms: {
            select: {
              platform: true,
              status: true,
            },
          },
        },
      });
    });

    return {
      id: updatedPost.id,
      content: updatedPost.content,
      mediaUrls: updatedPost.mediaUrls,
      platforms: updatedPost.platforms,
      status: updatedPost.status,
      createdAt: updatedPost.createdAt,
      scheduledAt: updatedPost.scheduledAt,
    };
  }

  async listRecurringPosts(teamId: string | undefined) {
    if (!teamId) {
      throw new ForbiddenException('Missing team context');
    }

    const posts = await this.prisma.post.findMany({
      where: {
        teamId,
        isRecurring: true,
        deletedAt: null,
      },
      include: {
        platforms: {
          select: {
            platform: true,
            status: true,
          },
        },
      },
      orderBy: [
        { nextPublishAt: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return {
      posts,
    };
  }

  async deletePost(user: AuthenticatedRequestUser, postId: string) {
    const teamId = await this.resolveTeamId(user.userId, user.team_id);
    const post = await this.prisma.post.findFirst({
      where: {
        id: postId,
        teamId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    await this.prisma.post.update({
      where: { id: postId },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  }

  private async resolveTeamId(userId: string, teamId?: string) {
    const membership = await this.prisma.teamMember.findFirst({
      where: teamId ? { userId, teamId } : { userId },
      select: { teamId: true },
      orderBy: { id: 'asc' },
    });

    if (!membership) {
      throw new ForbiddenException('User is not a team member');
    }

    return membership.teamId;
  }

  private validatePlatforms(platforms: string[]) {
    if (!platforms.length) {
      throw new BadRequestException('At least one platform is required');
    }

    const invalidPlatforms = platforms.filter(
      (platform) => !VALID_PLATFORMS.includes(platform as SupportedPlatform),
    );

    if (invalidPlatforms.length) {
      throw new BadRequestException(
        `Invalid platforms: ${invalidPlatforms.join(', ')}`,
      );
    }
  }

  private validateContentLengthByPlatform(content: string, platforms: string[]) {
    if (platforms.includes('twitter') && content.length > 280) {
      throw new BadRequestException(
        'Content exceeds Twitter character limit (280)',
      );
    }
  }

  private parseScheduledAt(scheduledAt: string) {
    const parsedDate = new Date(scheduledAt);

    if (Number.isNaN(parsedDate.getTime())) {
      throw new BadRequestException('scheduledAt must be a valid ISO8601 datetime');
    }

    return parsedDate;
  }

  async getPostById(user: AuthenticatedRequestUser, postId: string) {
    const teamId = await this.resolveTeamId(user.userId, user.team_id);
    const post = await this.prisma.post.findFirst({
      where: {
        id: postId,
        teamId,
        deletedAt: null,
      },
      include: {
        platforms: {
          select: { platform: true, status: true },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  private computeNextPublishAt(
    isRecurring: boolean,
    recurrencePattern: string | null,
    currentTime: Date,
    recurrenceEndAt: Date | null,
  ) {
    if (!isRecurring || !recurrencePattern) {
      return null;
    }

    try {
      const iterator = CronExpressionParser.parse(recurrencePattern, {
        currentDate: currentTime,
      });
      const next = iterator.next().toDate();
      if (recurrenceEndAt && next > recurrenceEndAt) {
        return null;
      }
      return next;
    } catch {
      throw new BadRequestException('Invalid recurrencePattern cron expression');
    }
  }
}
