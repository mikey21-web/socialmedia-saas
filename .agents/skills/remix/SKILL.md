---
name: remix
description: Build full-stack web apps with Remix. Use when creating Remix routes, loaders, actions, error boundaries, implementing nested routing, form handling, or deploying Remix apps to Cloudflare/Vercel/Node.js.
---

# Remix Expert Guide

## Core Mental Model

```
Remix = Nested routing + Server/Client data contract
Routes → files in app/routes/
loader() → server: fetch data for GET requests
action() → server: handle form submissions (POST/PUT/DELETE)
Component → renders with loader data
ErrorBoundary → catches errors per route
```

## File-based Routing

```
app/routes/
├── _index.tsx              → /
├── about.tsx               → /about
├── blog._index.tsx         → /blog
├── blog.$slug.tsx          → /blog/:slug
├── dashboard.tsx           → layout for /dashboard/*
├── dashboard._index.tsx    → /dashboard
├── dashboard.settings.tsx  → /dashboard/settings
├── $username.tsx           → /:username
└── $.tsx                   → splat (catch-all)
```

## Loader (Data Fetching)

```typescript
// app/routes/blog.$slug.tsx
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'

export async function loader({ params, request }: LoaderFunctionArgs) {
  const post = await db.post.findUnique({ where: { slug: params.slug } })
  if (!post) throw new Response('Not found', { status: 404 })

  // Access request headers, cookies
  const cookie = request.headers.get('Cookie')

  return json({
    post,
    meta: { title: post.title },
  })
}

export default function BlogPost() {
  const { post } = useLoaderData<typeof loader>()
  return <article><h1>{post.title}</h1><p>{post.content}</p></article>
}
```

## Action (Form Handling)

```typescript
// app/routes/contact.tsx
import { json, redirect, type ActionFunctionArgs } from '@remix-run/node'
import { Form, useActionData, useNavigation } from '@remix-run/react'

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()
  const name = formData.get('name') as string
  const email = formData.get('email') as string

  // Validate
  const errors: Record<string, string> = {}
  if (!name) errors.name = 'Name is required'
  if (!email || !email.includes('@')) errors.email = 'Valid email required'

  if (Object.keys(errors).length > 0) {
    return json({ errors }, { status: 422 })
  }

  await sendContactEmail({ name, email })
  return redirect('/thank-you')
}

export default function Contact() {
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  return (
    <Form method="post">
      <div>
        <label>Name</label>
        <input name="name" required />
        {actionData?.errors?.name && <p className="text-red-500">{actionData.errors.name}</p>}
      </div>
      <div>
        <label>Email</label>
        <input name="email" type="email" required />
        {actionData?.errors?.email && <p className="text-red-500">{actionData.errors.email}</p>}
      </div>
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Sending...' : 'Send message'}
      </button>
    </Form>
  )
}
```

## Nested Layouts

```typescript
// app/routes/dashboard.tsx — parent layout
import { Outlet, NavLink } from '@remix-run/react'

export default function DashboardLayout() {
  return (
    <div className="flex">
      <aside>
        <NavLink to="/dashboard" end>Overview</NavLink>
        <NavLink to="/dashboard/settings">Settings</NavLink>
      </aside>
      <main>
        <Outlet />  {/* child routes render here */}
      </main>
    </div>
  )
}

// app/routes/dashboard._index.tsx — child route at /dashboard
export async function loader() {
  return json({ stats: await getStats() })
}

export default function DashboardHome() {
  const { stats } = useLoaderData<typeof loader>()
  return <div>Stats: {stats.total}</div>
}
```

## Error Handling

```typescript
// Per-route error boundary
export function ErrorBoundary() {
  const error = useRouteError()

  if (isRouteErrorResponse(error)) {
    return (
      <div>
        <h1>{error.status} {error.statusText}</h1>
        <p>{error.data}</p>
      </div>
    )
  }

  return (
    <div>
      <h1>Unexpected error</h1>
      <p>{error instanceof Error ? error.message : 'Unknown error'}</p>
    </div>
  )
}
```

## Authentication Pattern

```typescript
// app/sessions.server.ts
import { createCookieSessionStorage, redirect } from '@remix-run/node'

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: '__session',
    secrets: [process.env.SESSION_SECRET!],
    sameSite: 'lax',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  },
})

export async function requireUser(request: Request) {
  const session = await sessionStorage.getSession(request.headers.get('Cookie'))
  const userId = session.get('userId')
  if (!userId) throw redirect('/login')
  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user) throw redirect('/login')
  return user
}

// In protected routes:
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request)
  return json({ user })
}
```

## Meta Tags

```typescript
import { type MetaFunction } from '@remix-run/node'

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    { title: data?.post.title ?? 'Blog' },
    { name: 'description', content: data?.post.excerpt },
    { property: 'og:title', content: data?.post.title },
    { property: 'og:image', content: data?.post.coverImage },
  ]
}
```

## Optimistic UI

```tsx
import { useFetcher } from '@remix-run/react'

function LikeButton({ postId, liked, likeCount }: Props) {
  const fetcher = useFetcher()
  const isLiked = fetcher.formData ? fetcher.formData.get('liked') === 'true' : liked
  const count = isLiked ? likeCount + (liked ? 0 : 1) : likeCount - (liked ? 1 : 0)

  return (
    <fetcher.Form method="post" action="/api/like">
      <input type="hidden" name="postId" value={postId} />
      <input type="hidden" name="liked" value={String(!liked)} />
      <button type="submit">{isLiked ? '❤️' : '🤍'} {count}</button>
    </fetcher.Form>
  )
}
```
