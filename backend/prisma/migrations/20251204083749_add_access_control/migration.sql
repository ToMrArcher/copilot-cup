-- CreateEnum
CREATE TYPE "AccessPermission" AS ENUM ('VIEW', 'EDIT');

-- AlterTable
ALTER TABLE "Kpi" ADD COLUMN     "ownerId" TEXT;

-- CreateTable
CREATE TABLE "DashboardAccess" (
    "id" TEXT NOT NULL,
    "dashboardId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permission" "AccessPermission" NOT NULL DEFAULT 'VIEW',
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantedById" TEXT,

    CONSTRAINT "DashboardAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KpiAccess" (
    "id" TEXT NOT NULL,
    "kpiId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permission" "AccessPermission" NOT NULL DEFAULT 'VIEW',
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantedById" TEXT,

    CONSTRAINT "KpiAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DashboardAccess_userId_idx" ON "DashboardAccess"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DashboardAccess_dashboardId_userId_key" ON "DashboardAccess"("dashboardId", "userId");

-- CreateIndex
CREATE INDEX "KpiAccess_userId_idx" ON "KpiAccess"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "KpiAccess_kpiId_userId_key" ON "KpiAccess"("kpiId", "userId");

-- AddForeignKey
ALTER TABLE "Kpi" ADD CONSTRAINT "Kpi_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardAccess" ADD CONSTRAINT "DashboardAccess_dashboardId_fkey" FOREIGN KEY ("dashboardId") REFERENCES "Dashboard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardAccess" ADD CONSTRAINT "DashboardAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KpiAccess" ADD CONSTRAINT "KpiAccess_kpiId_fkey" FOREIGN KEY ("kpiId") REFERENCES "Kpi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KpiAccess" ADD CONSTRAINT "KpiAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
