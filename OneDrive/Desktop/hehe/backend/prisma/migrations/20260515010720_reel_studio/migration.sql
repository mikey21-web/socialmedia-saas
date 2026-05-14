-- ─── Reel Studio: Templates, Scripts, Calendar ───────────────────────────────

CREATE TABLE "reel_template" (
  "id"             TEXT NOT NULL,
  "slug"           TEXT NOT NULL,
  "title"          TEXT NOT NULL,
  "category"       TEXT NOT NULL,            -- product_showcase | bts | educational | before_after | founder_story | testimonial | trend_riding | day_in_life | promo | comparison | tutorial | story
  "vertical"       TEXT NOT NULL,            -- generic | salon | restaurant | real_estate | fitness | d2c | clinic | coach | retail | education | finance | tech | beauty | hospitality
  "goal"           TEXT NOT NULL,            -- awareness | conversion | engagement | trust | educate | entertain
  "difficulty"     TEXT NOT NULL DEFAULT 'easy', -- easy | medium | advanced
  "estDurationSec" INTEGER NOT NULL DEFAULT 30,
  "shotCount"      INTEGER NOT NULL DEFAULT 3,
  "shotList"       JSONB NOT NULL DEFAULT '[]', -- [{ index, durationSec, action, cameraAngle, lightingTip, propsNeeded, textOverlay }]
  "structure"      JSONB NOT NULL DEFAULT '{}', -- { hookSec, patternInterruptSec, ctaSec, beats: [...] }
  "captionTemplate" TEXT NOT NULL,
  "hashtagSets"    JSONB NOT NULL DEFAULT '[]', -- [{ niche: 'salon', tags: ['#salonindia', ...] }]
  "audioMood"      TEXT[] DEFAULT '{}',     -- ['upbeat', 'aesthetic', 'trending']
  "exampleUrl"     TEXT,
  "thumbnailUrl"   TEXT,
  "language"       TEXT NOT NULL DEFAULT 'en',
  "engagementTier" TEXT NOT NULL DEFAULT 'high', -- high | medium | low (based on format research)
  "tags"           TEXT[] DEFAULT '{}',
  "isActive"       BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,

  CONSTRAINT "reel_template_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "reel_template_slug_key" ON "reel_template"("slug");
CREATE INDEX "reel_template_vertical_idx" ON "reel_template"("vertical");
CREATE INDEX "reel_template_category_idx" ON "reel_template"("category");
CREATE INDEX "reel_template_goal_idx" ON "reel_template"("goal");
CREATE INDEX "reel_template_isActive_idx" ON "reel_template"("isActive");

-- ─── Reel Scripts: Generated scripts from templates ──────────────────────────

CREATE TABLE "reel_script" (
  "id"             TEXT NOT NULL,
  "teamId"         TEXT NOT NULL,
  "templateId"     TEXT,                     -- null if custom/freeform
  "title"          TEXT NOT NULL,
  "topic"          TEXT NOT NULL,
  "vertical"       TEXT NOT NULL,
  "goal"           TEXT NOT NULL,
  "language"       TEXT NOT NULL DEFAULT 'en',
  "shots"          JSONB NOT NULL DEFAULT '[]', -- [{ index, durationSec, action, voiceover, textOverlay, cameraAngle, lightingTip }]
  "hook"           TEXT NOT NULL,
  "patternInterrupt" TEXT,
  "cta"            TEXT NOT NULL,
  "caption"        TEXT NOT NULL,
  "hashtags"       TEXT[] DEFAULT '{}',
  "audioSuggestion" JSONB,                   -- { mood, bpm, tracks: [{ id, title }] }
  "trendSignalId"  TEXT,                     -- if riding a trend
  "totalDuration"  INTEGER NOT NULL DEFAULT 30,
  "videoProjectId" TEXT,                     -- once user records & uploads
  "status"         TEXT NOT NULL DEFAULT 'draft', -- draft | filming | ready | published
  "filmingTips"    JSONB NOT NULL DEFAULT '[]',
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,

  CONSTRAINT "reel_script_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "reel_script_teamId_idx" ON "reel_script"("teamId");
CREATE INDEX "reel_script_templateId_idx" ON "reel_script"("templateId");
CREATE INDEX "reel_script_status_idx" ON "reel_script"("status");
CREATE INDEX "reel_script_videoProjectId_idx" ON "reel_script"("videoProjectId");

-- ─── Reel Calendars: 30-day vertical-specific calendars ──────────────────────

CREATE TABLE "reel_calendar" (
  "id"          TEXT NOT NULL,
  "teamId"      TEXT NOT NULL,
  "vertical"    TEXT NOT NULL,
  "month"       INTEGER NOT NULL,
  "year"        INTEGER NOT NULL,
  "language"    TEXT NOT NULL DEFAULT 'en',
  "entries"     JSONB NOT NULL DEFAULT '[]', -- [{ day, templateId, topic, hook, scriptId? }]
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,

  CONSTRAINT "reel_calendar_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "reel_calendar_teamId_month_year_key" ON "reel_calendar"("teamId", "month", "year");
CREATE INDEX "reel_calendar_teamId_idx" ON "reel_calendar"("teamId");

-- ─── Trending Audio: Curated track library specifically for Reels ────────────

CREATE TABLE "trending_audio" (
  "id"             TEXT NOT NULL,
  "title"          TEXT NOT NULL,
  "artist"         TEXT,
  "platform"       TEXT NOT NULL DEFAULT 'instagram', -- instagram | tiktok | youtube_shorts
  "externalId"     TEXT,                              -- platform-specific audio ID for tagging
  "externalUrl"    TEXT,
  "previewUrl"     TEXT,
  "duration"       FLOAT NOT NULL DEFAULT 30,
  "bpm"            INTEGER,
  "mood"           TEXT[] DEFAULT '{}',     -- ['upbeat', 'aesthetic', 'desi', 'romantic']
  "verticals"      TEXT[] DEFAULT '{}',     -- which industries this works for
  "language"       TEXT NOT NULL DEFAULT 'en',
  "trendStrength"  INTEGER NOT NULL DEFAULT 5, -- 1-10
  "isLicensed"     BOOLEAN NOT NULL DEFAULT FALSE, -- true if we have rights
  "tags"           TEXT[] DEFAULT '{}',
  "discoveredAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt"      TIMESTAMP(3),                    -- when trend is expected to die
  "isActive"       BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,

  CONSTRAINT "trending_audio_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "trending_audio_platform_idx" ON "trending_audio"("platform");
CREATE INDEX "trending_audio_trendStrength_idx" ON "trending_audio"("trendStrength");
CREATE INDEX "trending_audio_isActive_idx" ON "trending_audio"("isActive");
