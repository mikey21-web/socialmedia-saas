---
name: deploy
argument-hint: [staging|production]
---

# Deploy to Environment

Deploy the current branch to staging or production:

1. Verify all tests pass: `pnpm test`
2. Build all packages: `pnpm build`
3. Create deployment tag: `git tag deploy-{env}-{date}`
4. Push to GitHub with tags
5. Trigger CI/CD pipeline (Vercel for frontend, Railway for backend)
6. Wait for deployment confirmation
7. Run smoke tests

**Usage:** Type `/deploy staging` or `/deploy production`

**Note:** Production deploys require main branch + no uncommitted changes.
