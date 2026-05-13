# Postiz Deep-Dive Architectural Analysis

**Analysis Date**: May 5, 2026  
**Codebase Size**: ~90K LOC TypeScript  
**License**: AGPL-3.0 (must open-source or buy commercial license)

---

## 🎯 Executive Summary

**Postiz is a mature, production-ready social media scheduling SaaS** with 35+ platform integrations, AI agents, team collaboration, marketplace, and analytics. It's an excellent reference for understanding SaaS architecture at scale.

**Our MVP Strategy**: Build a cleaner, faster, **3-4 platform MVP** (Twitter/X, LinkedIn, Instagram) in 3-4 weeks without copying code, learning from their architecture.

---

## 🏗️ Core Architecture

### **Layered Architecture (Clean)**

```
Frontend (Next.js React 19)
    ↓ (SWR + REST API)
NestJS Backend (API Layer)
    ↓ (Controllers → Services → Repositories)
Business Logic Services
    ↓ (Auth, Integrations, Analytics)
Temporal Orchestrator (Async Jobs)
    ↓ (Workflows + Activities)
PostgreSQL Database (Prisma ORM)
    ↓
Redis Cache (Session, Rate Limiting)
```

### **Key Design Patterns**

1. **Guard-Based Authorization** (CASL)
   - Permission guard on every endpoint
   - Role-based access control (RBAC)
   - Organization-scoped permissions
   - Extremely solid pattern ✅

2. **Controller → Service → Repository** (3-layer model)
   - Controllers: HTTP handling, validation
   - Services: Business logic, orchestration
   - Repositories: Data access via Prisma
   - Very clean, follows NestJS conventions ✅

3. **Provider Pattern for Social Integrations**
   - Each platform is a "Provider" implementing `SocialProvider` interface
   - Unified OAuth flow, token refresh, analytics
   - Very extensible - easy to add new platforms ✅
   - 35+ providers already implemented

4. **Temporal Workflows for Background Jobs**
   - Post scheduling (main workflow)
   - Email digests
   - Token refresh (handles OAuth expiration)
   - Analytics collection
   - Error retry with exponential backoff
   - **Much better than cron jobs** ✅

5. **Module-Based Organization**
   - Auth Module (JWT + OAuth providers)
   - Integrations Module (28+ social platforms)
   - Posts Module (CRUD, scheduling)
   - Analytics Module
   - Billing Module (Stripe)
   - Agents Module (Mastra AI agents)
   - Chat Module (Copilot)

---

## 💾 Database Design (Prisma PostgreSQL)

### **Core Data Model**

```
Organization (Team/Workspace)
├── Users (Multiple auth providers)
├── Subscriptions (Billing)
├── Integrations (Connected social accounts)
│   ├── Token management
│   ├── Posting times
│   └── Refresh logic
├── Posts (Scheduled content)
│   ├── State: QUEUE → PUBLISHED → FAILED
│   ├── Grouped by schedule
│   └── Media relationships
├── Media (Images/Videos)
│   ├── Thumbnails
│   └── File management
├── Analytics (Metrics)
├── Notifications (Alerts)
├── Tags (Organization)
├── Comments (Team collab)
└── Webhooks (Event subscriptions)
```

### **Smart Design Choices**

✅ **JSON fields** for flexible data:
- `postingTimes` - array of {time, count}
- `additionalSettings` - platform-specific config
- `settings` - per-post platform settings
- Allows flexibility without schema changes

✅ **Soft deletes** - `deletedAt` field instead of hard delete
- Track deleted items
- Enable recovery
- Comply with data retention laws

✅ **Indexing strategy**:
- All commonly filtered fields indexed
- `organizationId` on everything (fast tenant isolation)
- `publishDate`, `state` for post queries
- `createdAt`, `updatedAt` for sorting

✅ **Relationships**:
- Proper foreign keys with cascades
- No orphaned records
- UNIQUE constraints on critical pairs (userId + organizationId)

---

## 🔌 Social Media Integration Pattern

### **How Postiz Integrates Platforms**

Each platform (Twitter, Instagram, LinkedIn, etc.) is a **Provider** that implements:

```typescript
interface SocialProvider {
  // Authentication
  authenticate(code, codeVerifier) → AuthTokenDetails
  refreshToken(token) → AuthTokenDetails
  generateAuthUrl() → { url, codeVerifier, state }
  
  // Posting
  post(id, accessToken, postDetails) → PostResponse[]
  comment?(id, postId, content) → PostResponse[]
  
  // Analytics
  analytics?(id, token, date) → AnalyticsData[]
  postAnalytics?(integrationId, token, postId) → AnalyticsData[]
  
  // Profile Management
  changeNickname?(id, token, name)
  changeProfilePicture?(id, token, url)
  
  // Metadata
  identifier: string (e.g., "twitter", "instagram")
  maxLength: (settings) → number
  editor: "markdown" | "html" | "none"
  scopes: string[] (OAuth scopes)
  isBetweenSteps: boolean (multi-step OAuth)
}
```

