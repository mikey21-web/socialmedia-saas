# MVP Implementation Roadmap — Week-by-Week Execution Guide

**Project:** Postiz Competitor MVP  
**Launch Date:** June 1, 2026  
**Duration:** 4 weeks (May 5 - June 1)  
**Sub-Agents:** Claude Code (orchestrator), Codex (backend), OpenCode (tests), Balcbox (optimization), GitHub (CI/CD)

## WEEK 1: Auth + Database (May 5–11)

Checkpoint Goal: Authenticate a user, verify team isolation in DB.  
Owner: Codex (backend), Claude Code (frontend), OpenCode (tests)

## Backend Tasks (Codex)

1.1 NestJS Scaffolding - Initialize NestJS app with modules
- [ ] Create src/prisma/prisma.service.ts (Prisma client wrapper)
- [ ] Set up TypeORM to PostgreSQL
- [ ] Create src/common/ folder with DTOs, guards, filters

1.2 Prisma Schema + Migrations
- [ ] Define schema.prisma with 8 core tables
- [ ] Run migrations: `npx prisma migrate dev --name init`

1.3 JWT Authentication Guard
- [ ] Create src/auth/jwt.strategy.ts (Passport strategy)
- [ ] Create src/auth/auth.service.ts with signup/signin
- [ ] Password hashing with bcrypt (10 rounds)

1.4 Multi-Tenant Team Isolation
- [ ] Create src/common/decorators/team.decorator.ts
- [ ] Add team_id to JWT payload
- [ ] Filter all queries by team_id (prevent cross-team leakage)

1.5 Error Handling Middleware
- [ ] Create src/common/filters/http-exception.filter.ts
- [ ] Create src/common/filters/prisma-exception.filter.ts
- [ ] Bind filters globally in main.ts

Total Backend Commits: 6 commits to main

## Frontend Tasks (Claude Code)

1.6 Next.js 14 Setup
- [ ] Initialize Next.js 14 with TypeScript + Tailwind CSS
- [ ] Install shadcn/ui components
- [ ] Create dark theme + Tailwind config

1.7 Authentication Pages
- [ ] Create /auth/signin page with form validation
- [ ] Create /auth/signup page with email + password form

1.8 Zustand Auth Store
- [ ] Create src/store/authStore.ts with auth state
- [ ] Add localStorage hydration

1.9 API Client Setup
- [ ] Create src/lib/api.ts (fetch wrapper with JWT header)
- [ ] Create src/lib/httpClient.ts with methods

1.10 Dashboard Skeleton
- [ ] Create /dashboard page with protected route
- [ ] Create navbar + sidebar placeholder

Total Frontend Commits: 7 commits to main

## Testing Tasks (OpenCode)

1.11-1.13 Auth Tests
- [ ] 8+ unit tests for auth service
- [ ] 6+ integration tests for JWT guard
- [ ] 8+ E2E tests for signup/signin flow

Test Coverage: Auth module 90%+
Total Test Commits: 1 commit

Week 1 Success Criteria:
- [ ] User can signup/signin
- [ ] JWT stored in localStorage
- [ ] Dashboard loads for authenticated user
- [ ] Team isolation verified
- [ ] Zero TypeScript errors
- [ ] All auth tests passing (14+ tests)

---

## WEEK 2: Platform Integrations (May 12–18)

Checkpoint Goal: Create a draft post, select 3 platforms, schedule for later.

### Backend Tasks (Codex)

2.1 Platforms Module - Create OAuth integration service
2.2 Posts CRUD API - Create POST, PATCH, GET, DELETE endpoints
2.3 Platform Connectors - Abstract base + 4 platform implementations

### Frontend Tasks (Claude Code)

2.4 Posts Page - List posts with status filtering
2.5 Post Creator - Rich text editor with auto-save
2.6 Platform Selector - Checkboxes for X, IG, LinkedIn, FB
2.7 Schedule Picker - Date/time picker for scheduling
2.8 Posts Store - Zustand store for post state

### Testing Tasks

2.9-2.11 Integration Tests
- [ ] 8+ OAuth tests
- [ ] 10+ CRUD tests
- [ ] 8+ connector tests

Week 2 Success Criteria:
- [ ] All 4 platforms OAuth configured
- [ ] Can create + update draft post
- [ ] Can select platforms
- [ ] Can schedule post
- [ ] All tests passing (18+ tests)

---

## WEEK 3: Publishing + Analytics (May 19–25)

Checkpoint Goal: Publish a post at scheduled time, verify on all platforms.

### Backend Tasks (Codex)

3.1 Temporal Workflows Setup
3.2 Publishing Logic - POST /posts/:id/publish endpoint
3.3 Analytics Collection - Daily metrics collection workflow
3.4 Analytics API - GET /analytics/dashboard endpoint

### Frontend Tasks (Claude Code)

3.5 Analytics Page - Dashboard with metrics cards
3.6 Chart Component - Line chart for impressions over time
3.7 CSV Export - Export analytics as CSV

### Testing Tasks

3.8-3.9 Temporal + Analytics Tests
- [ ] 10+ workflow tests
- [ ] 8+ analytics tests

Week 3 Success Criteria:
- [ ] Schedule post for future time
- [ ] Temporal triggers at scheduled time
- [ ] Post published to all platforms
- [ ] Metrics in analytics dashboard
- [ ] All tests passing (18+ tests)

---

## WEEK 4: Frontend + Billing + Launch (May 26–June 1)

Checkpoint Goal: Deploy to production June 1, live at postiz-competitor.com.

### Backend Tasks (Codex)

4.1 Stripe Integration - Checkout + webhook handling
4.2 Feature Gating - Plan limits (free vs pro)
4.3 Email Notifications - SendGrid integration

### Frontend Tasks (Claude Code)

4.4 Settings Page - Team, Billing, Integrations tabs
4.5 Billing Page - Pricing table + upgrade button
4.6 UI Polish - Dark mode, mobile responsive, error boundaries

### Optimization Tasks (Balcbox)

4.7 Code Splitting - Dynamic imports for large routes
4.8 Image Optimization - next/image for all images
4.9 Database Query Optimization - Add indexes, eager loading

### Deployment Tasks (GitHub)

4.10 CI/CD Pipeline - Test + Deploy workflows
4.11 Environment Setup - Vercel + Railway + .env.example
4.12 Production Deployment - Tag release, monitor logs

### Testing Tasks

4.13-4.15 Final Tests
- [ ] 8+ Stripe tests
- [ ] 6+ feature gate tests
- [ ] 1 comprehensive E2E test

Week 4 Success Criteria:
- [ ] All pages load < 2s
- [ ] Lighthouse score > 80
- [ ] Mobile responsive
- [ ] Stripe subscription working
- [ ] Production deploy succeeds
- [ ] Zero 5xx errors
- [ ] 5+ beta users testing

---

## Summary: Total Metrics

- Week 1: 14 commits, 14+ tests
- Week 2: 10 commits, 18+ tests
- Week 3: 9 commits, 18+ tests
- Week 4: 10 commits, 15+ tests

Total: 43 commits, 65+ tests, June 1 Launch ✅

## Command Reference for Sub-Agents

**Read These First:**
- PROJECT_OVERVIEW.md - What + Why
- ARCHITECTURE.md - How it's structured
- TEAMS.md - Who does what
- STATUS.md - Current progress
- ROADMAP.md - When each piece is done

**Before Each Day:**
- Check STATUS.md for assigned tasks
- Read week''s section
- Execute tasks in order
- Update STATUS.md with progress
- Commit with descriptive message

Success = Zero errors + All tests passing
