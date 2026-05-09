import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs/promises';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export type TemplateId = 'quote-card' | 'announcement' | 'stat-card' | 'product-showcase';

export type AnyTemplateData = {
  quote?: string;
  author?: string;
  headline?: string;
  subtext?: string;
  badge?: string;
  metric?: string;
  label?: string;
  context?: string;
  productName?: string;
  tagline?: string;
  cta?: string;
  bgColor?: string;
  accentColor?: string;
};

export type TemplateData = {
  'quote-card': {
    quote: string;
    author: string;
    bgColor?: string;
    accentColor?: string;
  };
  'announcement': {
    headline: string;
    subtext?: string;
    badge?: string;
    bgColor?: string;
    accentColor?: string;
  };
  'stat-card': {
    metric: string;
    label: string;
    context?: string;
    bgColor?: string;
    accentColor?: string;
  };
  'product-showcase': {
    productName: string;
    tagline: string;
    cta?: string;
    bgColor?: string;
    accentColor?: string;
  };
};

@Injectable()
export class HyperframesService {
  private readonly logger = new Logger(HyperframesService.name);

  async render<T extends TemplateId>(
    templateId: T,
    data: AnyTemplateData,
    format: 'story' | 'square' | 'landscape' = 'story',
  ): Promise<Buffer> {
    const html = this.buildHtml(templateId, data, format);
    return this.htmlToMp4(html, format);
  }

  private getDimensions(format: string): { width: number; height: number } {
    switch (format) {
      case 'story':
        return { width: 1080, height: 1920 };
      case 'square':
        return { width: 1080, height: 1080 };
      case 'landscape':
        return { width: 1920, height: 1080 };
      default:
        return { width: 1080, height: 1920 };
    }
  }

