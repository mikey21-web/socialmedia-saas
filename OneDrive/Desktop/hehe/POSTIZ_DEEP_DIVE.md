# Postiz Deep Dive — Complete Architecture Knowledge

**Status**: Based on actual Postiz codebase analysis  
**Date**: May 2026  
**Scope**: Backend architecture, patterns, integrations, workflows

---

## 1. Project Structure (Monorepo)

```
postiz-app/
├── apps/
│   ├── backend/                    # Main NestJS API
│   │   └── src/
│   │       ├── api/               # REST controllers + routes
│   │       ├── services/          # Business logic
│   │       └── app.module.ts      # Root module
│   ├── orchestrator/              # Temporal worker + workflows
│   ├── commands/                  # CLI utilities
│   ├── sdk/                       # JavaScript SDK (public API)
│   └── frontend/                  # Next.js UI (not analyzed)
├── libraries/
│   ├── nestjs-libraries/          # Shared NestJS logic (reusable)
│   │   └── src/
│   │       ├── 3rdparties/        # ThirdParty providers (HeyGen, etc)
│   │       ├── integrations/      # Social platform integrations
│   │       ├── database/          # Prisma schema + services
│   │       ├── agent/             # Agent orchestration
│   │       ├── chat/              # Copilot/LLM chat
│   │       ├── temporal/          # Temporal workflows
│   │       ├── redis/             # Redis client
│   │       ├── sentry/            # Error tracking
│   │       ├── openai/            # OpenAI integration
│   │       ├── videos/            # Video module
│   │       ├── upload/            # File upload handling
│   │       ├── dtos/              # Data transfer objects
│   │       └── user/              # Auth + user utilities
│   └── helpers/                   # Pure utility functions
└── package.json                   # Monorepo dependencies
```

---

## 2. Module Dependencies (from AppModule)

**All modules imported in `apps/backend/src/app.module.ts`:**

```typescript
@Module({
  imports: [
    SentryModule.forRoot(),              // Error tracking
    DatabaseModule,                       // Prisma + services
    ApiModule,                           // REST routes
    PublicApiModule,                     // Public SDK API
    AgentModule,                         // AI agent orchestration
    ThirdPartyModule,                    // HeyGen, etc
    VideoModule,                         // Video generation
    ChatModule,                          // Copilot/AI chat
    getTemporalModule(false),            // Temporal client
    TemporalRegisterMissingSearchAttributesModule,
    InfiniteWorkflowRegisterModule,
    ThrottlerModule.forRoot({            // Redis-backed rate limiting
      storage: new ThrottlerStorageRedisService(ioRedis)
    }),
  ],
  providers: [
    FILTER,                              // Sentry exception filter
    PoliciesGuard,                       // Permission/auth guard
    ThrottlerBehindProxyGuard,
  ],
})
```

---

## 3. Database Schema (Prisma)

### Core Models

**Organization** (Workspace/Team)
- `id UUID` (primary key)
- `name, description, apiKey`
- `paymentId` (Stripe customer ID)
- `streakSince` (posting streak tracking)
- `allowTrial, isTrailing` (subscription state)
- `shortlink` preference (ASK, ALWAYS, NEVER)
- Relations: users, posts, integrations, subscriptions, credits, tags, etc.

**User**
- `id UUID`
- `email, password, providerName` (OAuth provider: GITHUB, GOOGLE, etc)
- `name, lastName, bio, timezone`
- `pictureId` (references Media.id)
- `isSuperAdmin` (staff flag)
- `activated` (email verification)
- `account, connectedAccount` (OAuth account metadata)
- Relations: organizations, comments, messages, orders, picture

**UserOrganization** (Many-to-many)
- `userId, organizationId` (composite key)
- `role` (OWNER, USER, ADMIN) - RBAC
- `disabled` (soft delete / deactivate)

**Post**
- `id UUID`
- `orgId` (which organization)
- `content` (body text)
- `additionalData JSON` (platform-specific settings per post)
- `publishedDateTime` (when post goes live)
- `releaseId` (scheduled job/workflow ID)
- `status` (DRAFT, SCHEDULED, PUBLISHED, FAILED)
- Relations: postInteractions (per-platform results), tags, comments

**Integration** (Connected social account)
- `id UUID`
- `orgId`
- `providerIdentifier` (e.g., "twitter", "instagram", "linkedin")
- `internalId` (platform user ID, e.g., Twitter account handle)
- `name` (display name for multi-account support)
- `picture` (profile pic URL)
- `profile JSON` (platform-specific profile data)
- `postingTimes JSON` (schedule: when to auto-post daily)
- `disabled` (soft disable)
- `inBetweenSteps` (OAuth flow state)
- `refreshNeeded` (token expired, needs refresh)
- `type` (ACCOUNT, CUSTOM_FIELDS, etc)
- `additionalSettings JSON` (platform-specific options)

