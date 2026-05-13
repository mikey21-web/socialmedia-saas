# Postiz Competitor MVP — Claude Code Configuration

## Project Overview
Building a **clean Postiz competitor** (social media scheduling SaaS) over 4 weeks to avoid AGPL licensing issues.

**Launch Date:** June 1, 2026  
**Target:** $10K+/month revenue with 300+ Pro users in first 2 weeks post-launch

## Stack
- **Backend:** NestJS + TypeScript + PostgreSQL + Prisma
- **Frontend:** Next.js 14 + shadcn/ui + Tailwind CSS
- **Orchestration:** Temporal workflows for publish scheduling
- **Payments:** Stripe
- **Image Generation:** Replicate
- **Deployment:** Vercel (frontend), Railway/Heroku (backend)

## MVP Scope
- ✅ Authentication & multi-tenant architecture
- ✅ 5 platforms: X, Instagram, LinkedIn, Facebook (+ TikTok optional)
- ✅ Advanced analytics (CRITICAL feature, not basic)
- ✅ Content scheduling with Temporal
- ✅ Token-based approval workflows
- ✅ Stripe billing (Pro tier)

## Commands
- `pnpm dev` — Start all dev servers (monorepo)
- `pnpm build` — Build all packages
- `pnpm test` — Run test suite
- `pnpm lint` — Lint with ESLint
- `cd apps/backend && pnpm prisma studio` — Database UI

## Conventions
- TypeScript strict mode, no `any`
- Functional components + hooks (React)
- Zustand for client state
- Dark mode first
- NestJS modules organized by domain

## Key Files
- `/apps/backend/src/` — NestJS API
- `/apps/frontend/src/` — Next.js UI
- `/packages/` — Shared types, utilities
- `prisma/schema.prisma` — Database schema
- `.env.example` — Template for secrets

## Do Not Commit
- `.env` (actual secrets)
- `/dist`, `/build`, `/node_modules`
- `.next`
- IDE settings (except shared `.cursor/` rules)
