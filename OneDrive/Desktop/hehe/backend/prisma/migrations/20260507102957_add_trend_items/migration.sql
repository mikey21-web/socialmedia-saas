-- CreateTable
CREATE TABLE "TrendItem" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "url" TEXT,
    "source" TEXT NOT NULL,
    "category" TEXT,
    "relevanceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "brandFitReason" TEXT,
    "pillar" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "convertedPostId" TEXT,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrendItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrendItem_teamId_idx" ON "TrendItem"("teamId");

-- CreateIndex
CREATE INDEX "TrendItem_status_idx" ON "TrendItem"("status");

-- CreateIndex
CREATE INDEX "TrendItem_relevanceScore_idx" ON "TrendItem"("relevanceScore");

-- CreateIndex
CREATE INDEX "TrendItem_detectedAt_idx" ON "TrendItem"("detectedAt");

-- AddForeignKey
ALTER TABLE "TrendItem" ADD CONSTRAINT "TrendItem_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
