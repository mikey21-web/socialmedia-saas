-- Priority Features Migration
-- 1. Auto-onboarding from URL (website scraping)
-- 2. ROI dashboard (UTM tracking, revenue attribution)
-- 3. Competitor watcher (auto counter-posts)
-- 4. Performance-based learning loop
-- 5. Video/Reel pipeline
-- 6. White-label client portal
-- 7. Bulk onboarding

-- ─── Auto-Onboarding: Website scrape results ────────────────────────────────

CREATE TABLE "website_scrape" (
  "id" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "scrapedData" JSONB NOT NULL DEFAULT '{}',
  "brandSuggestions" JSONB NOT NULL DEFAULT '{}',
  "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "website_scrape_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "website_scrape_teamId_idx" ON "website_scrape"("teamId");

-- ─── ROI Dashboard: UTM links and revenue tracking ──────────────────────────

CREATE TABLE "utm_link" (
  "id" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "postId" TEXT,
  "platform" TEXT NOT NULL,
  "destinationUrl" TEXT NOT NULL,
  "utmSource" TEXT NOT NULL,
  "utmMedium" TEXT NOT NULL DEFAULT 'social',
  "utmCampaign" TEXT,
  "utmContent" TEXT,
  "shortUrl" TEXT,
  "clicks" INTEGER NOT NULL DEFAULT 0,
  "conversions" INTEGER NOT NULL DEFAULT 0,
  "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "utm_link_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "utm_link_teamId_idx" ON "utm_link"("teamId");
CREATE INDEX "utm_link_postId_idx" ON "utm_link"("postId");
CREATE INDEX "utm_link_shortUrl_idx" ON "utm_link"("shortUrl");

CREATE TABLE "conversion_event" (
  "id" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "utmLinkId" TEXT,
  "postId" TEXT,
  "eventType" TEXT NOT NULL,
  "value" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "sourceIp" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "conversion_event_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "conversion_event_teamId_idx" ON "conversion_event"("teamId");
CREATE INDEX "conversion_event_utmLinkId_idx" ON "conversion_event"("utmLinkId");
CREATE INDEX "conversion_event_postId_idx" ON "conversion_event"("postId");
CREATE INDEX "conversion_event_createdAt_idx" ON "conversion_event"("createdAt");

-- ─── Competitor Watcher: Auto counter-posts ─────────────────────────────────

CREATE TABLE "counter_post" (
  "id" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "competitorPostId" TEXT NOT NULL,
  "generatedContent" TEXT NOT NULL,
  "platform" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "postId" TEXT,
  "reasoning" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "counter_post_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "counter_post_teamId_idx" ON "counter_post"("teamId");
CREATE INDEX "counter_post_competitorPostId_idx" ON "counter_post"("competitorPostId");
CREATE INDEX "counter_post_status_idx" ON "counter_post"("status");

-- ─── Performance Learning Loop ──────────────────────────────────────────────

CREATE TABLE "performance_insight" (
  "id" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "insightType" TEXT NOT NULL,
  "pattern" TEXT NOT NULL,
  "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "sampleSize" INTEGER NOT NULL DEFAULT 0,
  "multiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "appliedCount" INTEGER NOT NULL DEFAULT 0,
  "lastAppliedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "performance_insight_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "performance_insight_teamId_idx" ON "performance_insight"("teamId");
CREATE INDEX "performance_insight_insightType_idx" ON "performance_insight"("insightType");
CREATE UNIQUE INDEX "performance_insight_teamId_insightType_pattern_key" ON "performance_insight"("teamId", "insightType", "pattern");

-- ─── Video/Reel Pipeline ────────────────────────────────────────────────────

CREATE TABLE "video_project" (
  "id" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "sourceVideoUrl" TEXT NOT NULL,
  "sourceVideoDuration" DOUBLE PRECISION,
  "status" TEXT NOT NULL DEFAULT 'uploaded',
  "outputFormats" JSONB NOT NULL DEFAULT '[]',
  "clips" JSONB NOT NULL DEFAULT '[]',
  "captions" JSONB NOT NULL DEFAULT '[]',
  "suggestedHooks" JSONB NOT NULL DEFAULT '[]',
  "musicTrackId" TEXT,
  "thumbnailUrl" TEXT,
  "postId" TEXT,
  "processingError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "video_project_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "video_project_teamId_idx" ON "video_project"("teamId");
CREATE INDEX "video_project_status_idx" ON "video_project"("status");

CREATE TABLE "music_track" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "artist" TEXT,
  "genre" TEXT NOT NULL,
  "mood" TEXT NOT NULL,
  "duration" DOUBLE PRECISION NOT NULL,
  "url" TEXT NOT NULL,
  "licenseType" TEXT NOT NULL DEFAULT 'royalty_free',
  "bpm" INTEGER,
  "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "music_track_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "music_track_genre_mood_idx" ON "music_track"("genre", "mood");

-- ─── White-Label Client Portal ──────────────────────────────────────────────

CREATE TABLE "client_portal" (
  "id" TEXT NOT NULL,
  "agencyTeamId" TEXT NOT NULL,
  "clientTeamId" TEXT NOT NULL,
  "clientName" TEXT NOT NULL,
  "clientEmail" TEXT,
  "clientLogo" TEXT,
  "customDomain" TEXT,
  "brandColor" TEXT NOT NULL DEFAULT '#2563eb',
  "accessToken" TEXT NOT NULL,
  "permissions" JSONB NOT NULL DEFAULT '{"viewPosts": true, "approvePosts": true, "viewAnalytics": true}',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "lastAccessedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "client_portal_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "client_portal_accessToken_key" ON "client_portal"("accessToken");
CREATE UNIQUE INDEX "client_portal_agencyTeamId_clientTeamId_key" ON "client_portal"("agencyTeamId", "clientTeamId");
CREATE INDEX "client_portal_agencyTeamId_idx" ON "client_portal"("agencyTeamId");
CREATE INDEX "client_portal_clientTeamId_idx" ON "client_portal"("clientTeamId");
CREATE INDEX "client_portal_accessToken_idx" ON "client_portal"("accessToken");

-- ─── Bulk Onboarding ────────────────────────────────────────────────────────

CREATE TABLE "bulk_onboard_job" (
  "id" TEXT NOT NULL,
  "agencyTeamId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "totalClients" INTEGER NOT NULL DEFAULT 0,
  "processedClients" INTEGER NOT NULL DEFAULT 0,
  "failedClients" INTEGER NOT NULL DEFAULT 0,
  "csvData" JSONB NOT NULL DEFAULT '[]',
  "results" JSONB NOT NULL DEFAULT '[]',
  "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "bulk_onboard_job_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bulk_onboard_job_agencyTeamId_idx" ON "bulk_onboard_job"("agencyTeamId");
CREATE INDEX "bulk_onboard_job_status_idx" ON "bulk_onboard_job"("status");

-- ─── Add UTM fields to Post ─────────────────────────────────────────────────

ALTER TABLE "Post" ADD COLUMN "utmEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Post" ADD COLUMN "utmLinkId" TEXT;

-- ─── Add learning loop fields to Post ───────────────────────────────────────

ALTER TABLE "Post" ADD COLUMN "hookType" TEXT;
ALTER TABLE "Post" ADD COLUMN "contentFormat" TEXT;
ALTER TABLE "Post" ADD COLUMN "appliedInsights" JSONB DEFAULT '[]';
