# System Architecture — Postiz MVP

## High-Level Layers

```
┌─────────────────────────────────────────┐
│  Frontend (Next.js 14 + shadcn/ui)      │ ← User Interface
├─────────────────────────────────────────┤
│  API Gateway (NestJS)                   │ ← Request Routing
├─────────────────────────────────────────┤
│  Business Logic (NestJS Modules)        │ ← Core Services
│  ├─ Auth Service                        │
│  ├─ Posts Service                       │
│  ├─ Analytics Service                   │
│  ├─ Platforms Service                   │
│  └─ Subscriptions Service               │
├─────────────────────────────────────────┤
│  Temporal Workflows (Orchestration)     │ ← Async Job Scheduling
├─────────────────────────────────────────┤
│  Database (PostgreSQL + Prisma)         │ ← Persistent Storage
├─────────────────────────────────────────┤
│  External APIs (Platform SDKs)          │ ← X, Instagram, etc.
└─────────────────────────────────────────┘
```

## Backend Modules

### Auth Module
- JWT token generation/validation
- Multi-tenant user isolation
- Role-based access control (Admin, Editor, Viewer)
- OAuth integration (future)

### Posts Module
- CRUD operations on social media posts
- Draft/published state management
- Content scheduling
- Media attachment handling

### Platforms Module
- API connectors for X, Instagram, LinkedIn, Facebook, TikTok
- OAuth credential storage (encrypted)
- Rate limiting per platform
- Error handling + retries

### Analytics Module
- Event collection (impressions, engagements, clicks)
- Real-time metric aggregation
- Historical trend tracking
- Dashboard data API

### Subscriptions Module
- Stripe webhook handling
- Plan management (Free, Pro, Enterprise)
- Usage-based billing (posts/month)
- Invoice tracking

### Temporal Module
- Publish scheduling (delayed post creation)
- Analytics collection jobs (batch)
- Retry logic for failed publishes

## Frontend Components

### Pages
- `/auth/signin` — User authentication
- `/dashboard` — Overview + stats
- `/posts` — Create/edit/schedule posts
- `/analytics` — Metrics dashboard
- `/settings` — Team, billing, integrations

### Core Components
- `PostCreator` — Rich text editor + media upload
- `ScheduleCalendar` — Visual scheduling
- `AnalyticsDashboard` — Charts + metrics
- `PlatformSelector` — Multi-platform toggle
- `ApprovalWorkflow` — Review + publish

## Database Schema

### Core Tables
- `users` — Authentication + profile
- `teams` — Organization (multi-tenant)
- `team_members` — User roles per team
- `posts` — Draft/published content
- `post_platforms` — Posts scheduled for specific platforms
- `platform_credentials` — OAuth tokens (encrypted)
- `subscriptions` — Stripe plans + usage
- `analytics_events` — Impression/engagement tracking

### Relationships
```
teams (1) ─ (many) users
teams (1) ─ (many) posts
posts (1) ─ (many) post_platforms
users (1) ─ (many) platform_credentials
teams (1) ─ (1) subscriptions
```

## API Endpoints (NestJS)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/auth/signup` | Register new user |
| POST | `/auth/signin` | Login |
| POST | `/posts` | Create draft post |
| PATCH | `/posts/:id` | Update post |
| POST | `/posts/:id/publish` | Publish to platforms |
| GET | `/analytics/dashboard` | Get metrics |
| POST | `/subscriptions/checkout` | Stripe session |
| POST | `/webhooks/stripe` | Webhook handler |

## External API Integrations

### Twitter (X)
- OAuth 2.0 authentication
- Tweet creation endpoint
- Like/retweet metrics
- Rate limit: 300 posts/15min

### Instagram
- Business Account API
- Photo carousel posting
- Engagement metrics
- Rate limit: Varies by account age

### LinkedIn
- OAuth delegation
- Article + post creation
- View/comment counts
- Rate limit: 100 requests/day

### Facebook
- Page access tokens
- Feed posting
- Engagement tracking
- Rate limit: 200 requests/hour

## Data Flow: "Publish a Post"

```
1. User creates post in frontend
2. POST /posts → Backend stores as DRAFT
3. User schedules publish time (optional)
4. POST /posts/:id/publish → Temporal workflow created
5. Temporal schedules task → "PublishPostWorkflow"
6. At scheduled time → Temporal triggers task
7. Backend calls each platform SDK (X, Instagram, etc.)
8. Platform SDKs return post IDs
9. Post marked PUBLISHED, platform IDs stored
10. Analytics collection job scheduled (collect metrics daily)
```

## Deployment Architecture

```
Frontend (Vercel)
    ↓ (HTTPS)
API (Railway/Heroku)
    ↓ (PostgreSQL connection)
Database (Heroku Postgres / Railway)
    ↓ (Job scheduling)
Temporal Server (Self-hosted on Railway)
    ↓ (External API calls)
X / Instagram / LinkedIn / Facebook APIs
```

## Multi-Tenancy

- **Isolation Level:** Row-level (every table has `team_id`)
- **Auth:** JWT includes `team_id` claim
- **Queries:** All SELECT/UPDATE/DELETE filtered by `team_id`
- **Data:** No cross-team data leakage
