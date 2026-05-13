# Changelog

All notable changes to this project will be documented here.

## [Unreleased]

### Added — Priority Features

- **Auto-onboarding from URL**: Paste website URL and social handles, AI extracts brand voice, colors, audience, offers
- **ROI dashboard**: UTM link generation per post/platform, click tracking via short URLs, conversion recording, revenue attribution
- **Competitor watcher**: Cron-based monitoring (6 hours), auto-generates counter-posts in brand voice
- **Performance learning loop**: Weekly cron analyzes 30-day patterns (hooks, posting times, formats), surfaces multipliers
- **Video pipeline**: Upload → AI hook suggestions, multi-platform format outputs (Reels/TikTok/LinkedIn/X/YouTube)
- **White-label client portal**: Token-based public dashboards, client approve/reject without login
- **Bulk client onboarding**: CSV upload, async processing, progress tracking

### Added — Quality & Reliability

- **Circuit breaker**: Per-platform circuits prevent cascade failures (5 fails = 60s cooldown, half-open recovery)
- **Retry with backoff**: Exponential backoff with jitter, honors `Retry-After` headers
- **Typed platform errors**: `PlatformAuthError`, `PlatformRateLimitError`, `PlatformContentError`, etc., for proper retry logic
- **Resilient publisher**: Wraps platform calls with retry + circuit breaker + structured logging
- **Structured JSON logger**: One JSON line per log, ready for Datadog/CloudWatch/Loki
- **Request ID middleware**: Propagates `x-request-id` for distributed tracing
- **Prometheus metrics**: `/metrics` endpoint with counters and histograms
- **Cache service**: Redis-backed with TTL, pattern invalidation, cache-aside `wrap()` helper
- **Input sanitizer**: HTML stripping, URL validation, XSS protection helpers
- **SSRF protection**: Allowlist + blocked private IP ranges for outbound requests

### Added — Tests

- 67 new tests covering circuit breaker, retry logic, platform errors, ROI service, client portal, learning loop, billing edge cases, resilient publisher, input sanitizer

### Added — Health & Monitoring

- `/health/live` — liveness probe (always 200 if process alive)
- `/health/ready` — readiness probe (200 only if DB reachable)
- `/health/platforms` — circuit breaker states per platform

### Added — Billing Edge Cases

- Payment retry tracking with admin notifications
- Card expiry warnings (30 days advance)
- Plan downgrade detection (warns when usage exceeds new plan limits)
- Refund handling (auto-downgrade to free)
- Dispute handling (lock to disputed state, notify admins)

### Added — Developer Experience

- **Swagger/OpenAPI docs**: `/api/docs` (auto-enabled in non-prod)
- **Staging environment**: `docker-compose.staging.yml` + `.env.staging.example`
- **Performance indexes**: 13 new composite indexes on hot query paths
- **Runbook**: Operational procedures for common incidents
- **Error boundary component**: Frontend error containment
- **Loading/empty/error state components**: Consistent UX across pages
- **`useApi` and `useMutation` hooks**: Standardized data-fetching patterns

### Changed

- **CI lint**: Removed `|| true` so lint failures fail the build
- **Helmet config**: Production-grade CSP headers
- **Express body limits**: Increased to 10mb for large payloads
- **CORS**: Added `maxAge: 86400` for preflight caching
- **Auto-onboard**: SSRF protection (blocks private IPs, validates content-type)

## Database Migrations

- `20260514010000_priority_features` — All new feature tables
- `20260514020000_performance_indexes` — Composite indexes for hot paths