**ThirdParty** (External service keys)
- `id UUID`
- `orgId`
- `identifier` (e.g., "heygen", "loom", "openai")
- `data encrypted` (API key + settings, AES-256)
- `decrypted` (runtime cache)

**Subscription**
- `id UUID`
- `orgId` (unique - one sub per org)
- `plan` (FREE, PRO, ENTERPRISE)
- `status` (ACTIVE, CANCELED, EXPIRED)
- `stripeCustomerId, stripeSubscriptionId`
- `currentPeriodStart, currentPeriodEnd` (billing cycle)
- `canceledAt` (when user cancelled)

**Webhooks**
- `id UUID`
- `orgId`
- `url` (webhook target)
- `event` (which events to trigger on)
- `secret` (HMAC signing key)

**Media**
- `id UUID`
- `orgId`
- `url` (S3 or CDN URL)
- `alt` (accessibility text)
- `preview` (thumbnail for image media)

---

## 4. ThirdParty Pattern (Extensible Integrations)

**Pattern Location**: `libraries/nestjs-libraries/src/3rdparties/`

### Interface

```typescript
// ThirdPartyAbstract (base class)
abstract checkConnection(apiKey: string): Promise<false | {
  name: string
  username: string
  id: string
}>
abstract sendData(apiKey: string, data: T): Promise<string>
[key: string]: ((apiKey, data?) => Promise<any>) | undefined  // Dynamic methods
```

### Decorator

```typescript
@ThirdParty({
  identifier: 'heygen',
  title: 'HeyGen',
  description: 'AI avatar video generation',
  position: 'media',  // UI section: media, media-library, webhook
  fields: [...]  // Form fields for API key entry
})
export class HeygenProvider extends ThirdPartyAbstract<{
  voice: string
  avatar: string
  aspect_ratio: string
  captions: string
}>
```

### HeyGen Implementation

```typescript
// checkConnection(apiKey)
→ GET https://api.heygen.com/v1/user/me
→ Header: x-api-key: apiKey
→ Returns: { name, username, id }

// voices(apiKey)
→ GET https://api.heygen.com/v2/voices
→ Returns: Array of { id, name, language, ... }

// avatars(apiKey)
→ GET https://api.heygen.com/v2/avatar_group.list?include_public=false
→ For each group, GET /v2/avatar_group/{id}/avatars
→ Returns: Flattened array of all avatars

// sendData(apiKey, data)
→ POST https://api.heygen.com/v2/video/generate
→ Body: { caption, video_inputs, dimension }
→ Poll GET /v1/video_status.get?video_id=... every 3s
→ Returns: video_url when status === 'completed'
```

---

## 5. Social Integration Pattern

**Pattern Location**: `libraries/nestjs-libraries/src/integrations/`

### Interface (Abstract Provider)

```typescript
interface SocialProvider {
  // Auth
  authenticate(code: string, codeVerifier: string): Promise<AuthTokenDetails>
  refreshToken(token: AuthTokenDetails): Promise<AuthTokenDetails>
  generateAuthUrl(): Promise<{ url, codeVerifier, state }>
  
  // Posting
  post(id: string, accessToken: string, content: PostContent): Promise<ExternalPost[]>
  
  // Analytics
  analytics?(id: string, token: string, date: Date): Promise<AnalyticsData[]>
  postAnalytics?(integrationId: string, token: string, postId: string): Promise<AnalyticsData[]>
  
  // Profile Management
  changeNickname?(id: string, token: string, name: string)
  changeProfilePicture?(id: string, token: string, url: string)
  
  // Metadata
  identifier: string  // "twitter", "instagram", etc
  maxLength: (settings: any) => number
  editor: "markdown" | "html" | "none"
  scopes: string[]
  isBetweenSteps: boolean
}
```

### Multiple Account Support

**Database**: Each `Integration` row is one account connection
- `orgId + providerIdentifier + internalId` = unique account
- Allows 5 Twitter accounts, 3 Instagram accounts, etc per org
- `postingTimes JSON` per account (schedule when to auto-post)

**Publishing**: When posting, for each selected integration:
```
1. Get Integration record by integrationId
2. Decrypt accessToken (AES-256-GCM)
3. Call platform provider.post(accessToken, content)
4. Store result in PostInteraction (platform-specific post ID)
5. Schedule CollectAnalyticsWorkflow (1hr delay)
```

