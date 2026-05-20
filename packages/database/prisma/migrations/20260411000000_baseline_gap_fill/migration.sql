-- =============================================================================
-- BASELINE GAP FILL — Phase A.1.5 (2026-05-20)
-- =============================================================================
--
-- Purpose: Restore replayability of the Prisma migration chain.
--
-- Background: 22 tables exist in the live database but had no creating migration.
-- They were created via prisma db push or direct SQL during development, then
-- registered in _prisma_migrations via 'migrate resolve --applied' without the
-- corresponding migration files ever being committed. This broke shadow-database
-- replay, blocking 'prisma migrate dev' for all future schema work.
--
-- Resolution: This migration uses CREATE TABLE IF NOT EXISTS so it is a no-op
-- against the live database (tables already exist with correct structure, verified
-- via pg_dump) but creates the tables correctly on fresh database setups.
--
-- Generated from: pg_dump --schema-only of the live nextpik_ecommerce database
-- on 2026-05-20.
--
-- This migration is part of Phase A.1.5 — the foundation cleanup that completes
-- the Phase A.1 baseline recovery work.
--
-- DO NOT MODIFY this file. If schema drift is discovered in these 22 tables,
-- create a new migration with the corrective ALTER statements.
-- =============================================================================

-- =============================================================================
-- GAP-FILLING MIGRATION: Restore 22 missing tables to Prisma migration chain
-- Phase A.1.5 — 2026-05-20
--
-- Context: 22 tables exist in the live DB but have no CREATE TABLE in the
-- migration chain, preventing shadow-DB replay. This migration was extracted
-- from the live DB via pg_dump and uses CREATE TABLE IF NOT EXISTS plus
-- DO $$ EXCEPTION guards on constraints/indexes so it is a safe no-op on the
-- live DB and provides correct CREATEs on fresh DB restores.
--
-- Tables covered (22): admin_notes, announcements, credit_balances,
-- credit_packages, credit_transactions, delivery_audit_logs,
-- delivery_tracking_events, email_otps, hot_deal_responses, hot_deals,
-- notifications, product_inquiries, return_requests, seller_credit_transactions,
-- seller_gelato_settings, seller_payout_settings, seller_shipments,
-- seller_subscriptions, shipment_events, shipment_items, store_follows,
-- subscription_plans
--
-- All 22 models are defined in schema.prisma. No schema logic changed here.
-- This is purely a migration-chain repair (Phase A.1.5, 2026-05-20).
-- =============================================================================

-- Name: admin_notes; Type: TABLE; Schema: public; Owner: -
--

-- ============================================================
-- ENUM TYPE DEFINITIONS (also missing from chain)
-- These enums were created via db push with no creating migration.
-- Wrapped in DO blocks for idempotency on the live DB.
-- ============================================================

