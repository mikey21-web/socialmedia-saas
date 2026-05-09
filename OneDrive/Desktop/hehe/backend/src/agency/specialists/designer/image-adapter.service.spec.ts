import { Test, TestingModule } from '@nestjs/testing';
import { ImageAdapterService } from './image-adapter.service';
import sharp from 'sharp';

describe('ImageAdapterService', () => {
  let adapter: ImageAdapterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImageAdapterService],
    }).compile();

    adapter = module.get<ImageAdapterService>(ImageAdapterService);
  });

  it('adapts 1024x1024 to Instagram portrait 1080x1350', async () => {
    const input = await sharp({
      create: { width: 1024, height: 1024, channels: 3, background: '#fff' }
    }).png().toBuffer();
    
    const output = await adapter.adaptForPlatform(input, 'instagram', 'portrait');
    const meta = await sharp(output).metadata();
    
    expect(meta.width).toBe(1080);
    expect(meta.height).toBe(1350);
  });
});
