#!/bin/bash
# Auto-format files after every edit/write
# No output unless there's an error

pnpm prettier --write . 2>/dev/null
pnpm eslint --fix . 2>/dev/null

exit 0
