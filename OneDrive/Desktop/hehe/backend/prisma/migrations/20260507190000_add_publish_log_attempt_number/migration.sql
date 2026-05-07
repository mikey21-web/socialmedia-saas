ALTER TABLE "PostPublishLog"
ADD COLUMN IF NOT EXISTS "attemptNumber" INTEGER NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS "PostPublishLog_status_idx" ON "PostPublishLog"("status");
