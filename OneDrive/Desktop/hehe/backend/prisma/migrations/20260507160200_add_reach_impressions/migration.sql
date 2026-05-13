-- Migration: Add Reach and Impressions to Posts
-- Run with: npx prisma migrate dev --name add_reach_impressions

-- Add reach and impressions fields to posts table
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "reach" INT DEFAULT 0;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "impressions" INT DEFAULT 0;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "metricsUpdatedAt" TIMESTAMP;

-- Create platform_metrics table for per-platform metrics
CREATE TABLE IF NOT EXISTS "PlatformMetrics" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "postId" UUID NOT NULL,
  "platform" VARCHAR(50) NOT NULL,
  "reach" INT DEFAULT 0,
  "impressions" INT DEFAULT 0,
  "likes" INT DEFAULT 0,
  "comments" INT DEFAULT 0,
  "shares" INT DEFAULT 0,
  "collectedAt" TIMESTAMP DEFAULT NOW(),
  CONSTRAINT "PlatformMetrics_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "PlatformMetrics_postId_idx" ON "PlatformMetrics"("postId");
CREATE INDEX IF NOT EXISTS "PlatformMetrics_collectedAt_idx" ON "PlatformMetrics"("collectedAt");
