---
name: msw
description: Mock HTTP APIs with Mock Service Worker (MSW) in tests and development. Use when mocking REST/GraphQL APIs in Jest tests, Storybook, or browser dev mode, setting up MSW handlers, or intercepting network requests in React Testing Library tests.
---

# Mock Service Worker (MSW) Expert Guide

MSW intercepts network requests at the service worker level — no need to mock `fetch`/`axios`. Your code runs exactly as in production.

## Setup

```bash
npm install -D msw
```

```bash
# Initialize browser service worker
npx msw init public/ --save
```

## Define Handlers

```typescript
// src/mocks/handlers.ts
import { http, HttpResponse, delay } from 'msw'

export const handlers = [
  // GET
  http.get('/api/users', () => {
    return HttpResponse.json([
      { id: 1, name: 'Alice', email: 'alice@example.com' },
      { id: 2, name: 'Bob', email: 'bob@example.com' },
    ])
  }),

  // GET with path param
  http.get('/api/users/:id', ({ params }) => {
    const { id } = params
    if (id === '999') {
      return HttpResponse.json({ error: 'User not found' }, { status: 404 })
    }
    return HttpResponse.json({ id, name: 'Alice', email: 'alice@example.com' })
  }),

  // POST
  http.post('/api/users', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json(
      { id: Math.random(), ...body, createdAt: new Date().toISOString() },
      { status: 201 }
    )
  }),

  // PUT
  http.put('/api/users/:id', async ({ params, request }) => {
    const body = await request.json()
    return HttpResponse.json({ id: params.id, ...body })
  }),

  // DELETE
  http.delete('/api/users/:id', () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // Simulate loading delay
  http.get('/api/slow-endpoint', async () => {
    await delay(1500)
    return HttpResponse.json({ data: 'finally loaded' })
  }),

  // Error response
  http.get('/api/broken', () => {
    return HttpResponse.json({ error: 'Internal server error' }, { status: 500 })
  }),
]
```

## Node.js (for Jest tests)

```typescript
// src/mocks/server.ts
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
```

```typescript
// jest.setup.ts
import { server } from './src/mocks/server'

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())  // IMPORTANT: reset after each test
afterAll(() => server.close())
```

## Browser (development/Storybook)

```typescript
// src/mocks/browser.ts
import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)
```

```typescript
// src/main.tsx (Next.js: app/providers.tsx)
async function enableMocking() {
  if (process.env.NODE_ENV !== 'development') return
  const { worker } = await import('./mocks/browser')
  return worker.start({ onUnhandledRequest: 'bypass' })
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
})
```

## Override Handlers in Tests

```typescript
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'

test('shows error when API fails', async () => {
  // Override default handler for this test only
  server.use(
    http.get('/api/users', () => {
      return HttpResponse.json({ error: 'Server error' }, { status: 500 })
    })
  )

  render(<UserList />)
  await screen.findByText('Failed to load users')
})

test('shows empty state', async () => {
  server.use(
    http.get('/api/users', () => HttpResponse.json([]))
  )

  render(<UserList />)
  await screen.findByText('No users found')
})
```

## GraphQL Handlers

```typescript
import { graphql, HttpResponse } from 'msw'

export const handlers = [
  graphql.query('GetUser', ({ variables }) => {
    return HttpResponse.json({
      data: {
        user: { id: variables.id, name: 'Alice', email: 'alice@example.com' },
      },
    })
  }),

  graphql.mutation('CreateUser', ({ variables }) => {
    return HttpResponse.json({
      data: { createUser: { id: '1', ...variables.input } },
    })
  }),
]
```

## Request Inspection

```typescript
http.post('/api/checkout', async ({ request }) => {
  const body = await request.json()
  const headers = Object.fromEntries(request.headers)

  // Can log, validate, and respond based on request
  if (!body.priceId) {
    return HttpResponse.json({ error: 'priceId required' }, { status: 400 })
  }

  return HttpResponse.json({ sessionId: 'cs_test_123', url: 'https://checkout.stripe.com/...' })
}),
```

## Common Test Patterns

```typescript
// Test loading state
test('shows loading spinner', async () => {
  server.use(
    http.get('/api/users', async () => {
      await delay('infinite')  // never resolves
      return HttpResponse.json([])
    })
  )
  render(<UserList />)
  expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument()
})

// Test with realistic data
const mockUsers = [
  { id: '1', name: 'Alice', email: 'alice@example.com', role: 'admin' },
  { id: '2', name: 'Bob', email: 'bob@example.com', role: 'user' },
]

server.use(
  http.get('/api/users', () => HttpResponse.json(mockUsers))
)
```

## Gotchas

| Issue | Fix |
|-------|-----|
| Requests not intercepted | Check handler URL matches exactly (including base URL) |
| Test pollution | `server.resetHandlers()` in `afterEach` |
| `onUnhandledRequest: 'error'` failing | Either add handler or use `'bypass'`/`'warn'` |
| SSR requests not mocked | Use Node.js server setup, not browser worker |
| Headers not passing | Use `request.headers.get('Authorization')` |