### **Why This Pattern Works**

✅ **Unified Interface**: All platforms implement same contract  
✅ **Extensible**: Add new platform = new provider file  
✅ **Testable**: Mock any provider  
✅ **Reusable**: Shared OAuth flow logic  
✅ **Type-Safe**: TypeScript enforces implementation

### **Postiz Platforms (35+)**

**Major**: Twitter/X, Instagram, LinkedIn, TikTok, Facebook, YouTube, Discord, Slack  
**Community**: Mastodon, Bluesky, Threads, Lemmy, Farcaster  
**Niche**: Pinterest, Reddit, Dev.to, Hashnode, Medium, WordPress, Telegram, VK, Nostr  
**Custom**: GMB (Google My Business), Skool, Whop, Twitch, Kick, Dribbble, Moltbook  

---

## ⚙️ Backend API Structure (27+ Controllers)

```
/api
├── /auth - Authentication (JWT, OAuth, email/password)
├── /posts - Create, edit, schedule posts
├── /integrations - Connect social accounts
├── /analytics - Engagement metrics
├── /notifications - User alerts
├── /settings - User/org settings
├── /billing - Stripe integration
├── /webhooks - Event subscriptions
├── /team - Team management
├── /media - Upload, manage images/videos
├── /copilot - AI assistant for content
├── /marketplace - Buy/sell posts (feature)
├── /admin - Admin panel
└── /public/v1 - Public API (SDK, N8N, Make.com)
```

### **Key Endpoints Pattern**

```
POST /api/posts
  ├─ Create new post
  ├─ Schedule for future
  └─ Auto-post to multiple platforms

GET /api/posts/:id/analytics
  ├─ Fetch engagement metrics
  ├─ Cache with Redis
  └─ Aggregate from all platforms

POST /api/integrations/:id/disconnect
  ├─ Revoke OAuth token
  ├─ Remove integration
  └─ Archive related posts

GET /api/integrations
  ├─ List connected accounts
  ├─ Show token expiration
  └─ Display posting status
```

---

## 🔄 Temporal Orchestration (Background Jobs)

### **Workflow Architecture**

Postiz uses **Temporal** (not cron, not job queues) for reliable async processing:

```
Post Schedule Workflow (Main)
├── Activity: Schedule post for publish time
├── Activity: At publish time, call platform API
├── Activity: Log result (success/error)
└── Activity: Notify user

Token Refresh Workflow (Async)
├── Activity: Check token expiration
├── Activity: Call refresh endpoint if needed
└── Activity: Update token in database

Email Digest Workflow (Daily)
├── Activity: Collect day's analytics
├── Activity: Generate report HTML
└── Activity: Send email to user

Streak Workflow (Daily)
├── Activity: Calculate user's posting streak
├── Activity: Send milestone notification
└── Activity: Update user profile
```

### **Why Temporal > Cron/Queues**

✅ **Reliable**: Guaranteed execution, not "best effort"  
✅ **Resumable**: If workflow fails, can retry from exact point  
✅ **Verifiable**: Built-in workflow history  
✅ **Scalable**: Handles millions of parallel workflows  
✅ **Type-Safe**: Workflows are TypeScript, fully typed  

**Downside**: Requires running Temporal cluster (Docker container)

---

## 🎨 Frontend Architecture

### **Tech Stack**
- **Next.js 16.2** (React 19, SSR capable)
- **Tailwind CSS 3.4** (utility-first styling)
- **Mantine UI** (component library)
- **SWR** (data fetching with cache)
- **React Hook Form** (form handling)
- **TipTap** (rich text editor)
- **Zustand** (optional state management)

### **Folder Structure**

```
apps/frontend/src/
├── app/              # Next.js app directory (routing)
├── components/
│   ├── ui/          # Reusable UI (buttons, inputs, modals)
│   ├── layout/      # Layout components (navbar, sidebar)
│   └── pages/       # Page-specific components
├── proxy.ts         # API proxy configuration
├── colors.scss      # Design tokens
├── global.scss      # Global styles
└── tailwind.config.js
```

### **Data Fetching Pattern (SWR)**

