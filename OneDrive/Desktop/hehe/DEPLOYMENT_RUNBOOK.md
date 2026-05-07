# Production Deployment Runbook

## Pre-Deployment Checklist

- [ ] All tests pass: `cd backend && npm test`
- [ ] Zero TS errors: `cd backend && npx tsc --noEmit` and `cd frontend && npx tsc --noEmit`
- [ ] No secrets in git: `git log -p --all -S 'SECRET' -S 'password' -- '*.ts' '*.env'`
- [ ] Database migration tested locally
- [ ] All Railway env vars set (see below)

## Required Environment Variables (Railway Backend)

```
JWT_SECRET                = <min 32 chars, random>
TOKEN_ENCRYPTION_KEY      = <min 32 chars, random>
REFRESH_TOKEN_SECRET      = <min 32 chars, random>
DATABASE_URL              = <Railway Postgres URL>
REDIS_URL                 = <Upstash or Railway Redis URL>
CORS_ORIGINS              = https://frontend-fawn-beta-69.vercel.app
NODE_ENV                  = production
PORT                      = 3000
GOOGLE_CLIENT_ID          = <from Google Cloud Console>
GOOGLE_CLIENT_SECRET      = <from Google Cloud Console>
STRIPE_SECRET_KEY         = <from Stripe Dashboard>
STRIPE_WEBHOOK_SECRET     = <from Stripe Webhooks>
SENTRY_DSN                = <from Sentry Project>
GROQ_API_KEY              = <from Groq>
```

Generate secrets:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Deployment Steps

### 1. Push code
```bash
git add backend/src/ frontend/ .github/
git commit -m "feat: ..."
git push origin master
```

Railway + Vercel auto-deploy on push.

### 2. Monitor Railway deploy
- Railway dashboard → Deployments → watch logs
- Should see: `NestJS application listening on port 3000`
- Health check: `curl https://agile-kindness-production-0efc.up.railway.app/health`

### 3. Run Prisma migrations (if schema changed)
Railway runs `npx prisma migrate deploy` automatically via CI.  
Manual: Railway dashboard → your service → Shell → `npx prisma migrate deploy`

### 4. Verify integration
- [ ] Frontend loads: https://frontend-fawn-beta-69.vercel.app
- [ ] Sign up with email works
- [ ] Sign up with Google works
- [ ] Sign in returns JWT + refresh token (check DevTools)
- [ ] Rate limit: try /auth/signin 6× in 5 min → 429 response
- [ ] Admin panel: set `role = 'admin'` in DB, then visit /admin

## Admin User Setup

To create first admin user (run in Railway shell or local with prod DATABASE_URL):
```sql
UPDATE "User" SET role = 'admin' WHERE email = 'your@email.com';
```

Admin endpoints (JWT required, role must be 'admin'):
- `GET /admin/users` — list all users
- `GET /admin/users/:id` — user detail + teams + subscription
- `PATCH /admin/users/:id` — suspend user or change role
- `GET /admin/posts` — all posts
- `DELETE /admin/posts/:id` — force delete post
- `GET /admin/subscriptions` — subscription overview
- `GET /admin/audit-logs` — action history

## Rollback

```bash
# Revert last commit
git revert HEAD
git push origin master

# Or: Railway dashboard → Deployments → select previous → Redeploy
# Or: Vercel dashboard → Deployments → select previous → Promote to production
```

## Monitoring (First 24h Post-Launch)

Watch:
- Sentry: error rate > 5% = investigate
- Railway logs: 500 errors, crashes
- DB: slow queries (Railway → Postgres → Metrics)
- Redis: memory usage (< 80%)

## GitHub Secrets to Configure

Go to GitHub repo → Settings → Secrets → Actions:
```
JWT_SECRET
TOKEN_ENCRYPTION_KEY
REFRESH_TOKEN_SECRET
DATABASE_URL_PROD
REDIS_URL
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
SENTRY_DSN
CORS_ORIGINS
NEXT_PUBLIC_API_URL_PROD   = https://agile-kindness-production-0efc.up.railway.app
RAILWAY_TOKEN              = <from Railway account settings>
VERCEL_TOKEN               = <from Vercel account settings>
VERCEL_ORG_ID              = <from Vercel project settings>
VERCEL_PROJECT_ID          = <from Vercel project settings>
```
