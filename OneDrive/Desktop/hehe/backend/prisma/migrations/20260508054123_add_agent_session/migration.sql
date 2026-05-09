/*
  Warnings:

  - You are about to drop the column `adminId` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `targetId` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `targetType` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `height` on the `MediaAsset` table. All the data in the column will be lost.
  - You are about to drop the column `source` on the `MediaAsset` table. All the data in the column will be lost.
  - You are about to drop the column `width` on the `MediaAsset` table. All the data in the column will be lost.
  - You are about to drop the column `lastFetchAt` on the `RssSource` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `RssSource` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `TrendItem` table. All the data in the column will be lost.
  - You are about to drop the column `detectedAt` on the `TrendItem` table. All the data in the column will be lost.
  - Added the required column `teamId` to the `AuditLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `AuditLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `ThirdPartyIntegration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `keyword` to the `TrendItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `platform` to the `TrendItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_adminId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "AuditLog_action_idx";

-- DropIndex
DROP INDEX IF EXISTS "AuditLog_adminId_idx";

-- DropIndex
DROP INDEX IF EXISTS "AuditLog_targetId_idx";

-- DropIndex
DROP INDEX IF EXISTS "Comment_teamId_idx";

-- DropIndex
DROP INDEX IF EXISTS "MediaAsset_teamId_source_idx";

-- DropIndex
DROP INDEX IF EXISTS "TrendItem_detectedAt_idx";

-- AlterTable
ALTER TABLE "AuditLog" DROP COLUMN "adminId",
DROP COLUMN "targetId",
DROP COLUMN "targetType",
ADD COLUMN     "entity" TEXT,
ADD COLUMN     "entityId" TEXT,
ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "teamId" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "mentions" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "parentCommentId" TEXT;

-- AlterTable
ALTER TABLE "MediaAsset" DROP COLUMN "height",
DROP COLUMN "source",
DROP COLUMN "width",
ADD COLUMN     "metadata" JSONB,
ALTER COLUMN "mimeType" DROP NOT NULL,
ALTER COLUMN "size" DROP NOT NULL,
ALTER COLUMN "size" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "abTestId" TEXT,
ADD COLUMN     "abTestVariant" TEXT,
ADD COLUMN     "campaignId" TEXT,
ADD COLUMN     "impressions" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "metricsUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "reach" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "RssSource" DROP COLUMN "lastFetchAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "lastFetch" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ThirdPartyIntegration" ADD COLUMN     "config" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "type" TEXT NOT NULL,
ALTER COLUMN "identifier" DROP NOT NULL,
ALTER COLUMN "apiKey" DROP NOT NULL;

-- AlterTable
ALTER TABLE "TrendItem" DROP COLUMN "category",
DROP COLUMN "detectedAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "keyword" TEXT NOT NULL,
ADD COLUMN     "lastChecked" TIMESTAMP(3),
ADD COLUMN     "platform" TEXT NOT NULL,
ADD COLUMN     "sentiment" TEXT,
ADD COLUMN     "volume" INTEGER,
ALTER COLUMN "title" DROP NOT NULL,
ALTER COLUMN "summary" DROP NOT NULL,
ALTER COLUMN "source" DROP NOT NULL,
ALTER COLUMN "relevanceScore" DROP NOT NULL,
ALTER COLUMN "relevanceScore" DROP DEFAULT,
ALTER COLUMN "status" DROP NOT NULL,
ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "expiresAt" DROP NOT NULL;

-- CreateTable
CREATE TABLE "FollowerSnapshot" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FollowerSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbTest" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    "platforms" JSONB NOT NULL DEFAULT '[]',
    "mediaUrls" JSONB NOT NULL DEFAULT '[]',
    "variantATime" TIMESTAMP(3) NOT NULL,
    "variantBTime" TIMESTAMP(3) NOT NULL,
    "variantAEngagement" INTEGER NOT NULL DEFAULT 0,
    "variantBEngagement" INTEGER NOT NULL DEFAULT 0,
    "variantAPostId" TEXT,
    "variantBPostId" TEXT,
    "winner" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AbTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformMetrics" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "reach" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AudienceDemographic" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "dimension" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AudienceDemographic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "targetMetric" TEXT NOT NULL,
    "targetValue" DOUBLE PRECISION NOT NULL,
    "currentValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "platform" TEXT,
    "deadline" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "contentPlan" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentSession" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "toolCalls" JSONB,
    "agentName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FollowerSnapshot_teamId_idx" ON "FollowerSnapshot"("teamId");

-- CreateIndex
CREATE INDEX "FollowerSnapshot_teamId_platform_idx" ON "FollowerSnapshot"("teamId", "platform");

-- CreateIndex
CREATE INDEX "FollowerSnapshot_recordedAt_idx" ON "FollowerSnapshot"("recordedAt");

-- CreateIndex
CREATE INDEX "Campaign_teamId_idx" ON "Campaign"("teamId");

-- CreateIndex
CREATE INDEX "AbTest_teamId_idx" ON "AbTest"("teamId");

-- CreateIndex
CREATE INDEX "PlatformMetrics_postId_idx" ON "PlatformMetrics"("postId");

-- CreateIndex
CREATE INDEX "PlatformMetrics_collectedAt_idx" ON "PlatformMetrics"("collectedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformMetrics_postId_platform_key" ON "PlatformMetrics"("postId", "platform");

-- CreateIndex
CREATE INDEX "AudienceDemographic_teamId_idx" ON "AudienceDemographic"("teamId");

-- CreateIndex
CREATE INDEX "AudienceDemographic_teamId_platform_idx" ON "AudienceDemographic"("teamId", "platform");

-- CreateIndex
CREATE INDEX "AudienceDemographic_recordedAt_idx" ON "AudienceDemographic"("recordedAt");

-- CreateIndex
CREATE INDEX "Notification_teamId_idx" ON "Notification"("teamId");

-- CreateIndex
CREATE INDEX "Notification_read_idx" ON "Notification"("read");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Goal_teamId_idx" ON "Goal"("teamId");

-- CreateIndex
CREATE INDEX "Goal_status_idx" ON "Goal"("status");

-- CreateIndex
CREATE INDEX "AgentSession_teamId_idx" ON "AgentSession"("teamId");

-- CreateIndex
CREATE INDEX "AgentMessage_sessionId_idx" ON "AgentMessage"("sessionId");

-- CreateIndex
CREATE INDEX "AuditLog_teamId_idx" ON "AuditLog"("teamId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "Comment_parentCommentId_idx" ON "Comment"("parentCommentId");

-- CreateIndex
CREATE INDEX "Post_abTestId_idx" ON "Post"("abTestId");

-- CreateIndex
CREATE INDEX "Post_campaignId_idx" ON "Post"("campaignId");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_abTestId_fkey" FOREIGN KEY ("abTestId") REFERENCES "AbTest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowerSnapshot" ADD CONSTRAINT "FollowerSnapshot_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentCommentId_fkey" FOREIGN KEY ("parentCommentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbTest" ADD CONSTRAINT "AbTest_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AudienceDemographic" ADD CONSTRAINT "AudienceDemographic_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentSession" ADD CONSTRAINT "AgentSession_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentMessage" ADD CONSTRAINT "AgentMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AgentSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
