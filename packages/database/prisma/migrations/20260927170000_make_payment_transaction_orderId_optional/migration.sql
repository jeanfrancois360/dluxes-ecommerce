-- AlterTable: Make orderId optional on PaymentTransaction for non-order payments (credits, subscriptions, hot deals)
ALTER TABLE "payment_transactions" ALTER COLUMN "orderId" DROP NOT NULL;
