import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import { LlmService } from '../../../agents/llm/llm.service';
import { ReelTemplateService } from '../reel-template.service';
import { ReelScriptService } from '../reel-script.service';
import { ReelCalendarService } from '../reel-calendar.service';
import { TrendingAudioService } from '../trending-audio.service';
import { REEL_TEMPLATES } from '../reel-templates.data';

describe('Reel Studio', () => {
  describe('REEL_TEMPLATES data integrity', () => {
    it('all templates have required fields', () => {
      for (const t of REEL_TEMPLATES) {
        expect(t.slug).toMatch(/^[a-z0-9-]+$/);
        expect(t.title.length).toBeGreaterThan(0);
        expect(t.shotList.length).toBe(t.shotCount);
        expect(t.captionTemplate.length).toBeGreaterThan(0);
        expect(t.hashtagSets.length).toBeGreaterThan(0);
      }
    });

    it('slugs are unique', () => {
      const slugs = REEL_TEMPLATES.map(t => t.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    });

    it('total shot durations are within 5s of estDurationSec', () => {
      for (const t of REEL_TEMPLATES) {
        const sum = t.shotList.reduce((s, x) => s + x.durationSec, 0);
        expect(Math.abs(sum - t.estDurationSec)).toBeLessThanOrEqual(5);
      }
    });

    it('every template has at least one trending or vertical-relevant audio mood', () => {
      for (const t of REEL_TEMPLATES) {
        expect(t.audioMood.length).toBeGreaterThan(0);
      }
    });
  });

  describe('ReelTemplateService', () => {
    let service: ReelTemplateService;
    let prisma: any;

    beforeEach(async () => {
      prisma = {
        reelTemplate: {
          findMany: jest.fn().mockResolvedValue([{ id: 't_1', slug: 'a' }]),
          findUnique: jest.fn(),
          groupBy: jest.fn().mockResolvedValue([{ vertical: 'salon', _count: { _all: 3 } }]),
        },
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ReelTemplateService,
          { provide: PrismaService, useValue: prisma },
        ],
      }).compile();

      service = module.get(ReelTemplateService);
    });

    it('list filters by vertical including generic', async () => {
      await service.list({ vertical: 'salon' });
      expect(prisma.reelTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            vertical: { in: ['salon', 'generic'] },
          }),
        }),
      );
    });

    it('curatedPicks returns max 3 high-engagement templates', async () => {
      await service.curatedPicks('salon', 'engagement');
      expect(prisma.reelTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            engagementTier: 'high',
            difficulty: { in: ['easy', 'medium'] },
          }),
          take: 3,
        }),
      );
    });

    it('listVerticalsWithCounts maps grouped result', async () => {
      const out = await service.listVerticalsWithCounts();
      expect(out).toEqual([{ vertical: 'salon', count: 3 }]);
    });
  });

  describe('ReelScriptService', () => {
    let service: ReelScriptService;
    let prisma: any;
    let llm: any;
    let templates: any;

    beforeEach(async () => {
      prisma = {
        brandProfile: { findUnique: jest.fn().mockResolvedValue(null) },
        brandVoice: { findUnique: jest.fn().mockResolvedValue(null) },
        trendSignal: { findUnique: jest.fn().mockResolvedValue(null) },
        trendingAudio: { findMany: jest.fn().mockResolvedValue([]) },
        reelScript: {
          create: jest.fn().mockImplementation(({ data }) => ({
            id: 's_1',
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          })),
          findMany: jest.fn(),
          findFirst: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
        },
      };
      llm = {
        completeJson: jest.fn().mockResolvedValue({
          title: 'Test Reel',
          hook: 'You won\'t believe',
          patternInterrupt: 'cut',
          cta: 'DM us',
          caption: 'Check this out',
          hashtags: ['#test'],
          shots: [
            { index: 1, voiceover: 'hi', textOverlay: 'hook' },
            { index: 2, voiceover: 'middle', textOverlay: 'mid' },
            { index: 3, voiceover: 'cta', textOverlay: 'cta' },
          ],
          filmingTips: ['Use natural light'],
        }),
      };
      templates = {
        getById: jest.fn().mockResolvedValue({
          id: 't_1',
          slug: 'salon-before-after-3shot',
          vertical: 'salon',
          goal: 'engagement',
          language: 'en',
          estDurationSec: 15,
          structure: { hookSec: 1.5, ctaSec: 13, beats: [] },
          shotList: [
            { index: 1, durationSec: 2, action: 'a', cameraAngle: 'b', lightingTip: 'c', propsNeeded: [], textOverlay: 'd' },
            { index: 2, durationSec: 8, action: 'a', cameraAngle: 'b', lightingTip: 'c', propsNeeded: [], textOverlay: 'd' },
            { index: 3, durationSec: 5, action: 'a', cameraAngle: 'b', lightingTip: 'c', propsNeeded: [], textOverlay: 'd' },
          ],
          audioMood: ['upbeat'],
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ReelScriptService,
          { provide: PrismaService, useValue: prisma },
          { provide: LlmService, useValue: llm },
          { provide: ReelTemplateService, useValue: templates },
        ],
      }).compile();

      service = module.get(ReelScriptService);
    });

    it('throws if topic is missing', async () => {
      await expect(
        service.generate({ teamId: 't_1', topic: '' }),
      ).rejects.toThrow();
    });

    it('generates a script using a template + LLM', async () => {
      const result = await service.generate({
        teamId: 'team_1',
        templateId: 't_1',
        topic: 'New balayage service',
        variables: { clientFirstName: 'Priya' },
      });

      expect(result.title).toBe('Test Reel');
      expect(result.hook).toBe('You won\'t believe');
      expect(result.shots).toHaveLength(3);
      expect(result.shots[0].voiceover).toBe('hi');
      expect(result.totalDuration).toBe(15);
      expect(prisma.reelScript.create).toHaveBeenCalled();
    });

    it('generates a script without a template (freeform)', async () => {
      const result = await service.generate({
        teamId: 'team_1',
        topic: 'Generic post',
      });
      expect(result).toBeDefined();
      expect(result.shots.length).toBeGreaterThan(0);
    });
  });

  describe('TrendingAudioService', () => {
    let service: TrendingAudioService;
    let prisma: any;

    beforeEach(async () => {
      prisma = {
        trendingAudio: {
          findMany: jest.fn().mockResolvedValue([]),
          findUnique: jest.fn(),
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockImplementation(({ data }) => ({ id: 'a_1', ...data })),
          update: jest.fn(),
          updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        },
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          TrendingAudioService,
          { provide: PrismaService, useValue: prisma },
        ],
      }).compile();

      service = module.get(TrendingAudioService);
    });

    it('list filters by mood and platform', async () => {
      await service.list({ platform: 'instagram', mood: 'upbeat' });
      expect(prisma.trendingAudio.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
            platform: 'instagram',
            mood: { has: 'upbeat' },
          }),
        }),
      );
    });

    it('upsert creates new track with defaults', async () => {
      const result = await service.upsert({ title: 'Test Song' });
      expect(result.title).toBe('Test Song');
      expect(prisma.trendingAudio.create).toHaveBeenCalled();
    });
  });

  describe('ReelCalendarService', () => {
    let service: ReelCalendarService;
    let prisma: any;
    let llm: any;
    let templates: any;

    beforeEach(async () => {
      prisma = {
        reelCalendar: {
          findUnique: jest.fn().mockResolvedValue(null),
          findFirst: jest.fn(),
          upsert: jest.fn().mockImplementation(({ create }) => ({ id: 'c_1', ...create })),
          findMany: jest.fn().mockResolvedValue([]),
          update: jest.fn(),
        },
        brandProfile: { findUnique: jest.fn().mockResolvedValue(null) },
      };
      llm = {
        completeJson: jest.fn().mockResolvedValue({
          ideas: Array.from({ length: 16 }).map((_, i) => ({
            templateSlug: 'salon-before-after-3shot',
            topic: `Idea ${i}`,
            hook: `Hook ${i}`,
            notes: 'note',
          })),
        }),
      };
      templates = {
        list: jest.fn().mockResolvedValue([
          { id: 't_1', slug: 'salon-before-after-3shot', vertical: 'salon', category: 'before_after', goal: 'engagement', title: 'Before/After' },
        ]),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ReelCalendarService,
          { provide: PrismaService, useValue: prisma },
          { provide: LlmService, useValue: llm },
          { provide: ReelTemplateService, useValue: templates },
        ],
      }).compile();

      service = module.get(ReelCalendarService);
    });

    it('generates a calendar with entries', async () => {
      const result = await service.generate({
        teamId: 'team_1',
        vertical: 'salon',
        month: 5,
        year: 2026,
      });
      expect(result.id).toBe('c_1');
      expect((result as any).entries.length).toBeGreaterThan(0);
    });

    it('returns existing calendar from getOrGenerate when one exists', async () => {
      prisma.reelCalendar.findUnique.mockResolvedValueOnce({ id: 'existing', entries: [] });
      const result = await service.getOrGenerate({
        teamId: 'team_1',
        vertical: 'salon',
        month: 5,
        year: 2026,
      });
      expect(result.id).toBe('existing');
      expect(llm.completeJson).not.toHaveBeenCalled();
    });
  });
});
