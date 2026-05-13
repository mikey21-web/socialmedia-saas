---
paths:
  - "apps/frontend/**/*.tsx"
  - "apps/frontend/**/*.ts"
---

# Frontend Rules — Next.js + shadcn/ui

## Component Patterns
- **Functional components only** + React hooks
- **shadcn/ui for primitives** — never build buttons/inputs from scratch
- **Zustand for global state** — no prop drilling
- **Tailwind CSS** with dark mode first (use `dark:` prefix)
- **Server/Client boundaries** — mark with `"use client"` where needed
- **Dynamic imports** for heavy components

## Dark Mode
- Always design dark mode first, then light
- Use Tailwind's `dark:` prefix
- Never flat black — use `#0A0A0A` or gradients
- Add depth with borders, glows, shadows

## TypeScript
- Strict mode: no `any` type
- Interface for component props
- Explicit return types on functions

## Performance
- Use `next/image` for all images
- Code split with dynamic imports for routes
- Memoize expensive re-renders with `useMemo` / `useCallback`
- Avoid unnecessary re-renders in lists

## Testing
- Write tests in `__tests__/` folders co-located with components
- Use React Testing Library for component tests
- Test user behavior, not implementation
