---
name: prettier
description: Configure and use Prettier for code formatting. Use when setting up Prettier config, adding .prettierrc, integrating Prettier with ESLint, setting up format-on-save in VS Code, running prettier as a pre-commit hook, or resolving Prettier/ESLint conflicts.
---

# Prettier Expert Guide

## Installation

```bash
npm install --save-dev prettier
# or
npm install --save-dev --save-exact prettier  # pin exact version (recommended)
```

## Config File (`.prettierrc`)

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "bracketSameLine": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

Or as `.prettierrc.js` for dynamic config:

```javascript
// .prettierrc.js
/** @type {import('prettier').Config} */
module.exports = {
  semi: false,
  singleQuote: true,
  trailingComma: 'es5',
  printWidth: 100,
  tabWidth: 2,
  plugins: ['prettier-plugin-tailwindcss'],  // sort Tailwind classes
}
```

## `.prettierignore`

```
# Build outputs
dist/
build/
.next/
out/

# Dependencies
node_modules/

# Generated files
*.min.js
*.min.css
coverage/

# Specific files
package-lock.json
yarn.lock
pnpm-lock.yaml
```

## CLI Usage

```bash
# Format all files
npx prettier --write .

# Format specific files/patterns
npx prettier --write "src/**/*.{ts,tsx,js,jsx,css,json}"
npx prettier --write src/components/Button.tsx

# Check (no write — useful in CI)
npx prettier --check .
npx prettier --check "src/**/*.ts"

# Show formatted output (stdout)
npx prettier src/index.ts

# Add to package.json scripts
```

```json
{
  "scripts": {
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

## Prettier + ESLint Integration

```bash
npm install --save-dev eslint-config-prettier
# eslint-config-prettier disables ESLint rules that conflict with Prettier
# Do NOT install eslint-plugin-prettier (runs Prettier as ESLint rule — slow, messy output)
```

```javascript
// eslint.config.js (ESLint 9+ flat config)
import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import prettierConfig from 'eslint-config-prettier'

export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,  // MUST be last — disables conflicting rules
]
```

```javascript
// .eslintrc.js (legacy)
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',  // MUST be last
  ],
}
```

## VS Code Integration

```json
// .vscode/settings.json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[css]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

## Pre-commit Hook with lint-staged

```bash
npm install --save-dev husky lint-staged
npx husky init
```

```json
// package.json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,css,scss,md,html}": ["prettier --write"]
  }
}
```

```bash
# .husky/pre-commit
#!/usr/bin/env sh
npx lint-staged
```

## Plugin: Tailwind CSS Class Sorting

```bash
npm install --save-dev prettier-plugin-tailwindcss
```

```json
// .prettierrc
{
  "plugins": ["prettier-plugin-tailwindcss"],
  "tailwindConfig": "./tailwind.config.js"
}
```

## Plugin: Organize Imports

```bash
npm install --save-dev @ianvs/prettier-plugin-sort-imports
```

```json
{
  "plugins": ["@ianvs/prettier-plugin-sort-imports"],
  "importOrder": [
    "^(react/(.*)$)|^(react$)",
    "^(next/(.*)$)|^(next$)",
    "<THIRD_PARTY_MODULES>",
    "",
    "^@/(.*)$",
    "^[./]"
  ]
}
```

## Per-file / Per-language Overrides

```json
{
  "semi": false,
  "singleQuote": true,
  "overrides": [
    {
      "files": "*.json",
      "options": {
        "parser": "json",
        "printWidth": 200
      }
    },
    {
      "files": ["*.html", "*.svelte"],
      "options": {
        "singleQuote": false
      }
    },
    {
      "files": "*.md",
      "options": {
        "proseWrap": "always",
        "printWidth": 80
      }
    }
  ]
}
```

## Inline Disable

```typescript
// prettier-ignore
const matrix = [
  1, 0, 0,
  0, 1, 0,
  0, 0, 1,
]

// prettier-ignore-start
// prettier-ignore-end
```

## Key Options Reference

| Option | Default | Description |
|--------|---------|-------------|
| `printWidth` | 80 | Wrap at this column |
| `tabWidth` | 2 | Spaces per indent level |
| `useTabs` | false | Use tabs instead of spaces |
| `semi` | true | Add semicolons |
| `singleQuote` | false | Use single quotes |
| `trailingComma` | `"all"` | Add trailing commas |
| `bracketSpacing` | true | `{ foo: bar }` vs `{foo: bar}` |
| `arrowParens` | `"always"` | `(x) => x` vs `x => x` |
| `endOfLine` | `"lf"` | `lf`, `crlf`, `cr`, `auto` |
