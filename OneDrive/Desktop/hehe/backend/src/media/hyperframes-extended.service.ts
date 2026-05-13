import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs/promises';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

/**
 * HyperFrames extended template renderer.
 *
 * Adds 11 archetype templates ported from Open Design (Apache-2.0).
 * Source: https://github.com/nexu-io/open-design/tree/main/prompt-templates/video
 *
 * Each template renders HTML+CSS animations to MP4 via Puppeteer + FFmpeg
 * at the requested duration and aspect ratio.
 */

export type ExtendedTemplateId =
  | 'product-reveal-minimal'
  | 'saas-promo-30s'
  | 'tiktok-karaoke'
  | 'brand-sizzle-reel'
  | 'data-bar-chart-race'
  | 'flight-map-route'
  | 'logo-outro-cinematic'
  | 'money-counter-hype'
  | 'app-showcase-three-phones'
  | 'social-overlay-stack'
  | 'website-to-video';

@Injectable()
export class HyperframesExtendedService {
  private readonly logger = new Logger(HyperframesExtendedService.name);

  async render(
    templateId: ExtendedTemplateId,
    data: Record<string, unknown>,
    format: 'story' | 'square' | 'landscape',
    durationSec: number,
  ): Promise<Buffer> {
    const html = this.buildHtml(templateId, data, format);
    return this.htmlToMp4(html, format, durationSec);
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

  private buildHtml(templateId: ExtendedTemplateId, data: Record<string, unknown>, format: string): string {
    const { width, height } = this.getDimensions(format);
    const body = this.buildBody(templateId, data, width, height);
    const css = this.commonCss();

    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>${css}</style></head><body>${body}</body></html>`;
  }

  private buildBody(id: ExtendedTemplateId, d: Record<string, unknown>, w: number, h: number): string {
    const accent = String(d.accentColor ?? '#6366f1');
    const bg = String(d.bgColor ?? '#0f172a');
    const e = (s: unknown) => this.escape(String(s ?? ''));

    switch (id) {
      // ─── 5s Minimal Product Reveal ──────────────────────────────────────
      case 'product-reveal-minimal':
        return `<div class="stage" style="width:${w}px;height:${h}px;background:${bg};color:${accent};display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:-apple-system,Inter,sans-serif;overflow:hidden;">
          <div class="reveal-line" style="width:0;height:2px;background:${accent};margin-bottom:80px;animation:expandLine 1.2s cubic-bezier(0.65,0,0.35,1) 0.3s forwards;"></div>
          <h1 class="reveal-title" style="font-size:${Math.min(180, w/8)}px;font-weight:200;letter-spacing:-0.04em;margin:0 0 40px;opacity:0;animation:fadeInUp 1.4s cubic-bezier(0.16,1,0.3,1) 1.5s forwards;">${e(d.productName)}</h1>
          <p class="reveal-tag" style="font-size:${Math.min(48, w/30)}px;font-weight:300;letter-spacing:0.05em;opacity:0;animation:fadeInUp 1.2s cubic-bezier(0.16,1,0.3,1) 2.5s forwards;">${e(d.tagline)}</p>
        </div>`;

      // ─── 30s SaaS Product Promo ─────────────────────────────────────────
      case 'saas-promo-30s':
        return `<div class="stage" style="width:${w}px;height:${h}px;background:linear-gradient(135deg,${bg} 0%,#1a1f2e 100%);color:#fff;font-family:Inter,sans-serif;overflow:hidden;position:relative;">
          <div class="phase phase-hook" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:120px;animation:phaseHook 30s linear forwards;">
            <h1 style="font-size:${Math.min(120, w/14)}px;font-weight:800;text-align:center;line-height:1.1;color:${accent};">${e(d.problemHook)}</h1>
          </div>
          <div class="phase phase-product" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;animation:phaseProduct 30s linear forwards;opacity:0;">
            <h2 style="font-size:${Math.min(160, w/10)}px;font-weight:900;color:#fff;letter-spacing:-0.04em;">${e(d.productName)}</h2>
          </div>
          <div class="phase phase-features" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:60px;animation:phaseFeatures 30s linear forwards;opacity:0;">
            ${[d.feature1, d.feature2, d.feature3].map((f, i) => `
              <div class="feature-row" style="font-size:${Math.min(60, w/26)}px;color:#fff;animation:slideInLeft 0.6s ease-out ${15 + i * 1.5}s both;">
                <span style="color:${accent};margin-right:24px;">▸</span>${e(f)}
              </div>`).join('')}
          </div>
          <div class="phase phase-cta" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;animation:phaseCta 30s linear forwards;opacity:0;">
            <div style="background:${accent};color:#000;padding:32px 96px;font-size:${Math.min(60, w/26)}px;font-weight:700;border-radius:100px;">${e(d.cta)}</div>
          </div>
        </div>`;

      // ─── TikTok Karaoke Talking-Head ────────────────────────────────────
      case 'tiktok-karaoke': {
        const words = String(d.script ?? '').split(/\s+/).filter(Boolean);
        const wordSpans = words.map((w, i) => `<span class="kw" style="animation-delay:${i * 0.4}s">${this.escape(w)}</span>`).join(' ');
        return `<div class="stage" style="width:${w}px;height:${h}px;background:${bg};color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding:80px;font-family:Inter,sans-serif;position:relative;overflow:hidden;">
          ${d.speakerImageUrl ? `<img src="${e(d.speakerImageUrl)}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0.85;" />` : `<div style="position:absolute;inset:0;background:linear-gradient(180deg,${bg} 0%,#000 100%);"></div>`}
          <div class="captions" style="position:relative;font-size:${Math.min(72, w/16)}px;font-weight:900;text-align:center;line-height:1.3;text-shadow:0 4px 20px rgba(0,0,0,0.8);max-width:90%;padding-bottom:20%;">
            ${wordSpans}
          </div>
        </div>`;
      }

      // ─── 30s Brand Sizzle Reel ──────────────────────────────────────────
      case 'brand-sizzle-reel':
        return `<div class="stage" style="width:${w}px;height:${h}px;background:${bg};color:${accent};font-family:Inter,sans-serif;display:flex;align-items:center;justify-content:center;overflow:hidden;position:relative;">
          <div class="word w1" style="position:absolute;font-size:${Math.min(280, w/7)}px;font-weight:900;letter-spacing:-0.05em;animation:flashWord 30s linear forwards;animation-delay:2s;opacity:0;">${e(d.word1)}</div>
          <div class="word w2" style="position:absolute;font-size:${Math.min(280, w/7)}px;font-weight:900;letter-spacing:-0.05em;animation:flashWord 30s linear forwards;animation-delay:7s;opacity:0;">${e(d.word2)}</div>
          <div class="word w3" style="position:absolute;font-size:${Math.min(280, w/7)}px;font-weight:900;letter-spacing:-0.05em;animation:flashWord 30s linear forwards;animation-delay:12s;opacity:0;">${e(d.word3)}</div>
          <div class="brand-final" style="position:absolute;display:flex;flex-direction:column;align-items:center;gap:30px;animation:fadeInUp 1.5s ease-out 22s both;opacity:0;">
            <h1 style="font-size:${Math.min(160, w/12)}px;font-weight:900;letter-spacing:-0.04em;color:#fff;margin:0;">${e(d.brandName)}</h1>
            <p style="font-size:${Math.min(48, w/32)}px;color:${accent};margin:0;">${e(d.tagline)}</p>
          </div>
        </div>`;

      // ─── Animated Bar Chart Race ────────────────────────────────────────
      case 'data-bar-chart-race': {
        const items = [
          { label: d.item1Label, value: Number(d.item1Value ?? 0) },
          { label: d.item2Label, value: Number(d.item2Value ?? 0) },
          { label: d.item3Label, value: Number(d.item3Value ?? 0) },
          ...(d.item4Label ? [{ label: d.item4Label, value: Number(d.item4Value ?? 0) }] : []),
        ];
        const max = Math.max(...items.map((i) => i.value), 1);
        const unit = String(d.unit ?? '%');
        const bars = items.map((item, i) => `
          <div class="bar-row" style="display:grid;grid-template-columns:200px 1fr 120px;gap:24px;align-items:center;margin-bottom:32px;font-size:${Math.min(36, w/40)}px;color:#fff;">
            <div style="font-weight:600;text-align:right;">${this.escape(String(item.label))}</div>
            <div class="bar-track" style="height:48px;background:rgba(255,255,255,0.08);border-radius:8px;overflow:hidden;">
              <div class="bar-fill" style="height:100%;background:${accent};width:0;animation:barGrow 2s cubic-bezier(0.16,1,0.3,1) ${0.5 + i * 0.3}s forwards;--target-width:${(item.value / max) * 100}%;"></div>
            </div>
            <div class="bar-value" style="font-weight:700;color:${accent};opacity:0;animation:fadeIn 0.4s ease-out ${1.5 + i * 0.3}s forwards;">${item.value}${unit}</div>
          </div>`).join('');
        return `<div class="stage" style="width:${w}px;height:${h}px;background:${bg};color:#fff;font-family:Inter,sans-serif;padding:120px;box-sizing:border-box;">
          <h2 style="font-size:${Math.min(72, w/26)}px;font-weight:800;margin:0 0 60px;color:#fff;">${e(d.title)}</h2>
          ${bars}
        </div>`;
      }

      // ─── Flight Map Route Reveal ────────────────────────────────────────
      case 'flight-map-route':
        return `<div class="stage" style="width:${w}px;height:${h}px;background:#000;color:#fff;font-family:Inter,sans-serif;position:relative;overflow:hidden;">
          <svg viewBox="0 0 1920 1080" style="position:absolute;inset:0;width:100%;height:100%;">
            <defs>
              <radialGradient id="globe">
                <stop offset="0%" stop-color="#1a3a6e"/><stop offset="100%" stop-color="#000"/>
              </radialGradient>
            </defs>
            <circle cx="960" cy="540" r="450" fill="url(#globe)" opacity="0.3"/>
            <circle cx="600" cy="500" r="14" fill="${accent}" class="pin pin1"/>
            <circle cx="1320" cy="600" r="14" fill="${accent}" class="pin pin2"/>
            <path d="M 600 500 Q 960 200 1320 600" stroke="${accent}" stroke-width="4" fill="none" stroke-dasharray="2000" stroke-dashoffset="2000" style="animation:dashIn 3s ease-out 1s forwards;"/>
          </svg>
          <div style="position:absolute;top:120px;left:120px;font-size:${Math.min(64, w/30)}px;font-weight:300;animation:fadeIn 0.8s ease-out 0.3s both;">
            <div style="opacity:0.6;font-size:0.5em;letter-spacing:2px;">FROM</div>
            <div style="font-weight:800;">${e(d.origin)}</div>
          </div>
          <div style="position:absolute;bottom:120px;right:120px;font-size:${Math.min(64, w/30)}px;font-weight:300;text-align:right;animation:fadeIn 0.8s ease-out 4s both;">
            <div style="opacity:0.6;font-size:0.5em;letter-spacing:2px;">TO</div>
            <div style="font-weight:800;">${e(d.destination)}</div>
          </div>
          ${d.distanceLabel ? `<div style="position:absolute;bottom:60px;left:50%;transform:translateX(-50%);color:${accent};font-size:${Math.min(28, w/68)}px;letter-spacing:3px;animation:fadeIn 0.8s ease-out 5s both;">${e(d.distanceLabel)}</div>` : ''}
        </div>`;

      // ─── 4s Cinematic Logo Outro ────────────────────────────────────────
      case 'logo-outro-cinematic':
        return `<div class="stage" style="width:${w}px;height:${h}px;background:${bg};color:${accent};font-family:Inter,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;">
          <h1 class="logo-text" style="font-size:${Math.min(220, w/9)}px;font-weight:900;letter-spacing:-0.05em;margin:0;text-shadow:0 0 40px ${accent};opacity:0;animation:logoBloom 2s cubic-bezier(0.16,1,0.3,1) 0.5s forwards;">${e(d.logoText)}</h1>
          ${d.tagline ? `<p style="font-size:${Math.min(36, w/40)}px;letter-spacing:0.2em;text-transform:uppercase;margin-top:40px;opacity:0;animation:fadeIn 1s ease-out 2.5s forwards;">${e(d.tagline)}</p>` : ''}
        </div>`;

      // ─── $0 → $10K Money Counter ────────────────────────────────────────
      case 'money-counter-hype': {
        const symbol = String(d.currencySymbol ?? '₹');
        const start = Number(d.startValue ?? 0);
        const end = Number(d.endValue ?? 10000);
        return `<div class="stage" style="width:${w}px;height:${h}px;background:${bg};color:${accent};font-family:Inter,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;position:relative;">
          <div class="money-counter" style="font-size:${Math.min(280, w/5)}px;font-weight:900;letter-spacing:-0.04em;color:${accent};text-shadow:0 0 60px ${accent};" data-start="${start}" data-end="${end}" data-symbol="${e(symbol)}">${e(symbol)}${start.toLocaleString()}</div>
          <p style="font-size:${Math.min(48, w/32)}px;color:#fff;font-weight:600;margin-top:60px;opacity:0;animation:fadeInUp 0.8s ease-out 4s forwards;">${e(d.label)}</p>
          <div class="burst" style="position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at center,${accent}33,transparent 50%);opacity:0;animation:burst 0.5s ease-out 4.5s forwards;"></div>
          <script>
            (function() {
              const el = document.querySelector('.money-counter');
              const start = parseInt(el.dataset.start, 10);
              const end = parseInt(el.dataset.end, 10);
              const symbol = el.dataset.symbol;
              const duration = 4000;
              const startTime = performance.now();
              function tick(now) {
                const elapsed = now - startTime;
                const t = Math.min(1, elapsed / duration);
                const eased = 1 - Math.pow(1 - t, 3);
                const value = Math.floor(start + (end - start) * eased);
                el.textContent = symbol + value.toLocaleString();
                if (t < 1) requestAnimationFrame(tick);
              }
              requestAnimationFrame(tick);
            })();
          </script>
        </div>`;
      }

      // ─── 3-Phone App Showcase ───────────────────────────────────────────
      case 'app-showcase-three-phones':
        return `<div class="stage" style="width:${w}px;height:${h}px;background:${bg};color:#fff;font-family:Inter,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:60px;position:relative;overflow:hidden;">
          <h1 style="font-size:${Math.min(80, w/24)}px;font-weight:800;color:#fff;margin:0;animation:fadeInUp 0.8s ease-out 0.3s both;">${e(d.appName)}</h1>
          <div style="display:flex;gap:60px;align-items:flex-end;">
            ${[1, 2, 3].map((i) => `
              <div class="phone phone-${i}" style="width:280px;height:580px;background:#000;border-radius:48px;border:8px solid #1a1a1a;padding:8px;animation:floatPhone 4s ease-in-out infinite ${i * 0.5}s, fadeInUp 1s ease-out ${i * 0.3}s both;display:flex;flex-direction:column;">
                <img src="${e(d[`screen${i}Url`])}" style="width:100%;height:100%;object-fit:cover;border-radius:32px;" />
                <p style="text-align:center;color:${accent};font-size:24px;margin-top:24px;font-weight:600;">${e(d[`screen${i}Feature`])}</p>
              </div>`).join('')}
          </div>
        </div>`;

      // ─── Social Overlay Stack ───────────────────────────────────────────
      case 'social-overlay-stack': {
        const cards = [1, 2, 3].map((i) => ({
          type: String(d[`card${i}Type`] ?? 'twitter'),
          author: String(d[`card${i}Author`] ?? ''),
          content: String(d[`card${i}Content`] ?? ''),
        })).filter((c) => c.author);
        const cardHtml = cards.map((c, i) => {
          const colors = { twitter: '#1da1f2', reddit: '#ff4500', spotify: '#1db954', instagram: '#e1306c' };
          const color = colors[c.type as keyof typeof colors] ?? accent;
          return `<div class="social-card" style="position:absolute;top:${20 + i * 25}%;left:50%;transform:translateX(-50%);width:80%;max-width:600px;background:#1a1a1a;border-radius:24px;padding:32px;border-left:6px solid ${color};animation:slideInRight 0.6s cubic-bezier(0.16,1,0.3,1) ${i * 2}s both;">
            <div style="font-size:14px;color:${color};text-transform:uppercase;letter-spacing:2px;margin-bottom:12px;">${this.escape(c.type)}</div>
            <div style="font-size:20px;font-weight:600;color:#fff;margin-bottom:8px;">${this.escape(c.author)}</div>
            <div style="font-size:18px;color:#aaa;line-height:1.5;">${this.escape(c.content)}</div>
          </div>`;
        }).join('');
        return `<div class="stage" style="width:${w}px;height:${h}px;background:${bg};color:#fff;font-family:Inter,sans-serif;position:relative;overflow:hidden;">${cardHtml}</div>`;
      }

      // ─── Website-to-Video Promo ─────────────────────────────────────────
      case 'website-to-video':
        return `<div class="stage" style="width:${w}px;height:${h}px;background:#000;color:#fff;font-family:Inter,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:40px;overflow:hidden;">
          <h1 style="font-size:${Math.min(96, w/20)}px;font-weight:900;color:${accent};margin:0;animation:fadeInUp 1s ease-out 0.3s both;">${e(d.productName)}</h1>
          <p style="font-size:${Math.min(48, w/32)}px;color:#fff;margin:0;animation:fadeInUp 1s ease-out 1s both;">${e(d.tagline)}</p>
          <div class="browser-mockup" style="width:80%;height:50%;background:#1a1a1a;border-radius:12px;border:2px solid #333;display:flex;flex-direction:column;animation:fadeInUp 1.2s ease-out 1.5s both;">
            <div style="height:40px;background:#222;border-radius:10px 10px 0 0;display:flex;align-items:center;padding:0 16px;gap:8px;">
              <div style="width:12px;height:12px;border-radius:50%;background:#ff5f57;"></div>
              <div style="width:12px;height:12px;border-radius:50%;background:#febc2e;"></div>
              <div style="width:12px;height:12px;border-radius:50%;background:#28c840;"></div>
              <div style="margin-left:24px;color:#666;font-size:14px;">${e(d.websiteUrl)}</div>
            </div>
            <div style="flex:1;background:linear-gradient(135deg,#0f172a,#1a1f2e);"></div>
          </div>
          <div style="background:${accent};color:#000;padding:24px 64px;font-size:${Math.min(40, w/40)}px;font-weight:700;border-radius:100px;animation:fadeInUp 1s ease-out 5s both;">${e(d.cta)}</div>
        </div>`;

      default:
        return `<div style="width:${w}px;height:${h}px;background:${bg};color:#fff;display:flex;align-items:center;justify-content:center;font-family:sans-serif;">Unknown template: ${id}</div>`;
    }
  }

  private commonCss(): string {
    return `
      * { margin:0; padding:0; box-sizing:border-box; }
      body { overflow:hidden; }
      @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
      @keyframes fadeInUp { from { opacity:0; transform:translateY(40px); } to { opacity:1; transform:translateY(0); } }
      @keyframes slideInLeft { from { opacity:0; transform:translateX(-60px); } to { opacity:1; transform:translateX(0); } }
      @keyframes slideInRight { from { opacity:0; transform:translateX(80px) translateY(-50%); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
      @keyframes expandLine { to { width:240px; } }
      @keyframes dashIn { to { stroke-dashoffset:0; } }
      @keyframes barGrow { to { width:var(--target-width); } }
      @keyframes logoBloom {
        0% { opacity:0; transform:scale(0.6); filter:blur(20px); }
        60% { opacity:1; transform:scale(1.05); filter:blur(0); }
        100% { opacity:1; transform:scale(1); filter:blur(0); }
      }
      @keyframes burst {
        0% { opacity:0; transform:scale(0.5); }
        100% { opacity:1; transform:scale(2); }
      }
      @keyframes floatPhone {
        0%, 100% { transform:translateY(0); }
        50% { transform:translateY(-20px); }
      }
      @keyframes flashWord {
        0%, 100% { opacity:0; transform:scale(0.5); }
        2%, 8% { opacity:1; transform:scale(1); }
      }
      @keyframes phaseHook {
        0%, 23% { opacity:1; }
        25%, 100% { opacity:0; }
      }
      @keyframes phaseProduct {
        0%, 25% { opacity:0; }
        27%, 45% { opacity:1; }
        47%, 100% { opacity:0; }
      }
      @keyframes phaseFeatures {
        0%, 47% { opacity:0; }
        50%, 80% { opacity:1; }
        82%, 100% { opacity:0; }
      }
      @keyframes phaseCta {
        0%, 82% { opacity:0; }
        85%, 100% { opacity:1; }
      }
      .kw {
        opacity:0;
        animation:fadeInUp 0.4s cubic-bezier(0.16,1,0.3,1) forwards;
        display:inline-block;
        margin:0 4px;
      }
    `;
  }

  private escape(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private async htmlToMp4(html: string, format: string, durationSec: number): Promise<Buffer> {
    const { width, height } = this.getDimensions(format);
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hf-ext-'));
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
      const TOTAL_FRAMES = FPS * durationSec;

      for (let i = 0; i < TOTAL_FRAMES; i++) {
        const framePath = path.join(framesDir, `frame-${String(i).padStart(4, '0')}.png`) as `${string}.png`;
        await page.screenshot({ path: framePath });
        await page.evaluate((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)), Math.round(1000 / FPS));
      }

      await browser.close();
      browser = null;

      await execFileAsync('ffmpeg', [
        '-y', '-framerate', String(FPS),
        '-i', path.join(framesDir, 'frame-%04d.png'),
        '-c:v', 'libx264', '-preset', 'fast', '-crf', '23',
        '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
        outputPath,
      ]);

      return await fs.readFile(outputPath);
    } finally {
      if (browser) await browser.close().catch(() => undefined);
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  }
}
