import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BrandVoiceService } from '../brand-voice/brand-voice.service';
import { LlmService } from '../agents/llm/llm.service';
import { HumanizerService } from '../ai/humanizer/humanizer.service';
import { HtmlGeneratorService } from './html-generator.service';
import { PlaywrightExporterService } from './playwright-exporter.service';
import { CarouselBrief, CarouselPalette, CarouselSlide } from './carousel.types';

@Injectable()
export class CarouselService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly brandVoice: BrandVoiceService,
    private readonly llm: LlmService,
    private readonly humanizer: HumanizerService,
    private readonly htmlGenerator: HtmlGeneratorService,
    private readonly exporter: PlaywrightExporterService,
  ) {}

  async generateCarousel(teamId: string, brief: CarouselBrief) {
    const slideCount = Math.max(5, Math.min(10, brief.slideCount));
    const profile = await this.resolveBrandVoiceProfile(teamId, brief);
    const slides = await this.generateSlides({
      topic: brief.topic,
      slideCount,
      contentSource: brief.contentSource,
      palette: this.extractPalette(profile),
      toneDimensions: profile.toneDimensions as Record<string, number>,
    });
    const htmlSource = this.htmlGenerator.build({
      slides,
      palette: this.extractPalette(profile),
      fonts: {
        primary: profile.fontPrimary,
        secondary: profile.fontSecondary,
      },
    });
    const pngUrls = await this.exporter.export({
      teamId,
      html: htmlSource,
      slideCount,
      deviceScaleFactor: 1080 / 420,
    });

    return this.prisma.carousel.create({
      data: {
        teamId,
        brandVoiceProfileId: profile.id,
        title: brief.topic,
        topic: brief.topic,
        slideCount,
        slides: slides as unknown as Prisma.InputJsonValue,
        htmlSource,
        pngUrls,
        status: 'ready',
      },
    });
  }

  async getCarousel(teamId: string, id: string) {
    const carousel = await this.prisma.carousel.findFirst({ where: { id, teamId } });
    if (!carousel) throw new NotFoundException('Carousel not found');
    return carousel;
  }

  async getPreviewHtml(teamId: string, id: string): Promise<string> {
    const carousel = await this.getCarousel(teamId, id);
    return carousel.htmlSource;
  }

  async listCarousels(teamId: string) {
    return this.prisma.carousel.findMany({
      where: { teamId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async publishToInstagram(teamId: string, id: string) {
    const carousel = await this.getCarousel(teamId, id);
    return this.prisma.carousel.update({
      where: { id: carousel.id },
      data: { status: 'published' },
    });
  }

  private async resolveBrandVoiceProfile(teamId: string, brief: CarouselBrief) {
    if (brief.vibeChoice === 'saved_profile') {
      if (!brief.brandVoiceProfileId) {
        throw new BadRequestException('brandVoiceProfileId is required for saved_profile');
      }
      const profile = await this.prisma.brandVoiceProfile.findFirst({
        where: { id: brief.brandVoiceProfileId, teamId },
      });
      if (!profile) throw new NotFoundException('Brand voice profile not found');
      return profile;
    }

    if (brief.vibeChoice === 'new_custom') {
      if (!brief.customBrandDetails) {
        throw new BadRequestException('customBrandDetails is required for new_custom');
      }
      return this.brandVoice.createProfile(teamId, {
        name: 'Custom carousel profile',
        isDefault: false,
        primaryColor: brief.customBrandDetails.primaryColor,
        fontPrimary: brief.customBrandDetails.fontPreference,
      });
    }

    const profile = brief.vibeChoice === 'last_used'
      ? await this.brandVoice.getRecentProfile(teamId)
      : await this.brandVoice.getDefaultProfile(teamId);

    if (profile) return profile;

    return this.brandVoice.createProfile(teamId, {
      name: 'Neutral agency default',
      isDefault: true,
      primaryColor: '#2563eb',
      fontPrimary: 'Inter',
    });
  }

  private async generateSlides(input: {
    topic: string;
    slideCount: number;
    contentSource?: string;
    palette: CarouselPalette;
    toneDimensions: Record<string, number>;
  }): Promise<CarouselSlide[]> {
    const prompt = `Create ${input.slideCount} Instagram carousel slides about "${input.topic}".
Arc: hook, problem, solution, details, proof, CTA.
Use concrete Indian SMB marketing language. Avoid corporate filler. No em dashes.
${input.contentSource ? `Source notes: ${input.contentSource.slice(0, 3000)}` : ''}
Return JSON: {"slides":[{"headline":"...","body":"..."}]}`;

    const generated = await this.llm.completeJson<{ slides: Array<{ headline: string; body: string }> }>(prompt, {
      maxTokens: 1800,
    });
    const rawSlides = generated.slides.slice(0, input.slideCount);

    const slides: CarouselSlide[] = [];
    for (let i = 0; i < input.slideCount; i++) {
      const raw = rawSlides[i] ?? this.defaultSlide(input.topic, i, input.slideCount);
      const humanized = await this.humanizer.humanize(`${raw.headline}\n${raw.body}`, {
        platform: 'instagram',
        toneDimensions: input.toneDimensions,
      });
      const [headline, ...bodyParts] = humanized.humanized.split('\n').filter(Boolean);
      slides.push({
        slideNumber: i + 1,
        role: this.slideRole(i, input.slideCount),
        headline: headline ?? raw.headline,
        body: bodyParts.join(' ') || raw.body,
        copyText: humanized.humanized,
        designTokens: this.designTokens(input.palette, i),
      });
    }

    return slides;
  }

  private defaultSlide(topic: string, index: number, total: number): { headline: string; body: string } {
    if (index === 0) return { headline: topic, body: 'A simple way to turn attention into action.' };
    if (index === total - 1) return { headline: 'Ready to try it?', body: 'Save this, share it with your team, and use it this week.' };
    return { headline: `Step ${index}`, body: `Apply this idea to ${topic.toLowerCase()} with one clear action.` };
  }

  private slideRole(index: number, total: number): CarouselSlide['role'] {
    if (index === 0) return 'hook';
    if (index === 1) return 'problem';
    if (index === 2) return 'solution';
    if (index === total - 2) return 'proof';
    if (index === total - 1) return 'cta';
    return 'detail';
  }

  private designTokens(palette: CarouselPalette, index: number): CarouselSlide['designTokens'] {
    const dark = index % 2 === 1;
    return {
      background: dark ? palette.darkBg : palette.lightBg,
      foreground: dark ? '#ffffff' : palette.brandDark,
      accent: dark ? palette.brandLight : palette.primaryColor,
    };
  }

  private extractPalette(profile: {
    primaryColor: string;
    brandLight: string;
    brandDark: string;
    lightBg: string;
    lightBorder: string;
    darkBg: string;
  }): CarouselPalette {
    return {
      primaryColor: profile.primaryColor,
      brandLight: profile.brandLight,
      brandDark: profile.brandDark,
      lightBg: profile.lightBg,
      lightBorder: profile.lightBorder,
      darkBg: profile.darkBg,
    };
  }
}
