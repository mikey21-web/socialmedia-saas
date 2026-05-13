#!/usr/bin/env node
'use strict';

/**
 * Production environment validation script.
 * Run before every deployment to catch missing or misconfigured env vars.
 *
 * Exit codes:
 *   0 — all checks passed
 *   1 — one or more FATAL checks failed
 */

let fatalCount = 0;
let warnCount = 0;

function fatal(message) {
  console.error(`  ✗ FATAL  ${message}`);
  fatalCount++;
}

function warn(message) {
  console.warn(`  ⚠ WARN   ${message}`);
  warnCount++;
}

function ok(message) {
  console.log(`  ✓ OK     ${message}`);
}

function section(title) {
  console.log(`\n── ${title} ──`);
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

section('Auth');

if (!process.env.JWT_SECRET) {
  fatal('JWT_SECRET is not set');
} else if (process.env.JWT_SECRET.length < 32) {
  fatal(`JWT_SECRET is too short (${process.env.JWT_SECRET.length} chars, need ≥32)`);
} else {
  ok('JWT_SECRET is set and long enough');
}

if (!process.env.REFRESH_TOKEN_SECRET) {
  fatal('REFRESH_TOKEN_SECRET is not set');
} else if (process.env.REFRESH_TOKEN_SECRET.length < 32) {
  fatal(`REFRESH_TOKEN_SECRET is too short (${process.env.REFRESH_TOKEN_SECRET.length} chars, need ≥32)`);
} else {
  ok('REFRESH_TOKEN_SECRET is set and long enough');
}

if (!process.env.TOKEN_ENCRYPTION_KEY) {
  fatal('TOKEN_ENCRYPTION_KEY is not set');
} else {
  const decoded = Buffer.from(process.env.TOKEN_ENCRYPTION_KEY, 'hex');
  if (decoded.length !== 32) {
    fatal(`TOKEN_ENCRYPTION_KEY must be a 64-char hex string (32 bytes). Got ${decoded.length} bytes.`);
  } else {
    ok('TOKEN_ENCRYPTION_KEY is set and correct length');
  }
}

// ─── Database ─────────────────────────────────────────────────────────────────

section('Database');

if (!process.env.DATABASE_URL) {
  fatal('DATABASE_URL is not set');
} else if (process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1')) {
  warn('DATABASE_URL points to localhost — is this intentional for production?');
} else if (!process.env.DATABASE_URL.startsWith('postgresql://') && !process.env.DATABASE_URL.startsWith('postgres://')) {
  fatal('DATABASE_URL must start with postgresql:// or postgres://');
} else {
  ok('DATABASE_URL is set');
}

// ─── Redis ────────────────────────────────────────────────────────────────────

section('Redis');

if (!process.env.REDIS_URL) {
  warn('REDIS_URL is not set — rate limiting will use in-memory storage (not suitable for multi-instance)');
} else if (process.env.REDIS_URL.includes('localhost')) {
  warn('REDIS_URL points to localhost — is this intentional for production?');
} else {
  ok('REDIS_URL is set');
}

// ─── Stripe ───────────────────────────────────────────────────────────────────

section('Stripe');

if (!process.env.STRIPE_SECRET_KEY) {
  fatal('STRIPE_SECRET_KEY is not set');
} else if (process.env.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
  warn('STRIPE_SECRET_KEY is a TEST key — payments will not be real');
} else if (process.env.STRIPE_SECRET_KEY.startsWith('sk_live_')) {
  ok('STRIPE_SECRET_KEY is a LIVE key');
} else {
  fatal('STRIPE_SECRET_KEY format is unrecognized');
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  fatal('STRIPE_WEBHOOK_SECRET is not set — Stripe webhooks will fail signature verification');
} else {
  ok('STRIPE_WEBHOOK_SECRET is set');
}

const stripePriceIds = ['STRIPE_SOLO_PRICE_ID', 'STRIPE_PRO_PRICE_ID', 'STRIPE_AGENCY_PRICE_ID'];
for (const key of stripePriceIds) {
  if (!process.env[key]) {
    warn(`${key} is not set — that plan tier will not be purchasable`);
  } else {
    ok(`${key} is set`);
  }
}

// ─── Email ────────────────────────────────────────────────────────────────────

section('Email');

const hasResend = !!process.env.RESEND_API_KEY;
const hasSendgrid = !!process.env.SENDGRID_API_KEY;
const hasSmtp = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

if (!hasResend && !hasSendgrid && !hasSmtp) {
  warn('No email provider configured (RESEND_API_KEY, SENDGRID_API_KEY, or SMTP_*) — transactional emails will not send');
} else {
  if (hasResend) ok('Resend email configured');
  if (hasSendgrid) ok('SendGrid email configured');
  if (hasSmtp) ok('SMTP email configured');
}

if (!process.env.EMAIL_FROM && !process.env.RESEND_FROM_EMAIL && !process.env.SENDGRID_FROM_EMAIL) {
  warn('No FROM email address configured — emails may be rejected by providers');
}

// ─── AI Providers ─────────────────────────────────────────────────────────────

section('AI Providers');

if (!process.env.GROQ_API_KEY) {
  fatal('GROQ_API_KEY is not set — AI content generation will fail');
} else {
  ok('GROQ_API_KEY is set');
}

if (!process.env.ANTHROPIC_API_KEY) {
  warn('ANTHROPIC_API_KEY is not set — Claude-based features will fall back to Groq');
} else {
  ok('ANTHROPIC_API_KEY is set');
}

if (!process.env.REPLICATE_API_TOKEN) {
  warn('REPLICATE_API_TOKEN is not set — AI image/video generation will be unavailable');
} else {
  ok('REPLICATE_API_TOKEN is set');
}

// ─── Storage ──────────────────────────────────────────────────────────────────

section('Storage');

const hasS3 = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.S3_BUCKET_NAME);
const hasR2 = !!(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET_NAME);

