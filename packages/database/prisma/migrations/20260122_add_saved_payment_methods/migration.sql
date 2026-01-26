-- CreateTable: SavedPaymentMethod
CREATE TABLE IF NOT EXISTS "saved_payment_methods" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripePaymentMethodId" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "last4" TEXT NOT NULL,
    "expMonth" INTEGER NOT NULL,
    "expYear" INTEGER NOT NULL,
    "funding" TEXT,
    "country" TEXT,
    "nickname" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "lastUsedAt" TIMESTAMP(3),
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "cardholderName" TEXT,
    "billingAddressId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "saved_payment_methods_stripePaymentMethodId_key" ON "saved_payment_methods"("stripePaymentMethodId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "saved_payment_methods_userId_idx" ON "saved_payment_methods"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "saved_payment_methods_isDefault_idx" ON "saved_payment_methods"("isDefault");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "saved_payment_methods_stripePaymentMethodId_idx" ON "saved_payment_methods"("stripePaymentMethodId");

-- AddForeignKey
ALTER TABLE "saved_payment_methods" ADD CONSTRAINT "saved_payment_methods_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
