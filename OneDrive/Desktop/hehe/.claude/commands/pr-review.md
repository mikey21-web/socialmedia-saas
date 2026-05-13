---
name: pr-review
argument-hint: [pr-number]
---

# Review Pull Request

Perform structured code review on a GitHub PR:

1. Fetch PR details and diff
2. Check for security issues (hardcoded secrets, injection vulnerabilities)
3. Verify test coverage — no new untested code
4. Review architecture — does it follow project conventions?
5. Check for performance issues
6. Verify no breaking changes
7. Report: APPROVED / REQUEST CHANGES / COMMENT

**Usage:** Type `/pr-review 42`

**Criteria:**
- ✅ Tests pass
- ✅ Types check (no `any`)
- ✅ No security issues
- ✅ Follows naming conventions
- ✅ Functions < 50 lines
