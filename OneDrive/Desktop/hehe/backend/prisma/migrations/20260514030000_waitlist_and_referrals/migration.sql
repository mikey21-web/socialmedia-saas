-- Waitlist entries for pre-launch email capture
CREATE TABLE IF NOT EXISTS "waitlist_entries" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "email" TEXT NOT NULL UNIQUE,
  "name" TEXT,
  "referred_by" TEXT,
  "position" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "waitlist_entries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "waitlist_entries_email_idx" ON "waitlist_entries"("email");
CREATE INDEX IF NOT EXISTS "waitlist_entries_position_idx" ON "waitlist_entries"("position");

-- Referral program
CREATE TABLE IF NOT EXISTS "referral" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "referrer_team_id" TEXT NOT NULL,
  "referred_email" TEXT NOT NULL,
  "referred_team_id" TEXT,
  "code" TEXT NOT NULL UNIQUE,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "reward_type" TEXT NOT NULL DEFAULT 'credit',
  "reward_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "converted_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "referral_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "referral_referrer_team_id_idx" ON "referral"("referrer_team_id");
CREATE INDEX IF NOT EXISTS "referral_code_idx" ON "referral"("code");
CREATE INDEX IF NOT EXISTS "referral_status_idx" ON "referral"("status");

-- NPS / Feedback collection
CREATE TABLE IF NOT EXISTS "feedback" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "team_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'nps',
  "score" INTEGER,
  "comment" TEXT,
  "page" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "feedback_team_id_idx" ON "feedback"("team_id");
CREATE INDEX IF NOT EXISTS "feedback_type_idx" ON "feedback"("type");
CREATE INDEX IF NOT EXISTS "feedback_created_at_idx" ON "feedback"("created_at");
