import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../../prisma/prisma.service';
import { LlmService } from '../../../agents/llm/llm.service';
import { CopywriterService } from '../copywriter/copywriter.service';

export interface CounterPostResult {
  competitorPostId: string;
  competitorHandle: string;
  originalCaption: string;
  generatedContent: string;
  platform: string;
  reasoning: string;
}

@Injectable()
export class CompetitorWatcherService {
  private readonly logger = new Logger(CompetitorWatcherService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: LlmService,
    private readonly copywriter: CopywriterService,
  ) {}

  /**
   * Every 6 hours, check for new competitor posts and generate counter-posts
   */
  @Cron('0 */6 * * *')
  async watchCompetitors() {
    this.logger.log('Starting competitor watch cycle');
    const activeTrackers = await this.prisma.competitorTrack.findMany({
      where: { isActive: true },
      include: { posts: { orderBy: { postedAt: 'desc' }, take: 1 } },
    });

    const teamIds = [...new Set(activeTrackers.map(t => t.teamId))];

    for (const teamId of teamIds) {
      try {
        await this.processTeamCompetitors(teamId);
      } catch (err) {
        this.logger.error(`Competitor watch failed for team ${teamId}`, err);
      }
    }
  }

  async processTeamCompetitors(teamId: string) {
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

    // Find recent competitor posts that don't have counter-posts yet
    const recentCompetitorPosts = await this.prisma.competitorPost.findMany({
      where: {
        competitor: { teamId, isActive: true },
        postedAt: { gte: sixHoursAgo },
      },
      include: { competitor: true },
      orderBy: { engagementRate: 'desc' },
      take: 5,
    });

    const existingCounterPostIds = new Set(
      (await this.prisma.counterPost.findMany({
        where: { teamId, competitorPostId: { in: recentCompetitorPosts.map(p => p.id) } },
        select: { competitorPostId: true },
      })).map(cp => cp.competitorPostId),
    );

    const newPosts = recentCompetitorPosts.filter(p => !existingCounterPostIds.has(p.id));
    if (newPosts.length === 0) return { counterPostsGenerated: 0 };

    // Get brand context for voice matching
    const brandProfile = await this.prisma.brandProfile.findUnique({ where: { teamId } });
    const brandVoice = await this.prisma.brandVoice.findFirst({ where: { teamId, isActive: true } });

    let generated = 0;

    for (const competitorPost of newPosts.slice(0, 3)) {
      try {
        const counterPost = await this.generateCounterPost(
          teamId,
          competitorPost,
          brandProfile,
          brandVoice,
        );

        await this.prisma.counterPost.create({
          data: {
            teamId,
            competitorPostId: competitorPost.id,
            generatedContent: counterPost.content,
            platform: competitorPost.platform,
            status: 'draft',
            reasoning: counterPost.reasoning,
          },
        });

        generated++;
      } catch (err) {
        this.logger.warn(`Failed to generate counter-post for ${competitorPost.id}`, err);
      }
    }

    return { counterPostsGenerated: generated };
  }

  async generateCounterPost(
    teamId: string,
    competitorPost: { caption: string; platform: string; hashtags: string[]; competitor: { handle: string; competitorName?: string | null } },
    brandProfile: any,
    brandVoice: any,
  ): Promise<{ content: string; reasoning: string }> {
    const brandContext = brandProfile
      ? `Brand: ${brandProfile.brandName}, Industry: ${brandProfile.industry}, Voice: ${brandProfile.voiceTone}, Traits: ${brandProfile.voiceTraits?.join(', ')}`
      : 'No brand profile available';

    const prompt = `A competitor just posted this on ${competitorPost.platform}:

COMPETITOR: ${competitorPost.competitor.competitorName ?? competitorPost.competitor.handle}
POST: "${competitorPost.caption}"
HASHTAGS: ${competitorPost.hashtags.join(', ')}

YOUR BRAND CONTEXT: ${brandContext}

Generate a counter-post that:
1. Addresses the same topic/pain point but from YOUR brand's unique angle
2. Doesn't mention or attack the competitor directly
3. Provides MORE value or a contrarian/fresh take
4. Matches your brand voice exactly
5. Is optimized for ${competitorPost.platform}
6. Includes relevant hashtags

Return JSON:
{
  "content": "the full post caption with hashtags",
  "reasoning": "1 sentence explaining the counter-strategy used"
}`;

    return this.llm.completeJson<{ content: string; reasoning: string }>(prompt, {
      maxTokens: 800,
      temperature: 0.7,
    });
  }

  async getCounterPosts(teamId: string, status?: string) {
    return this.prisma.counterPost.findMany({
      where: {
        teamId,
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async approveCounterPost(teamId: string, counterPostId: string) {
    const counterPost = await this.prisma.counterPost.findFirst({
      where: { id: counterPostId, teamId },
    });

    if (!counterPost) return null;

    // Create actual post from counter-post
    const post = await this.prisma.post.create({
      data: {
        teamId,
        title: `Counter: ${counterPost.generatedContent.slice(0, 50)}...`,
        content: counterPost.generatedContent,
        status: 'draft',
        mediaUrls: [],
      },
    });

    await this.prisma.counterPost.update({
      where: { id: counterPostId },
      data: { status: 'approved', postId: post.id },
    });

    return post;
  }

  async dismissCounterPost(teamId: string, counterPostId: string) {
    return this.prisma.counterPost.updateMany({
      where: { id: counterPostId, teamId },
      data: { status: 'rejected' },
    });
  }
}
