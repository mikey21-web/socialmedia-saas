import { CarouselService } from './carousel.service';
import { PrismaService } from '../prisma/prisma.service';
import { BrandVoiceService } from '../brand-voice/brand-voice.service';
import { LlmService } from '../agents/llm/llm.service';
import { HumanizerService } from '../ai/humanizer/humanizer.service';
import { CritiqueService } from '../ai/critique/critique.service';
import { HtmlGeneratorService } from './html-generator.service';
import { PlaywrightExporterService } from './playwright-exporter.service';
import { R2StorageService } from '../media/r2-storage.service';

describe('CarouselService', () => {
  const profile = {
    id: 'profile_1',
    primaryColor: '#2563eb',
    brandLight: '#93c5fd',
    brandDark: '#1e3a8a',
    lightBg: '#f8fafc',
    lightBorder: '#e2e8f0',
    darkBg: '#0f172a',
    fontPrimary: 'Inter',
    fontSecondary: null,
    toneDimensions: { warmth: 0.7, formality: 0.5 },
  };

  function buildService() {
    const prisma = {
      carousel: {
        create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => ({
          id: 'carousel_1',
          ...data,
        })),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => ({
          id: where.id,
          status: 'ready',
          slideCount: 5,
          htmlSource: '<main class="carousel-deck"></main>',
          ...data,
        })),
      },
      brandVoiceProfile: {
        findFirst: jest.fn(),
      },
    };
    const brandVoice = {
      getDefaultProfile: jest.fn(async () => profile),
      getRecentProfile: jest.fn(async () => profile),
      createProfile: jest.fn(async () => profile),
    };
    const llm = {
      completeJson: jest.fn(async () => ({
        slides: [
          { headline: 'Book more salon visits', body: 'Start with one useful tip your clients can try today.' },
          { headline: 'The problem', body: 'Most posts look nice but do not give people a reason to book.' },
          { headline: 'Fix the message', body: 'Lead with the client outcome, then show the offer.' },
          { headline: 'Make it easy', body: 'Add one action, one benefit, and one clear next step.' },
          { headline: 'Try this today', body: 'Save this format and use it for your next promo.' },
        ],
      })),
    };
    const humanizer = {
      humanize: jest.fn(async (text: string) => ({
        original: text,
        humanized: text,
        detections: [],
        aiScore: 10,
        finalAiScore: 5,
      })),
    };
    const critique = {
      critiqueAndRevise: jest.fn(async (content: string) => ({
        finalContent: content,
        passed: true,
        critique: {
          scores: [],
          overall: 4,
          failingDimensions: [],
          passed: true,
          summary: 'Passes.',
        },
        attempts: 1,
      })),
    };
    const html = new HtmlGeneratorService();
    const exporter = {
      exportSlidesToBuffers: jest.fn(async () => [
        Buffer.from('one'),
        Buffer.from('two'),
        Buffer.from('three'),
        Buffer.from('four'),
        Buffer.from('five'),
      ]),
    };
    const r2Storage = {
      upload: jest.fn(async (key: string) => `https://cdn.example.com/${key}`),
    };

    return {
      service: new CarouselService(
        prisma as unknown as PrismaService,
        brandVoice as unknown as BrandVoiceService,
        llm as unknown as LlmService,
        humanizer as unknown as HumanizerService,
        critique as unknown as CritiqueService,
        html,
        exporter as unknown as PlaywrightExporterService,
        r2Storage as unknown as R2StorageService,
      ),
      prisma,
      exporter,
      humanizer,
      critique,
      r2Storage,
    };
  }

  it('generates a ready carousel with humanized slides and export urls', async () => {
    const { service, prisma, exporter, humanizer, critique } = buildService();

    const result = await service.generateCarousel('team_1', {
      topic: 'Salon booking mistakes',
      slideCount: 5,
      vibeChoice: 'generic_default',
    });

    expect(result.status).toBe('ready');
    expect(result.slideCount).toBe(5);
    expect(result.pngUrls).toHaveLength(5);
    expect(String(result.htmlSource)).toContain('carousel-deck');
    expect(humanizer.humanize).toHaveBeenCalledTimes(5);
    expect(critique.critiqueAndRevise).toHaveBeenCalledTimes(5);
    expect(exporter.exportSlidesToBuffers).toHaveBeenCalledWith(expect.arrayContaining([expect.stringContaining('<section class="slide"')]));
    expect(prisma.carousel.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'carousel_1' },
        data: {
          pngUrls: expect.arrayContaining([
            'https://cdn.example.com/carousels/carousel_1/slide-1.png',
          ]),
        },
      }),
    );
    expect(prisma.carousel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          teamId: 'team_1',
          brandVoiceProfileId: 'profile_1',
          status: 'ready',
        }),
      }),
    );
  });
});