```typescript
// ✅ CORRECT: One hook = one SWR call
const usePosts = () => {
  return useSWR("/api/posts", getPosts)
}

const useAnalytics = () => {
  return useSWR("/api/analytics", getAnalytics)
}

// ❌ WRONG: Multiple SWR in one function
const useDashboard = () => {
  return {
    posts: () => useSWR(...),      // ← violates hooks rules
    analytics: () => useSWR(...)
  }
}
```

---

## 🔐 Authentication System

### **Providers (Multiple OAuth)**

- **Email/Password** (local accounts)
- **Google OAuth** (easiest for users)
- **GitHub OAuth** (for developers)
- **Farcaster** (Web3)
- **Wallet Auth** (Solana, EVM)
- **Custom OAuth** (self-hosted)

### **Token Flow**

```
User Login
  ↓
Generate JWT + Refresh Token
  ↓
Store in HTTP-only cookies
  ↓
Every request: Verify JWT in guard
  ↓
If expired: Use refresh token to get new JWT
  ↓
Rate limit check (Redis-backed)
```

### **Permission System (CASL)**

```
PoliciesGuard (Every endpoint)
  ├── Check user JWT
  ├── Load user permissions
  ├── Define ability (what user can do)
  └── Throw if unauthorized
```

---

## 💳 Billing Integration (Stripe)

### **Model**

```
Organization
  ├── Subscription
  │   ├── plan (FREE, PRO, ENTERPRISE)
  │   ├── status (active, cancelled, expired)
  │   └── Stripe customerId
  ├── Credits (for API usage)
  └── UsedCodes (promo codes)
```

### **Key Features**

✅ Trial subscriptions  
✅ Usage-based billing (credits)  
✅ Promo codes  
✅ Webhook handling (payment success/failure)  
✅ Graceful downgrade on payment failure  

---

## 🤖 Advanced Features

### **1. Agents (Mastra AI)**
- Content generation
- Trend analysis
- Auto-posting rules
- Sentiment analysis

### **2. Chat Module (Copilot)**
- AI-powered post suggestions
- Content optimization
- Hashtag recommendations
- Scheduling advice

### **3. Marketplace**
- Buy/sell pre-made posts
- Creator economy
- Analytics on post performance
- Commission system

### **4. Webhooks**
- Event-driven integrations
- N8N, Make.com, Zapier support
- Real-time notifications
- Custom workflows

---

## ⚠️ Critical Implementation Details

### **Token Management**

**Problem**: OAuth tokens expire, apps lose access  
**Postiz Solution**:
```typescript
// Background workflow checks token expiration
// Refreshes BEFORE expiration (not after)
// Stores new token in database immediately
// Re-tests connection before declaring success
```

### **Post State Machine**

```
QUEUE → (at publish time) → PUBLISHED
  ↓ (if error)              ↓
  └→ FAILED                 SUCCESS
       ↓
    Retry with backoff
```

### **Rate Limiting**

- Redis-backed throttler
- IP-based + token-based
- 30 requests/hour default
- Configurable per environment

### **Error Handling**

```
Platform API returns error
  ↓
Log to Sentry (error tracking)
  ↓
Store in Post.error field
  ↓
Temporal activity retries with exponential backoff
  ↓
If all retries fail: Send email to user
```

---

## 📊 Performance Optimizations

1. **Database Indexing**
   - All filtered fields indexed
   - Composite indexes on `(organizationId, state)`
   - Regular ANALYZE to optimize query planner

2. **Caching**
   - Redis for session data
   - Redis for rate limit counters
   - In-memory cache for frequently accessed data

3. **Pagination**
   - Cursor-based pagination (more efficient than offset)
   - Default 20-50 items per page

4. **Image Optimization**
   - Thumbnails for preview
   - WebP conversion
   - CDN delivery (S3 + CloudFront)

5. **Query Optimization**
   - Lazy load relationships
   - Select only needed fields
   - Batch operations where possible

---

## 🔑 Key Files to Understand

### **Backend**
- `apps/backend/src/app.module.ts` - Module imports, global setup
- `apps/backend/src/services/auth/` - Auth system
- `libraries/nestjs-libraries/src/database/prisma/schema.prisma` - Data model
- `libraries/nestjs-libraries/src/integrations/social/` - Platform providers
- `apps/orchestrator/src/workflows/` - Temporal workflows

### **Frontend**
- `apps/frontend/src/app/layout.tsx` - Root layout
- `apps/frontend/src/components/` - Reusable components
- `apps/frontend/src/app/colors.scss` - Design tokens

### **Configuration**
- `docker-compose.dev.yaml` - Local dev services
- `pnpm-workspace.yaml` - Monorepo config
- `.env.example` - Required environment variables

