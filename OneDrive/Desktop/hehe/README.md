# Diyaa AI Marketing Agency MVP

This workspace contains the AI Marketing Agency SaaS MVP: a NestJS backend, Next.js dashboard, Prisma/PostgreSQL database, Temporal workflows, publishing integrations, billing, analytics, brand voice training, humanizer, carousel generation, and agency agent orchestration.

## Main Modules

- `backend/src/brand-voice`: brand voice profile extraction, palette generation, profile CRUD, and voice validation.
- `backend/src/ai/humanizer`: pattern detectors and humanization pass used before AI copy reaches users.
- `backend/src/agency`: strategist, copywriter, designer, analyst, engagement manager, trend monitor, orchestrator, and tier config.
- `backend/src/carousel`: carousel slide generation, HTML preview, Playwright/R2 export path, and carousel persistence.
- `backend/src/temporal`: agency workflow extensions for daily cycle, trend scan, engagement polling, reports, competitors, and metrics collection.
- `backend/src/subscriptions`: Stripe checkout, webhook handling, four agency tiers, and usage reporting.
- `frontend/app/(dashboard)`: command center, brand voice, strategy, pipeline, carousel, inbox, reports, trends, competitors, and settings.
- `frontend/app/admin`: platform observability, including agent runs, carousel gallery, LLM costs, trends, and humanizer stats.

## Verification

Backend build:

```bash
cd backend
npx nest build --builder swc
```

Focused backend tests:

```bash
cd backend
npm test -- copywriter.spec.ts carousel.service.spec.ts engagement.spec.ts strategist.spec.ts brand-voice-trainer.spec.ts orchestrator.spec.ts
```

Frontend build:

```bash
cd frontend
npm run build
```

## Environment

Copy `backend/.env.example` and fill in database, JWT, Stripe, LLM, Replicate, Sentry, platform OAuth, Temporal, and R2/S3 values. Stripe supports `STRIPE_SOLO_PRICE_ID`, `STRIPE_PRO_PRICE_ID`, `STRIPE_AGENCY_PRICE_ID`, and `STRIPE_ENTERPRISE_PRICE_ID`.
