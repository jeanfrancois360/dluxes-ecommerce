-- CreateTable
CREATE TABLE "trusted_partners" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT NOT NULL,
    "website" TEXT,
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trusted_partners_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "trusted_partners_isActive_idx" ON "trusted_partners"("isActive");
CREATE INDEX "trusted_partners_displayOrder_idx" ON "trusted_partners"("displayOrder");
