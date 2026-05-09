import { Injectable, Logger } from '@nestjs/common';
import { MediaService } from '../media/media.service';
import { HtmlGeneratorService } from './html-generator.service';

interface BrowserLike {
  newContext(options: {
    viewport: { width: number; height: number };
    deviceScaleFactor: number;
  }): Promise<ContextLike>;
  close(): Promise<void>;
}

interface ContextLike {
  newPage(): Promise<PageLike>;
  close(): Promise<void>;
}

interface PageLike {
  setContent(html: string): Promise<void>;
  waitForLoadState(state: 'networkidle'): Promise<void>;
  screenshot(options: {
    type: 'png';
    fullPage: boolean;
    omitBackground: boolean;
  }): Promise<Buffer>;
}

interface PlaywrightLike {
  chromium: {
    launch(): Promise<BrowserLike>;
  };
}

@Injectable()
export class PlaywrightExporterService {
  private readonly logger = new Logger(PlaywrightExporterService.name);

  constructor(
    private readonly mediaService: MediaService,
    private readonly htmlGenerator: HtmlGeneratorService,
  ) {}

  async export(input: {
    teamId: string;
    html: string;
    slideCount: number;
    deviceScaleFactor: number;
  }): Promise<string[]> {
    const playwright = this.loadPlaywright();
    if (!playwright) {
      return this.fallbackUrls(input.slideCount);
    }

    const browser = await playwright.chromium.launch();
    const urls: string[] = [];

    try {
      for (let i = 0; i < input.slideCount; i++) {
        const context = await browser.newContext({
          viewport: { width: 420, height: 525 },
          deviceScaleFactor: input.deviceScaleFactor,
        });
        try {
          const page = await context.newPage();
          await page.setContent(this.htmlGenerator.buildSingleSlideHtml(input.html, i));
          await page.waitForLoadState('networkidle');
          const buffer = await page.screenshot({
            type: 'png',
            fullPage: false,
            omitBackground: false,
          });

          urls.push(await this.uploadOrFallback(input.teamId, buffer, i));
        } finally {
          await context.close();
        }
      }
    } finally {
      await browser.close();
    }

    return urls;
  }

  private loadPlaywright(): PlaywrightLike | null {
    try {
      const dynamicRequire = eval('require') as NodeRequire;
      return dynamicRequire('playwright') as PlaywrightLike;
    } catch {
      this.logger.warn('Playwright is not installed in backend, using SVG preview URLs');
      return null;
    }
  }

  private async uploadOrFallback(teamId: string, buffer: Buffer, index: number): Promise<string> {
    try {
      return await this.mediaService.uploadGeneratedBuffer(
        teamId,
        buffer,
        `carousel-slide-${index + 1}.png`,
        'image/png',
      );
    } catch {
      return this.fallbackUrl(index);
    }
  }

  private fallbackUrls(count: number): string[] {
    return Array.from({ length: count }, (_, index) => this.fallbackUrl(index));
  }

  private fallbackUrl(index: number): string {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350"><rect width="100%" height="100%" fill="#f6f7f9"/><text x="540" y="675" text-anchor="middle" font-family="Arial" font-size="64" fill="#111827">Slide ${index + 1}</text></svg>`;
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }
}
