# 4-Week Development Roadmap

## Week 1: Auth + Database Foundation (May 5–11)

### Goals
- ✅ Multi-tenant architecture in place
- ✅ User authentication (signup/signin/JWT)
- ✅ Database schema complete
- ✅ Dashboard skeleton UI
- ✅ API routes structured

### Backend Tasks
- [ ] NestJS app scaffolded + modules created (auth, posts, platforms, analytics)
- [ ] Prisma schema defined (users, teams, posts, platform_credentials, subscriptions)
- [ ] PostgreSQL database deployed (Railway or Heroku)
- [ ] Prisma migrations running
- [ ] JWT authentication guard + routes
- [ ] Bcrypt password hashing
- [ ] Team creation on signup
- [ ] Error handling middleware

### Frontend Tasks
- [ ] Next.js 14 scaffolded + Tailwind configured
- [ ] Shadcn/ui components imported
- [ ] `/auth/signin` page + form validation
- [ ] `/auth/signup` page + form validation
- [ ] `/dashboard` skeleton (layout only)
- [ ] Zustand store for auth state
- [ ] API client setup (fetch wrapper)

### Database
- [ ] Create `users` table (id, email, password_hash, created_at)
- [ ] Create `teams` table (id, name, owner_id)
- [ ] Create `team_members` table (team_id, user_id, role)
- [ ] Create `posts` table (id, team_id, title, content, status)
- [ ] Create `platform_credentials` table (id, team_id, platform, oauth_token)
- [ ] Create `subscriptions` table (id, team_id, stripe_id, plan)

### Success Criteria
- [ ] Signup → create user + team in DB
- [ ] Signin → return valid JWT
- [ ] Dashboard loads (authenticated)
- [ ] Zero TypeScript errors
- [ ] All unit tests passing (auth service, auth guard)

**Checkpoint:** Authenticate a user, verify team isolation in DB

---

## Week 2: Platform Integrations (May 12–18)

### Goals
- ✅ OAuth for X, Instagram, LinkedIn, Facebook connected
- ✅ Create post + save to DB (not published yet)
- ✅ Posts UI (editor, scheduling UI)
- ✅ Platform credential storage (encrypted)

