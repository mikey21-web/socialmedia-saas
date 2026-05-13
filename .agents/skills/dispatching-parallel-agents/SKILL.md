---
name: dispatching-parallel-agents
description: Solve multiple independent problems simultaneously using parallel subagents. Use when facing multiple unrelated failures, need to investigate different subsystems at once, or want to parallelize independent development tasks for speed.
---

# Dispatching Parallel Agents

Delegate independent tasks to specialized subagents working concurrently.

## When to Use

✅ Multiple unrelated failures across different files/systems
✅ Problems that can be understood independently (no shared state)
✅ Independent development tasks (different features/modules)
✅ Parallel research across different topics

❌ Failures are interconnected (fixing one affects others)
❌ Agents would modify the same files
❌ Tasks require full system context

## The Pattern

```
1. Identify independent domains/problems
2. Create focused, self-contained task descriptions for each
3. Dispatch all agents simultaneously (not sequentially)
4. Collect results
5. Review for conflicts
6. Integrate and run full test suite
```

## Effective Agent Task Description

```
# Agent Task: [Domain]

## Scope
ONLY modify files in: [specific paths]
DO NOT touch: [other areas]

## Problem
[Specific, detailed description — include error messages, stack traces]

## Expected Output
[What success looks like — test passes, API returns X, etc.]

## Context
[Minimal context needed — relevant code snippets, not entire codebase]
```

**Key principle**: Each agent gets focused, self-contained instructions. No vague "fix all the issues in this area."

## Example: Parallel Bug Investigation

```
3 failing test suites in unrelated areas:

Agent 1 — Auth tests (src/auth/)
  "Fix auth.test.ts: JWT validation failing. Error: 'invalid signature'.
   Only modify src/auth/jwt.ts and src/auth/middleware.ts"

Agent 2 — Database tests (src/db/)
  "Fix db.test.ts: connection pool exhaustion in tests.
   Only modify src/db/pool.ts — add proper connection cleanup in afterEach"

Agent 3 — API tests (src/api/users/)
  "Fix users.test.ts: POST /users returning 500 on duplicate email.
   Only modify src/api/routes/users.ts — add duplicate check with 409 response"

Dispatch all 3 simultaneously.
```

## Example: Parallel Feature Development

```
Building a dashboard with 3 independent panels:

Agent 1 — Revenue chart
  "Build RevenueChart component in src/components/RevenueChart.tsx
   Uses Recharts LineChart, accepts props: { data: DailyRevenue[] }
   Includes: tooltip, legend, responsive container"

Agent 2 — User stats card
  "Build UserStatsCard component in src/components/UserStatsCard.tsx
   Shows: total users, active today, churn rate
   Accepts props: { stats: UserStats }"

Agent 3 — Recent activity feed
  "Build ActivityFeed component in src/components/ActivityFeed.tsx
   Shows last 20 events, auto-refreshes every 30s
   Accepts props: { userId: string }"

Dispatch all 3, then integrate in Dashboard.tsx
```

## Conflict Check After Parallel Work

```bash
# Check if agents modified same files
git diff --name-only HEAD~3..HEAD | sort | uniq -d

# Run full test suite
npm test

# If conflicts: resolve manually before continuing
```

## Splitting Complex Work

```
❌ Too broad (one agent):
"Fix all the authentication issues"

✅ Properly split:
Agent A: "Fix the refresh token expiry check in src/auth/tokens.ts"
Agent B: "Fix the OAuth callback URL in src/auth/oauth.ts"
Agent C: "Fix the session persistence in src/auth/session.ts"
```

## Result Integration Template

```
Parallel agents complete. Integrating:

Agent 1 result: [summary + files changed]
Agent 2 result: [summary + files changed]
Agent 3 result: [summary + files changed]

Conflicts: [none / list]
Integration steps: [any manual merging needed]
Full test run: [pass/fail]
```