---

## 6. API Structure (Controllers)

**Location**: `apps/backend/src/api/routes/`

### Controller Pattern

```typescript
@ApiTags('Posts')
@Controller('/posts')
export class PostsController {
  @Post('/')
  @CheckPolicies([AuthorizationActions.Create, Sections.POSTS_PER_MONTH])
  async createPost(
    @GetOrgFromRequest() org: Organization,
    @Body() body: CreatePostDto
  ) {
    // GetOrgFromRequest = JWT decode + fetch org
    // CheckPolicies = CASL permission guard
    return this._postsService.createPost(org.id, body)
  }
}
```

### Key Endpoints

**Posts**
- `POST /posts` — create draft/scheduled post
- `GET /posts` — list with filters (status, dateRange)
- `GET /posts/:id` — get single post + stats
- `PUT /posts/:id` — update draft
- `DELETE /posts/:id` — soft delete

**Integrations** (Social accounts)
- `POST /integrations/:id/connect` — OAuth callback handler
- `GET /integrations/list` — list connected accounts
- `PUT /integrations/:id/group` — organize by group
- `POST /integrations/:id/nickname` — change display name
- `POST /integrations/:id/settings` — per-account settings

**Third Party** (External APIs)
- `GET /third-party` — list available options (HeyGen, etc)
- `POST /third-party/validate` — test API key
- `PUT /third-party/:identifier` — store API key (encrypted)

**Analytics**
- `GET /analytics` — aggregate stats
- `GET /analytics/:integrationId` — per-account stats
- `GET /analytics/:postId` — per-post engagement

---

## 7. Permission/Auth Pattern (CASL + Policies)

**Location**: `backend/src/services/auth/permissions/`

### Permission Guards

```typescript
@Global()
@Module({
  providers: [
    PoliciesGuard,  // On every endpoint
    { provide: APP_GUARD, useClass: PoliciesGuard }
  ]
})
```

### Decorator Pattern

```typescript
@CheckPolicies([
  AuthorizationActions.Create,        // Action
  Sections.POSTS_PER_MONTH           // Resource
])
async createPost(...) {}
```

### Roles (RBAC)

**UserOrganization.role**:
- `OWNER` — full access + billing
- `ADMIN` — full access (no billing)
- `USER` — posts, settings (limited)

**Permission Check**:
```
1. JWT decode → userId
2. GetOrgFromRequest → org (via header or param)
3. Query UserOrganization { userId, orgId }
4. Load CASL ability for role
5. Assert ability.can(action, resource)
6. If not authorized → throw 403
```

---

## 8. Temporal Workflows (Background Jobs)

**Location**: `apps/orchestrator/src/workflows/`

### Workflow Architecture

```typescript
export async function publishPostWorkflow(input: {
  postId: string
  orgId: string
  integrationIds: string[]
}) {
  // Activity: Prepare post data
  const postData = await activities.getPost(input.postId)
  
  // Parallel: Publish to all platforms
  const results = await Promise.all(
    integrationIds.map(id => publishToIntegration(id, postData))
  )
  
  // Activity: Update post status
  await activities.updatePostStatus(input.postId, results)
  
  // Child workflow: Collect analytics (1hr delay)
  await startChild(collectAnalyticsWorkflow, {
    postId: input.postId,
    platforms: results.map(r => r.platform)
  })
}
```

### Temporal Advantages

✅ **Reliable**: Guaranteed execution (ACID)  
✅ **Resumable**: Retry from exact point on failure  
✅ **Verifiable**: Full execution history  
✅ **Scalable**: Millions of parallel workflows  
✅ **Type-Safe**: TypeScript end-to-end  
✅ **Debuggable**: Temporal UI shows workflow state

### Key Workflows in Postiz

1. **PublishPostWorkflow** — Multi-platform publishing
2. **CollectAnalyticsWorkflow** — Fetch metrics 1hr after publish
3. **TokenRefreshWorkflow** — Refresh OAuth tokens before expiry
4. **EmailDigestWorkflow** — Daily/weekly email reports
5. **StreakWorkflow** — Track posting streak (daily check)

---

## 9. Agent/AI Generation Pattern

**Location**: `libraries/nestjs-libraries/src/agent/`

### Agent Graph Service

```typescript
export class AgentGraphService {
  async start(orgId: string, input: GeneratorDto) {
    // Streaming responses
    for await (const event of this.runAgentGraph(orgId, input)) {
      yield event  // SSE to frontend
    }
  }
}
```

### Agents (Multi-step AI)

