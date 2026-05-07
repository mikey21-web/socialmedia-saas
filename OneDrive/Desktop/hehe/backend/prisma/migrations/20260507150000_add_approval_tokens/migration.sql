-- CreateTable ApprovalToken
CREATE TABLE "ApprovalToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "action" TEXT,
    "usedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApprovalToken_token_key" ON "ApprovalToken"("token");

-- CreateIndex
CREATE INDEX "ApprovalToken_token_idx" ON "ApprovalToken"("token");

-- CreateIndex
CREATE INDEX "ApprovalToken_postId_idx" ON "ApprovalToken"("postId");
