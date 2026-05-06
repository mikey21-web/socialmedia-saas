CREATE TABLE IF NOT EXISTS "MediaAsset" (
  "id"          TEXT NOT NULL,
  "teamId"      TEXT NOT NULL,
  "url"         TEXT NOT NULL,
  "filename"    TEXT NOT NULL,
  "mimeType"    TEXT NOT NULL,
  "size"        INTEGER NOT NULL DEFAULT 0,
  "width"       INTEGER,
  "height"      INTEGER,
  "source"      TEXT NOT NULL DEFAULT 'upload',
  "tags"        TEXT[] NOT NULL DEFAULT '{}',
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "MediaAsset_teamId_idx" ON "MediaAsset"("teamId");
CREATE INDEX IF NOT EXISTS "MediaAsset_teamId_source_idx" ON "MediaAsset"("teamId", "source");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'MediaAsset_teamId_fkey'
      AND table_name = 'MediaAsset'
  ) THEN
    ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_teamId_fkey"
      FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