if (!hasS3 && !hasR2) {
  warn('No media storage configured (S3 or R2) — media uploads and carousel exports will fail');
} else {
  if (hasS3) ok('AWS S3 storage configured');
  if (hasR2) ok('Cloudflare R2 storage configured');
}

// ─── Social Platforms ─────────────────────────────────────────────────────────

section('Social Platform OAuth');

const platforms = [
  { name: 'X (Twitter)', keys: ['X_CLIENT_ID', 'X_CLIENT_SECRET'] },
  { name: 'Instagram/Facebook', keys: ['FACEBOOK_CLIENT_ID', 'FACEBOOK_CLIENT_SECRET'] },
  { name: 'LinkedIn', keys: ['LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET'] },
  { name: 'TikTok', keys: ['TIKTOK_CLIENT_ID', 'TIKTOK_CLIENT_SECRET'] },
  { name: 'YouTube', keys: ['YOUTUBE_CLIENT_ID', 'YOUTUBE_CLIENT_SECRET'] },
];

for (const platform of platforms) {
  const missing = platform.keys.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    warn(`${platform.name}: missing ${missing.join(', ')} — OAuth connect will fail for this platform`);
  } else {
    ok(`${platform.name}: OAuth credentials configured`);
  }
}

// ─── Monitoring ───────────────────────────────────────────────────────────────

section('Monitoring');

if (!process.env.SENTRY_DSN) {
  warn('SENTRY_DSN is not set — errors will not be tracked in Sentry');
} else {
  ok('SENTRY_DSN is set');
}

// ─── URLs ─────────────────────────────────────────────────────────────────────

section('URLs');

if (!process.env.FRONTEND_URL) {
  fatal('FRONTEND_URL is not set — OAuth callbacks and email links will be broken');
} else if (process.env.FRONTEND_URL.includes('localhost')) {
  warn('FRONTEND_URL points to localhost — is this intentional for production?');
} else {
  ok(`FRONTEND_URL: ${process.env.FRONTEND_URL}`);
}

if (!process.env.CORS_ORIGINS) {
  warn('CORS_ORIGINS is not set — CORS will be disabled (all cross-origin requests blocked)');
} else {
  ok(`CORS_ORIGINS: ${process.env.CORS_ORIGINS}`);
}

// ─── Temporal ─────────────────────────────────────────────────────────────────

section('Temporal');

if (!process.env.TEMPORAL_ADDRESS) {
  warn('TEMPORAL_ADDRESS is not set — scheduled publishing workflows will not run');
} else {
  ok(`TEMPORAL_ADDRESS: ${process.env.TEMPORAL_ADDRESS}`);
}

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log('\n' + '─'.repeat(50));

if (fatalCount > 0) {
  console.error(`\n✗ FAILED — ${fatalCount} fatal error(s), ${warnCount} warning(s)\n`);
  console.error('  Fix all FATAL errors before deploying to production.\n');
  process.exit(1);
} else if (warnCount > 0) {
  console.warn(`\n⚠ PASSED WITH WARNINGS — 0 fatal errors, ${warnCount} warning(s)\n`);
  console.warn('  Review warnings before deploying. Some features may be unavailable.\n');
  process.exit(0);
} else {
  console.log('\n✓ ALL CHECKS PASSED — ready for production deployment\n');
  process.exit(0);
}
