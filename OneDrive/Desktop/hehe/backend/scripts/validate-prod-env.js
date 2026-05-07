#!/usr/bin/env node
'use strict';

const REQUIRED = [
  'JWT_SECRET',
  'TOKEN_ENCRYPTION_KEY',
  'DATABASE_URL',
];

const RECOMMENDED = [
  'REDIS_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'SENTRY_DSN',
  'REFRESH_TOKEN_SECRET',
  'CORS_ORIGINS',
];

const missing = REQUIRED.filter((v) => !process.env[v]);
const absent = RECOMMENDED.filter((v) => !process.env[v]);

if (missing.length > 0) {
  console.error(`\n[preflight] FATAL — missing required env vars:\n  ${missing.join('\n  ')}\n`);
  process.exit(1);
}

if (absent.length > 0) {
  console.warn(`\n[preflight] WARNING — missing recommended env vars:\n  ${absent.join('\n  ')}\n`);
}

// Validate JWT_SECRET length (min 32 chars)
if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
  console.error('[preflight] FATAL — JWT_SECRET must be at least 32 characters');
  process.exit(1);
}

// Validate TOKEN_ENCRYPTION_KEY length
if (process.env.TOKEN_ENCRYPTION_KEY && process.env.TOKEN_ENCRYPTION_KEY.length < 32) {
  console.error('[preflight] FATAL — TOKEN_ENCRYPTION_KEY must be at least 32 characters');
  process.exit(1);
}

console.log('[preflight] ✓ All required production env vars present');
