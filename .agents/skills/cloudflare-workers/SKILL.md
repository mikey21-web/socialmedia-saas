---
name: cloudflare-workers
description: Build and deploy Cloudflare Workers serverless functions. Use when writing Workers scripts, using KV/D1/R2/Durable Objects, implementing edge APIs, deploying with Wrangler, or building with Hono on Workers.
---

# Cloudflare Workers Expert Guide

## Setup

```bash
npm create cloudflare@latest my-worker -- --type=hello-world
# or
npm install -g wrangler
wrangler init my-worker
wrangler login
```

## Basic Worker

```typescript
// src/index.ts
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/') {
      return new Response('Hello World!', {
        headers: { 'Content-Type': 'text/plain' },
      })
    }

    if (url.pathname === '/api/data') {
      if (request.method !== 'GET') {
        return new Response('Method not allowed', { status: 405 })
      }
      const data = { message: 'from the edge!', timestamp: Date.now() }
      return Response.json(data)
    }

    return new Response('Not found', { status: 404 })
  },
}

// Type for env bindings
interface Env {
  MY_KV: KVNamespace
  MY_DB: D1Database
  MY_BUCKET: R2Bucket
  API_KEY: string  // secret
}
```

## wrangler.toml

```toml
name = "my-worker"
main = "src/index.ts"
compatibility_date = "2024-09-23"

[[kv_namespaces]]
binding = "MY_KV"
id = "your-kv-namespace-id"

[[d1_databases]]
binding = "MY_DB"
database_name = "my-db"
database_id = "your-d1-db-id"

[[r2_buckets]]
binding = "MY_BUCKET"
bucket_name = "my-bucket"

[vars]
ENVIRONMENT = "production"

[[secrets]]
name = "API_KEY"
```

## KV (Key-Value Store)

```typescript
// Write
await env.MY_KV.put('user:123', JSON.stringify({ name: 'Alice' }), {
  expirationTtl: 60 * 60 * 24,  // 24 hours
})

// Read
const raw = await env.MY_KV.get('user:123')
const user = raw ? JSON.parse(raw) : null

// List keys
const { keys } = await env.MY_KV.list({ prefix: 'user:' })

// Delete
await env.MY_KV.delete('user:123')
```

## D1 (SQLite Database)

```typescript
// Create tables
await env.MY_DB.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    created_at INTEGER DEFAULT (unixepoch())
  )
`)

// Query
const { results } = await env.MY_DB.prepare(
  'SELECT * FROM users WHERE email = ?'
).bind(email).all()

const user = await env.MY_DB.prepare(
  'SELECT * FROM users WHERE id = ?'
).bind(userId).first()

// Insert
await env.MY_DB.prepare(
  'INSERT INTO users (id, name, email) VALUES (?, ?, ?)'
).bind(crypto.randomUUID(), name, email).run()

// Batch
await env.MY_DB.batch([
  env.MY_DB.prepare('INSERT INTO orders ...').bind(...),
  env.MY_DB.prepare('UPDATE inventory ...').bind(...),
])
```

## R2 (Object Storage — S3-compatible)

```typescript
// Upload
await env.MY_BUCKET.put(`files/${filename}`, file, {
  httpMetadata: { contentType: 'image/jpeg' },
})

// Download
const object = await env.MY_BUCKET.get(`files/${filename}`)
if (!object) return new Response('Not found', { status: 404 })
return new Response(object.body, {
  headers: { 'Content-Type': object.httpMetadata?.contentType ?? 'application/octet-stream' }
})

// Delete
await env.MY_BUCKET.delete(`files/${filename}`)

// List
const { objects } = await env.MY_BUCKET.list({ prefix: 'files/' })
```

## Hono Framework (recommended)

```bash
npm create cloudflare@latest -- --framework=hono
# or: npm install hono
```

```typescript
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { bearerAuth } from 'hono/bearer-auth'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

type Bindings = { MY_KV: KVNamespace; API_KEY: string }

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', cors())
app.use('/api/*', bearerAuth({ token: (c) => c.env.API_KEY }))

app.get('/api/users', async (c) => {
  const users = await getUsers(c.env.MY_KV)
  return c.json(users)
})

app.post('/api/users', zValidator('json', z.object({
  name: z.string().min(1),
  email: z.string().email(),
})), async (c) => {
  const body = c.req.valid('json')
  const user = await createUser(c.env.MY_KV, body)
  return c.json(user, 201)
})

app.notFound((c) => c.json({ error: 'Not found' }, 404))
app.onError((err, c) => {
  console.error(err)
  return c.json({ error: err.message }, 500)
})

export default app
```

## Deployment

```bash
wrangler dev                  # local dev
wrangler dev --remote         # dev with real bindings
wrangler deploy               # deploy to production
wrangler tail                 # stream logs
wrangler secret put API_KEY   # add secret
```

## Caching

```typescript
// Cache API
const cache = caches.default
const cacheKey = new Request(request.url)

let response = await cache.match(cacheKey)
if (!response) {
  response = await fetch(originUrl)
  const cachedResponse = new Response(response.body, response)
  cachedResponse.headers.set('Cache-Control', 'public, max-age=3600')
  ctx.waitUntil(cache.put(cacheKey, cachedResponse.clone()))
}
return response
```
