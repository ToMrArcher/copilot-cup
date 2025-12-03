-- AlterTable
ALTER TABLE "ShareLink" ADD COLUMN     "accessCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastAccessedAt" TIMESTAMP(3),
ADD COLUMN     "name" TEXT;

-- CreateIndex
CREATE INDEX "ShareLink_createdById_idx" ON "ShareLink"("createdById");
