-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED');

-- AlterTable
ALTER TABLE "Integration" ADD COLUMN     "nextSyncAt" TIMESTAMP(3),
ADD COLUMN     "retryCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "syncEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "syncInterval" INTEGER DEFAULT 3600;

-- CreateTable
CREATE TABLE "SyncLog" (
    "id" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "status" "SyncStatus" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "recordsCount" INTEGER,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SyncLog_integrationId_createdAt_idx" ON "SyncLog"("integrationId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "SyncLog" ADD CONSTRAINT "SyncLog_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
