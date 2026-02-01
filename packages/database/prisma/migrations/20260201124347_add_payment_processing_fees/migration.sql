-- Add payment processing fee fields to PaymentTransaction table
ALTER TABLE payment_transactions
ADD COLUMN IF NOT EXISTS "stripeBalanceTransactionId" TEXT,
ADD COLUMN IF NOT EXISTS "processingFeeAmount" DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS "processingFeePercent" DECIMAL(5,4),
ADD COLUMN IF NOT EXISTS "processingFeeFixed" DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS "netAmount" DECIMAL(10,2);

-- Add payment processing fee to EscrowTransaction table
ALTER TABLE escrow_transactions
ADD COLUMN IF NOT EXISTS "paymentProcessingFee" DECIMAL(10,2) NOT NULL DEFAULT 0;