### Backend Tasks
- [ ] NestJS PlatformsService + controllers
- [ ] X OAuth flow + token exchange
- [ ] Instagram OAuth flow + token exchange
- [ ] LinkedIn OAuth flow + token exchange
- [ ] Facebook OAuth flow + token exchange
- [ ] Encrypt/decrypt credential storage
- [ ] POST /posts endpoint
- [ ] PATCH /posts/:id endpoint
- [ ] GET /posts endpoint (list user's posts)
- [ ] Platform connector classes (TwitterConnector, InstagramConnector, etc.)

### Frontend Tasks
- [ ] `/posts` page (list drafts + published)
- [ ] `PostCreator` component (rich text editor)
- [ ] Platform checkboxes (select X, Instagram, etc.)
- [ ] Schedule picker component (date/time)
- [ ] Media upload UI
- [ ] Zustand store for posts state
- [ ] API calls for create/update/list posts

### External APIs
- [ ] Register app with X (Developer Portal)
- [ ] Register app with Instagram (Meta Business)
- [ ] Register app with LinkedIn (LinkedIn Developers)
- [ ] Register app with Facebook (Meta Developers)
- [ ] Store OAuth client IDs + secrets in `.env`

### Success Criteria
- [ ] User authorizes X → token stored in DB
- [ ] User creates post → saved to `posts` table
- [ ] Post shows platform selection → stored in `post_platforms`
- [ ] All platform connectors initialized (no actual publishing yet)
- [ ] Tests for each OAuth flow

**Checkpoint:** Create a draft post, select 3 platforms, schedule for later

---

## Week 3: Publishing + Analytics (May 19–25)

### Goals
- ✅ Temporal workflows for scheduled publishing
- ✅ Actual post publishing to platforms
- ✅ Analytics event collection
- ✅ Analytics dashboard

### Backend Tasks
- [ ] Temporal server setup (local or Railway)
- [ ] PublishPostWorkflow defined (publish to all selected platforms)
- [ ] X publish logic (Tweet creation)
- [ ] Instagram publish logic (Media Container + Image)
- [ ] LinkedIn publish logic (Post creation)
- [ ] Facebook publish logic (Feed post)
- [ ] Temporal job scheduling (on /posts/:id/publish)
- [ ] POST /webhooks/platforms/* (platform callbacks for metrics)
- [ ] Analytics collection service (batch job for daily metrics)
- [ ] Metric aggregation (impressions, likes, comments, shares)

### Frontend Tasks
- [ ] `/analytics` page (dashboard)
- [ ] Chart component (impressions over time)
- [ ] Engagement metrics table (per post)
- [ ] Date range picker (last 7/30/90 days)
- [ ] Export analytics as CSV

### Temporal Workflows
- [ ] PublishPostWorkflow: Orchestrate publishing to all platforms
- [ ] CollectAnalyticsWorkflow: Daily metric collection from each platform
- [ ] Retry logic (failed publishes, exponential backoff)

### Success Criteria
- [ ] Schedule post for 1 hour later
- [ ] Temporal triggers publish at scheduled time
- [ ] Post appears on X, Instagram, LinkedIn, Facebook
- [ ] Metrics begin collecting (impressions visible next day)
- [ ] Analytics dashboard shows engagement

**Checkpoint:** Publish a post at scheduled time, verify on all platforms

---

## Week 4: Frontend UI + Billing + Launch (May 26–June 1)

### Goals
- ✅ Complete UI polish
- ✅ Stripe billing integration
- ✅ Approval workflow (optional for MVP)
- ✅ Performance optimization
- ✅ Staging deployment
- ✅ Production deployment by June 1

### Backend Tasks
- [ ] SubscriptionsService + Stripe integration
- [ ] POST /subscriptions/checkout (create Stripe session)
- [ ] POST /webhooks/stripe (webhook handler)
- [ ] Invoice tracking + usage metrics
- [ ] Feature gating (Pro features locked behind plan)
- [ ] API rate limiting per plan
- [ ] Email notifications (payment success, failed, expiring)

### Frontend Tasks
- [ ] `/settings/billing` page (subscribe, manage payment method)
- [ ] Pricing table component (Free, Pro, Enterprise)
- [ ] Settings navigation + pages
- [ ] Team management (add members, roles)
- [ ] Dark mode polish (review all components)
- [ ] Mobile responsiveness (test on iPhone)
- [ ] Loading states (spinners, skeleton screens)
- [ ] Error boundaries + error pages
- [ ] 404 + 500 error pages

### Optimization
- [ ] Code splitting (dynamic imports for heavy routes)
- [ ] Image optimization (next/image)
- [ ] Bundle analysis (check for unused deps)
- [ ] Database query optimization (indexes, eager loading)
- [ ] Caching strategy (Redis for frequently accessed data)

### Deployment
- [ ] Staging environment setup (separate DB, Stripe account)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Automated tests on PR
- [ ] Staging deploy on merge to `staging` branch
- [ ] Production deploy on tag `release-*`
- [ ] SSL certificates (auto via Vercel/Railway)
- [ ] Email delivery (SendGrid or Mailgun)

### Launch Prep
- [ ] Marketing landing page (simple)
- [ ] onboarding flow (skip for MVP)
- [ ] Terms of Service + Privacy Policy
- [ ] Help docs (basic FAQ)
- [ ] Status page (uptime monitoring)

### Success Criteria
- [ ] Subscribe to Pro plan → charge $29/month on Stripe
- [ ] Pro user can post to 5 platforms, Free user to 1
- [ ] All pages load < 2s (LCP)
- [ ] Lighthouse score > 80 (Performance)
- [ ] Zero 5xx errors in production
- [ ] 5+ beta users testing

**Checkpoint:** Deploy to production June 1, live at postiz-competitor.com

---

## Cross-Week Dependencies

```
Week 1 (Auth + DB)
    ↓ (required for)
Week 2 (Platforms)
    ↓ (required for)
Week 3 (Publishing)
    ↓ (required for)
Week 4 (Launch)
```

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| OAuth delays | Pre-register all apps by start of Week 2 |
| Database schema changes | Finalize schema end of Week 1 |
| Temporal complexity | Prototype publish workflow mid-Week 2 |
| Stripe integration bugs | Use Stripe test mode until Week 4 |
| Performance issues | Profile + optimize each week |
| Scope creep | Lock MVP features, defer rest to MVP+1 |

## What's NOT in MVP (MVP+1)

- Approval workflows (optional, Slack notifications)
- TikTok integration
- Hashtag suggestions
- Caption AI generation
- Team collaboration features
- Custom reporting
- SSO (SAML/OIDC)
