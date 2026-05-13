# Postiz Competitor MVP — Project Overview

**Status:** Planning → Development (Starting Week 1)  
**Launch Date:** June 1, 2026  
**Target Revenue:** $10K+/month with 300+ Pro users in first 2 weeks

## What We're Building

A **clean Postiz competitor** — social media scheduling SaaS that avoids AGPL licensing issues.

**MVP Feature Set:**
- Multi-platform publishing (X, Instagram, LinkedIn, Facebook, TikTok optional)
- Advanced analytics (must-have, not basic)
- Content scheduling with Temporal workflows
- Token-based approval workflows
- Stripe billing (Pro tier)
- Multi-tenant architecture from day 1

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | NestJS + TypeScript + PostgreSQL + Prisma |
| **Frontend** | Next.js 14 + shadcn/ui + Tailwind CSS |
| **Orchestration** | Temporal (publish scheduling) |
| **Payments** | Stripe |
| **Image Gen** | Replicate |
| **Deployment** | Vercel (frontend), Railway/Heroku (backend) |

## 4-Week Sprint Breakdown

| Week | Focus | Deliverable |
|------|-------|-------------|
| **1** | Auth + Database | User signup, multi-tenant DB, dashboard skeleton |
| **2** | Integrations | X, Instagram, LinkedIn, Facebook API connections |
| **3** | Publishing + Analytics | Temporal workflows, content posting, metrics collection |
| **4** | Frontend + Billing | Complete UI, Stripe subscription, launch prep |

## Sub-Agents (Workers)

- **Codex** — Deep architectural investigations, complex refactors
- **OpenCode** — Isolated testing, build validation, performance tuning
- **Balcbox** — Specific optimizations, benchmarking
- **Claude Code** — Orchestration, task delegation, coordination
- **GitHub** — PR/issue automation, deployment triggers

## Success Criteria

✅ Zero TypeScript errors  
✅ All tests passing  
✅ 5+ Week 1 checkpoints hit  
✅ Deploy to staging by Week 3  
✅ 5+ beta users testing Week 4  
✅ Launch June 1 with $0 technical debt
