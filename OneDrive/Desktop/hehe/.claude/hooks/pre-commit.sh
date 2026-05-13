#!/bin/bash
# Before EVERY commit: type check → lint → test
# If anything fails, commit is BLOCKED.
# Skip checks if no package.json or pnpm not available (e.g., during initial setup)

if ! command -v pnpm &> /dev/null; then
  exit 0
fi

if [ ! -f "package.json" ] && [ ! -f "frontend/package.json" ] && [ ! -f "backend/package.json" ]; then
  exit 0
fi

pnpm tsc --noEmit || exit 2
pnpm eslint --cache --quiet . || exit 2
pnpm test -- --passWithNoTests || exit 2

echo "All checks passed!"
exit 0
