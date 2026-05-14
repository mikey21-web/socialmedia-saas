import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LlmService } from '../../agents/llm/llm.service';
import { ReelTemplateService } from './reel-template.service';

export interface CalendarEntry {
  day: number;          // day of month (1-30/31)
  templateSlug: string; // which template to use
  templateId?: string;
  topic: string;        // what to film
  hook: string;         // hook idea
  notes?: string;
  scriptId?: string;    // once user generates a script
}

export interface GenerateCalendarInput {
  teamId: string;
  vertical: string;
  month: number;
  year: number;
  language?: string;
  postsPerWeek?: number;
}

@Injectable()
export class ReelCalendarService {
  private readonly logger = new Logger(ReelCalendarService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: LlmService,
    private readonly templates: ReelTemplateService,
  ) {}

  /**
   * Generate (or fetch existing) 30-day Reel calendar for a vertical.
   *
   * Strategy:
   *  - 4 reels per week by default (16 reels for 30 days)
   *  - Mix of categories: 30% educational, 30% product, 20% trend/entertain, 20% story/trust
   *  - Each entry is a specific topic with a hook idea, not a generic prompt
   *  - Pulls from our template library to ground topics in proven formats
   */
  async getOrGenerate(input: GenerateCalendarInput) {
    const existing = await this.prisma.reelCalendar.findUnique({
      where: { teamId_month_year: { teamId: input.teamId, month: input.month, year: input.year } },
    });
    if (existing) return existing;

    return this.generate(input);
  }

  async generate(input: GenerateCalendarInput) {
    const postsPerWeek = input.postsPerWeek ?? 4;
    const language = input.language ?? 'en';

    // Pull all relevant templates (vertical + generic)
    const allTemplates = await this.templates.list({
      vertical: input.vertical,
      language,
      limit: 50,
    });

    if (allTemplates.length === 0) {
      // fall back to all generic
      const generic = await this.templates.list({ vertical: 'generic', language, limit: 20 });
      allTemplates.push(...generic);
    }

    // Group by category for nice variety
    const byCategory: Record<string, typeof allTemplates> = {};
    for (const t of allTemplates) {
      (byCategory[t.category] ??= []).push(t);
    }

    const daysInMonth = new Date(input.year, input.month, 0).getDate();
    const totalReels = Math.ceil((daysInMonth / 7) * postsPerWeek);

    // Brand context for topic personalisation
    const brandProfile = await this.prisma.brandProfile.findUnique({
      where: { teamId: input.teamId },
    });

    const brandName = brandProfile?.brandName ?? 'your brand';
    const primaryGoal = brandProfile?.primaryGoal ?? '';
    const description = brandProfile?.description ?? '';
    const audiencePersona = [
      brandProfile?.audienceAge,
      brandProfile?.audienceGender,
      ...(brandProfile?.audienceInterests ?? []),
    ]
      .filter(Boolean)
      .join(', ');

    // Ask LLM to generate concrete topics + hooks per template slot
    const prompt = `Generate ${totalReels} concrete Reel ideas for "${brandName}" (${input.vertical} business).
${audiencePersona ? `Audience: ${audiencePersona}` : ''}
${description ? `Brand: ${description.slice(0, 200)}` : ''}
${primaryGoal ? `Primary goal: ${primaryGoal}` : ''}

For each idea, pick one of these proven Reel formats (use slug):
${allTemplates.slice(0, 20).map(t => `- ${t.slug}: ${t.title} (${t.category}, ${t.goal})`).join('\n')}

Mix: ~30% educational, ~30% product/showcase, ~20% trends/entertain, ~20% story/trust.
Each topic must be SPECIFIC (e.g. "How we plate our biryani", not "show our food").
Each hook must be CONCRETE and stop-the-scroll worthy.

Return JSON:
{
  "ideas": [
    {
      "templateSlug": "salon-before-after-3shot",
      "topic": "specific topic for this brand",
      "hook": "concrete hook line (max 10 words)",
      "notes": "1 sentence of filming context"
    }
  ]
}

Generate exactly ${totalReels} ideas.`;

    const result = await this.llm.completeJson<{
      ideas: Array<{ templateSlug: string; topic: string; hook: string; notes?: string }>;
    }>(prompt, { maxTokens: 4096 });

    // Map ideas to days of month — distributed evenly
    const ideas = result.ideas ?? [];
    const entries: CalendarEntry[] = [];
    const dayStep = Math.max(1, Math.floor(daysInMonth / Math.max(ideas.length, 1)));

    let day = 1;
    for (const idea of ideas) {
      if (day > daysInMonth) break;

      const matchingTemplate =
        allTemplates.find(t => t.slug === idea.templateSlug) ??
        allTemplates[0];

      entries.push({
        day,
        templateSlug: matchingTemplate?.slug ?? 'generic',
        templateId: matchingTemplate?.id,
        topic: idea.topic,
        hook: idea.hook,
        notes: idea.notes,
      });

      day += dayStep;
    }

    return this.prisma.reelCalendar.upsert({
      where: { teamId_month_year: { teamId: input.teamId, month: input.month, year: input.year } },
      create: {
        teamId: input.teamId,
        vertical: input.vertical,
        month: input.month,
        year: input.year,
        language,
        entries: entries as unknown as object,
      },
      update: {
        vertical: input.vertical,
        language,
        entries: entries as unknown as object,
      },
    });
  }

  async list(teamId: string) {
    return this.prisma.reelCalendar.findMany({
      where: { teamId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      take: 12,
    });
  }

  async updateEntryScript(teamId: string, calendarId: string, day: number, scriptId: string) {
    const cal = await this.prisma.reelCalendar.findFirst({
      where: { id: calendarId, teamId },
    });
    if (!cal) return null;

    const entries = (cal.entries as CalendarEntry[]) ?? [];
    const updated = entries.map(e => (e.day === day ? { ...e, scriptId } : e));

    return this.prisma.reelCalendar.update({
      where: { id: calendarId },
      data: { entries: updated as unknown as object },
    });
  }
}
