# Deployment Guide (Ready-to-Deploy)

This guide matches the current codebase:
- Backend: NestJS + Prisma + Temporal + Stripe webhook
- Frontend: Next.js 16
- CI/CD: `.github/workflows/ci-cd.yml`

## 1. Required Secrets and Environment Variables

### Backend (`backend/.env`)
```env
DATABASE_URL=postgresql://...
JWT_SECRET=...
PORT=3001
FRONTEND_URL=https://your-frontend-domain.com

# Temporal
TEMPORAL_SERVER_URL=localhost:7233
TEMPORAL_NAMESPACE=default
TEMPORAL_TASK_QUEUE=posts-queue

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PRO=price_...

# OAuth
X_CLIENT_ID=...
X_CLIENT_SECRET=...
INSTAGRAM_CLIENT_ID=...
INSTAGRAM_CLIENT_SECRET=...
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...
FACEBOOK_CLIENT_ID=...
FACEBOOK_CLIENT_SECRET=...

# Platform publishing
INSTAGRAM_BUSINESS_ACCOUNT_ID=...
FACEBOOK_PAGE_ID=...

# Webhooks
TWITTER_WEBHOOK_SECRET=...
INSTAGRAM_WEBHOOK_SECRET=...
LINKEDIN_WEBHOOK_SECRET=...
FACEBOOK_WEBHOOK_SECRET=...

OAUTH_CALLBACK_URL=https://your-backend-domain.com/oauth/callback
```

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
NEXT_PUBLIC_TEAM_ID=team-1
```

## 2. Local Production Validation

```bash
# backend
cd backend
npm ci
npm run build
npm test -- --runInBand

# frontend
cd ../frontend
npm ci
npm run build
```

## 3. Stripe Setup

1. Create product/price in Stripe and set `STRIPE_PRICE_ID_PRO`.
2. Set webhook endpoint:
   - `POST https://your-backend-domain.com/webhooks/stripe`
3. Subscribe events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Put webhook signing secret in `STRIPE_WEBHOOK_SECRET`.

## 4. Temporal Setup

Run Temporal server (local/dev):
```bash
docker run --name temporal -p 7233:7233 -p 8233:8233 temporalio/auto-setup:latest
```

Run backend API and worker as separate processes:
```bash
cd backend
npm run build
npm run start
npm run start:worker
```

## 5. Deploy Targets

### Frontend (Vercel)
1. Import repo in Vercel.
2. Root directory: `frontend`.
3. Add env vars (`NEXT_PUBLIC_API_URL`, optional `NEXT_PUBLIC_TEAM_ID`).
4. Deploy.

### Backend (Railway/Fly/Render)
1. Deploy `backend`.
2. Add backend env vars above.
3. Run Prisma migration:
   ```bash
   npx prisma migrate deploy
   ```
4. Ensure both API process and worker process are running.

## 6. CI/CD Pipeline

Workflow file: `.github/workflows/ci-cd.yml`

It does:
1. Backend test/build on PR and push.
2. Frontend build on PR and push.
3. Optional auto-deploy on `main` push when secrets exist.

### GitHub Secrets Required for Deploy Jobs
```text
RAILWAY_TOKEN
DATABASE_URL_PROD
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
NEXT_PUBLIC_API_URL_PROD
```

If deploy secrets are missing, CI still runs build/test jobs and skips deploy jobs.

## 7. Go-Live Checklist

- [ ] Backend `npm run build` passes
- [ ] Backend tests pass
- [ ] Frontend `npm run build` passes
- [ ] Prisma migrations deployed
- [ ] Temporal server reachable from backend
- [ ] Backend worker running
- [ ] Stripe checkout works from `/settings/billing`
- [ ] Stripe webhook receives events and updates subscription rows
- [ ] Platform webhooks configured
- [ ] OAuth redirect URLs configured
- [ ] Frontend points to production backend URL
