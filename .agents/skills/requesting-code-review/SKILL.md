---
name: requesting-code-review
description: Request structured code review via subagent after completing features or tasks. Use when finishing a feature, completing a task in a plan, before merging to main, or when you want an objective quality check on code you've written.
---

# Requesting Code Review

Get objective, structured code review via a reviewer subagent.

## When Reviews Are Required

- After completing individual tasks in subagent-driven workflows
- Upon finishing a major feature or bug fix
- Before merging to main/master
- When facing an architectural decision
- After significant refactoring

**Philosophy**: Review early, review often. Issues compound when left unfound.

## Prepare the Review Request

```bash
# Get commit range
git log --oneline main..HEAD

# Example output:
# a3f8b2c feat: add JWT middleware
# 1d4e9f0 feat: add user verification endpoint
# b2c7a1d test: add auth integration tests
```

## Reviewer Subagent Prompt

```
You are a senior code reviewer. Review this implementation objectively.

REQUIREMENTS (what was asked for):
[Paste the task/ticket/plan section]

COMMIT RANGE: [start-sha]..[end-sha]

DIFF:
[Paste: git diff start-sha..end-sha]

Review for:
1. CORRECTNESS — Does it do what was required? Are edge cases handled?
2. SECURITY — Any injection risks, auth bypasses, data exposure?
3. PERFORMANCE — N+1 queries, blocking operations, unnecessary computation?
4. MAINTAINABILITY — Clear names, appropriate comments, follows codebase patterns?
5. TESTS — Adequate coverage? Tests test the right things?

Categorize each finding:
- 🔴 CRITICAL: Must fix before merging (correctness/security issues)
- 🟡 IMPORTANT: Should fix (quality/performance)
- 🔵 MINOR: Nice to have (style, suggestions)

Output format:
## Summary
[1-2 sentence overall assessment]

## Critical Issues
[list or "None"]

## Important Issues
[list or "None"]

## Minor Suggestions
[list or "None"]
```

## Handling Review Feedback

| Category | Action |
|----------|--------|
| 🔴 Critical | Fix immediately, re-review the specific change |
| 🟡 Important | Fix before continuing to next task |
| 🔵 Minor | Fix if quick (<5 min), otherwise log for later |

**Never skip Critical or Important issues.** You can challenge feedback with technical evidence, but don't ignore it.

## Challenging Feedback

If you disagree with a finding:
```
"I disagree with finding #2 because:
- [specific technical reason]
- [reference to docs/standard]
- [trade-off explanation]

Proposal: [alternative approach or rationale for keeping current approach]"
```

## Quick Self-Review Checklist

Before requesting formal review, run through this yourself:

```
Code Quality:
- [ ] No dead code or commented-out blocks
- [ ] Variable names explain intent
- [ ] Functions do one thing
- [ ] No magic numbers (use named constants)

Security:
- [ ] User input validated/sanitized
- [ ] No secrets in code
- [ ] Auth checks on all protected routes
- [ ] SQL uses parameterized queries

Tests:
- [ ] Happy path covered
- [ ] Error cases covered
- [ ] Edge cases covered (null, empty, boundary values)
- [ ] No tests that only test mocks
```