  private buildHtml(templateId: TemplateId, data: AnyTemplateData, format: string): string {
    const { width, height } = this.getDimensions(format);
    const bg = (data as Record<string, string>).bgColor ?? '#0f172a';
    const accent = (data as Record<string, string>).accentColor ?? '#6366f1';

    const bodies: Record<TemplateId, string> = {
      'quote-card': `
        <div class="container" style="
          background: ${bg};
          width: ${width}px; height: ${height}px;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 120px; box-sizing: border-box; position: relative; overflow: hidden;
        ">
          <div style="
            position: absolute; top: 0; left: 0; right: 0; height: 8px;
            background: ${accent};
          "></div>
          <div style="
            font-size: 96px; color: ${accent}; font-family: Georgia, serif;
            line-height: 0.8; margin-bottom: 60px; opacity: 0.7;
          ">"</div>
          <p class="animate-fade-in" style="
            font-size: 72px; color: #f8fafc; text-align: center;
            font-family: 'Georgia', serif; line-height: 1.4;
            font-style: italic; margin: 0 0 80px;
          ">${this.escape((data as Record<string, string>).quote)}</p>
          <p style="
            font-size: 48px; color: ${accent}; font-family: sans-serif;
            font-weight: 600; letter-spacing: 2px; text-transform: uppercase;
          ">— ${this.escape((data as Record<string, string>).author)}</p>
        </div>`,

      'announcement': `
        <div style="
          background: linear-gradient(135deg, ${bg} 0%, #1e293b 100%);
          width: ${width}px; height: ${height}px;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 120px; box-sizing: border-box;
        ">
          ${(data as Record<string, string>).badge ? `<span style="
            background: ${accent}; color: white;
            font-size: 40px; font-weight: 700; padding: 16px 48px;
            border-radius: 100px; margin-bottom: 80px; letter-spacing: 4px;
            font-family: sans-serif; text-transform: uppercase;
          ">${this.escape((data as Record<string, string>).badge)}</span>` : ''}
          <h1 class="animate-fade-in" style="
            font-size: 96px; color: #f8fafc; text-align: center;
            font-family: sans-serif; font-weight: 800; line-height: 1.2;
            margin: 0 0 60px;
          ">${this.escape((data as Record<string, string>).headline)}</h1>
          ${(data as Record<string, string>).subtext ? `<p style="
            font-size: 56px; color: #94a3b8; text-align: center;
            font-family: sans-serif; line-height: 1.5; margin: 0;
          ">${this.escape((data as Record<string, string>).subtext)}</p>` : ''}
        </div>`,

      'stat-card': `
        <div style="
          background: ${bg};
          width: ${width}px; height: ${height}px;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 120px; box-sizing: border-box;
        ">
          <p class="animate-count" style="
            font-size: 200px; color: ${accent}; font-weight: 900;
            font-family: sans-serif; margin: 0 0 20px; line-height: 1;
          ">${this.escape((data as Record<string, string>).metric)}</p>
          <p style="
            font-size: 72px; color: #f8fafc; font-family: sans-serif;
            font-weight: 700; text-align: center; margin: 0 0 40px;
          ">${this.escape((data as Record<string, string>).label)}</p>
          ${(data as Record<string, string>).context ? `<p style="
            font-size: 48px; color: #64748b; font-family: sans-serif; text-align: center;
          ">${this.escape((data as Record<string, string>).context)}</p>` : ''}
        </div>`,

      'product-showcase': `
        <div style="
          background: linear-gradient(180deg, ${bg} 0%, #020617 100%);
          width: ${width}px; height: ${height}px;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 120px; box-sizing: border-box;
        ">
          <div style="
            width: 160px; height: 160px; background: ${accent};
            border-radius: 40px; margin-bottom: 80px;
            display: flex; align-items: center; justify-content: center;
            font-size: 80px;
          ">✦</div>
          <h1 style="
            font-size: 120px; color: #f8fafc; font-weight: 900;
            font-family: sans-serif; text-align: center; margin: 0 0 40px;
          ">${this.escape((data as Record<string, string>).productName)}</h1>
          <p class="animate-fade-in" style="
            font-size: 60px; color: #94a3b8; text-align: center;
            font-family: sans-serif; line-height: 1.4; margin: 0 0 80px;
          ">${this.escape((data as Record<string, string>).tagline)}</p>
          ${(data as Record<string, string>).cta ? `<div style="
            background: ${accent}; color: white; font-size: 52px;
            font-weight: 700; padding: 32px 96px; border-radius: 100px;
            font-family: sans-serif;
          ">${this.escape((data as Record<string, string>).cta)}</div>` : ''}
        </div>`,
    };

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { overflow: hidden; }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(40px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in {
    animation: fadeIn 0.8s ease-out 0.3s both;
  }
  @keyframes countUp {
    from { opacity: 0; transform: scale(0.8); }
    to { opacity: 1; transform: scale(1); }
  }
  .animate-count {
    animation: countUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both;
  }
</style>
</head>
<body>
${bodies[templateId]}
</body>
</html>`;
  }

  private escape(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private async htmlToMp4(html: string, format: string): Promise<Buffer> {
    const { width, height } = this.getDimensions(format);
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hf-'));
    const htmlPath = path.join(tmpDir, 'frame.html');
    const framesDir = path.join(tmpDir, 'frames');
    const outputPath = path.join(tmpDir, 'output.mp4');

    let browser: import('puppeteer').Browser | null = null;

    try {
      await fs.writeFile(htmlPath, html, 'utf8');
      await fs.mkdir(framesDir);

      const puppeteer = await import('puppeteer');
      browser = await puppeteer.default.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });
      const page = await browser.newPage();
      await page.setViewport({ width, height, deviceScaleFactor: 1 });
      await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });

      const FPS = 30;
      const DURATION_SECONDS = 3;
      const TOTAL_FRAMES = FPS * DURATION_SECONDS;

      for (let i = 0; i < TOTAL_FRAMES; i++) {
        const framePath = path.join(framesDir, `frame-${String(i).padStart(4, '0')}.png`) as `${string}.png`;
        await page.screenshot({ path: framePath });
        await page.evaluate((ms: number) => {
          return new Promise<void>((resolve) => setTimeout(resolve, ms));
        }, Math.round(1000 / FPS));
      }

      await browser.close();
      browser = null;

      await execFileAsync('ffmpeg', [
        '-y',
        '-framerate',
        String(FPS),
        '-i',
        path.join(framesDir, 'frame-%04d.png'),
        '-c:v',
        'libx264',
        '-preset',
        'fast',
        '-crf',
        '23',
        '-pix_fmt',
        'yuv420p',
        '-movflags',
        '+faststart',
        outputPath,
      ]);

      const buffer = await fs.readFile(outputPath);
      return buffer;
    } finally {
      if (browser) await browser.close().catch(() => { /* ignore close errors */ });
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  }
}