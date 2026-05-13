---
name: nextjs
description: Expert Next.js development with App Router, Server Components, API routes, and deployment. Use when building Next.js apps, implementing Server/Client Components, setting up routing, data fetching, middleware, or optimizing Next.js performance.
---

# Next.js Expert Guide

## App Router vs Pages Router

Always use **App Router** (`app/`) for new projects. Pages Router (`pages/`) is legacy.

```
app/
├── layout.tsx          ← Root layout (always Server Component)
├── page.tsx            ← Home page
├── loading.tsx         ← Suspense fallback
├── error.tsx           ← Error boundary (must be Client)
├── not-found.tsx       ← 404 page
├── (auth)/             ← Route group (no URL segment)
│   ├── login/page.tsx
│   └── register/page.tsx
├── dashboard/
│   ├── layout.tsx      ← Nested layout
│   └── page.tsx
└── api/
    └── users/route.ts  ← API route
```

## Server vs Client Components

```tsx
// SERVER COMPONENT (default — no 'use client')
// ✅ Can: fetch data, access DB, use env vars, async/await
// ❌ Can't: useState, useEffect, browser APIs, event handlers
async function UserList() {
  const users = await db.user.findMany(); // Direct DB access
  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
}

// CLIENT COMPONENT (opt-in)
'use client';
// ✅ Can: useState, useEffect, onClick, browser APIs
// ❌ Can't: async directly, server-only code
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

**Rule**: Push `'use client'` as far down the tree as possible. Keep the heavy lifting in Server Components.

## Data Fetching

```tsx
// In Server Component (recommended)
async function Page() {
  // Fetch is automatically cached and deduplicated
  const data = await fetch('https://api.example.com/data', {
    next: { revalidate: 3600 }, // ISR: revalidate every hour
    // next: { tags: ['products'] }, // On-demand revalidation
    // cache: 'no-store',            // Dynamic (no cache)
  });
  const json = await data.json();
  return <div>{json.title}</div>;
}

// Parallel fetching (don't await sequentially!)
async function Dashboard() {
  const [user, posts, analytics] = await Promise.all([
    getUser(),
    getPosts(),
    getAnalytics(),
  ]);
  return <DashboardView user={user} posts={posts} analytics={analytics} />;
}
```

## API Routes

```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  const user = await db.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(user);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const user = await db.user.create({ data: body });
  return NextResponse.json(user, { status: 201 });
}
```

## Dynamic Routes

```
app/
├── blog/[slug]/page.tsx          ← /blog/my-post
├── shop/[...categories]/page.tsx ← /shop/a/b/c
└── docs/[[...slug]]/page.tsx     ← /docs (optional catch-all)
```

```tsx
// app/blog/[slug]/page.tsx
export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map(post => ({ slug: post.slug }));
}

export async function generateMetadata({ params }) {
  const post = await getPost(params.slug);
  return { title: post.title, description: post.excerpt };
}

export default async function BlogPost({ params }) {
  const post = await getPost(params.slug);
  return <article>{post.content}</article>;
}
```

## Middleware

```typescript
// middleware.ts (root level)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
};
```

## Server Actions

```tsx
// In Server Component
async function CreatePost() {
  async function create(formData: FormData) {
    'use server'; // Server Action
    const title = formData.get('title') as string;
    await db.post.create({ data: { title } });
    revalidatePath('/blog');
  }

  return (
    <form action={create}>
      <input name="title" required />
      <button type="submit">Create</button>
    </form>
  );
}
```

## Performance Patterns

```tsx
// Lazy load heavy Client Components
const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <Skeleton />,
  ssr: false, // skip SSR for browser-only libs
});

// Image optimization
import Image from 'next/image';
<Image src="/hero.jpg" alt="Hero" width={1200} height={600} priority />

// Font optimization
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'] });
<html className={inter.className}>
```

## Common Gotchas

| Issue | Fix |
|-------|-----|
| `useState` in Server Component | Add `'use client'` |
| Data stale after mutation | Call `revalidatePath('/path')` or `revalidateTag('tag')` |
| Hydration mismatch | Check browser-only code in Server Components |
| Slow page | Use `Promise.all()` for parallel fetches |
| Large bundle | Move logic to Server Components, use `dynamic()` |
