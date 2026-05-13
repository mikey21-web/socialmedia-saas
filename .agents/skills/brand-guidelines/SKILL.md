---
name: brand-guidelines
description: Apply Anthropic brand identity to visual artifacts and designs. Use when creating branded content, designing Anthropic-styled interfaces, applying official Anthropic colors and typography, or building anything that should look like official Anthropic material.
---

# Anthropic Brand Guidelines

Apply official Anthropic brand identity to visual artifacts and designs.

## Color Palette

```css
:root {
  /* Primary */
  --anthro-dark:   #141413;  /* primary text, dark backgrounds */
  --anthro-cream:  #faf9f5;  /* light backgrounds */

  /* Grays */
  --anthro-gray-900: #1a1916;
  --anthro-gray-700: #3d3d3a;
  --anthro-gray-500: #6b6b67;
  --anthro-gray-300: #c8c7c2;
  --anthro-gray-100: #f0ede6;

  /* Accent Colors */
  --anthro-orange: #d97757;  /* primary accent */
  --anthro-blue:   #6a9bcc;  /* secondary accent */
  --anthro-green:  #788c5d;  /* tertiary accent */

  /* Usage */
  --bg-primary:   var(--anthro-cream);
  --bg-dark:      var(--anthro-dark);
  --text-primary: var(--anthro-dark);
  --accent:       var(--anthro-orange);
}
```

## Typography

```html
<!-- Load preferred fonts -->
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Lora:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet">
```

```css
/* Headings */
font-family: 'Poppins', Arial, sans-serif;
font-weight: 600;

/* Body text */
font-family: 'Lora', Georgia, serif;
font-weight: 400;

/* Fallback (works without internet) */
h1, h2, h3 { font-family: Arial, sans-serif; }
p, body { font-family: Georgia, serif; }
```

## Typography Scale

```css
.heading-xl  { font: 600 3.5rem/1.1 'Poppins', sans-serif; letter-spacing: -0.02em; }
.heading-lg  { font: 600 2.5rem/1.2 'Poppins', sans-serif; letter-spacing: -0.01em; }
.heading-md  { font: 600 1.75rem/1.3 'Poppins', sans-serif; }
.heading-sm  { font: 600 1.25rem/1.4 'Poppins', sans-serif; }
.body-lg     { font: 400 1.125rem/1.7 'Lora', serif; }
.body-md     { font: 400 1rem/1.6 'Lora', serif; }
.caption     { font: 400 0.875rem/1.5 'Poppins', sans-serif; color: var(--anthro-gray-500); }
```

## Component Examples

### Header / Nav
```html
<header style="background: #faf9f5; border-bottom: 1px solid #e8e5de; padding: 16px 32px; display: flex; align-items: center; gap: 8px;">
  <span style="font-family: Poppins, sans-serif; font-weight: 600; font-size: 1.25rem; color: #141413;">Anthropic</span>
</header>
```

### Primary Button
```html
<button style="background: #d97757; color: #faf9f5; font-family: Poppins, sans-serif; font-weight: 500; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; font-size: 0.95rem; transition: opacity 0.15s;">
  Get started
</button>
```

### Card
```html
<div style="background: #fff; border: 1px solid #e8e5de; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(20,20,19,0.06);">
  <h3 style="font-family: Poppins, sans-serif; font-weight: 600; color: #141413; margin: 0 0 8px;">Card Title</h3>
  <p style="font-family: Lora, Georgia, serif; color: #3d3d3a; margin: 0; line-height: 1.6;">Card content here.</p>
</div>
```

## Accent Color Usage

Use accents sparingly — one per visual context:

| Accent | Hex | Use for |
|--------|-----|---------|
| Orange | `#d97757` | CTAs, highlights, links |
| Blue | `#6a9bcc` | Charts, data, info states |
| Green | `#788c5d` | Success, nature themes |

Never use multiple accents on the same element.

## Dark Mode Variant

```css
/* Dark Anthropic surface */
.anthro-dark-surface {
  background: #141413;
  color: #faf9f5;
  border: 1px solid rgba(250,249,245,0.1);
}

/* Text on dark */
.anthro-dark-surface h1,
.anthro-dark-surface h2 {
  color: #faf9f5;
}
.anthro-dark-surface p {
  color: #c8c7c2;
}
```
