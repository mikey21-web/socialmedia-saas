# Pre-Launch Checklist

Use this checklist before going live. Every item must be checked off before flipping the "launched" switch.

---

## Environment Variables

- [ ] All required backend env vars are set in Railway (or target host) — no `.env` defaults leaking to prod
- [ ] `DATABASE_URL` points to the production PostgreSQL instance
- [ ] `JWT_SECRET` is a cryptographically random string (≥ 64 chars), unique to prod
- [ ] `STRIPE_SECRET_KEY` is the **live** key (not `sk_test_`)
- [ ] `STRIPE_WEBHOOK_SECRET` is set and matches the live webhook endpoint
- [ ] `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` (or R2 equivalents) are set
- [ ] `R2_BUCKET` (or `S3_BUCKET`) is set; bucket is not public by default
- [ ] `CDN_URL` or `R2_PUBLIC_URL` is set and resolves correctly
- [ ] `SENTRY_DSN` is set for both backend and frontend
- [ ] `NEXTAUTH_SECRET` (or `NEXT_PUBLIC_*` equivalents) are set for the frontend
- [ ] `SENDGRID_API_KEY` / `RESEND_API_KEY` is the live key
- [ ] `REPLICATE_API_TOKEN` is set if image/video generation is enabled
- [ ] All Temporal connection env vars are set (`TEMPORAL_ADDRESS`, namespace, etc.)
- [ ] `NODE_ENV=production` on backend; `NEXT_PUBLIC_API_URL` points to live backend

---

## OAuth Registrations

- [ ] **Google OAuth** — client ID & secret registered, redirect URI updated to prod domain
- [ ] **X (Twitter) OAuth** — app approved, callback URL set to prod
- [ ] **LinkedIn OAuth** — app verified, redirect URI updated
- [ ] **Facebook/Instagram OAuth** — app in Live mode (not Development), redirect URI updated
- [ ] **TikTok OAuth** — app approved for posting scope, redirect URI updated
- [ ] All OAuth apps have the correct scopes for read + publish permissions
- [ ] Token refresh flows tested end-to-end on prod credentials

---

## Stripe Setup

- [ ] Stripe account is activated (identity verified, bank account linked)
- [ ] Live mode is enabled (not test mode)
- [ ] Products & prices created in live mode matching the pricing page
- [ ] Webhook endpoint registered in Stripe Dashboard pointing to `https://<domain>/api/webhooks/stripe`
- [ ] Webhook events selected: `checkout.session.completed`, `customer.subscription.*`, `invoice.*`
- [ ] `STRIPE_WEBHOOK_SECRET` updated with the live signing secret
- [ ] Trial period / coupon codes tested in live mode with a real card
- [ ] Customer portal link configured in Stripe settings

---

## Sentry

- [ ] Sentry project created for backend (NestJS)
- [ ] Sentry project created for frontend (Next.js)
- [ ] `SENTRY_DSN` set in both environments
- [ ] Source maps uploaded (or configured to upload on build)
- [ ] Error alerts configured (email / Slack) for `P0` issues
- [ ] Sentry release tracking enabled (release tied to git SHA)
- [ ] Performance monitoring sample rate set (e.g., 10% for prod)

---

## Domain & TLS

- [ ] Custom domain purchased and DNS configured
- [ ] Frontend domain pointing to Vercel (or CDN)
- [ ] Backend domain / subdomain pointing to Railway / Heroku
- [ ] TLS certificate provisioned and auto-renewing (Let's Encrypt or host-managed)
- [ ] `www` redirect configured (www → apex or apex → www, consistent)
- [ ] HSTS header enabled (via `helmet` on backend)
- [ ] CORS `allowedOrigins` updated to prod frontend domain only

---

## Legal Pages

- [ ] Privacy Policy page live at `/privacy`
- [ ] Terms of Service page live at `/terms`
- [ ] Cookie policy / GDPR banner in place (if targeting EU users)
- [ ] DMCA / Copyright notice on footer
- [ ] Refund / cancellation policy linked from pricing page
- [ ] Legal pages reviewed by a qualified professional (not just AI-generated)

---

## Database & Migrations

- [ ] `npm run db:migrate` (`prisma migrate deploy`) run on prod database
- [ ] Migration history verified — no pending migrations
- [ ] `prisma migrate dev` is NOT used in production scripts
- [ ] Prisma Client re-generated after latest schema (`npm run db:generate`)
- [ ] Database connection pool size tuned for expected load
- [ ] Slow query logging enabled on prod PostgreSQL

---

## Backup & Restore

- [ ] Automated daily backups configured for the production database
- [ ] Backup retention policy set (e.g., 7 daily, 4 weekly)
- [ ] Backup restore tested: picked a recent backup, restored to a staging DB, verified data integrity
- [ ] R2 / S3 bucket versioning or cross-region replication enabled for media assets
- [ ] Runbook documented: how to restore DB from backup in < 30 minutes

---

## Security Hardening

- [ ] `helmet` middleware enabled with sensible defaults
- [ ] Rate limiting configured (throttler) on auth, publish, and AI endpoints
- [ ] `prisma migrate dev` command removed / disabled from prod scripts ✅
- [ ] File upload: MIME type validation enforced in service ✅
- [ ] File upload: 100 MB size limit enforced in service ✅
- [ ] Admin routes protected by role guard (not just authentication)
- [ ] Secrets rotation plan documented

---

## Performance

- [ ] Next.js build passes with no type errors (`npx tsc --noEmit`)
- [ ] NestJS build passes (`npm run build`)
- [ ] CI pipeline green on `main` branch
- [ ] Lighthouse score ≥ 80 on mobile for landing page
- [ ] CDN caching headers set for static assets
- [ ] Database indexes verified for common queries (posts by team, analytics, etc.)

---

## Private Beta

- [ ] Beta invite flow working (invite code or waitlist → activation)
- [ ] Onboarding tour / empty states tested with a fresh account
- [ ] 5–10 internal / friend accounts created and exercised
- [ ] Feedback channel set up (Discord, email alias, or in-app widget)
- [ ] Usage monitoring dashboard live (Sentry, PostHog, or similar)
- [ ] Support SLA defined for beta users (best-effort, response within 24 h)
- [ ] Kill switch / feature flags in place for high-risk features

---

## Go / No-Go Sign-Off

- [ ] All items above checked
- [ ] Smoke test: create account → connect platform → schedule post → approve → publish
- [ ] Stripe payment end-to-end: subscribe → upgrade → cancel
- [ ] Team sign-off obtained
- [ ] Launch date & rollout plan confirmed

> Last updated: 2026-05-08
