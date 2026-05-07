-- CreateTable: PostPublishLog (with attemptNumber)
CREATE TABLE IF NOT EXISTS "PostPublishLog" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "platformPostId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostPublishLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PostPublishLog_postId_idx" ON "PostPublishLog"("postId");
CREATE INDEX IF NOT EXISTS "PostPublishLog_platform_idx" ON "PostPublishLog"("platform");
CREATE INDEX IF NOT EXISTS "PostPublishLog_publishedAt_idx" ON "PostPublishLog"("publishedAt");
CREATE INDEX IF NOT EXISTS "PostPublishLog_status_idx" ON "PostPublishLog"("status");

ALTER TABLE "PostPublishLog" ADD COLUMN IF NOT EXISTS "attemptNumber" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "PostPublishLog" ADD CONSTRAINT "PostPublishLog_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
