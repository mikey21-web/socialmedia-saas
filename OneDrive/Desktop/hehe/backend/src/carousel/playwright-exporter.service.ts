import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { chromium, Browser } from 'playwright';

@Injectable()
export class PlaywrightExporterService implements OnModuleDestroy {
  private readonly logger = new Logger(PlaywrightExporterService.name);
  private browser: Browser | null = null;

  private async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.logger.log('Launching Chromium for carousel exports');
      this.browser = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    }
    return this.browser;
  }

  async exportSlideToBuffer(html: string, width = 1080, height = 1350): Promise<Buffer> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      await page.setViewportSize({ width, height });
      await page.setContent(html, { waitUntil: 'networkidle' });
      await page.waitForTimeout(300);
      const buffer = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width, height } });
      return Buffer.from(buffer);
    } finally {
      await page.close();
    }
  }

  async exportSlidesToBuffers(htmlSlides: string[]): Promise<Buffer[]> {
    return Promise.all(htmlSlides.map((html) => this.exportSlideToBuffer(html)));
  }

  async onModuleDestroy(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
