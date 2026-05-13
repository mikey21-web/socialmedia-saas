---
name: prisma
description: Expert Prisma ORM usage for database access in Node.js/TypeScript. Use when writing Prisma schema, queries, migrations, relations, transactions, or integrating Prisma with Next.js/Express/NestJS.
---

# Prisma ORM Expert Guide

## Setup

```bash
npm install prisma @prisma/client
npx prisma init  # creates prisma/schema.prisma and .env
```

```env
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
# or SQLite for dev:
DATABASE_URL="file:./dev.db"
```

## Schema Definition

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"  // sqlite, mysql, mongodb, sqlserver
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  posts     Post[]
  profile   Profile?

  @@index([email])
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  published Boolean  @default(false)
  authorId  String

  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  tags      Tag[]

  @@index([authorId])
}

model Profile {
  id     String  @id @default(cuid())
  bio    String?
  userId String  @unique
  user   User    @relation(fields: [userId], references: [id])
}

model Tag {
  id    String @id @default(cuid())
  name  String @unique
  posts Post[]
}

enum Role {
  USER
  ADMIN
  MODERATOR
}
```

## Migrations

```bash
npx prisma migrate dev --name init          # dev migration (creates + applies)
npx prisma migrate deploy                   # production migration
npx prisma db push                          # push schema without migration (prototyping)
npx prisma db pull                          # introspect existing DB
npx prisma generate                         # regenerate client after schema change
npx prisma studio                           # open GUI browser
```

## Client Setup (Singleton)

```typescript
// lib/prisma.ts — prevent multiple instances in Next.js dev
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

## CRUD Queries

```typescript
import { prisma } from '@/lib/prisma';

// CREATE
const user = await prisma.user.create({
  data: { email: 'a@b.com', name: 'Alice' },
});

// READ
const user = await prisma.user.findUnique({ where: { id: '...' } });
const user = await prisma.user.findFirst({ where: { email: { contains: '@b.com' } } });
const users = await prisma.user.findMany({
  where: { role: 'ADMIN', createdAt: { gte: new Date('2024-01-01') } },
  orderBy: { createdAt: 'desc' },
  take: 10,
  skip: 20,
  select: { id: true, email: true, name: true },  // only these fields
});

// UPDATE
const user = await prisma.user.update({
  where: { id: '...' },
  data: { name: 'Bob', updatedAt: new Date() },
});

// UPSERT
const user = await prisma.user.upsert({
  where: { email: 'a@b.com' },
  update: { name: 'Alice Updated' },
  create: { email: 'a@b.com', name: 'Alice' },
});

// DELETE
await prisma.user.delete({ where: { id: '...' } });
await prisma.user.deleteMany({ where: { role: 'USER', createdAt: { lt: cutoff } } });

// COUNT / AGGREGATE
const count = await prisma.user.count({ where: { role: 'ADMIN' } });
const agg = await prisma.post.aggregate({ _avg: { views: true }, _max: { views: true } });
```

## Relations & Includes

```typescript
// Include related records
const user = await prisma.user.findUnique({
  where: { id },
  include: {
    posts: {
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    },
    profile: true,
  },
});
// user.posts is populated

// Nested create
const post = await prisma.post.create({
  data: {
    title: 'Hello World',
    author: { connect: { id: userId } },   // connect existing
    tags: {
      connectOrCreate: [
        { where: { name: 'typescript' }, create: { name: 'typescript' } },
      ],
    },
  },
  include: { author: true, tags: true },
});
```

## Transactions

```typescript
// Sequential (in transaction)
const [user, post] = await prisma.$transaction([
  prisma.user.create({ data: { email: 'a@b.com' } }),
  prisma.post.create({ data: { title: 'First post', authorId: '...' } }),
]);

// Interactive (for complex logic)
const result = await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: { email: 'a@b.com' } });
  const post = await tx.post.create({
    data: { title: 'Welcome', authorId: user.id },
  });
  return { user, post };
});
```

## Filtering Patterns

```typescript
// String filters
where: { name: { contains: 'ali', mode: 'insensitive' } }
where: { email: { startsWith: 'admin' } }
where: { email: { endsWith: '@company.com' } }

// Number/Date ranges
where: { age: { gte: 18, lte: 65 } }
where: { createdAt: { gte: startDate, lte: endDate } }

// Array: in/notIn
where: { role: { in: ['ADMIN', 'MODERATOR'] } }
where: { id: { notIn: blockedIds } }

// Null checks
where: { deletedAt: null }
where: { profile: { isNot: null } }

// OR / AND / NOT
where: {
  OR: [
    { email: { contains: 'admin' } },
    { role: 'ADMIN' },
  ],
  AND: [
    { createdAt: { gte: new Date('2024-01-01') } },
  ],
  NOT: { email: { endsWith: '@test.com' } },
}
```

## Common Gotchas

| Issue | Fix |
|-------|-----|
| Multiple PrismaClient instances | Use singleton pattern (`lib/prisma.ts`) |
| Schema changed, types stale | Run `npx prisma generate` |
| Migration conflict in team | Run `npx prisma migrate dev` to sync |
| N+1 queries | Use `include` instead of looping queries |
| BigInt JSON serialization | `JSON.stringify(data, (_, v) => typeof v === 'bigint' ? v.toString() : v)` |
