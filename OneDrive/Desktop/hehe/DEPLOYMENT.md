# Deployment Guide

Step-by-step guide to deploy Diyaa AI to production.

## Prerequisites

- Railway account (backend)
- Vercel account (frontend)
- PostgreSQL database (Railway managed or Neon)
- Redis (Upstash or Railway Redis)
- Domain name (e.g. diyaa.ai)

## Step 1 — Validate environment variables

Before deploying, run the validation script locally with your production env vars:

```bash
cd backend
# Copy your production env vars into a temp file
cp .env.example .env.prod
# Edit .env.prod with real values, then:
node -r dotenv/config scripts/validate-prod-env.js dotenv_config_path=.env.prod
```

Fix all FATAL errors before proceeding.

## Step 2 — Deploy the backend (Railway)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Deploy
railway up
```

Railway will:
1. Build the NestJS app (`npm run build`)
2. Generate Prisma client
3. Run `prisma migrate deploy` on startup
4. Start the server

**Required environment variables in Railway:**

```
NODE_ENV=production
PORT=3000
JWT_SECRET=<min 32 chars>
REFRESH_TOKEN_SECRET=<min 32 chars>
TOKEN_ENCRYPTION_KEY=<64 char hex>
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
FRONTEND_URL=https://diyaa.ai
CORS_ORIGINS=https://diyaa.ai
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_SOLO_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_AGENCY_PRICE_ID=price_...
GROQ_API_KEY=gsk_...
SENTRY_DSN=https://...@sentry.io/...
RESEND_API_KEY=re_...
EMAIL_FROM=no-reply@diyaa.ai
```

## Step 3 — Seed the database

After first deploy, run the seed script to populate email templates and music tracks:

```bash
railway run npm run db:seed
```

## Step 4 — Deploy the frontend (Vercel)

```bash
# Install Vercel CLI
npm install -g vercel

cd frontend

# Deploy
vercel --prod
```

**Required environment variables in Vercel:**

```
NEXT_PUBLIC_API_URL=https://api.diyaa.ai
NEXT_PUBLIC_APP_URL=https://diyaa.ai
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
NEXT_PUBLIC_CRISP_WEBSITE_ID=your-crisp-id
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

## Step 5 — Configure DNS

Point your domain to Vercel and Railway:

```
diyaa.ai          → Vercel (A record or CNAME)
www.diyaa.ai      → Vercel (CNAME)
api.diyaa.ai      → Railway (CNAME)
```

## Step 6 — Configure Stripe webhook

In the Stripe dashboard:
1. Go to Developers → Webhooks
2. Add endpoint: `https://api.diyaa.ai/api/subscriptions/webhook`
3. Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
4. Copy the webhook signing secret → set as `STRIPE_WEBHOOK_SECRET`

## Step 7 — Verify deployment

```bash
# Health check
curl https://api.diyaa.ai/health

# Expected response:
# {"status":"ok","db":"ok","redis":"ok","uptime":...}
```

## Step 8 — Set up uptime monitoring

1. Go to https://betteruptime.com or https://uptimerobot.com
2. Add monitor: `https://api.diyaa.ai/health/live`
3. Check interval: 60 seconds
4. Alert: email + SMS

## Step 9 — Run load tests against staging

Before going live, run load tests against your staging environment:

```bash
BASE_URL=https://api-staging.diyaa.ai TEST_TOKEN=your-staging-jwt k6 run load-tests/publish-workflow.js
BASE_URL=https://api-staging.diyaa.ai TEST_TOKEN=your-staging-jwt k6 run load-tests/analytics-dashboard.js
```

All thresholds must pass before production launch.

## Rollback

If something goes wrong:

**Backend (Railway):**
1. Go to Railway dashboard → Deployments
2. Click the previous successful deployment
3. Click "Redeploy"

**Frontend (Vercel):**
1. Go to Vercel dashboard → Deployments
2. Click the previous deployment
3. Click "Promote to Production"

**Database:**
- Migrations are forward-only. To rollback a migration, create a new migration that reverses it.
- Always backup before running migrations: `pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql`
