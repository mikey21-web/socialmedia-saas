import * as Joi from 'joi';

/**
 * Joi schema for required environment variables.
 * In production (NODE_ENV=production) all vars are required.
 * In development/test some may be optional to allow local startup without all secrets.
 */
const isProd = process.env.NODE_ENV === 'production';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),

  // Database
  DATABASE_URL: isProd
    ? Joi.string().uri().required()
    : Joi.string().uri().optional(),

  // Auth
  JWT_SECRET: isProd
    ? Joi.string().min(32).required()
    : Joi.string().optional(),
  REFRESH_TOKEN_SECRET: Joi.string().optional(),
  JWT_EXPIRY: Joi.string().default('7d'),
  REFRESH_TOKEN_EXPIRY: Joi.string().default('30d'),

  // Redis
  REDIS_URL: isProd
    ? Joi.string().required()
    : Joi.string().optional(),

  // Stripe
  STRIPE_SECRET_KEY: isProd
    ? Joi.string().required()
    : Joi.string().optional(),
  STRIPE_WEBHOOK_SECRET: isProd
    ? Joi.string().required()
    : Joi.string().optional(),
  STRIPE_SOLO_PRICE_ID: Joi.string().optional(),
  STRIPE_PRO_PRICE_ID: Joi.string().optional(),
  STRIPE_AGENCY_PRICE_ID: Joi.string().optional(),
  STRIPE_ENTERPRISE_PRICE_ID: Joi.string().optional(),

  // Replicate / AI
  REPLICATE_API_TOKEN: isProd
    ? Joi.string().required()
    : Joi.string().optional(),

  // Sentry
  SENTRY_DSN: isProd
    ? Joi.string().uri().required()
    : Joi.string().uri().optional(),

  // Encryption
  ENCRYPTION_KEY: Joi.string().optional(),
  TOKEN_ENCRYPTION_KEY: Joi.string().optional(),

  // App
  PORT: Joi.number().integer().min(1).max(65535).default(3000),
  APP_URL: Joi.string().uri().optional(),
  FRONTEND_URL: Joi.string().uri().optional(),
  CORS_ORIGINS: Joi.string().optional(),

  // Optional platform OAuth keys (not required at startup)
  GOOGLE_CLIENT_ID: Joi.string().optional(),
  GOOGLE_CLIENT_SECRET: Joi.string().optional(),
  X_CLIENT_ID: Joi.string().optional(),
  X_CLIENT_SECRET: Joi.string().optional(),
  INSTAGRAM_CLIENT_ID: Joi.string().optional(),
  INSTAGRAM_CLIENT_SECRET: Joi.string().optional(),
  LINKEDIN_CLIENT_ID: Joi.string().optional(),
  LINKEDIN_CLIENT_SECRET: Joi.string().optional(),
  FACEBOOK_CLIENT_ID: Joi.string().optional(),
  FACEBOOK_CLIENT_SECRET: Joi.string().optional(),
  TIKTOK_CLIENT_ID: Joi.string().optional(),
  TIKTOK_CLIENT_SECRET: Joi.string().optional(),
  YOUTUBE_CLIENT_ID: Joi.string().optional(),
  YOUTUBE_CLIENT_SECRET: Joi.string().optional(),

  // Email
  ANTHROPIC_API_KEY: Joi.string().optional(),
  GROQ_API_KEY: Joi.string().optional(),
  SENDGRID_API_KEY: Joi.string().optional(),
  RESEND_API_KEY: Joi.string().optional(),
  EMAIL_FROM: Joi.string().email().optional(),
  SMTP_HOST: Joi.string().optional(),
  SMTP_PORT: Joi.number().integer().optional(),
  SMTP_USER: Joi.string().optional(),
  SMTP_PASS: Joi.string().optional(),

  // AWS / S3
  AWS_REGION: Joi.string().optional(),
  AWS_ACCESS_KEY_ID: Joi.string().optional(),
  AWS_SECRET_ACCESS_KEY: Joi.string().optional(),
  AWS_S3_BUCKET: Joi.string().optional(),
  S3_BUCKET_NAME: Joi.string().optional(),
  AWS_S3_BASE_URL: Joi.string().uri().optional(),

  // Temporal
  TEMPORAL_ADDRESS: Joi.string().optional(),
  TEMPORAL_NAMESPACE: Joi.string().optional(),

  // Agency MVP - LLMs
  VOYAGE_API_KEY: Joi.string().optional(),

  // Agency MVP - Browser automation
  PLAYWRIGHT_BROWSERS_PATH: Joi.string().optional(),

  // Agency MVP - Trend sources
  X_BEARER_TOKEN: Joi.string().optional(),
  GOOGLE_TRENDS_PROXY_URL: Joi.string().optional(),

  // Agency MVP - R2 Storage
  R2_ACCOUNT_ID: Joi.string().optional(),
  R2_ACCESS_KEY_ID: Joi.string().optional(),
  R2_SECRET_ACCESS_KEY: Joi.string().optional(),
  R2_BUCKET_NAME: Joi.string().optional(),
  R2_PUBLIC_URL: Joi.string().optional(),
  R2_ENDPOINT: Joi.string().optional(),
}).options({ allowUnknown: true });
