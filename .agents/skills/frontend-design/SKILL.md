---
name: frontend-design
description: Create distinctive, production-grade web UI with React and Tailwind. Use when building web components, pages, dashboards, landing pages, or applications requiring exceptional visual polish and intentional creative direction — not generic AI aesthetics.
---

# Frontend Design Expert

Create distinctive, production-grade web interfaces. Avoid generic AI-generated aesthetics.

## Pre-Coding: Establish Direction

Before writing code, choose a bold aesthetic direction:
- **Brutally minimal**: razor-sharp spacing, monospace, stark contrast
- **Editorial/magazine**: strong typography hierarchy, asymmetric layouts
- **Glassmorphism**: backdrop-blur, translucent layers, soft glows
- **Neomorphism**: subtle shadows, embossed surfaces
- **Maximalist**: layered elements, rich color, overlapping grids
- **Retro/terminal**: CRT effects, scan lines, monochrome

Execute the direction with precision. Never default to generic patterns.

## Anti-Patterns to AVOID

```
❌ Inter font everywhere
❌ Purple-to-blue gradients (#7c3aed → #2563eb)
❌ Centered hero with rounded card below
❌ "Your SaaS Name" placeholder copy
❌ Uniform border-radius: 8px on everything
❌ Gray-50 backgrounds with gray-900 text
❌ Three feature cards with emoji icons
```

## Typography First

```jsx
// Use characterful fonts via Google Fonts CDN
// Headings: Space Grotesk, Syne, Cabinet Grotesk, Clash Display, Bebas Neue
// Body: DM Sans, Plus Jakarta Sans, Instrument Sans
// Mono: JetBrains Mono, Fira Code, Berkeley Mono
// Serif accent: Playfair Display, Lora, Editorial New

// Tailwind config extension
fontFamily: {
  display: ['Space Grotesk', 'sans-serif'],
  body: ['DM Sans', 'sans-serif'],
  mono: ['JetBrains Mono', 'monospace'],
}
```

## Color System with CSS Variables

```css
:root {
  --bg: #0c0c0d;
  --surface: #161618;
  --border: rgba(255,255,255,0.08);
  --text-primary: #f0eff0;
  --text-muted: #71717a;
  --accent: #e879f9;       /* pick one strong accent */
  --accent-dim: rgba(232,121,249,0.15);
}
```

## Layout Patterns

### Asymmetric hero (not centered)
```jsx
<section className="grid grid-cols-[1fr_40%] gap-0 min-h-screen">
  <div className="flex flex-col justify-end p-16 pb-24">
    <span className="text-xs tracking-[0.3em] uppercase text-muted mb-6">tagline</span>
    <h1 className="text-[clamp(3rem,8vw,7rem)] font-display leading-[0.9] tracking-tight">
      Bold<br/><em>Statement</em>
    </h1>
  </div>
  <div className="bg-accent/10 border-l border-border relative overflow-hidden">
    {/* visual element */}
  </div>
</section>
```

### Grid-breaking card layout
```jsx
<div className="grid grid-cols-12 gap-4">
  <div className="col-span-7 row-span-2 ...">large card</div>
  <div className="col-span-5 ...">small card</div>
  <div className="col-span-3 ...">tiny</div>
  <div className="col-span-2 ...">tiny</div>
</div>
```

## Animation: Staggered Page Load

```jsx
// Using CSS animations (no library needed)
const fadeUp = `
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

// Apply with staggered delays
<h1 style={{ animation: 'fadeUp 0.6s ease forwards', animationDelay: '0.1s', opacity: 0 }}>
<p style={{ animation: 'fadeUp 0.6s ease forwards', animationDelay: '0.3s', opacity: 0 }}>
<button style={{ animation: 'fadeUp 0.6s ease forwards', animationDelay: '0.5s', opacity: 0 }}>
```

## Glassmorphism Cards

```jsx
<div className="relative rounded-2xl overflow-hidden"
  style={{
    background: 'rgba(255,255,255,0.03)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.1)'
  }}>
```

## Texture / Grain Effect

```css
/* Noise texture overlay for depth */
.grain::after {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 9999;
}
```

## Interactive Hover States

```jsx
// Magnetic button effect
const handleMouseMove = (e) => {
  const rect = e.target.getBoundingClientRect();
  const x = e.clientX - rect.left - rect.width / 2;
  const y = e.clientY - rect.top - rect.height / 2;
  e.target.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
};
```

## Checklist Before Shipping

- [ ] Font is loaded (Google Fonts link in head)
- [ ] Color palette uses CSS variables, not hardcoded values
- [ ] Mobile responsive (check at 375px)
- [ ] Loading animation on initial render
- [ ] Hover states on interactive elements
- [ ] Consistent spacing rhythm (4/8/16/24/32/48/64px)
- [ ] No placeholder text — real copy
- [ ] Contrast passes WCAG AA (4.5:1)
