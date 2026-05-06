CREATE TABLE IF NOT EXISTS "ThirdPartyIntegration" (
  "id"         TEXT NOT NULL,
  "teamId"     TEXT NOT NULL,
  "identifier" TEXT NOT NULL,
  "apiKey"     TEXT NOT NULL,
  "name"       TEXT,
  "username"   TEXT,
  "externalId" TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ThirdPartyIntegration_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ThirdPartyIntegration_teamId_identifier_key"
  ON "ThirdPartyIntegration"("teamId", "identifier");

CREATE INDEX IF NOT EXISTS "ThirdPartyIntegration_teamId_idx"
  ON "ThirdPartyIntegration"("teamId");

ALTER TABLE "ThirdPartyIntegration"
  ADD CONSTRAINT "ThirdPartyIntegration_teamId_fkey"
  FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