1. **Content Creator** — Generate post ideas + copy
   - Input: topic, tone, platform
   - Output: post content + image prompts

2. **Trend Analyzer** — Find trending topics
   - Input: industry, region, timeframe
   - Output: trending hashtags + angles

3. **Scheduler** — Optimize posting times
   - Input: audience timezone, platform
   - Output: best posting times

4. **Engagement Responder** — Reply to comments
   - Input: comment text, post context
   - Output: reply suggestions

### Integration with Posts

```typescript
// Frontend: SSE stream
POST /posts/generator
→ Stream events: generating, analyzing, optimizing...
→ Creates draft posts incrementally
→ User can edit/approve before publishing
```

---

## 10. Copilot/Chat Module

**Location**: `libraries/nestjs-libraries/src/chat/`

### Chat Tools (Functions called by LLM)

**Tools available to Copilot agent**:
- `generate_video_options_tool` — List HeyGen voices + avatars
- `generate_video_tool` — Create avatar video
- `post_content_tool` — Generate post ideas
- `image_generation_tool` — DALL-E or Replicate images
- `scheduling_tool` — Suggest post times

**Pattern**:
```typescript
@Controller('/copilot')
@Post('/message')
async chat(
  @GetOrgFromRequest() org: Organization,
  @Body() { message, context }: ChatDto
) {
  // Stream LLM responses with tool use
  for await (const chunk of this._copilotService.chat(org.id, message)) {
    // If chunk.type === 'tool_use':
    //   - Execute tool (generate_video, post_content, etc)
    //   - Send result back to LLM
    // Else stream to frontend
    yield chunk
  }
}
```

---

## 11. Video Module Pattern

**Location**: `libraries/nestjs-libraries/src/videos/`

### Video DTO

```typescript
export class VideoDto {
  platform: string  // twitter, instagram, linkedin
  description: string
  duration: number
  thumbnail: string
  aspectRatio: '16:9' | '9:16' | '1:1'
}

export class VideoFunctionDto {
  video: VideoDto
  url: string  // Generated video URL
  type: 'avatar' | 'animation' | 'slideshow'
}
```

### Video Generation Sources

1. **HeyGen API** — AI avatar videos
2. **Replicate** — Text-to-video (minimax/video-01)
3. **Custom uploads** — User-provided videos
4. **Hyperframes** (future) — HTML-based animated videos

---

## 12. Service Layer Pattern

**Location**: `libraries/nestjs-libraries/src/database/prisma/`

### Service Pattern

```typescript
export class PostsService {
  constructor(private db: PrismaService) {}
  
  async createPost(orgId: string, input: CreatePostDto) {
    // Validate input
    // Encrypt sensitive data
    // Create post + relationships
    // Schedule workflow if needed
    return await this.db.post.create({
      data: {
        orgId,
        content: input.content,
        additionalData: JSON.stringify(input.platformSettings),
        publishedDateTime: input.scheduledFor,
        releaseId: `${Date.now()}-${Math.random()}`,
      },
      include: {
        integrations: true,  // Selected platforms
        tags: true,
      },
    })
  }
  
  async publishPost(postId: string) {
    // Trigger Temporal workflow
    const client = await this._temporalClient.getClient()
    await client.workflow.start(publishPostWorkflow, {
      taskQueue: 'posts',
      workflowId: `publish-${postId}`,
      args: [{ postId, orgId: this.orgId }],
    })
  }
}
```

---

## 13. Error Handling Pattern

**Global Exception Filter** (Sentry integration)

```typescript
// All errors automatically:
// 1. Logged to Sentry
// 2. Traced for performance
// 3. Profiled if enabled
// 4. Returned as JSON to client

// Usage:
throw new BadRequestException('Invalid input')
→ 400 { statusCode: 400, message: 'Invalid input', ... }
→ Sentry captures + alert

throw new UnauthorizedException()
→ 401 + JWT redirect

throw new ForbiddenException()
→ 403 + CASL permission error
```

---

## 14. Key Architectural Decisions

### Why Temporal over Cron/Queues?
- Workflows are first-class, not background tasks
- Full execution history = debugging + auditing
- Guaranteed delivery = no lost posts
- Resumable from failure point = no duplicates
- Type-safe workflows = fewer runtime errors

### Why Monorepo?
- Shared types across frontend/backend/SDK
- Orchestrator (worker) separate from API
- Libraries reusable across multiple apps
- Single CI/CD pipeline

### Why ThirdParty + Integration pattern?
- Extensible: add new platform in 1 file
- Type-safe: each provider is a class
- Testable: mock providers easily
- Decoupled: platform logic separate from API

