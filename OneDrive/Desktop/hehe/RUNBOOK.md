# Operations Runbook

Quick reference for handling common production incidents.

## Health Checks

- **Liveness**: `GET /health/live` — returns 200 if the process is responding
- **Readiness**: `GET /health/ready` — returns 200 only when DB is reachable
- **Full health**: `GET /health` — DB + Redis status, version, uptime
- **Platform circuits**: `GET /health/platforms` — circuit breaker state per platform
- **Metrics (Prometheus)**: `GET /metrics`
- **Metrics (JSON)**: `GET /metrics/json`

## Deploy & Rollback

### Backend (Railway)
```bash
# Deploy current main branch
git push origin main  # CI/CD takes over

# Rollback via Railway dashboard:
# Settings → Deployments → click previous deploy → Redeploy
```

### Frontend (Vercel)
```bash
# Auto-deploys on push to main
# Rollback: Vercel dashboard → Deployments → click previous → Promote to Production
```

### Database migrations
```bash
# Migrations run automatically in CI/CD after backend deploy
# Manual:
cd backend
npx prisma migrate deploy

# To rollback a migration: create a new migration that reverses it
# (Prisma does not support automated rollbacks)
```

## Common Incidents

### Platform publish failures spike

**Symptoms**: Users report posts failing, `/health/platforms` shows circuits open.

**Diagnosis**:
1. Check `/health/platforms` for which circuits are open
2. Check Sentry for the most recent error stack
3. Look at `metrics/json` for `publish_total{status="failure"}` rates

**Resolution**:
- Twitter/X 503: usually transient, circuit will close in 60s
- 401/403 errors: token may have been revoked. User must re-auth via OAuth
- 429 rate limit: respect retry-after, reduce concurrency
- Reset a stuck circuit: restart the backend (circuits are in-memory)

### Database connection pool exhausted

**Symptoms**: 500 errors, `Error: P2024 - Timed out fetching a new connection from the pool`.

**Resolution**:
1. Check current connections: `SELECT count(*) FROM pg_stat_activity WHERE datname = 'postiz_db'`
2. Increase pool: edit `DATABASE_URL` to add `?connection_limit=20`
3. Look for long-running queries: `SELECT pid, now() - query_start as duration, query FROM pg_stat_activity WHERE state = 'active' ORDER BY duration DESC`
4. Kill stuck queries if needed: `SELECT pg_cancel_backend(pid)`

### Stripe webhook signature failures

**Symptoms**: `BadRequestException: Missing Stripe signature` in logs.

**Resolution**:
1. Confirm `STRIPE_WEBHOOK_SECRET` matches the value in Stripe Dashboard
2. Verify the webhook endpoint URL in Stripe matches `https://api.yourdomain.com/api/subscriptions/webhook`
3. Check that the request body is raw (not parsed). Backend handles this with `express.raw()` for the webhook path

### Redis disconnected

**Symptoms**: Throttling falls back to in-memory, cache misses everywhere.

**Diagnosis**: `GET /health` shows `redis: fail`

**Resolution**:
- App continues to work but with degraded rate limiting and no caching
- Restart Redis or check Upstash dashboard
- No data loss — the app is designed to gracefully degrade

### Failed payment recovery

**Symptoms**: User reports "subscription suspended" but they say they paid.

**Diagnosis**:
1. Check Stripe dashboard for the customer
2. Check `subscriptions` table: `SELECT * FROM "Subscription" WHERE "stripeCustomerId" = ?`
3. Look at `webhook_deliveries` for the latest events

**Resolution**:
- If Stripe shows "active" but our DB shows "past_due", manually trigger webhook replay from Stripe dashboard
- Or update directly: `UPDATE "Subscription" SET status = 'active' WHERE id = ?`

### Account suspended after dispute

If a customer disputes a charge:
1. The webhook automatically sets status to `disputed` and notifies admins
2. Manual review: respond via Stripe dashboard with proof of service
3. If dispute is won: `UPDATE "Subscription" SET status = 'active' WHERE ...`
4. If dispute is lost: account stays in `disputed` and is on the `free` plan

## Secrets Rotation

### JWT secret
1. Generate new: `openssl rand -hex 32`
2. Set as `JWT_SECRET` in Railway and Vercel
3. Deploy. All existing tokens become invalid (forced re-login)

### Encryption key (DANGER)
**This will invalidate all stored OAuth tokens.** Users must re-connect every platform.

1. Run a migration to clear `PlatformCredential.accessToken` and `refreshToken`
2. Generate new key: `openssl rand -hex 32`
3. Update `ENCRYPTION_KEY` in production
4. Notify users they must re-connect platforms

### Stripe webhook secret
1. Generate new endpoint secret in Stripe dashboard (rotate)
2. Update `STRIPE_WEBHOOK_SECRET` in Railway
3. Old webhook deliveries will fail validation; Stripe will retry with new sig

## Database Backups

- Production DB has automated daily backups (configured in Railway/managed Postgres)
- Last backup time: see `team.lastBackupAt` for per-team data backups
- Manual backup:
  ```bash
  pg_dump $DATABASE_URL_PROD > backup-$(date +%Y%m%d).sql
  ```

## Performance Issues

### Slow analytics dashboard

1. Check `metrics/json` for `analytics_query_duration_ms` p95
2. Look at slow query log: `SELECT query, calls, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 20`
3. Consider warming Redis cache: hit `/api/analytics/summary` for the team
4. If still slow, the indexes may not be applied. Check: `\d+ "AnalyticsEvent"`

### High memory usage

1. Check Railway metrics dashboard
2. Most likely culprit: a temporal worker stuck on a big workflow
3. Restart the worker: it picks up where it left off

## Contact

- **Sentry**: https://sentry.io/yourorg/postiz-competitor
- **Stripe**: https://dashboard.stripe.com
- **Railway**: https://railway.app/project/...
- **Vercel**: https://vercel.com/yourteam/...
