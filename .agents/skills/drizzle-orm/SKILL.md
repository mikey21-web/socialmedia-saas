---
name: drizzle-orm
description: Use Drizzle ORM for type-safe database access in TypeScript. Use when writing Drizzle schema definitions, queries, migrations, joins, or integrating Drizzle with Next.js, Supabase, PlanetScale, or other databases.
---

# Drizzle ORM Expert Guide

Drizzle is a lightweight TypeScript ORM — schema defined in TypeScript, queries are type-safe SQL.

## Setup

```bash
npm install drizzle-orm
# Pick driver:
npm install @libsql/client        # SQLite/Turso
npm install postgres               # PostgreSQL
npm install mysql2                 # MySQL/PlanetScale
npm install better-sqlite3         # SQLite (Node.js)

npm install -D drizzle-kit         # migrations CLI
```

## Schema Definition

```typescript
// db/schema.ts
import { pgTable, text, integer, boolean, timestamp, uuid, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: text('role', { enum: ['user', 'admin'] }).default('user').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: index('email_idx').on(table.email),
}))

export const posts = pgTable('posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  content: text('content'),
  published: boolean('published').default(false).notNull(),
  authorId: uuid('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Relations (for joins)
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}))

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, { fields: [posts.authorId], references: [users.id] }),
}))
```

## Database Connection

```typescript
// db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const client = postgres(process.env.DATABASE_URL!)
export const db = drizzle(client, { schema })

// For SQLite
import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
const sqlite = new Database('local.db')
export const db = drizzle(sqlite, { schema })
```

## CRUD Queries

```typescript
import { db } from './db'
import { users, posts } from './db/schema'
import { eq, and, or, like, gt, lt, desc, asc, count, sql } from 'drizzle-orm'

// INSERT
const [newUser] = await db.insert(users)
  .values({ email: 'a@b.com', name: 'Alice' })
  .returning()

// INSERT multiple
await db.insert(posts).values([
  { title: 'Post 1', authorId: userId },
  { title: 'Post 2', authorId: userId },
])

// SELECT
const allUsers = await db.select().from(users)
const [user] = await db.select().from(users).where(eq(users.id, userId))
const admins = await db.select({ id: users.id, name: users.name })
  .from(users)
  .where(eq(users.role, 'admin'))
  .orderBy(desc(users.createdAt))
  .limit(10)
  .offset(20)

// UPDATE
const [updated] = await db.update(users)
  .set({ name: 'Bob', updatedAt: new Date() })
  .where(eq(users.id, userId))
  .returning()

// DELETE
await db.delete(posts).where(eq(posts.authorId, userId))
```

## Filtering & Conditions

```typescript
import { eq, ne, lt, lte, gt, gte, and, or, not, like, ilike, inArray, isNull, isNotNull, between } from 'drizzle-orm'

// Compound conditions
where(and(eq(users.role, 'admin'), gt(users.createdAt, cutoffDate)))
where(or(eq(users.role, 'admin'), eq(users.role, 'moderator')))
where(not(eq(users.role, 'user')))

// String search
where(ilike(users.name, `%${search}%`))  // case-insensitive
where(like(users.email, `${prefix}%`))

// Arrays
where(inArray(users.id, userIds))
where(not(inArray(posts.status, ['deleted', 'archived'])))

// Null checks
where(isNull(users.deletedAt))
where(isNotNull(posts.publishedAt))

// Ranges
where(between(posts.createdAt, startDate, endDate))
```

## Joins

```typescript
// Inner join
const postsWithAuthors = await db.select({
  postId: posts.id,
  title: posts.title,
  authorName: users.name,
  authorEmail: users.email,
})
.from(posts)
.innerJoin(users, eq(posts.authorId, users.id))
.where(eq(posts.published, true))

// Left join
const usersWithPosts = await db.select()
  .from(users)
  .leftJoin(posts, eq(users.id, posts.authorId))

// Using relations (with)
const usersWithPosts = await db.query.users.findMany({
  with: {
    posts: {
      where: eq(posts.published, true),
      orderBy: desc(posts.createdAt),
      limit: 5,
    },
  },
  where: eq(users.role, 'admin'),
})
```

## Transactions

```typescript
await db.transaction(async (tx) => {
  const [user] = await tx.insert(users)
    .values({ email: 'a@b.com', name: 'Alice' })
    .returning()

  await tx.insert(posts).values({
    title: 'First post',
    authorId: user.id,
  })

  // If anything throws, transaction rolls back automatically
})
```

## Migrations (drizzle-kit)

```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit'

export default {
  schema: './db/schema.ts',
  out: './db/migrations',
  driver: 'pg',
  dbCredentials: { connectionString: process.env.DATABASE_URL! },
} satisfies Config
```

```bash
npx drizzle-kit generate    # generate migration files
npx drizzle-kit migrate     # apply migrations
npx drizzle-kit push        # push schema directly (no migration files, dev only)
npx drizzle-kit studio      # open GUI
```

## Aggregate Queries

```typescript
import { count, sum, avg, max, min, sql } from 'drizzle-orm'

const [{ total }] = await db.select({ total: count() }).from(users)
const [{ total }] = await db.select({ total: count(users.id) }).from(users).where(eq(users.role, 'admin'))

// Group by
const postsByUser = await db.select({
  authorId: posts.authorId,
  postCount: count(),
}).from(posts).groupBy(posts.authorId).having(gt(count(), 5))

// Raw SQL when needed
await db.execute(sql`VACUUM ANALYZE users`)
```
