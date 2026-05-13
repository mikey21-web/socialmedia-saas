---
name: frontend-design
description: Apply design system and accessibility standards to any UI
user-invocable: true
---

# Frontend Design System — Postiz SaaS

Apply these standards to every component you build.

## Colors
- **Primary:** `#0066CC` (Postiz blue)
- **Success:** `#00AA44` (social green)
- **Warning:** `#FF9900` (engagement orange)
- **Error:** `#DD1144` (action red)
- **Background:** `#0A0A0A` (dark mode)
- **Surface:** `#1A1A1A` (cards, inputs)
- **Text:** `#FFFFFF` (primary), `#AAAAAA` (secondary)

## Typography
- **Font:** Inter, -0.02em tracking, 1.5 line height
- **Hero/H1:** 48px, 600 weight, -0.02em
- **Heading/H2:** 32px, 600 weight
- **Subheading/H3:** 24px, 500 weight
- **Body:** 16px, 400 weight
- **Caption:** 12px, 400 weight, #AAAAAA

## Spacing
- Use 8px grid system
- **Padding:** 16px (small), 24px (medium), 32px (large)
- **Gaps:** 16px (horizontal), 12px (vertical in lists)
- **Margins:** 32px between sections

## Components
- Use **shadcn/ui** for buttons, inputs, modals, dropdowns, tabs
- Use **Tailwind CSS** with `dark:` prefix (never hardcode colors)
- **Never build from scratch** — shadcn has it

## Dark Mode
- Always dark by default
- Use gradients for depth (avoid flat #000000)
- Borders with subtle color: `border-zinc-800`
- Shadows with transparency: `shadow-lg` with opacity

## Accessibility
- Every interactive element is keyboard-accessible
- Use `aria-label` for icon buttons
- Maintain color contrast (WCAG AAA)
- Use semantic HTML (`<button>`, `<nav>`, `<main>`)

## Patterns
- **Loading:** Use Spinner component from shadcn (no custom spinners)
- **Empty States:** Friendly message + call-to-action
- **Error States:** Red border, error icon, clear message
- **Success:** Green icon, toast notification
- **Forms:** Inline validation, helper text, required marker

## Mobile
- Breakpoints: `sm: 640px`, `md: 768px`, `lg: 1024px`
- Touch targets: min 44px × 44px
- Text should never be smaller than 16px on mobile
- Full-width on mobile, max-width 1200px on desktop
