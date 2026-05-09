-- AlterTable (skipped - campaignId already exists)
-- ALTER TABLE "Post" ADD COLUMN "campaignId" TEXT;

-- CreateTable (skipped - already exists)
-- CREATE TABLE "FollowerSnapshot" (
--     "id" TEXT NOT NULL,
--     "teamId" TEXT NOT NULL,
--     "platform" TEXT NOT NULL,
--     "count" INTEGER NOT NULL,
--     "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
--     CONSTRAINT "FollowerSnapshot_pkey" PRIMARY KEY ("id")
-- );

-- CreateTable (skipped - already exists)
-- CREATE TABLE "Campaign" (
--     "id" TEXT NOT NULL,
--     "teamId" TEXT NOT NULL,
--     "name" TEXT NOT NULL,
--     "description" TEXT,
--     "startDate" TIMESTAMP(3),
--     "endDate" TIMESTAMP(3),
--     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
--     "updatedAt" TIMESTAMP(3) NOT NULL,
--     "deletedAt" TIMESTAMP(3),
--     CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
-- );

-- CreateTable (skipped - already exists)
-- CREATE TABLE "AudienceDemographic" (
--     "id" TEXT NOT NULL,
--     "teamId" TEXT NOT NULL,
--     "platform" TEXT NOT NULL,
--     "dimension" TEXT NOT NULL,
--     "bucket" TEXT NOT NULL,
--     "value" DOUBLE PRECISION NOT NULL,
--     "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
--     CONSTRAINT "AudienceDemographic_pkey" PRIMARY KEY ("id")
-- );

-- CreateIndex (skipped - campaignId already exists)
-- CREATE INDEX "Post_campaignId_idx" ON "Post"("campaignId");

-- CreateIndex (skipped - tables already exist)
-- CREATE INDEX "FollowerSnapshot_teamId_idx" ON "FollowerSnapshot"("teamId");
-- CREATE INDEX "FollowerSnapshot_teamId_platform_idx" ON "FollowerSnapshot"("teamId", "platform");
-- CREATE INDEX "FollowerSnapshot_recordedAt_idx" ON "FollowerSnapshot"("recordedAt");
-- CREATE INDEX "Campaign_teamId_idx" ON "Campaign"("teamId");
-- CREATE INDEX "AudienceDemographic_teamId_idx" ON "AudienceDemographic"("teamId");
-- CREATE INDEX "AudienceDemographic_teamId_platform_idx" ON "AudienceDemographic"("teamId", "platform");
-- CREATE INDEX "AudienceDemographic_recordedAt_idx" ON "AudienceDemographic"("recordedAt");

-- AddForeignKey (skipped - campaignId already exists)
-- ALTER TABLE "Post" ADD CONSTRAINT "Post_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey (skipped - tables already exist)
-- ALTER TABLE "FollowerSnapshot" ADD CONSTRAINT "FollowerSnapshot_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- ALTER TABLE "AudienceDemographic" ADD CONSTRAINT "AudienceDemographic_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