---

## 🎯 MVP Strategy: Build Our Own (No Code Copy)

### **Timeline: 3-4 Weeks**

**Week 1: Foundation**
- [ ] Setup NestJS backend (port 3000)
- [ ] Setup Next.js frontend (port 4200)
- [ ] PostgreSQL + Prisma schema (Users, Orgs, Posts, Integrations)
- [ ] Auth system (JWT + email/password)
- [ ] Basic UI (login, dashboard skeleton)

**Week 2: Social Integrations**
- [ ] Twitter/X provider (OAuth + posting)
- [ ] LinkedIn provider (OAuth + posting)
- [ ] Instagram provider (OAuth + posting)
- [ ] Integration connection UI
- [ ] Token refresh workflow (Temporal simple job)

**Week 3: Core Features**
- [ ] Post creation & scheduling
- [ ] Calendar view
- [ ] Basic analytics (post engagement)
- [ ] Team management (role-based access)
- [ ] Media upload

**Week 4: Polish & Deploy**
- [ ] Stripe subscription setup
- [ ] Error handling & retries
- [ ] Email notifications
- [ ] Production deployment
- [ ] Documentation

### **What NOT to Build (Save for Later)**

❌ 35+ platform integrations (5 are enough)  
❌ Marketplace (complex, low ROI early)  
❌ AI agents/copilot (can add later)  
❌ Webhooks for integrations (nice-to-have)  
❌ Advanced analytics (basic metrics first)  
✅ **Focus**: Fast, clean, reliable scheduling + posting

---

## 💡 Improvements Over Postiz

### **Simpler & Faster**

1. **Fewer Platforms** (3-4 vs 35+)
   - Easier to maintain
   - Faster to market
   - Still covers 80% of users

2. **No Marketplace**
   - Huge complexity
   - Payments, escrow, disputes
   - Low usage until scale

3. **Minimal Agents**
   - Use OpenAI API directly
   - Don't need Mastra framework
   - Simple prompt templates

4. **Smart Defaults**
   - Pre-set posting times
   - Auto-hashtag suggestions
   - Optimal image formats

### **Better Architecture**

1. **Simpler State Management**
   - Fewer edge cases
   - Easier to understand
   - Fewer bugs

2. **Direct Temporal Usage**
   - No abstraction layer
   - Easier to debug
   - Better performance

3. **Native TypeScript**
   - Type safety from DB to UI
   - IDE autocomplete everywhere
   - Fewer runtime errors

---

## 📋 Required Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/postiz

# Authentication
JWT_SECRET=your-secret-key
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx

# Social Platforms
TWITTER_CLIENT_ID=xxx
TWITTER_CLIENT_SECRET=xxx
LINKEDIN_CLIENT_ID=xxx
LINKEDIN_CLIENT_SECRET=xxx
INSTAGRAM_CLIENT_ID=xxx
INSTAGRAM_CLIENT_SECRET=xxx

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLIC_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# External Services
OPENAI_API_KEY=sk_xxx
SENTRY_DSN=https://xxx

# Temporal
TEMPORAL_ADDRESS=localhost:7233
TEMPORAL_NAMESPACE=default

# Redis
REDIS_URL=redis://localhost:6379

# Email
RESEND_API_KEY=xxx

# AWS S3 (optional)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_BUCKET_NAME=xxx
```

---

## 🚀 Quick Start (If Using Postiz as Base)

```bash
# Install dependencies
pnpm install

# Setup database
pnpm run prisma-db-push

# Start dev servers
pnpm run dev:docker   # Start Postgres, Redis, Temporal
pnpm run dev          # Start backend + frontend + orchestrator
```

Access:
- **Backend**: http://localhost:3000
- **Frontend**: http://localhost:4200
- **Temporal UI**: http://localhost:8080

---

## ⚖️ Legal Note

**AGPL License Requirement**:
- If modifying Postiz code for SaaS: MUST open-source modifications
- If building from scratch: Not subject to AGPL
- If buying commercial license: Full proprietary rights

**Recommendation**: Build from scratch (cleaner, faster, no license headaches)

---

## Summary: What Makes Postiz Good

✅ **Clean architecture** - Controllers → Services → Repos  
✅ **Guard-based auth** - Scales to complex permissions  
✅ **Temporal workflows** - Reliable async processing  
✅ **Modular integrations** - Easy to add platforms  
✅ **TypeScript everywhere** - Type safety at scale  
✅ **Production-ready** - Error handling, logging, monitoring  

---

**Next Step**: Build our MVP using these patterns, not code.
