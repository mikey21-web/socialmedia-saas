ALTER TABLE "PlatformCredential"
ADD COLUMN "accountId" TEXT,
ADD COLUMN "accountName" TEXT;

DROP INDEX IF EXISTS "PlatformCredential_teamId_platform_key";

CREATE UNIQUE INDEX "PlatformCredential_teamId_platform_accountId_key"
ON "PlatformCredential"("teamId", "platform", "accountId");

CREATE INDEX "PlatformCredential_teamId_idx"
ON "PlatformCredential"("teamId");

CREATE INDEX "PlatformCredential_teamId_platform_idx"
ON "PlatformCredential"("teamId", "platform");
