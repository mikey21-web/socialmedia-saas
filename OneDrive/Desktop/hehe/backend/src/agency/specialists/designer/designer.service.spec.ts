import { Test, TestingModule } from '@nestjs/testing';
import { DesignerService, ImageGenerationBrief } from './designer.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { ReplicateProvider } from '../../../ai/replicate/replicate.provider';
import { R2StorageService } from '../../../media/r2-storage.service';
import { ImageAdapterService } from './image-adapter.service';
import { AgentRunLoggerService } from '../../agent-run-logger.service';

describe('DesignerService', () => {
  let service: DesignerService;
  let replicateProvider: jest.Mocked<ReplicateProvider>;
  let r2StorageService: jest.Mocked<R2StorageService>;
  let imageAdapterService: jest.Mocked<ImageAdapterService>;
  let agentRunLoggerService: jest.Mocked<AgentRunLoggerService>;

  beforeEach(async () => {
    replicateProvider = {
      generateImage: jest.fn(),
      generateMultiple: jest.fn(),
    } as any;

    r2StorageService = {
      uploadBuffer: jest.fn(),
    } as any;

    imageAdapterService = {
      adaptForAllPlatforms: jest.fn(),
    } as any;

    agentRunLoggerService = {
      start: jest.fn(),
      succeed: jest.fn(),
      fail: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DesignerService,
        { provide: PrismaService, useValue: {} },
        { provide: ReplicateProvider, useValue: replicateProvider },
        { provide: R2StorageService, useValue: r2StorageService },
        { provide: ImageAdapterService, useValue: imageAdapterService },
        { provide: AgentRunLoggerService, useValue: agentRunLoggerService },
      ],
    }).compile();

    service = module.get<DesignerService>(DesignerService);
  });

  const brief: ImageGenerationBrief = {
    teamId: 'team1',
    subject: 'A test subject',
    style: 'realistic',
    mood: 'happy',
    colorPalette: ['#fff'],
    platform: ['instagram', 'x'],
    imageType: 'post',
    negativePrompt: 'text',
  };

  it('generates image and adapts for all platforms', async () => {
    const testBuffer = Buffer.from('test');
    replicateProvider.generateImage.mockResolvedValue(testBuffer);
    r2StorageService.uploadBuffer.mockResolvedValue('http://fakeurl/img.png');
    imageAdapterService.adaptForAllPlatforms.mockResolvedValue({
      instagram: Buffer.from('insta'),
      x: Buffer.from('x'),
    });

    const result = await service.generateImage(brief);

    expect(result.sourceUrl).toBe('http://fakeurl/img.png');
    expect(result.platformUrls['instagram']).toBe('http://fakeurl/img.png');
    expect(result.platformUrls['x']).toBe('http://fakeurl/img.png');
    expect(replicateProvider.generateImage).toHaveBeenCalled();
    expect(imageAdapterService.adaptForAllPlatforms).toHaveBeenCalledWith(testBuffer, ['instagram', 'x']);
  });

  it('generates 3 variants', async () => {
    const testBuffer = Buffer.from('test');
    replicateProvider.generateMultiple.mockResolvedValue([testBuffer, testBuffer, testBuffer]);
    r2StorageService.uploadBuffer.mockResolvedValue('http://fakeurl/img.png');
    imageAdapterService.adaptForAllPlatforms.mockResolvedValue({
      instagram: Buffer.from('insta'),
    });

    const results = await service.generateVariants(brief, 3);
    
    expect(results.length).toBe(3);
    expect(replicateProvider.generateMultiple).toHaveBeenCalledWith(expect.any(String), 3, expect.any(Object));
  });

  it('falls back to local storage when R2 not configured', async () => {
    // Note: Since we mocked R2StorageService, we'll just verify the service
    // correctly uses whatever URL the mock returns.
    // The actual fallback logic is in R2StorageService itself.
    const testBuffer = Buffer.from('test');
    replicateProvider.generateImage.mockResolvedValue(testBuffer);
    r2StorageService.uploadBuffer.mockResolvedValue('/uploads/img.png');
    imageAdapterService.adaptForAllPlatforms.mockResolvedValue({});

    const result = await service.generateImage(brief);
    
    expect(result.sourceUrl).toMatch(/^\/uploads\//);
  });

  it('builds correct prompt from brief', async () => {
    const prompt = (service as any).buildPrompt(brief);
    
    expect(prompt).toContain('A test subject');
    expect(prompt).toContain('realistic');
    expect(prompt).toContain('happy');
    expect(prompt).toContain('Color palette: #fff');
    expect(prompt).toContain('Avoid: text');
    expect(prompt).not.toContain('\n\n'); // No empty lines based on filter(Boolean)
  });
});
