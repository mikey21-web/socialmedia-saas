import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LlmService } from '../agents/llm/llm.service';

export interface AutoOnboardInput {
  websiteUrl: string;
  socialHandles?: {
    instagram?: string;
    x?: string;
    linkedin?: string;
    facebook?: string;
    tiktok?: string;
  };
}

export interface ScrapedBrandData {
  brandName: string;
  industry: string;
  description: string;
  voiceTone: string;
  voiceTraits: string[];
  audienceAge: string;
  audienceInterests: string[];
  offers: string[];
  testimonials: string[];
  colors: { primary: string; secondary: string; accent: string };
  fonts: { primary: string; secondary: string };
  keywords: string[];
  ctas: string[];
}

@Injectable()
export class AutoOnboardService {
  private readonly logger = new Logger(AutoOnboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: LlmService,
  ) {}

  async scrapeAndAnalyze(teamId: string, input: AutoOnboardInput): Promise<{
    scrapeId: string;
    suggestions: ScrapedBrandData;
  }> {
    const scrape = await this.prisma.websiteScrape.create({
      data: {
        teamId,
        url: input.websiteUrl,
        status: 'scraping',
      },
    });

    try {
      // Fetch website content
      const pageContent = await this.fetchWebsiteContent(input.websiteUrl);

      // Fetch social media bios if handles provided
      const socialBios = await this.fetchSocialBios(input.socialHandles);

      // Use LLM to analyze everything
      const suggestions = await this.analyzeWithLlm(pageContent, socialBios, input.websiteUrl);

      await this.prisma.websiteScrape.update({
        where: { id: scrape.id },
        data: {
          status: 'completed',
          scrapedData: { pageContent: pageContent.slice(0, 5000), socialBios },
          brandSuggestions: suggestions as any,
          completedAt: new Date(),
        },
      });

      return { scrapeId: scrape.id, suggestions };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Scrape failed';
      await this.prisma.websiteScrape.update({
        where: { id: scrape.id },
        data: { status: 'failed', error: message },
      });
      throw error;
    }
  }

  async applyToProfile(teamId: string, suggestions: Partial<ScrapedBrandData>) {
    const existing = await this.prisma.brandProfile.findUnique({ where: { teamId } });

    if (existing) {
      return this.prisma.brandProfile.update({
        where: { teamId },
        data: {
          brandName: suggestions.brandName ?? existing.brandName,
          industry: suggestions.industry ?? existing.industry,
          description: suggestions.description ?? existing.description,
          voiceTone: suggestions.voiceTone ?? existing.voiceTone,
          voiceTraits: suggestions.voiceTraits ?? existing.voiceTraits,
          audienceAge: suggestions.audienceAge ?? existing.audienceAge,
          audienceInterests: suggestions.audienceInterests ?? existing.audienceInterests,
        },
      });
    }

    return this.prisma.brandProfile.create({
      data: {
        teamId,
        brandName: suggestions.brandName ?? 'My Brand',
        industry: suggestions.industry ?? 'general',
        description: suggestions.description ?? '',
        voiceTone: suggestions.voiceTone ?? 'professional',
        voiceTraits: suggestions.voiceTraits ?? [],
        audienceAge: suggestions.audienceAge ?? '25-34',
        audienceGender: 'all',
        primaryGoal: 'awareness',
      },
    });
  }

  private async fetchWebsiteContent(url: string): Promise<string> {
    try {
      const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
      const parsedUrl = new URL(normalizedUrl);

      // SSRF protection: block private/loopback addresses
      const { isBlockedInternalAddress } = await import('../common/security/dependency-allowlist');
      if (isBlockedInternalAddress(parsedUrl.hostname)) {
        throw new Error('Cannot scrape internal addresses');
      }

      const response = await fetch(normalizedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BrandAnalyzer/1.0)',
          Accept: 'text/html',
        },
        signal: AbortSignal.timeout(15000),
        redirect: 'follow',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const contentType = response.headers.get('content-type') ?? '';
      if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
        throw new Error(`Unsupported content type: ${contentType}`);
      }

      const html = await response.text();
      return this.extractTextFromHtml(html);
    } catch (error) {
      this.logger.warn(`Failed to fetch ${url}: ${error}`);
      return '';
    }
  }

  private extractTextFromHtml(html: string): string {
    // Remove scripts, styles, and HTML tags
    let text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();

    // Extract meta description and title
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);

    const meta = [
      titleMatch?.[1],
      metaDescMatch?.[1],
      ogDescMatch?.[1],
    ].filter(Boolean).join('. ');

    return `${meta}\n\n${text}`.slice(0, 10000);
  }

  private async fetchSocialBios(handles?: AutoOnboardInput['socialHandles']): Promise<Record<string, string>> {
    const bios: Record<string, string> = {};
    if (!handles) return bios;

    // For now, store handles — actual bio fetching requires platform APIs
    for (const [platform, handle] of Object.entries(handles)) {
      if (handle) {
        bios[platform] = handle;
      }
    }

    return bios;
  }

  private async analyzeWithLlm(
    pageContent: string,
    socialBios: Record<string, string>,
    url: string,
  ): Promise<ScrapedBrandData> {
    const prompt = `Analyze this website and social media presence to extract brand identity.

WEBSITE URL: ${url}
WEBSITE CONTENT:
${pageContent.slice(0, 6000)}

SOCIAL HANDLES: ${JSON.stringify(socialBios)}

Extract and return JSON with these fields:
{
  "brandName": "the brand/business name",
  "industry": "one of: fashion-d2c, saas, real-estate, ecommerce, health-wellness, food-beverage, education, finance, tech-startup, agency, personal-brand, other",
  "description": "2-3 sentence elevator pitch",
  "voiceTone": "one of: professional, casual, funny, inspirational, authoritative, friendly, bold",
  "voiceTraits": ["trait1", "trait2", "trait3"],
  "audienceAge": "age range like 25-34",
  "audienceInterests": ["interest1", "interest2"],
  "offers": ["main product/service 1", "main product/service 2"],
  "testimonials": ["any testimonial snippets found"],
  "colors": { "primary": "#hex", "secondary": "#hex", "accent": "#hex" },
  "fonts": { "primary": "font name", "secondary": "font name" },
  "keywords": ["brand keyword 1", "keyword 2"],
  "ctas": ["main CTA phrases found on the site"]
}

Be specific and accurate. If you can't determine something, use reasonable defaults for the industry.`;

    return this.llm.completeJson<ScrapedBrandData>(prompt, { maxTokens: 1500 });
  }
}
