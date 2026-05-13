import { PlaywrightExporterService } from './playwright-exporter.service';

describe('PlaywrightExporterService', () => {
  let service: PlaywrightExporterService;

  beforeAll(() => {
    service = new PlaywrightExporterService();
  });

  afterAll(async () => {
    await service.onModuleDestroy();
  });

  it('exports HTML slide to PNG buffer', async () => {
    const html = '<html><body style="background:red;width:1080px;height:1350px"></body></html>';
    const buffer = await service.exportSlideToBuffer(html);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
  }, 30000);

  it('exports multiple slides', async () => {
    const slides = [
      '<html><body style="background:blue"></body></html>',
      '<html><body style="background:green"></body></html>',
    ];
    const buffers = await service.exportSlidesToBuffers(slides);
    expect(buffers).toHaveLength(2);
    buffers.forEach((buffer) => expect(buffer).toBeInstanceOf(Buffer));
  }, 30000);
});
