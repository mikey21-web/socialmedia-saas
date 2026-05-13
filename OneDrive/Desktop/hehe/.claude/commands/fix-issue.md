---
name: fix-issue
argument-hint: [issue-number]
---

# Fix GitHub Issue

Fix a GitHub Issue by number:
1. Read the issue details
2. Find relevant source files
3. Implement the minimal fix
4. Write a regression test
5. `pnpm test` — all green
6. Commit: "fix: description (closes #ISSUE)"

**Usage:** Type `/fix-issue 42` and Claude handles the rest.
