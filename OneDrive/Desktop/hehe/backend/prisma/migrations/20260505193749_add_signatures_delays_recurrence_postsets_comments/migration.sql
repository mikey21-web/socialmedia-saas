-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "isRecurring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "nextPublishAt" TIMESTAMP(3),
ADD COLUMN     "postDelay" INTEGER,
ADD COLUMN     "postSetId" TEXT,
ADD COLUMN     "recurrenceEndAt" TIMESTAMP(3),
ADD COLUMN     "recurrencePattern" TEXT;

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "signature" TEXT;

-- CreateTable
CREATE TABLE "PostSet" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PostSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "platform" TEXT,
    "externalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PostSet_teamId_idx" ON "PostSet"("teamId");

-- CreateIndex
CREATE INDEX "Comment_postId_idx" ON "Comment"("postId");

-- CreateIndex
CREATE INDEX "Comment_teamId_idx" ON "Comment"("teamId");

-- CreateIndex
CREATE INDEX "Post_postSetId_idx" ON "Post"("postSetId");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_postSetId_fkey" FOREIGN KEY ("postSetId") REFERENCES "PostSet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostSet" ADD CONSTRAINT "PostSet_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
