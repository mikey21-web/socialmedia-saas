import { Injectable } from '@nestjs/common';

export interface BrandPalette {
  primaryColor: string;
  brandLight: string;
  brandDark: string;
  lightBg: string;
  lightBorder: string;
  darkBg: string;
}

interface HSL {
  h: number;
  s: number;
  l: number;
}

@Injectable()
export class PaletteBuilderService {
  buildPalette(primaryHex: string): BrandPalette {
    const hsl = this.hexToHsl(primaryHex);

    return {
      primaryColor: primaryHex,
      brandLight: this.hslToHex({
        h: hsl.h,
        s: Math.max(0, hsl.s - 20),
        l: Math.min(100, hsl.l + 15),
      }),
      brandDark: this.hslToHex({
        h: hsl.h,
        s: hsl.s,
        l: Math.max(0, hsl.l - 30),
      }),
      lightBg: this.hslToHex({
        h: hsl.h,
        s: 8,
        l: 97,
      }),
      lightBorder: this.hslToHex({
        h: hsl.h,
        s: 12,
        l: 92,
      }),
      darkBg: this.hslToHex({
        h: hsl.h,
        s: 15,
        l: 8,
      }),
    };
  }

  private hexToHsl(hex: string): HSL {
    const cleaned = hex.replace('#', '');
    const r = parseInt(cleaned.substring(0, 2), 16) / 255;
    const g = parseInt(cleaned.substring(2, 4), 16) / 255;
    const b = parseInt(cleaned.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;

    if (max === min) {
      return { h: 0, s: 0, l: l * 100 };
    }

    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    let h = 0;
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  }

  private hslToHex(hsl: HSL): string {
    const h = hsl.h / 360;
    const s = hsl.s / 100;
    const l = hsl.l / 100;

    if (s === 0) {
      const val = Math.round(l * 255);
      return `#${val.toString(16).padStart(2, '0').repeat(3)}`;
    }

    const hue2rgb = (p: number, q: number, t: number): number => {
      let tn = t;
      if (tn < 0) tn += 1;
      if (tn > 1) tn -= 1;
      if (tn < 1 / 6) return p + (q - p) * 6 * tn;
      if (tn < 1 / 2) return q;
      if (tn < 2 / 3) return p + (q - p) * (2 / 3 - tn) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const r = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
    const g = Math.round(hue2rgb(p, q, h) * 255);
    const b = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
}
