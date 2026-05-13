---
paths:
  - "prisma/schema.prisma"
  - "apps/backend/src/prisma/**/*.ts"
---

# Database Rules — PostgreSQL + Prisma

## Schema Design
- **Timestamps on everything** — `createdAt`, `updatedAt`
- **Soft deletes** — add `deletedAt` for data retention
- **Foreign keys with cascading** — define clearly
- **Indexes on foreign keys** and frequently filtered columns
- **Unique constraints** where needed (email, username, etc.)

## Relationships
- Use Prisma's relation syntax clearly
- Define both sides of one-to-many/many-to-many
- Use `@relation` names if ambiguous

## Migrations
- Create migration for every schema change: `prisma migrate dev --name description`
- Migrations are immutable — test before committing
- Run migrations in order (`prisma migrate deploy`)
- For multi-tenant: partition strategies documented in schema comments

## Querying
- Use Prisma Client for type safety
- Avoid N+1 queries — use `include` and `select` to fetch relations
- Use `where` filters efficiently — indexes help
- Batch operations where possible

## Performance
- Monitor slow queries
- Add indexes on high-cardinality columns
- Denormalize sparingly for reporting
- Use views for complex analytics queries

## Data Integrity
- Constraints in schema, not application
- Validate at DB level (NOT NULL, CHECK constraints)
- Use transactions for multi-step operations
