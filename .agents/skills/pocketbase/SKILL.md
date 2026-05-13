---
name: pocketbase
description: Build apps with PocketBase as a backend. Use when setting up PocketBase collections, using PocketBase SDK for CRUD/auth/files, implementing real-time subscriptions, writing server-side hooks in Go/JS, or self-hosting PocketBase.
---

# PocketBase Expert Guide

## Setup

```bash
# Download PocketBase binary from pocketbase.io
# Run locally
./pocketbase serve

# Admin UI: http://localhost:8090/_/
# API: http://localhost:8090/api/

# JS SDK
npm install pocketbase
```

```typescript
// lib/pocketbase.ts
import PocketBase from 'pocketbase'

export const pb = new PocketBase('http://localhost:8090')
// or production: new PocketBase('https://your-app.pockethost.io')
```

## Authentication

```typescript
// Email/password auth
const authData = await pb.collection('users').authWithPassword(
  'user@example.com',
  'password123'
)
console.log(pb.authStore.isValid)  // true
console.log(pb.authStore.model)    // user record
console.log(pb.authStore.token)    // JWT

// OAuth2
const authData = await pb.collection('users').authWithOAuth2({
  provider: 'google',
})

// Check auth state
if (pb.authStore.isValid) {
  const user = pb.authStore.model
}

// Logout
pb.authStore.clear()

// Auto refresh token
pb.authStore.onChange((token, model) => {
  console.log('Auth changed:', model?.email)
})

// Persist auth in localStorage (browser)
const pb = new PocketBase('http://localhost:8090')
// authStore uses localStorage by default in browser
```

## CRUD Operations

```typescript
// CREATE
const record = await pb.collection('posts').create({
  title: 'Hello World',
  content: 'My first post',
  published: true,
  author: pb.authStore.model?.id,  // relation field
})

// READ one
const post = await pb.collection('posts').getOne('RECORD_ID', {
  expand: 'author',  // expand relation
})
console.log(post.expand?.author?.name)

// READ list with filters
const result = await pb.collection('posts').getList(1, 20, {
  filter: 'published = true && created > "2024-01-01"',
  sort: '-created',
  expand: 'author,tags',
  fields: 'id,title,created',  // select specific fields
})
console.log(result.items)
console.log(result.totalPages)

// READ all (auto-paginate)
const posts = await pb.collection('posts').getFullList({
  sort: '-created',
  filter: `author = "${userId}"`,
})

// READ first match
const post = await pb.collection('posts').getFirstListItem('slug="hello-world"')

// UPDATE
const updated = await pb.collection('posts').update('RECORD_ID', {
  title: 'Updated Title',
  views: pb.collection('posts').getOne('RECORD_ID').then(r => r.views + 1),
})

// DELETE
await pb.collection('posts').delete('RECORD_ID')
```

## File Uploads

```typescript
// Upload file
const formData = new FormData()
formData.append('title', 'My Post')
formData.append('cover', fileInput.files[0])

const record = await pb.collection('posts').create(formData)

// Get file URL
const url = pb.files.getUrl(record, record.cover)
// With thumb: pb.files.getUrl(record, record.cover, { thumb: '100x100' })

// Upload from URL or blob
const blob = await fetch(imageUrl).then(r => r.blob())
formData.append('avatar', blob, 'avatar.jpg')
```

## Real-time Subscriptions

```typescript
// Subscribe to collection changes
pb.collection('messages').subscribe('*', (e) => {
  console.log(e.action)  // 'create' | 'update' | 'delete'
  console.log(e.record)
})

// Subscribe to specific record
pb.collection('posts').subscribe('RECORD_ID', (e) => {
  console.log('Post updated:', e.record)
})

// Unsubscribe
pb.collection('messages').unsubscribe('*')

// React usage
useEffect(() => {
  pb.collection('messages').subscribe('*', handleChange)
  return () => pb.collection('messages').unsubscribe('*')
}, [])
```

## Filter Syntax

```typescript
// Comparison: = != > >= < <= ~ !~
// Logical: && ||
// Parentheses for grouping

const filters = {
  // Exact match
  byUser: `author = "${userId}"`,

  // Text search (~ is "like")
  search: `title ~ "${query}" || content ~ "${query}"`,

  // Date range
  dateRange: `created >= "2024-01-01" && created <= "2024-12-31"`,

  // Null check
  noImage: 'cover = null',
  hasImage: 'cover != null',

  // Relation filter
  byTag: `tags.name ?= "javascript"`,  // ?= means "any match"

  // Combined
  complex: `published = true && (title ~ "guide" || tags.name ?= "tutorial")`,
}
```

## Server-Side Hooks (JS — `pb_hooks/`)

```javascript
// pb_hooks/posts.pb.js
onModelBeforeCreate((e) => {
  if (e.model.tableName() === 'posts') {
    e.model.set('slug', slugify(e.model.get('title')))
  }
}, 'posts')

onModelAfterCreate((e) => {
  if (e.model.tableName() === 'posts') {
    // Send notification
    $mails.send({
      from: 'noreply@example.com',
      to: 'admin@example.com',
      subject: 'New post created',
      text: `Post: ${e.model.get('title')}`,
    })
  }
}, 'posts')

// Custom API route
routerAdd('GET', '/api/custom/stats', (c) => {
  const result = $app.db().newQuery('SELECT COUNT(*) as count FROM posts').one()
  return c.json(200, { count: result.count })
})

// Middleware
routerUse((next) => {
  return (c) => {
    console.log(c.request().method, c.request().url.path)
    return next(c)
  }
})
```

## TypeScript Types

```typescript
// Generate types from collection schema
// Install: npm install -g pocketbase-typegen
// pocketbase-typegen --db ./pb_data/data.db --out types/pocketbase.d.ts

import type { TypedPocketBase, PostsRecord, UsersRecord } from './types/pocketbase'

const pb = new PocketBase('http://localhost:8090') as TypedPocketBase

// Typed response
const posts = await pb.collection('posts').getFullList<PostsRecord>()
posts[0].title  // autocomplete!
```

## Relations

```typescript
// Collection schema (defined in admin UI):
// posts.author -> users (single relation)
// posts.tags -> tags[] (multi-relation)

// Expand single relation
const post = await pb.collection('posts').getOne('ID', {
  expand: 'author',
})
post.expand?.author?.name

// Expand nested relations
const post = await pb.collection('posts').getOne('ID', {
  expand: 'author.organization',
})
post.expand?.author?.expand?.organization?.name

// Back-relation (get user's posts)
const user = await pb.collection('users').getOne('USER_ID', {
  expand: 'posts_via_author',  // collectionName_via_fieldName
})
```

## Environment Variables

```env
# PocketBase doesn't use env vars directly
# Set via admin UI or in pb_hooks using $os.getenv()

# For JS SDK:
VITE_PB_URL=http://localhost:8090
NEXT_PUBLIC_PB_URL=http://localhost:8090
```
