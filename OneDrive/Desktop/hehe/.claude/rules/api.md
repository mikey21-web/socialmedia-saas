---
paths:
  - "apps/backend/src/**/*.ts"
  - "packages/**/*.ts"
---

# Backend Rules — NestJS API

## Architecture
- **Module-per-domain** — auth, posts, analytics, platforms, etc.
- **Services for business logic** — never in controllers
- **Controllers only handle HTTP** — request/response
- **DTOs for validation** — class-validator decorators
- **Guards for auth** — JWT middleware
- **Pipes for transformation** — validation happens here

## Database
- **Prisma models** define schema
- **Repositories pattern** for data access (or Prisma directly)
- **Transactions for multi-step operations**
- **Indexes on frequently queried fields**

## Error Handling
- Throw `BadRequestException`, `UnauthorizedException`, `NotFoundException`
- Return consistent error shape: `{ statusCode, message, error }`
- Log errors with context (user ID, request ID, etc.)

## TypeScript
- Strict mode, no `any`
- Explicit return types on all functions
- Use generics for reusable patterns

## Testing
- Unit tests for services
- E2E tests for critical flows (auth, posting, payments)
- Mock external APIs (Stripe, platform SDKs)

## External Integrations
- Encapsulate in services (`stripe.service.ts`, `instagram.service.ts`)
- Use environment variables for API keys (never hardcode)
- Handle timeouts and retries gracefully
- Log all external API calls (request, response, latency)
