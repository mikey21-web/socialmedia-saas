-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "agencyTier" TEXT NOT NULL DEFAULT 'solo',
ADD COLUMN     "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verticalProfileId" TEXT;

-- CreateTable
CREATE TABLE "BrandVoice" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "toneAttributes" JSONB NOT NULL,
    "vocabulary" TEXT[],
    "avoidPhrases" TEXT[],
    "emojiUsage" TEXT NOT NULL,
    "sentenceStyle" TEXT NOT NULL,
    "trainingPosts" JSONB NOT NULL,
    "embeddingVector" DOUBLE PRECISION[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandVoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentStrategy" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "contentMix" JSONB NOT NULL,
    "pillars" JSONB NOT NULL,
    "goals" JSONB NOT NULL,
    "platforms" TEXT[],
    "postingCadence" JSONB NOT NULL,
    "campaignPlan" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentStrategy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerticalProfile" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "contentPriorities" JSONB NOT NULL,
    "promptOverrides" JSONB NOT NULL,
    "templateLibrary" JSONB NOT NULL,
    "recommendedHashtags" TEXT[],
    "optimalPostingTimes" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerticalProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrendSignal" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "signalType" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "popularity" INTEGER NOT NULL,
    "velocity" DOUBLE PRECISION NOT NULL,
    "category" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrendSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EngagementAction" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "postId" TEXT,
    "commentId" TEXT,
    "dmThreadId" TEXT,
    "actionType" TEXT NOT NULL,
    "triggerContent" TEXT NOT NULL,
    "agentResponse" TEXT NOT NULL,
    "sentiment" TEXT NOT NULL,
    "intent" TEXT,
    "status" TEXT NOT NULL,
    "brandVoiceId" TEXT,
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EngagementAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentRole" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "llmModel" TEXT NOT NULL,
    "toolset" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentRunLog" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "agentRole" TEXT NOT NULL,
    "triggerType" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "output" JSONB NOT NULL,
    "tokensUsed" INTEGER NOT NULL,
    "costInr" DOUBLE PRECISION NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentRunLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandVoiceProfile" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "primaryColor" TEXT NOT NULL,
    "brandLight" TEXT NOT NULL,
    "brandDark" TEXT NOT NULL,
    "lightBg" TEXT NOT NULL,
    "lightBorder" TEXT NOT NULL,
    "darkBg" TEXT NOT NULL,
    "fontPrimary" TEXT NOT NULL,
    "fontSecondary" TEXT,
    "toneDimensions" JSONB NOT NULL,
    "vocabularyBank" JSONB NOT NULL,
    "emojiPatterns" JSONB NOT NULL,
    "sentencePatterns" JSONB NOT NULL,
    "hashtagStyle" JSONB NOT NULL,
    "embeddingVector" DOUBLE PRECISION[],
    "sampleCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandVoiceProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Carousel" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "brandVoiceProfileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "slideCount" INTEGER NOT NULL,
    "slides" JSONB NOT NULL,
    "htmlSource" TEXT NOT NULL,
    "pngUrls" TEXT[],
    "pdfUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "postId" TEXT,
    "generationCostUsd" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Carousel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitorTrack" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "competitorName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastScannedAt" TIMESTAMP(3),
    "scanFrequency" TEXT NOT NULL DEFAULT 'daily',
    "metricsSnapshot" JSONB NOT NULL,

    CONSTRAINT "CompetitorTrack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitorPost" (
    "id" TEXT NOT NULL,
    "competitorId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    "mediaUrls" TEXT[],
    "likes" INTEGER NOT NULL,
    "comments" INTEGER NOT NULL,
    "shares" INTEGER NOT NULL,
    "engagementRate" DOUBLE PRECISION NOT NULL,
    "hashtags" TEXT[],
    "postType" TEXT NOT NULL,
    "postedAt" TIMESTAMP(3) NOT NULL,
    "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompetitorPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostMetrics" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "reach" INTEGER NOT NULL DEFAULT 0,
    "engagement" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "saves" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "profileVisits" INTEGER NOT NULL DEFAULT 0,
    "follows" INTEGER NOT NULL DEFAULT 0,
    "revenue" DOUBLE PRECISION,
    "bookings" INTEGER,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "data" JSONB NOT NULL,
    "insights" JSONB NOT NULL,
    "recommendations" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BrandVoice_teamId_idx" ON "BrandVoice"("teamId");

-- CreateIndex
CREATE INDEX "ContentStrategy_teamId_idx" ON "ContentStrategy"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "VerticalProfile_slug_key" ON "VerticalProfile"("slug");

-- CreateIndex
CREATE INDEX "TrendSignal_platform_signalType_idx" ON "TrendSignal"("platform", "signalType");

-- CreateIndex
CREATE INDEX "TrendSignal_expiresAt_idx" ON "TrendSignal"("expiresAt");

-- CreateIndex
CREATE INDEX "EngagementAction_teamId_idx" ON "EngagementAction"("teamId");

-- CreateIndex
CREATE INDEX "EngagementAction_status_idx" ON "EngagementAction"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AgentRole_slug_key" ON "AgentRole"("slug");

-- CreateIndex
CREATE INDEX "AgentRunLog_teamId_agentRole_idx" ON "AgentRunLog"("teamId", "agentRole");

-- CreateIndex
CREATE INDEX "BrandVoiceProfile_teamId_idx" ON "BrandVoiceProfile"("teamId");

-- CreateIndex
CREATE INDEX "BrandVoiceProfile_teamId_isDefault_idx" ON "BrandVoiceProfile"("teamId", "isDefault");

-- CreateIndex
CREATE INDEX "Carousel_teamId_idx" ON "Carousel"("teamId");

-- CreateIndex
CREATE INDEX "Carousel_teamId_status_idx" ON "Carousel"("teamId", "status");

-- CreateIndex
CREATE INDEX "CompetitorTrack_teamId_isActive_idx" ON "CompetitorTrack"("teamId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "CompetitorTrack_teamId_platform_handle_key" ON "CompetitorTrack"("teamId", "platform", "handle");

-- CreateIndex
CREATE INDEX "CompetitorPost_competitorId_postedAt_idx" ON "CompetitorPost"("competitorId", "postedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CompetitorPost_competitorId_externalId_key" ON "CompetitorPost"("competitorId", "externalId");

-- CreateIndex
CREATE INDEX "PostMetrics_postId_capturedAt_idx" ON "PostMetrics"("postId", "capturedAt");

-- CreateIndex
CREATE INDEX "Report_teamId_type_periodStart_idx" ON "Report"("teamId", "type", "periodStart");

-- AddForeignKey
ALTER TABLE "BrandVoice" ADD CONSTRAINT "BrandVoice_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentStrategy" ADD CONSTRAINT "ContentStrategy_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EngagementAction" ADD CONSTRAINT "EngagementAction_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentRunLog" ADD CONSTRAINT "AgentRunLog_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandVoiceProfile" ADD CONSTRAINT "BrandVoiceProfile_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Carousel" ADD CONSTRAINT "Carousel_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Carousel" ADD CONSTRAINT "Carousel_brandVoiceProfileId_fkey" FOREIGN KEY ("brandVoiceProfileId") REFERENCES "BrandVoiceProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitorTrack" ADD CONSTRAINT "CompetitorTrack_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitorPost" ADD CONSTRAINT "CompetitorPost_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "CompetitorTrack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
