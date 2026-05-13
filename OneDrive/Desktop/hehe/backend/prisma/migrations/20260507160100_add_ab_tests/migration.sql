-- Migration: Add A/B Test Support
-- Run with: npx prisma migrate dev --name add_ab_tests

-- Add ab_test_id to posts table
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "abTestId" UUID;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "abTestVariant" VARCHAR(10);

-- Create ab_tests table
CREATE TABLE IF NOT EXISTS "AbTest" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "teamId" UUID NOT NULL,
  "caption" TEXT NOT NULL,
  "platforms" JSON NOT NULL DEFAULT '[]',
  "mediaUrls" JSON NOT NULL DEFAULT '[]',
  "variantATime" TIMESTAMP NOT NULL,
  "variantBTime" TIMESTAMP NOT NULL,
  "variantAEngagement" INT DEFAULT 0,
  "variantBEngagement" INT DEFAULT 0,
  "variantAPostId" UUID,
  "variantBPostId" UUID,
  "winner" VARCHAR(10),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Add foreign key constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Post_abTestId_fkey'
  ) THEN
    ALTER TABLE "Post" ADD CONSTRAINT "Post_abTestId_fkey" FOREIGN KEY ("abTestId") REFERENCES "AbTest"("id") ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AbTest_teamId_fkey'
  ) THEN
    ALTER TABLE "AbTest" ADD CONSTRAINT "AbTest_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE;
  END IF;
END $$;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS "Post_abTestId_idx" ON "Post"("abTestId");
