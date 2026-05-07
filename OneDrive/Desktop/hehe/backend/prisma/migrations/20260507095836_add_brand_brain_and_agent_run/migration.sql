-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "agentRunId" TEXT,
ADD COLUMN     "generatedBy" TEXT,
ADD COLUMN     "generationContext" JSONB,
ADD COLUMN     "rejectionReason" TEXT;

-- CreateTable
CREATE TABLE "BrandProfile" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "brandName" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "voiceTone" TEXT NOT NULL,
    "voiceTraits" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "formalityLevel" INTEGER NOT NULL DEFAULT 5,
    "audienceAge" TEXT NOT NULL,
    "audienceGender" TEXT NOT NULL,
    "audienceLocation" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "audienceInterests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "audiencePainPoints" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "primaryGoal" TEXT NOT NULL,
    "secondaryGoals" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "platforms" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "postsPerWeek" JSONB NOT NULL DEFAULT '{}',
    "contentMix" JSONB NOT NULL DEFAULT '{}',
    "alwaysWords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "neverWords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "emojiUsage" TEXT NOT NULL DEFAULT 'moderate',
    "hashtagStyle" TEXT NOT NULL DEFAULT 'moderate',
    "autonomousMode" BOOLEAN NOT NULL DEFAULT false,
    "approvalRequired" BOOLEAN NOT NULL DEFAULT true,
    "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentPillar" (
    "id" TEXT NOT NULL,
    "brandProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 20,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentPillar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Competitor" (
    "id" TEXT NOT NULL,
    "brandProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "handles" JSONB NOT NULL DEFAULT '{}',
    "url" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastScrapedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Competitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitorSnapshot" (
    "id" TEXT NOT NULL,
    "competitorId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "postsCount" INTEGER NOT NULL,
    "followersCount" INTEGER,
    "topPosts" JSONB NOT NULL DEFAULT '[]',
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompetitorSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoiceExample" (
    "id" TEXT NOT NULL,
    "brandProfileId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "platform" TEXT,
    "performanceScore" INTEGER,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoiceExample_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentRun" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "agentType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "input" JSONB NOT NULL,
    "output" JSONB,
    "error" TEXT,
    "steps" JSONB NOT NULL DEFAULT '[]',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "AgentRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BrandProfile_teamId_key" ON "BrandProfile"("teamId");

-- CreateIndex
CREATE INDEX "BrandProfile_teamId_idx" ON "BrandProfile"("teamId");

-- CreateIndex
CREATE INDEX "ContentPillar_brandProfileId_idx" ON "ContentPillar"("brandProfileId");

-- CreateIndex
CREATE INDEX "Competitor_brandProfileId_idx" ON "Competitor"("brandProfileId");

-- CreateIndex
CREATE INDEX "CompetitorSnapshot_competitorId_idx" ON "CompetitorSnapshot"("competitorId");

-- CreateIndex
CREATE INDEX "CompetitorSnapshot_capturedAt_idx" ON "CompetitorSnapshot"("capturedAt");

-- CreateIndex
CREATE INDEX "VoiceExample_brandProfileId_idx" ON "VoiceExample"("brandProfileId");

-- CreateIndex
CREATE INDEX "AgentRun_teamId_idx" ON "AgentRun"("teamId");

-- CreateIndex
CREATE INDEX "AgentRun_agentType_idx" ON "AgentRun"("agentType");

-- CreateIndex
CREATE INDEX "AgentRun_status_idx" ON "AgentRun"("status");

-- AddForeignKey
ALTER TABLE "BrandProfile" ADD CONSTRAINT "BrandProfile_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentPillar" ADD CONSTRAINT "ContentPillar_brandProfileId_fkey" FOREIGN KEY ("brandProfileId") REFERENCES "BrandProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Competitor" ADD CONSTRAINT "Competitor_brandProfileId_fkey" FOREIGN KEY ("brandProfileId") REFERENCES "BrandProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitorSnapshot" ADD CONSTRAINT "CompetitorSnapshot_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "Competitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoiceExample" ADD CONSTRAINT "VoiceExample_brandProfileId_fkey" FOREIGN KEY ("brandProfileId") REFERENCES "BrandProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentRun" ADD CONSTRAINT "AgentRun_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
