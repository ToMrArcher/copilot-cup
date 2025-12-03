-- CreateTable
CREATE TABLE "DataValue" (
    "id" TEXT NOT NULL,
    "dataFieldId" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataValue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DataValue_dataFieldId_syncedAt_idx" ON "DataValue"("dataFieldId", "syncedAt");

-- AddForeignKey
ALTER TABLE "DataValue" ADD CONSTRAINT "DataValue_dataFieldId_fkey" FOREIGN KEY ("dataFieldId") REFERENCES "DataField"("id") ON DELETE CASCADE ON UPDATE CASCADE;
