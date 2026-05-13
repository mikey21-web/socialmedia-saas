---
name: eslint
description: Configure and use ESLint for JavaScript/TypeScript code quality. Use when setting up ESLint config, writing custom rules, fixing ESLint errors, configuring TypeScript ESLint, integrating with Prettier, or setting up lint-staged pre-commit hooks.
---

# ESLint Expert Guide

## Setup (Flat Config — ESLint 9+)

```bash
npm install -D eslint @eslint/js typescript-eslint
npx eslint --init  # interactive setup
```

```javascript
// eslint.config.js (ESLint 9+ flat config)
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactPlugin from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import importPlugin from 'eslint-plugin-import'

export default tseslint.config(
  // Global ignores
  { ignores: ['dist/**', 'node_modules/**', '.next/**', '*.config.js'] },

  // Base JS rules
  js.configs.recommended,

  // TypeScript rules
  ...tseslint.configs.recommended,

  // React
  {
    plugins: { react: reactPlugin, 'react-hooks': reactHooks },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',   // not needed in React 17+
      'react/prop-types': 'off',           // TypeScript handles this
    },
    settings: { react: { version: 'detect' } },
  },

  // Custom rules
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
    },
  }
)
```

## Legacy .eslintrc.json (ESLint 8)

```json
{
  "root": true,
  "env": { "browser": true, "es2022": true, "node": true },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": { "ecmaVersion": "latest", "sourceType": "module" },
  "plugins": ["@typescript-eslint", "react", "react-hooks", "import"],
  "rules": {
    "react/react-in-jsx-scope": "off",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  },
  "ignorePatterns": ["dist/", "node_modules/"]
}
```

## Key Rule Configurations

```javascript
// TypeScript-specific
'@typescript-eslint/no-unused-vars': ['error', {
  vars: 'all',
  args: 'after-used',
  argsIgnorePattern: '^_',
  varsIgnorePattern: '^_',
}],
'@typescript-eslint/consistent-type-imports': ['error', {
  prefer: 'type-imports',  // enforce `import type { Foo }`
}],
'@typescript-eslint/no-floating-promises': 'error',  // catch unawaited promises

// Import order
'import/order': ['error', {
  groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
  'newlines-between': 'always',
  alphabetize: { order: 'asc', caseInsensitive: true },
}],
'import/no-duplicates': 'error',

// React
'react-hooks/rules-of-hooks': 'error',
'react-hooks/exhaustive-deps': 'warn',
'react/no-unescaped-entities': 'off',
'react/display-name': 'off',
```

## ESLint + Prettier Integration

```bash
npm install -D prettier eslint-config-prettier eslint-plugin-prettier
```

```javascript
// Add to extends (must be LAST):
"extends": ["...", "prettier"]

// Or with plugin (shows prettier errors as ESLint errors):
"extends": ["...", "plugin:prettier/recommended"]
```

## Running ESLint

```bash
npx eslint .                           # check all
npx eslint src/ --ext .ts,.tsx         # specific path + extensions
npx eslint src/ --fix                  # auto-fix what's fixable
npx eslint src/ --fix --fix-type suggestion  # only safe fixes
npx eslint . --format=compact          # compact output
```

## Disabling Rules (Use Sparingly)

```typescript
// Single line
const x = require('module') // eslint-disable-line @typescript-eslint/no-var-requires

// Next line
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function process(data: any) {}

// Block (always add reason)
/* eslint-disable no-console -- needed for CLI output */
console.log('CLI tool output')
/* eslint-enable no-console */

// Whole file
/* eslint-disable @typescript-eslint/no-explicit-any */
```

## Pre-commit Hooks with lint-staged

```bash
npm install -D husky lint-staged
npx husky init
```

```json
// package.json
"lint-staged": {
  "*.{ts,tsx,js,jsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md,css}": ["prettier --write"]
}
```

```bash
# .husky/pre-commit
npx lint-staged
```

## Custom Rule (Simple Example)

```javascript
// rules/no-hardcoded-colors.js
module.exports = {
  meta: {
    type: 'suggestion',
    docs: { description: 'Disallow hardcoded hex colors in JSX' },
    schema: [],
  },
  create(context) {
    return {
      JSXAttribute(node) {
        const value = node.value?.value
        if (typeof value === 'string' && /#[0-9a-fA-F]{3,6}/.test(value)) {
          context.report({
            node,
            message: 'Avoid hardcoded colors. Use CSS variables or design tokens.',
          })
        }
      },
    }
  },
}
```

## Common Error Fixes

| Error | Fix |
|-------|-----|
| `no-unused-vars` | Prefix with `_` or remove; use `argsIgnorePattern: '^_'` |
| `any` type | Add proper type or use `unknown` |
| `console.log` | Replace with logger or use `// eslint-disable-next-line` |
| `no-floating-promises` | Add `await` or `void` operator |
| React hooks deps | Add missing deps or restructure to avoid |
