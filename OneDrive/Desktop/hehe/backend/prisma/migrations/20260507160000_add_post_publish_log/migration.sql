-- CreatePostPublishLog
CREATE TABLE "PostPublishLog" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "postId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "publishedAt" TIMESTAMP NOT NULL DEFAULT now(),
    "platformPostId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX "PostPublishLog_postId_idx" ON "PostPublishLog"("postId");
CREATE INDEX "PostPublishLog_platform_idx" ON "PostPublishLog"("platform");
CREATE INDEX "PostPublishLog_publishedAt_idx" ON "PostPublishLog"("publishedAt");