import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BrandService } from '../../brand/brand.service';
import { LlmService } from '../llm/llm.service';
import { GenerateInput, StepResult } from './types';
import { ideate } from './pipeline/ideate';
import { pickBestAngle } from './pipeline/pick-angle';
import { adaptForAllPlatforms } from './pipeline/adapt-platform';
import { checkCompliance } from './pipeline/compliance-check';

@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly brandService: BrandService,
    private readonly llm: LlmService,
  ) {}

  async generate(teamId: string, input: GenerateInput) {
    const brand = await this.brandService.getBrandContext(teamId);
    const steps: StepResult[] = [];
    const platforms = input.platforms.length
      ? input.platforms
      : brand.platforms;

    if (platforms.length === 0) {
      throw new NotFoundException('No platforms configured — update your brand profile');
    }

    const run = await this.prisma.agentRun.create({
      data: {
        teamId,
        agentType: 'content',
        status: 'running',
        input: input as any,
      },
    });

    try {
      const ideationStart = new Date();
      const ideationResult = await ideate(
        { topic: input.topic, intent: input.intent },
        brand,
        this.llm,
      );
      steps.push({
        name: 'ideation',
        startedAt: ideationStart,
        completedAt: new Date(),
        durationMs: Date.now() - ideationStart.getTime(),
        output: ideationResult,
      });

      const pickStart = new Date();
      const bestAngle = pickBestAngle(ideationResult.angles);
      steps.push({
        name: 'pick_angle',
        startedAt: pickStart,
        completedAt: new Date(),
        durationMs: Date.now() - pickStart.getTime(),
        output: bestAngle,
      });

      const adaptStart = new Date();
      const drafts = await adaptForAllPlatforms(platforms, bestAngle, brand, this.llm);
      steps.push({
        name: 'adapt_platforms',
        startedAt: adaptStart,
        completedAt: new Date(),
        durationMs: Date.now() - adaptStart.getTime(),
        output: drafts,
      });

      const complianceStart = new Date();
      const complianceResults = drafts.map((draft) => ({
        platform: draft.platform,
        ...checkCompliance(draft, brand),
      }));
      steps.push({
        name: 'compliance_check',
        startedAt: complianceStart,
        completedAt: new Date(),
        durationMs: Date.now() - complianceStart.getTime(),
        output: complianceResults,
      });

      const brandProfile = await this.prisma.brandProfile.findUnique({
        where: { teamId },
        select: { autonomousMode: true },
      });
      const isAutonomous = brandProfile?.autonomousMode ?? false;

      const postIds: string[] = [];
      for (const draft of drafts) {
        const compliance = complianceResults.find((c) => c.platform === draft.platform);
        const finalCaption = compliance?.correctedCaption ?? draft.fullCaption;
        const wasTrimmed = finalCaption !== draft.fullCaption;

        const autonomousScheduledAt = isAutonomous
          ? (() => {
              const d = new Date();
              d.setDate(d.getDate() + 1);
              d.setHours(9, 0, 0, 0);
              return d;
            })()
          : null;

        const post = await this.prisma.post.create({
          data: {
            teamId,
            title: draft.hook,
            content: finalCaption,
            status: isAutonomous ? 'scheduled' : 'awaiting_approval',
            scheduledAt: autonomousScheduledAt,
            generatedBy: 'content_agent',
            agentRunId: run.id,
            generationContext: {
              topic: input.topic,
              intent: input.intent ?? null,
              angle: JSON.parse(JSON.stringify(bestAngle)),
              runId: run.id,
              platform: draft.platform,
              autonomous: isAutonomous,
              compliance: compliance ? JSON.parse(JSON.stringify(compliance)) : null,
              wasTrimmed,
              originalLength: draft.fullCaption.length,
              finalLength: finalCaption.length,
            },
            platforms: {
              create: {
                platform: draft.platform,
                status: 'pending',
              },
            },
          },
        });
        postIds.push(post.id);

        if (wasTrimmed) {
          this.logger.debug(
            `[${draft.platform}] Caption trimmed from ${draft.fullCaption.length} to ${finalCaption.length} chars`,
          );
        }
      }

      await this.prisma.agentRun.update({
        where: { id: run.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          steps: steps as any,
          output: { postIds, angle: JSON.parse(JSON.stringify(bestAngle)) },
        },
      });

      return {
        runId: run.id,
        postIds,
        angle: bestAngle,
        platforms: drafts.map((d) => d.platform),
        steps: steps.map((s) => ({
          name: s.name,
          durationMs: s.durationMs,
        })),
      };
    } catch (error) {
      await this.prisma.agentRun.update({
        where: { id: run.id },
        data: {
          status: 'failed',
          completedAt: new Date(),
          error: error instanceof Error ? error.message : String(error),
          steps: steps as any,
        },
      });
      throw error;
    }
  }

  async regenerate(teamId: string, postId: string) {
    const post = await this.prisma.post.findFirst({
      where: { id: postId, teamId },
      include: { platforms: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const context = post.generationContext as any;
    if (!context?.topic || !context?.angle) {
      throw new NotFoundException('Post was not agent-generated');
    }

    const brand = await this.brandService.getBrandContext(teamId);
    const platform = post.platforms[0]?.platform ?? 'instagram';

    const { adaptForPlatform } = await import('./pipeline/adapt-platform');
    const draft = await adaptForPlatform(platform, context.angle, brand, this.llm);
    const compliance = checkCompliance(draft, brand);
    const finalCaption = compliance.correctedCaption ?? draft.fullCaption;

    const updated = await this.prisma.post.update({
      where: { id: postId },
      data: {
        title: draft.hook,
        content: finalCaption,
        status: 'awaiting_approval',
        generationContext: {
          ...context,
          regeneratedAt: new Date().toISOString(),
          compliance,
          wasTrimmed: finalCaption !== draft.fullCaption,
          originalLength: draft.fullCaption.length,
          finalLength: finalCaption.length,
        },
      },
    });

    return updated;
  }

  async refine(teamId: string, postId: string, feedback: string) {
    const post = await this.prisma.post.findFirst({
      where: { id: postId, teamId },
      include: { platforms: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const brand = await this.brandService.getBrandContext(teamId);
    const platform = post.platforms[0]?.platform ?? 'instagram';

    const prompt = `You are refining a social media post for ${brand.brandName}.

CURRENT POST (${platform}):
"${post.content}"

USER FEEDBACK: ${feedback}

BRAND VOICE:
- Tone: ${brand.voice.tone}
- Traits: ${brand.voice.traits.join(', ')}
- Formality: ${brand.voice.formality}/10
- Never use: ${brand.voice.neverWords.join(', ') || 'none'}

Apply the feedback while maintaining brand voice. Return the refined post.

OUTPUT JSON ONLY:
{
  "hook": "first line",
  "body": "main content",
  "cta": "call to action",
  "hashtags": ["tag1"],
  "fullCaption": "complete refined post"
}`;

    const refined = await this.llm.completeJson<{
      hook: string;
      fullCaption: string;
    }>(prompt);

    const updated = await this.prisma.post.update({
      where: { id: postId },
      data: {
        title: refined.hook,
        content: refined.fullCaption,
        status: 'awaiting_approval',
        generationContext: {
          ...(post.generationContext as any),
          refinedAt: new Date().toISOString(),
          feedback,
        },
      },
    });

    return updated;
  }
}