---
name: sentry
description: Integrate Sentry error tracking and performance monitoring. Use when setting up Sentry in a project, capturing errors and exceptions, adding custom context/breadcrumbs, monitoring performance, or configuring Sentry for Next.js/Node.js/React.
---

# Sentry Error Tracking Expert Guide

## Setup

```bash
# Next.js (recommended)
npx @sentry/wizard@latest -i nextjs

# Manual install
npm install @sentry/nextjs    # Next.js
npm install @sentry/node      # Node.js/Express
npm install @sentry/react     # React SPA
npm install @sentry/browser   # Vanilla JS
```

## Next.js Configuration

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    Sentry.replayIntegration(),
  ],
})

// sentry.server.config.ts (same structure)
// sentry.edge.config.ts (same structure)
```

## Capturing Errors

```typescript
import * as Sentry from '@sentry/nextjs'

// Capture exception
try {
  await riskyOperation()
} catch (error) {
  Sentry.captureException(error)
  throw error  // re-throw after capturing
}

// With extra context
Sentry.captureException(error, {
  extra: { userId, orderId, action: 'checkout' },
  tags: { feature: 'payments', severity: 'critical' },
  level: 'error',  // 'fatal' | 'error' | 'warning' | 'info' | 'debug'
})

// Capture message (non-error)
Sentry.captureMessage('Payment amount mismatch detected', 'warning')
```

## User Context

```typescript
// Set user on login
Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.name,
})

// Clear on logout
Sentry.setUser(null)
```

## Breadcrumbs (User Journey)

```typescript
// Manual breadcrumb
Sentry.addBreadcrumb({
  category: 'auth',
  message: 'User authenticated successfully',
  level: 'info',
  data: { method: 'oauth', provider: 'google' },
})

// Track UI actions
function handleCheckout(cartItems) {
  Sentry.addBreadcrumb({
    category: 'ui.click',
    message: 'User clicked checkout',
    data: { itemCount: cartItems.length, total: cartItems.reduce(...) },
  })
  // proceed with checkout
}
```

## Custom Tags & Context

```typescript
// Tags (indexed, filterable in Sentry dashboard)
Sentry.setTag('feature', 'payments')
Sentry.setTag('plan', user.plan)
Sentry.setTag('locale', 'en-US')

// Extra context (not indexed, but visible in event)
Sentry.setExtra('raw_response', apiResponse)
Sentry.setExtra('request_id', headers['x-request-id'])

// Scope for a specific operation
Sentry.withScope((scope) => {
  scope.setTag('background_job', 'email_sync')
  scope.setExtra('job_data', jobPayload)
  Sentry.captureException(error)
})
```

## Performance Monitoring

```typescript
// Manual transaction
const transaction = Sentry.startTransaction({ name: 'process-order', op: 'task' })
const span = transaction.startChild({ op: 'db.query', description: 'fetch inventory' })

try {
  await fetchInventory()
  span.setStatus('ok')
} catch (error) {
  span.setStatus('internal_error')
  throw error
} finally {
  span.finish()
  transaction.finish()
}

// Wrap async function
const result = await Sentry.startSpan(
  { name: 'generate-report', op: 'function' },
  async () => {
    return await generateReport(params)
  }
)
```

## Node.js / Express

```typescript
import * as Sentry from '@sentry/node'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
})

const app = express()

// MUST be before routes
Sentry.setupExpressErrorHandler(app)

// Routes...
app.get('/users', async (req, res) => {
  const users = await getUsers()
  res.json(users)
})

// Error handler (after Sentry)
app.use((err, req, res, next) => {
  res.status(500).json({ error: 'Internal server error' })
})
```

## React Error Boundary

```tsx
import * as Sentry from '@sentry/react'

// Wrap your app or components
export default function App() {
  return (
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <div>
          <h2>Something went wrong</h2>
          <p>{error.message}</p>
          <button onClick={resetError}>Try again</button>
        </div>
      )}
      showDialog  // shows Sentry feedback dialog
    >
      <Routes />
    </Sentry.ErrorBoundary>
  )
}
```

## Source Maps (Production)

```bash
# Automatically uploaded with @sentry/nextjs wizard
# Or manual upload:
npx @sentry/cli releases files VERSION upload-sourcemaps ./dist

# Set release in config
Sentry.init({
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
})
```

## Filtering (Reduce Noise)

```typescript
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  beforeSend(event, hint) {
    // Don't send in development
    if (process.env.NODE_ENV === 'development') return null

    // Filter out known non-issues
    const error = hint.originalException
    if (error instanceof NetworkError) return null
    if (event.message?.includes('Non-Error exception captured')) return null

    return event
  },
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'ChunkLoadError',
    /^AbortError/,
  ],
  denyUrls: [
    /extensions\//i,
    /^chrome:\/\//i,
  ],
})
```

## Alerts Setup (in Sentry Dashboard)

Recommended alert rules:
1. **Error spike**: >50 new events in 1h → alert
2. **New issue**: any new issue type → alert
3. **Performance degradation**: p95 response time >2s → alert
4. **High error rate**: >5% of transactions with errors → alert
