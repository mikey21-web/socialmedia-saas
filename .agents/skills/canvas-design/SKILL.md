---
name: canvas-design
description: Create sophisticated visual art and design compositions as PDF or PNG artifacts. Use when asked to design posters, infographics, visual reports, data visualizations, artistic compositions, or any visual-first single-page content.
---

# Canvas Design

Create museum-quality visual compositions as self-contained PDF or PNG artifacts.

## Two-Phase Process

### Phase 1: Design Philosophy
Before creating anything, write 2-4 sentences establishing:
- Visual language (geometric? organic? typographic?)
- Color mood (warm/cool/monochrome/vibrant?)
- Composition approach (grid/free/radial/layered?)
- Conceptual theme

### Phase 2: Visual Execution
90% visual, 10% essential text. The composition communicates information through design — not explanatory paragraphs.

## Core Principles

- **Typography as design element**: Text shapes, not just labels
- **Visual hierarchy**: One dominant element, supporting elements, details
- **Restraint**: White space is as important as content
- **No overlap/bleed**: Everything contained with proper margins
- **No placeholder text**: Real, specific, purposeful copy only

## HTML → PNG/PDF Pattern

```html
<!DOCTYPE html>
<html>
<head>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }

  /* A4 at 96dpi */
  body {
    width: 794px;
    height: 1123px;
    overflow: hidden;
    background: #0f0f0f;
    font-family: 'Space Grotesk', sans-serif;
  }

  .canvas {
    width: 100%;
    height: 100%;
    position: relative;
    padding: 60px;
  }
</style>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;700&family=Playfair+Display:ital@0;1&display=swap" rel="stylesheet">
</head>
<body>
<div class="canvas">
  <!-- Design here -->
</div>
</body>
</html>
```

## Common Canvas Sizes

| Format | Dimensions (px) | Use |
|--------|----------------|-----|
| A4 portrait | 794 × 1123 | Documents, reports |
| A4 landscape | 1123 × 794 | Presentations |
| Square | 800 × 800 | Social media |
| Wide banner | 1200 × 628 | Blog headers, OG images |
| Poster | 600 × 900 | Event posters |

## Layout Patterns

### Dominant Typography
```css
.hero-text {
  font-size: clamp(4rem, 12vw, 9rem);
  font-weight: 700;
  line-height: 0.85;
  letter-spacing: -0.04em;
}
```

### Grid-based data layout
```css
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(4, 1fr);
  gap: 2px;
  height: 100%;
}
.cell-large { grid-column: span 2; grid-row: span 2; }
```

### Diagonal split
```css
.diagonal-bg {
  background: linear-gradient(
    135deg,
    #0f0f0f 50%,
    #1a1a2e 50%
  );
}
```

## Color Palettes

```css
/* Monochrome with accent */
--bg: #0a0a0a; --text: #f5f5f0; --accent: #e63946;

/* Warm neutral */
--bg: #faf7f0; --text: #1a1a18; --accent: #c9742b;

/* Deep ocean */
--bg: #0b1929; --text: #e8f4fd; --accent: #00b4d8;

/* Forest */
--bg: #1a2e1a; --text: #e8f5e3; --accent: #7ec850;

/* Paper */
--bg: #f8f3e8; --text: #2c2416; --accent: #8b6914;
```

## Visual Elements

### Geometric accent shapes
```html
<svg width="200" height="200" style="position:absolute; top:40px; right:40px; opacity:0.15">
  <circle cx="100" cy="100" r="80" fill="none" stroke="#fff" stroke-width="1"/>
  <circle cx="100" cy="100" r="50" fill="none" stroke="#fff" stroke-width="1"/>
  <line x1="100" y1="0" x2="100" y2="200" stroke="#fff" stroke-width="0.5"/>
  <line x1="0" y1="100" x2="200" y2="100" stroke="#fff" stroke-width="0.5"/>
</svg>
```

### Data visualization (pure CSS/SVG)
```html
<svg viewBox="0 0 400 200">
  <!-- Bar chart -->
  <rect x="20" y="60" width="40" height="140" fill="#e63946" opacity="0.8"/>
  <rect x="80" y="30" width="40" height="170" fill="#e63946"/>
  <rect x="140" y="90" width="40" height="110" fill="#e63946" opacity="0.6"/>
  <!-- Labels -->
  <text x="40" y="220" fill="#888" font-size="12" text-anchor="middle">Jan</text>
</svg>
```

## Deliverables

1. **Single HTML file** — self-contained, all styles inline, no external dependencies except Google Fonts
2. **Correct canvas dimensions** — use exact px values for the target format
3. **Print-ready**: no text cut off, proper margins (40-80px), nothing overflowing