DO $$ BEGIN
  CREATE TYPE "AnnouncementType" AS ENUM ('INFO', 'PROMO', 'WARNING', 'SUCCESS');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ContactMethod" AS ENUM ('PHONE', 'EMAIL', 'BOTH');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "DeliveryAuditAction" AS ENUM ('CREATED', 'ASSIGNED_PROVIDER', 'ASSIGNED_DRIVER', 'STATUS_UPDATED', 'PROOF_UPLOADED', 'BUYER_CONFIRMED', 'PAYOUT_RELEASED', 'CANCELLED', 'ISSUE_REPORTED', 'ISSUE_RESOLVED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "EmailOTPType" AS ENUM ('TWO_FACTOR_BACKUP', 'ACCOUNT_RECOVERY', 'SENSITIVE_ACTION', 'LOGIN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "HotDealCategory" AS ENUM ('CHILDCARE', 'HOME_SERVICES', 'AUTOMOTIVE', 'PET_SERVICES', 'MOVING_DELIVERY', 'TECH_SUPPORT', 'TUTORING', 'HEALTH_WELLNESS', 'CLEANING', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "HotDealStatus" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED', 'FULFILLED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "InquiryStatus" AS ENUM ('NEW', 'CONTACTED', 'VIEWING_SCHEDULED', 'TEST_DRIVE_SCHEDULED', 'NEGOTIATING', 'CONVERTED', 'CLOSED', 'SPAM');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "NotificationType" AS ENUM ('ORDER_PLACED', 'ORDER_CONFIRMED', 'ORDER_SHIPPED', 'ORDER_DELIVERED', 'ORDER_CANCELLED', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'PRODUCT_REVIEW', 'LOW_STOCK_ALERT', 'STOCK_OUT', 'INQUIRY_RECEIVED', 'INQUIRY_RESPONSE', 'RETURN_REQUEST', 'PAYOUT_PROCESSED', 'CREDIT_LOW', 'CREDIT_EXPIRED', 'SUBSCRIPTION_EXPIRING', 'SYSTEM_ANNOUNCEMENT', 'ACCOUNT_ALERT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ResponseStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ReturnReason" AS ENUM ('DEFECTIVE', 'WRONG_ITEM', 'NOT_AS_DESCRIBED', 'CHANGED_MIND', 'SIZE_FIT', 'QUALITY', 'LATE_DELIVERY', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ReturnStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ITEM_RECEIVED', 'REFUND_PROCESSING', 'REFUNDED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "SellerCreditTransactionType" AS ENUM ('PURCHASE', 'DEDUCTION', 'REFUND', 'ADJUSTMENT', 'BONUS');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "UrgencyLevel" AS ENUM ('NORMAL', 'URGENT', 'EMERGENCY');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ShipmentStatus" AS ENUM ('PENDING', 'PROCESSING', 'LABEL_CREATED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED_DELIVERY', 'RETURNED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "admin_notes" (
    id text NOT NULL,
    "userId" text NOT NULL,
    content text NOT NULL,
    "createdBy" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

--
-- Name: announcements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "announcements" (
    id text NOT NULL,
    text text NOT NULL,
    icon character varying(10),
    link text,
    type "AnnouncementType" DEFAULT 'INFO'::"AnnouncementType" NOT NULL,
    "displayOrder" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "validFrom" timestamp(3) without time zone,
    "validUntil" timestamp(3) without time zone,
    "createdBy" text NOT NULL,
    "updatedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

--
-- Name: credit_balances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "credit_balances" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "availableCredits" integer DEFAULT 0 NOT NULL,
    "lifetimeCredits" integer DEFAULT 0 NOT NULL,
    "lifetimeUsed" integer DEFAULT 0 NOT NULL,
    "expiringCredits" integer DEFAULT 0 NOT NULL,
    "expirationDate" timestamp(3) without time zone,
    "purchasedCredits" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

--
-- Name: credit_packages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "credit_packages" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    credits integer NOT NULL,
    price numeric(10,2) NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    "savingsPercent" integer DEFAULT 0 NOT NULL,
    "savingsLabel" text,
    "isPopular" boolean DEFAULT false NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "displayOrder" integer DEFAULT 0 NOT NULL,
    "stripeProductId" text,
    "stripePriceId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

--
-- Name: credit_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "credit_transactions" (
    id text NOT NULL,
    "balanceId" text NOT NULL,
    type "CreditTransactionType" NOT NULL,
    amount integer NOT NULL,
    "balanceBefore" integer NOT NULL,
    "balanceAfter" integer NOT NULL,
    action text,
    description text,
    "productId" text,
    "packageId" text,
    "subscriptionId" text,
    "performedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

--
-- Name: delivery_audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "delivery_audit_logs" (
    id text NOT NULL,
    "deliveryId" text NOT NULL,
    action "DeliveryAuditAction" NOT NULL,
    "performedBy" text NOT NULL,
    "userRole" "UserRole" NOT NULL,
    "oldValue" text,
    "newValue" text,
    notes text,
    metadata jsonb,
    "ipAddress" text,
    "userAgent" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

--
-- Name: delivery_tracking_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "delivery_tracking_events" (
    id text NOT NULL,
    "deliveryId" text NOT NULL,
    "timestamp" timestamp(3) without time zone NOT NULL,
    status text NOT NULL,
    "statusDescription" text NOT NULL,
    location jsonb,
    "rawEventData" jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

--
-- Name: email_otps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "email_otps" (
    id text NOT NULL,
    "userId" text NOT NULL,
    code text NOT NULL,
    type "EmailOTPType" DEFAULT 'TWO_FACTOR_BACKUP'::"EmailOTPType" NOT NULL,
    used boolean DEFAULT false NOT NULL,
    "usedAt" timestamp(3) without time zone,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

--
-- Name: hot_deal_responses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "hot_deal_responses" (
    id text NOT NULL,
    "hotDealId" text NOT NULL,
    "userId" text NOT NULL,
    message text NOT NULL,
    "contactInfo" text,
    status "ResponseStatus" DEFAULT 'PENDING'::"ResponseStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

--
-- Name: hot_deals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "hot_deals" (
    id text NOT NULL,
    "userId" text NOT NULL,
    title character varying(100) NOT NULL,
    description text NOT NULL,
    category "HotDealCategory" NOT NULL,
    urgency "UrgencyLevel" DEFAULT 'NORMAL'::"UrgencyLevel" NOT NULL,
    "contactName" text NOT NULL,
    "contactPhone" text NOT NULL,
    "contactEmail" text NOT NULL,
    "preferredContact" "ContactMethod" DEFAULT 'PHONE'::"ContactMethod" NOT NULL,
    city text NOT NULL,
    state text,
    "zipCode" text,
    "paymentStatus" "PaymentStatus" DEFAULT 'PENDING'::"PaymentStatus" NOT NULL,
    "paymentIntentId" text,
    "paidAmount" double precision DEFAULT 1.00 NOT NULL,
    status "HotDealStatus" DEFAULT 'PENDING'::"HotDealStatus" NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "publishedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    images jsonb DEFAULT '[]'::jsonb NOT NULL,
    budget numeric(10,2),
    budget_type character varying(20)
);

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "notifications" (
    id text NOT NULL,
    "userId" text NOT NULL,
    type "NotificationType" NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    link text,
    read boolean DEFAULT false NOT NULL,
    "readAt" timestamp(3) without time zone,
    metadata jsonb,
    priority "NotificationPriority" DEFAULT 'NORMAL'::"NotificationPriority" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

--
-- Name: product_inquiries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "product_inquiries" (
    id text NOT NULL,
    "productId" text NOT NULL,
    "sellerId" text NOT NULL,
    "storeId" text,
    "userId" text,
    "buyerName" text NOT NULL,
    "buyerEmail" text NOT NULL,
    "buyerPhone" text,
    message text NOT NULL,
    "preferredContact" text,
    "preferredTime" text,
    "scheduledViewing" timestamp(3) without time zone,
    "preApproved" boolean DEFAULT false NOT NULL,
    "scheduledTestDrive" timestamp(3) without time zone,
    "tradeInInterest" boolean DEFAULT false NOT NULL,
    status "InquiryStatus" DEFAULT 'NEW'::"InquiryStatus" NOT NULL,
    "sellerNotes" text,
    "respondedAt" timestamp(3) without time zone,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

--
-- Name: return_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "return_requests" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "orderItemId" text,
    "userId" text NOT NULL,
    reason "ReturnReason" NOT NULL,
    description text,
    images jsonb,
    status "ReturnStatus" DEFAULT 'PENDING'::"ReturnStatus" NOT NULL,
    resolution text,
    "refundAmount" numeric(10,2),
    "refundMethod" text,
    "refundedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "resolvedAt" timestamp(3) without time zone
);

--
-- Name: seller_credit_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "seller_credit_transactions" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "storeId" text NOT NULL,
    type "SellerCreditTransactionType" NOT NULL,
    amount integer NOT NULL,
    "balanceBefore" integer NOT NULL,
    "balanceAfter" integer NOT NULL,
    "amountPaid" numeric(10,2),
    currency text DEFAULT 'USD'::text,
    "stripeSessionId" text,
    "stripePaymentId" text,
    description text,
    "performedBy" text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

--
-- Name: seller_gelato_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "seller_gelato_settings" (
    id text NOT NULL,
    "sellerId" text NOT NULL,
    "storeId" text NOT NULL,
    "gelatoApiKey" text,
    "gelatoStoreId" text,
    "gelatoWebhookSecret" text,
    "isEnabled" boolean DEFAULT false NOT NULL,
    "isVerified" boolean DEFAULT false NOT NULL,
    "verifiedAt" timestamp(3) without time zone,
    "lastTestAt" timestamp(3) without time zone,
    "gelatoAccountName" text,
    "gelatoAccountEmail" text,
    "webhookUrl" text,
    "webhookId" text,
    "connectionError" text,
    notes text,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

--
-- Name: seller_payout_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "seller_payout_settings" (
    id text NOT NULL,
    "sellerId" text NOT NULL,
    "storeId" text NOT NULL,
    "paymentMethod" text DEFAULT 'bank_transfer'::text NOT NULL,
    "bankName" text,
    "accountHolderName" text,
    "accountNumber" text,
    "routingNumber" text,
    iban text,
    "swiftCode" text,
    "bankAddress" text,
    "bankCountry" text,
    "stripeAccountId" text,
    "stripeAccountStatus" text,
    "stripeOnboardedAt" timestamp(3) without time zone,
    "paypalEmail" text,
    "paypalVerified" boolean DEFAULT false NOT NULL,
    "wiseEmail" text,
    "wiseRecipientId" text,
    "taxId" text,
    "taxCountry" text,
    "taxFormType" text,
    "taxFormUrl" text,
    "payoutCurrency" text DEFAULT 'USD'::text NOT NULL,
    verified boolean DEFAULT false NOT NULL,
    "verifiedAt" timestamp(3) without time zone,
    "verifiedBy" text,
    "rejectionNotes" text,
    notes text,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

--
-- Name: seller_shipments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "seller_shipments" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "storeId" text NOT NULL,
    "shipmentNumber" text NOT NULL,
    status "ShipmentStatus" DEFAULT 'PENDING'::"ShipmentStatus" NOT NULL,
    carrier text,
    "trackingNumber" text,
    "trackingUrl" text,
    "estimatedDelivery" timestamp(3) without time zone,
    "shippedAt" timestamp(3) without time zone,
    "deliveredAt" timestamp(3) without time zone,
    "shippingCost" numeric(10,2),
    weight numeric(10,2),
    notes text,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "weightGrams" integer
);

--
-- Name: seller_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "seller_subscriptions" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "planId" text NOT NULL,
    status "SubscriptionStatus" DEFAULT 'ACTIVE'::"SubscriptionStatus" NOT NULL,
    "billingCycle" "BillingCycle" DEFAULT 'MONTHLY'::"BillingCycle" NOT NULL,
    "currentPeriodStart" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "currentPeriodEnd" timestamp(3) without time zone NOT NULL,
    "cancelAtPeriodEnd" boolean DEFAULT false NOT NULL,
    "canceledAt" timestamp(3) without time zone,
    "creditsAllocated" integer DEFAULT 0 NOT NULL,
    "creditsUsed" integer DEFAULT 0 NOT NULL,
    "activeListingsCount" integer DEFAULT 0 NOT NULL,
    "featuredSlotsUsed" integer DEFAULT 0 NOT NULL,
    "stripeSubscriptionId" text,
    "stripeCustomerId" text,
    "trialEndsAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

--
-- Name: shipment_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "shipment_events" (
    id text NOT NULL,
    "shipmentId" text NOT NULL,
    status "ShipmentStatus" NOT NULL,
    title text NOT NULL,
    description text,
    location text,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

--
-- Name: shipment_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "shipment_items" (
    id text NOT NULL,
    "shipmentId" text NOT NULL,
    "orderItemId" text NOT NULL,
    quantity integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

--
-- Name: store_follows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "store_follows" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "storeId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

--
-- Name: subscription_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "subscription_plans" (
    id text NOT NULL,
    tier "SubscriptionTier" NOT NULL,
    name text NOT NULL,
    description text,
    "monthlyPrice" numeric(10,2) NOT NULL,
    "yearlyPrice" numeric(10,2) NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    "maxActiveListings" integer DEFAULT '-1'::integer NOT NULL,
    "monthlyCredits" integer NOT NULL,
    "listingDurationDays" integer DEFAULT 30 NOT NULL,
    "featuredSlotsPerMonth" integer DEFAULT 0 NOT NULL,
    "allowedProductTypes" jsonb NOT NULL,
    features jsonb NOT NULL,
    "stripeProductId" text,
    "stripePriceIdMonthly" text,
    "stripePriceIdYearly" text,
    "isPopular" boolean DEFAULT false NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "displayOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

--
-- Name: admin_notes admin_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN
  ALTER TABLE "admin_notes" ADD CONSTRAINT "admin_notes_pkey" PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN
  ALTER TABLE "announcements" ADD CONSTRAINT "announcements_pkey" PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--
-- Name: credit_balances credit_balances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN
  ALTER TABLE "credit_balances" ADD CONSTRAINT "credit_balances_pkey" PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--
-- Name: credit_packages credit_packages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN
  ALTER TABLE "credit_packages" ADD CONSTRAINT "credit_packages_pkey" PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--
-- Name: credit_transactions credit_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN
  ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_pkey" PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--
-- Name: delivery_audit_logs delivery_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN
  ALTER TABLE "delivery_audit_logs" ADD CONSTRAINT "delivery_audit_logs_pkey" PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--
-- Name: delivery_tracking_events delivery_tracking_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN
  ALTER TABLE "delivery_tracking_events" ADD CONSTRAINT "delivery_tracking_events_pkey" PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--
-- Name: email_otps email_otps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN
  ALTER TABLE "email_otps" ADD CONSTRAINT "email_otps_pkey" PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--
-- Name: hot_deal_responses hot_deal_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN
  ALTER TABLE "hot_deal_responses" ADD CONSTRAINT "hot_deal_responses_pkey" PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--
-- Name: hot_deals hot_deals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN
  ALTER TABLE "hot_deals" ADD CONSTRAINT "hot_deals_pkey" PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN
  ALTER TABLE "notifications" ADD CONSTRAINT "notifications_pkey" PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--
-- Name: product_inquiries product_inquiries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN
  ALTER TABLE "product_inquiries" ADD CONSTRAINT "product_inquiries_pkey" PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--
-- Name: return_requests return_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN
  ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_pkey" PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--
-- Name: seller_credit_transactions seller_credit_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN
  ALTER TABLE "seller_credit_transactions" ADD CONSTRAINT "seller_credit_transactions_pkey" PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--
-- Name: seller_gelato_settings seller_gelato_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN
  ALTER TABLE "seller_gelato_settings" ADD CONSTRAINT "seller_gelato_settings_pkey" PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--
-- Name: seller_payout_settings seller_payout_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN
  ALTER TABLE "seller_payout_settings" ADD CONSTRAINT "seller_payout_settings_pkey" PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--
-- Name: seller_shipments seller_shipments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN
  ALTER TABLE "seller_shipments" ADD CONSTRAINT "seller_shipments_pkey" PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--
-- Name: seller_subscriptions seller_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN
  ALTER TABLE "seller_subscriptions" ADD CONSTRAINT "seller_subscriptions_pkey" PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--
-- Name: shipment_events shipment_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN
  ALTER TABLE "shipment_events" ADD CONSTRAINT "shipment_events_pkey" PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--
-- Name: shipment_items shipment_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN
  ALTER TABLE "shipment_items" ADD CONSTRAINT "shipment_items_pkey" PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--
-- Name: store_follows store_follows_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN
  ALTER TABLE "store_follows" ADD CONSTRAINT "store_follows_pkey" PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--
-- Name: subscription_plans subscription_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN
  ALTER TABLE "subscription_plans" ADD CONSTRAINT "subscription_plans_pkey" PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--
-- Name: admin_notes_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "admin_notes_createdAt_idx" ON "admin_notes" USING btree ("createdAt");

--
-- Name: admin_notes_createdBy_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "admin_notes_createdBy_idx" ON "admin_notes" USING btree ("createdBy");

--
-- Name: admin_notes_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "admin_notes_userId_idx" ON "admin_notes" USING btree ("userId");

--
-- Name: announcements_displayOrder_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "announcements_displayOrder_idx" ON "announcements" USING btree ("displayOrder");

--
-- Name: announcements_isActive_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "announcements_isActive_idx" ON "announcements" USING btree ("isActive");

--
-- Name: announcements_validFrom_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "announcements_validFrom_idx" ON "announcements" USING btree ("validFrom");

--
-- Name: announcements_validUntil_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "announcements_validUntil_idx" ON "announcements" USING btree ("validUntil");

--
-- Name: credit_balances_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "credit_balances_userId_idx" ON "credit_balances" USING btree ("userId");

--
-- Name: credit_balances_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX IF NOT EXISTS "credit_balances_userId_key" ON "credit_balances" USING btree ("userId");

--
-- Name: credit_packages_isActive_displayOrder_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "credit_packages_isActive_displayOrder_idx" ON "credit_packages" USING btree ("isActive", "displayOrder");

--
-- Name: credit_transactions_balanceId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "credit_transactions_balanceId_idx" ON "credit_transactions" USING btree ("balanceId");

--
-- Name: credit_transactions_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "credit_transactions_createdAt_idx" ON "credit_transactions" USING btree ("createdAt");

--
-- Name: credit_transactions_productId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "credit_transactions_productId_idx" ON "credit_transactions" USING btree ("productId");

--
-- Name: credit_transactions_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS credit_transactions_type_idx ON "credit_transactions" USING btree (type);

--
-- Name: delivery_audit_logs_action_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS delivery_audit_logs_action_idx ON "delivery_audit_logs" USING btree (action);

--
-- Name: delivery_audit_logs_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "delivery_audit_logs_createdAt_idx" ON "delivery_audit_logs" USING btree ("createdAt");

--
-- Name: delivery_audit_logs_deliveryId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "delivery_audit_logs_deliveryId_idx" ON "delivery_audit_logs" USING btree ("deliveryId");

--
-- Name: delivery_audit_logs_performedBy_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "delivery_audit_logs_performedBy_idx" ON "delivery_audit_logs" USING btree ("performedBy");

--
-- Name: delivery_tracking_events_deliveryId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "delivery_tracking_events_deliveryId_idx" ON "delivery_tracking_events" USING btree ("deliveryId");

--
-- Name: delivery_tracking_events_timestamp_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS delivery_tracking_events_timestamp_idx ON "delivery_tracking_events" USING btree ("timestamp");

--
-- Name: email_otps_code_expiresAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "email_otps_code_expiresAt_idx" ON "email_otps" USING btree (code, "expiresAt");

--
-- Name: email_otps_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "email_otps_userId_idx" ON "email_otps" USING btree ("userId");

--
-- Name: hot_deal_responses_hotDealId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "hot_deal_responses_hotDealId_idx" ON "hot_deal_responses" USING btree ("hotDealId");

--
-- Name: hot_deal_responses_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "hot_deal_responses_userId_idx" ON "hot_deal_responses" USING btree ("userId");

--
-- Name: hot_deals_category_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS hot_deals_category_status_idx ON "hot_deals" USING btree (category, status);

--
-- Name: hot_deals_city_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS hot_deals_city_status_idx ON "hot_deals" USING btree (city, status);

--
-- Name: hot_deals_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "hot_deals_createdAt_idx" ON "hot_deals" USING btree ("createdAt");

--
-- Name: hot_deals_paymentIntentId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX IF NOT EXISTS "hot_deals_paymentIntentId_key" ON "hot_deals" USING btree ("paymentIntentId");

--
-- Name: hot_deals_status_expiresAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "hot_deals_status_expiresAt_idx" ON "hot_deals" USING btree (status, "expiresAt");

--
-- Name: hot_deals_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "hot_deals_userId_idx" ON "hot_deals" USING btree ("userId");

--
-- Name: notifications_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "notifications_createdAt_idx" ON "notifications" USING btree ("createdAt");

--
-- Name: notifications_read_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS notifications_read_idx ON "notifications" USING btree (read);

--
-- Name: notifications_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS notifications_type_idx ON "notifications" USING btree (type);

--
-- Name: notifications_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "notifications_userId_idx" ON "notifications" USING btree ("userId");

--
-- Name: product_inquiries_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "product_inquiries_createdAt_idx" ON "product_inquiries" USING btree ("createdAt");

--
-- Name: product_inquiries_productId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "product_inquiries_productId_idx" ON "product_inquiries" USING btree ("productId");

--
-- Name: product_inquiries_sellerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "product_inquiries_sellerId_idx" ON "product_inquiries" USING btree ("sellerId");

--
-- Name: product_inquiries_sellerId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "product_inquiries_sellerId_status_idx" ON "product_inquiries" USING btree ("sellerId", status);

--
-- Name: product_inquiries_status_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "product_inquiries_status_createdAt_idx" ON "product_inquiries" USING btree (status, "createdAt");

--
-- Name: product_inquiries_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS product_inquiries_status_idx ON "product_inquiries" USING btree (status);

--
-- Name: product_inquiries_storeId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "product_inquiries_storeId_idx" ON "product_inquiries" USING btree ("storeId");

--
-- Name: product_inquiries_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "product_inquiries_userId_idx" ON "product_inquiries" USING btree ("userId");

--
-- Name: return_requests_orderId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "return_requests_orderId_idx" ON "return_requests" USING btree ("orderId");

--
-- Name: return_requests_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS return_requests_status_idx ON "return_requests" USING btree (status);

--
-- Name: return_requests_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "return_requests_userId_idx" ON "return_requests" USING btree ("userId");

--
-- Name: seller_credit_transactions_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "seller_credit_transactions_createdAt_idx" ON "seller_credit_transactions" USING btree ("createdAt");

--
-- Name: seller_credit_transactions_storeId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "seller_credit_transactions_storeId_idx" ON "seller_credit_transactions" USING btree ("storeId");

--
-- Name: seller_credit_transactions_stripeSessionId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX IF NOT EXISTS "seller_credit_transactions_stripeSessionId_key" ON "seller_credit_transactions" USING btree ("stripeSessionId");

--
-- Name: seller_credit_transactions_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS seller_credit_transactions_type_idx ON "seller_credit_transactions" USING btree (type);

--
-- Name: seller_credit_transactions_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "seller_credit_transactions_userId_idx" ON "seller_credit_transactions" USING btree ("userId");

--
-- Name: seller_gelato_settings_isEnabled_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "seller_gelato_settings_isEnabled_idx" ON "seller_gelato_settings" USING btree ("isEnabled");

--
-- Name: seller_gelato_settings_isVerified_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "seller_gelato_settings_isVerified_idx" ON "seller_gelato_settings" USING btree ("isVerified");

--
-- Name: seller_gelato_settings_sellerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "seller_gelato_settings_sellerId_idx" ON "seller_gelato_settings" USING btree ("sellerId");

--
-- Name: seller_gelato_settings_sellerId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX IF NOT EXISTS "seller_gelato_settings_sellerId_key" ON "seller_gelato_settings" USING btree ("sellerId");

--
-- Name: seller_gelato_settings_storeId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "seller_gelato_settings_storeId_idx" ON "seller_gelato_settings" USING btree ("storeId");

--
-- Name: seller_gelato_settings_storeId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX IF NOT EXISTS "seller_gelato_settings_storeId_key" ON "seller_gelato_settings" USING btree ("storeId");

--
-- Name: seller_payout_settings_sellerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "seller_payout_settings_sellerId_idx" ON "seller_payout_settings" USING btree ("sellerId");

--
-- Name: seller_payout_settings_sellerId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX IF NOT EXISTS "seller_payout_settings_sellerId_key" ON "seller_payout_settings" USING btree ("sellerId");

--
-- Name: seller_payout_settings_storeId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "seller_payout_settings_storeId_idx" ON "seller_payout_settings" USING btree ("storeId");

--
-- Name: seller_payout_settings_storeId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX IF NOT EXISTS "seller_payout_settings_storeId_key" ON "seller_payout_settings" USING btree ("storeId");

--
-- Name: seller_payout_settings_stripeAccountId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "seller_payout_settings_stripeAccountId_idx" ON "seller_payout_settings" USING btree ("stripeAccountId");

--
-- Name: seller_payout_settings_stripeAccountId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX IF NOT EXISTS "seller_payout_settings_stripeAccountId_key" ON "seller_payout_settings" USING btree ("stripeAccountId");

--
-- Name: seller_payout_settings_verified_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS seller_payout_settings_verified_idx ON "seller_payout_settings" USING btree (verified);

--
-- Name: seller_shipments_orderId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "seller_shipments_orderId_idx" ON "seller_shipments" USING btree ("orderId");

--
-- Name: seller_shipments_shipmentNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX IF NOT EXISTS "seller_shipments_shipmentNumber_key" ON "seller_shipments" USING btree ("shipmentNumber");

--
-- Name: seller_shipments_shippedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "seller_shipments_shippedAt_idx" ON "seller_shipments" USING btree ("shippedAt");

--
-- Name: seller_shipments_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS seller_shipments_status_idx ON "seller_shipments" USING btree (status);

--
-- Name: seller_shipments_storeId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "seller_shipments_storeId_idx" ON "seller_shipments" USING btree ("storeId");

--
-- Name: seller_shipments_trackingNumber_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "seller_shipments_trackingNumber_idx" ON "seller_shipments" USING btree ("trackingNumber");

--
-- Name: seller_subscriptions_currentPeriodEnd_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "seller_subscriptions_currentPeriodEnd_idx" ON "seller_subscriptions" USING btree ("currentPeriodEnd");

--
-- Name: seller_subscriptions_planId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "seller_subscriptions_planId_idx" ON "seller_subscriptions" USING btree ("planId");

--
-- Name: seller_subscriptions_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS seller_subscriptions_status_idx ON "seller_subscriptions" USING btree (status);

--
-- Name: seller_subscriptions_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "seller_subscriptions_userId_idx" ON "seller_subscriptions" USING btree ("userId");

--
-- Name: seller_subscriptions_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX IF NOT EXISTS "seller_subscriptions_userId_key" ON "seller_subscriptions" USING btree ("userId");

--
-- Name: shipment_events_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "shipment_events_createdAt_idx" ON "shipment_events" USING btree ("createdAt");

--
-- Name: shipment_events_shipmentId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "shipment_events_shipmentId_idx" ON "shipment_events" USING btree ("shipmentId");

--
-- Name: shipment_items_orderItemId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "shipment_items_orderItemId_idx" ON "shipment_items" USING btree ("orderItemId");

--
-- Name: shipment_items_shipmentId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "shipment_items_shipmentId_idx" ON "shipment_items" USING btree ("shipmentId");

--
-- Name: shipment_items_shipmentId_orderItemId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX IF NOT EXISTS "shipment_items_shipmentId_orderItemId_key" ON "shipment_items" USING btree ("shipmentId", "orderItemId");

--
-- Name: store_follows_storeId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "store_follows_storeId_idx" ON "store_follows" USING btree ("storeId");

--
-- Name: store_follows_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "store_follows_userId_idx" ON "store_follows" USING btree ("userId");

--
-- Name: store_follows_userId_storeId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX IF NOT EXISTS "store_follows_userId_storeId_key" ON "store_follows" USING btree ("userId", "storeId");

--
-- Name: subscription_plans_isActive_displayOrder_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "subscription_plans_isActive_displayOrder_idx" ON "subscription_plans" USING btree ("isActive", "displayOrder");

--
-- Name: subscription_plans_tier_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS subscription_plans_tier_idx ON "subscription_plans" USING btree (tier);

--
-- Name: subscription_plans_tier_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX IF NOT EXISTS subscription_plans_tier_key ON "subscription_plans" USING btree (tier);

--
-- Name: admin_notes admin_notes_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN
  ALTER TABLE "admin_notes" ADD CONSTRAINT "admin_notes_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--
-- Name: admin_notes admin_notes_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN
  ALTER TABLE "admin_notes" ADD CONSTRAINT "admin_notes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--
-- Name: credit_balances credit_balances_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN
  ALTER TABLE "credit_balances" ADD CONSTRAINT "credit_balances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--
-- Name: credit_transactions credit_transactions_balanceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN
  ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_balanceId_fkey" FOREIGN KEY ("balanceId") REFERENCES "credit_balances"(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--
-- Name: delivery_audit_logs delivery_audit_logs_deliveryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN
  ALTER TABLE "delivery_audit_logs" ADD CONSTRAINT "delivery_audit_logs_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "deliveries"(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--
-- Name: delivery_tracking_events delivery_tracking_events_deliveryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN
  ALTER TABLE "delivery_tracking_events" ADD CONSTRAINT "delivery_tracking_events_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "deliveries"(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--
-- Name: email_otps email_otps_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN
  ALTER TABLE "email_otps" ADD CONSTRAINT "email_otps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--
-- Name: hot_deal_responses hot_deal_responses_hotDealId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN
  ALTER TABLE "hot_deal_responses" ADD CONSTRAINT "hot_deal_responses_hotDealId_fkey" FOREIGN KEY ("hotDealId") REFERENCES "hot_deals"(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--
-- Name: hot_deal_responses hot_deal_responses_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN
  ALTER TABLE "hot_deal_responses" ADD CONSTRAINT "hot_deal_responses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--
-- Name: hot_deals hot_deals_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN
  ALTER TABLE "hot_deals" ADD CONSTRAINT "hot_deals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--
-- Name: notifications notifications_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN
  ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--
-- Name: product_inquiries product_inquiries_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN
  ALTER TABLE "product_inquiries" ADD CONSTRAINT "product_inquiries_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--
-- Name: product_inquiries product_inquiries_sellerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN
  ALTER TABLE "product_inquiries" ADD CONSTRAINT "product_inquiries_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--
-- Name: product_inquiries product_inquiries_storeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN
  ALTER TABLE "product_inquiries" ADD CONSTRAINT "product_inquiries_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"(id) ON UPDATE CASCADE ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--
-- Name: product_inquiries product_inquiries_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN
  ALTER TABLE "product_inquiries" ADD CONSTRAINT "product_inquiries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"(id) ON UPDATE CASCADE ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--
-- Name: return_requests return_requests_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN
  ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--
-- Name: return_requests return_requests_orderItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN
  ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_items"(id) ON UPDATE CASCADE ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--
-- Name: return_requests return_requests_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN
  ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--
-- Name: seller_credit_transactions seller_credit_transactions_storeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN
  ALTER TABLE "seller_credit_transactions" ADD CONSTRAINT "seller_credit_transactions_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--
-- Name: seller_credit_transactions seller_credit_transactions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN
  ALTER TABLE "seller_credit_transactions" ADD CONSTRAINT "seller_credit_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--
-- Name: seller_gelato_settings seller_gelato_settings_sellerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN
  ALTER TABLE "seller_gelato_settings" ADD CONSTRAINT "seller_gelato_settings_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--
-- Name: seller_gelato_settings seller_gelato_settings_storeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN
  ALTER TABLE "seller_gelato_settings" ADD CONSTRAINT "seller_gelato_settings_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--
-- Name: seller_payout_settings seller_payout_settings_sellerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN
  ALTER TABLE "seller_payout_settings" ADD CONSTRAINT "seller_payout_settings_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--
-- Name: seller_payout_settings seller_payout_settings_storeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN
  ALTER TABLE "seller_payout_settings" ADD CONSTRAINT "seller_payout_settings_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--
-- Name: seller_shipments seller_shipments_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN
  ALTER TABLE "seller_shipments" ADD CONSTRAINT "seller_shipments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--
-- Name: seller_shipments seller_shipments_storeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN
  ALTER TABLE "seller_shipments" ADD CONSTRAINT "seller_shipments_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--
-- Name: seller_subscriptions seller_subscriptions_planId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN
  ALTER TABLE "seller_subscriptions" ADD CONSTRAINT "seller_subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "subscription_plans"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--
-- Name: seller_subscriptions seller_subscriptions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN
  ALTER TABLE "seller_subscriptions" ADD CONSTRAINT "seller_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--
-- Name: shipment_events shipment_events_shipmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN
  ALTER TABLE "shipment_events" ADD CONSTRAINT "shipment_events_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "seller_shipments"(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--
-- Name: shipment_items shipment_items_orderItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN
  ALTER TABLE "shipment_items" ADD CONSTRAINT "shipment_items_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_items"(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--
-- Name: shipment_items shipment_items_shipmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN
  ALTER TABLE "shipment_items" ADD CONSTRAINT "shipment_items_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "seller_shipments"(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--
-- Name: store_follows store_follows_storeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN
  ALTER TABLE "store_follows" ADD CONSTRAINT "store_follows_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--
-- Name: store_follows store_follows_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN
  ALTER TABLE "store_follows" ADD CONSTRAINT "store_follows_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--
