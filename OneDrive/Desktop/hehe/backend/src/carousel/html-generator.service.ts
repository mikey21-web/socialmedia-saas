import { Injectable } from '@nestjs/common';
import { CarouselPalette, CarouselSlide } from './carousel.types';

@Injectable()
export class HtmlGeneratorService {
  build(input: {
    slides: CarouselSlide[];
    palette: CarouselPalette;
    fonts: { primary: string; secondary?: string | null };
  }): string {
    const fontFamily = `${input.fonts.primary}, ${input.fonts.secondary ?? 'Inter'}, system-ui, sans-serif`;
    const slides = input.slides.map((slide, index) => this.renderSlide(slide, input.slides.length, index)).join('');

    return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<style>
*{box-sizing:border-box}
body{margin:0;background:${input.palette.lightBg};font-family:${fontFamily};}
.carousel-deck{display:flex;flex-direction:column;gap:24px;padding:24px}
.slide{position:relative;width:420px;height:525px;overflow:hidden;padding:42px 34px 60px;border:1px solid ${input.palette.lightBorder};background:var(--bg);color:var(--fg)}
.kicker{font-size:13px;font-weight:700;letter-spacing:0;text-transform:uppercase;color:var(--accent);margin-bottom:22px}
h1{font-size:42px;line-height:1.02;margin:0 0 22px;font-weight:850;letter-spacing:0}
p{font-size:21px;line-height:1.35;margin:0;color:var(--fg)}
.badge{position:absolute;top:22px;right:24px;font-size:13px;padding:7px 10px;border:1px solid currentColor}
.progress{position:absolute;left:34px;right:34px;bottom:28px;height:5px;background:rgba(127,127,127,.22)}
.progress span{display:block;height:100%;width:var(--progress);background:var(--accent)}
.arrow{position:absolute;right:24px;bottom:44px;font-size:30px;color:var(--accent)}
</style>
</head>
<body><main class="carousel-deck">${slides}</main></body>
</html>`;
  }

  buildSingleSlideHtml(deckHtml: string, slideIndex: number): string {
    const match = deckHtml.match(/<style>[\s\S]*?<\/style>/);
    const styles = match?.[0] ?? '';
    const slideMatches = [...deckHtml.matchAll(/<section class="slide"[\s\S]*?<\/section>/g)];
    const slide = slideMatches[slideIndex]?.[0] ?? slideMatches[0]?.[0] ?? '';

    return `<!doctype html><html><head><meta charset="utf-8" />${styles}</head><body style="margin:0">${slide}</body></html>`;
  }

  private renderSlide(slide: CarouselSlide, total: number, index: number): string {
    const progress = Math.round(((index + 1) / total) * 100);
    return `<section class="slide" data-slide="${index}" style="--bg:${slide.designTokens.background};--fg:${slide.designTokens.foreground};--accent:${slide.designTokens.accent};--progress:${progress}%">
<div class="kicker">${this.escape(slide.role)}</div>
<div class="badge">${slide.slideNumber}/${total}</div>
<h1>${this.escape(slide.headline)}</h1>
<p>${this.escape(slide.body)}</p>
${index < total - 1 ? '<div class="arrow">›</div>' : ''}
<div class="progress"><span></span></div>
</section>`;
  }

  private escape(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