### Why Multi-account per integration?
- Agencies manage multiple client accounts
- Same platform, different credentials
- Per-account scheduling (postingTimes JSON)
- Unified analytics across all accounts

---

## 15. Data Flow (Complete Example)

### User creates + publishes post to 3 platforms:

```
1. Frontend: POST /posts
   { content: "Hello", integrationIds: [twitter_id, ig_id, li_id] }

2. PostsController.createPost()
   → CheckPolicies (CASL: user can create posts)
   → GetOrgFromRequest (JWT decode, fetch org)
   → PostsService.createPost()

3. PostsService.createPost()
   → Validate content (length limits per platform)
   → Create Post record (status: DRAFT)
   → Create PostIntegration for each platform
   → If publishedDateTime is in future:
     → Trigger Temporal publishPostWorkflow

4. Temporal publishPostWorkflow
   → Activity: getPost(postId) — fetch Post record
   → Activity: getIntegrations(integrationIds) — fetch credentials
   → Parallel Activities:
     → publishTwitter(accessToken, content)
     → publishInstagram(accessToken, content)
     → publishLinkedIn(accessToken, content)
   → Activity: updatePostStatus(results)
   → startChild(collectAnalyticsWorkflow, delay: 1hr)

5. publishTwitter Activity
   → Decrypt accessToken (AES-256-GCM)
   → Call Twitter API: POST /2/tweets { text: content }
   → Get tweet_id from response
   → Update PostInteraction { platform: twitter, externalId: tweet_id }
   → Return { success, externalId, error? }

6. collectAnalyticsWorkflow (1hr later)
   → Activity: fetchTwitterAnalytics(tweet_id, token)
   → Call Twitter API: GET /2/tweets/{id}?metrics=...
   → Parse: impressions, retweets, likes
   → Activity: updateAnalytics(postId, metrics)

7. Frontend: GET /posts/:id
   → Returns: post + engagement stats + platform results
```

---

## 16. Critical Implementation Details

### Token Encryption (AES-256-GCM)

```typescript
// Store
const iv = randomBytes(12)
const cipher = createCipheriv('aes-256-gcm', key, iv)
const encrypted = cipher.update(token, 'utf8')
const authTag = cipher.getAuthTag()
stored = `${iv.toString('base64')}.${authTag.toString('base64')}.${encrypted.toString('base64')}`

// Retrieve
const [iv, authTag, cipher] = stored.split('.')
const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64'))
decipher.setAuthTag(Buffer.from(authTag, 'base64'))
const token = decipher.update(Buffer.from(cipher, 'base64')).toString('utf8')
```

### Soft Deletes

```typescript
// Delete post
await db.post.update({
  where: { id: postId },
  data: { deletedAt: new Date() }  // Not actually deleted
})

// Query (excludes soft-deleted)
await db.post.findMany({
  where: { deletedAt: null, orgId }
})
```

### Posting Times (Per-account schedule)

```typescript
// Integration.postingTimes (JSON array)
[
  { hour: 9, minute: 0 },   // 9:00 AM
  { hour: 14, minute: 30 }, // 2:30 PM
  { hour: 20, minute: 0 }   // 8:00 PM
]

// Scheduler job runs every hour:
// "Is it 9:00 AM in user's timezone? Post auto-scheduled content"
```

---

## 17. What Your MVP Should Copy

**✅ Patterns to adopt**:
1. ThirdParty provider pattern (for HeyGen)
2. Service + Controller separation
3. CASL permission guards
4. Temporal workflows for async tasks
5. Token encryption (AES-256-GCM)
6. Multi-account support per platform
7. Soft deletes (deletedAt field)
8. PostInteraction for per-platform results
9. JSON fields for flexible data (additionalSettings, postingTimes)

**❌ Things to skip (until MVP+1)**:
- Agents/multi-step AI (basic content gen ok)
- Marketplace
- Webhooks for integrations (internal only)
- Advanced analytics (basic engagement ok)
- Admin panel
- Discord/Slack/custom platforms (4 main platforms enough)

---

## Summary: What Makes Postiz Scalable

✅ **Modular**: Each platform is a provider  
✅ **Reliable**: Temporal guarantees execution  
✅ **Encrypted**: Tokens safe at rest  
✅ **Multi-tenant**: Org isolation everywhere  
✅ **Extensible**: Add features via modules  
✅ **Type-safe**: TypeScript strict mode  
✅ **Observable**: Sentry + Temporal UI  
✅ **Scalable**: Redis for rate limiting  
✅ **Documented**: Clear DTO contracts  

Copy this architecture in your MVP.
