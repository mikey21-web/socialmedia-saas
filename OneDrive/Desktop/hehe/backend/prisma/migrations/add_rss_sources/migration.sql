CREATE TABLE IF NOT EXISTS "RssSource" (
  "id"          TEXT NOT NULL,
  "teamId"      TEXT NOT NULL,
  "url"         TEXT NOT NULL,
  "name"        TEXT,
  "platforms"   TEXT[] NOT NULL DEFAULT '{}',
  "autoPublish" BOOLEAN NOT NULL DEFAULT false,
  "isActive"    BOOLEAN NOT NULL DEFAULT true,
  "lastFetchAt" TIMESTAMP(3),
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RssSource_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "RssSource_teamId_idx" ON "RssSource"("teamId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'RssSource_teamId_fkey'
      AND table_name = 'RssSource'
  ) THEN
    ALTER TABLE "RssSource" ADD CONSTRAINT "RssSource_teamId_fkey"
      FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
