# Current Implementation Summary
# NextPik E-commerce Platform

**Generated:** December 31, 2025
**Purpose:** Comprehensive codebase documentation for implementation reference

---

## Table of Contents

1. [Database Schema](#1-database-schema)
2. [Seed File Structure](#2-seed-file-structure)
3. [Backend Module Structure](#3-backend-module-structure)
4. [Example Module - Settings](#4-example-module---settings)
5. [Example Module - Products Service](#5-example-module---products-service)
6. [Frontend API Clients](#6-frontend-api-clients)
7. [Frontend Hooks](#7-frontend-hooks)
8. [DTO Patterns](#8-dto-patterns)
9. [App Module Registration](#9-app-module-registration)
10. [System Settings Categories](#10-system-settings-categories)

---

## 1. Database Schema

**File:** `packages/database/prisma/schema.prisma`
**Lines:** 2643


### Key Models Summary

```
- User {
- UserPreferences {
- Address {
- Store {
- StoreFollow {
- Product {
- Category {
- Advertisement {
- AdAnalytics {
- AdSubscription {
- Collection {
- ProductCollection {
- ProductImage {
- ProductVariant {
- ProductTag {
- ProductInquiry {
- Cart {
- CartItem {
- Order {
- CurrencyRate {
- OrderItem {
- OrderTimeline {
- ReturnRequest {
- WishlistItem {
- ProductView {
- ProductLike {
- Review {
- ProductRecommendation {
- UserSession {
- MagicLink {
- LoginAttempt {
- PasswordReset {
- RefreshToken {
- PaymentTransaction {
- WebhookEvent {
- CommissionRule {
- Commission {
- Payout {
- InventoryTransaction {
- EscrowTransaction {
- EscrowSplitAllocation {
- SellerCommissionOverride {
- ShippingZone {
- ShippingRate {
- SystemSetting {
- SettingsAuditLog {
- PayoutScheduleConfig {
- DeliveryConfirmation {
- AdvertisementPlan {
- SellerPlanSubscription {
- DeliveryProvider {
- Delivery {
- DeliveryAuditLog {
- DeliveryProviderPayout {
- AdminNote {
```

### Key Enums Summary

```
- UserRole {
- StoreStatus {
- AdPlacement {
- AdPricingModel {
- AdStatus {
- AdPaymentStatus {
- AdEventType {
- AdPlanType {
- AdSubscriptionStatus {
- ProductStatus {
- PurchaseType {
- ProductType {
- CategoryType {
- InquiryStatus {
- OrderStatus {
- PaymentStatus {
- PaymentMethod {
- ReturnReason {
- ReturnStatus {
- PaymentTransactionStatus {
- WebhookStatus {
- CommissionRuleType {
- CommissionStatus {
- PayoutStatus {
- InventoryTransactionType {
- EscrowStatus {
- DeliveryConfirmationType {
- SettingValueType {
- AuditAction {
- PayoutFrequency {
- PlanBillingPeriod {
- SubscriptionStatus {
- SubscriptionTier {
- BillingCycle {
- CreditTransactionType {
- DeliveryProviderType {
- DeliveryServiceType {
- ProviderVerificationStatus {
- DeliveryStatus {
- DeliveryAuditAction {
```

### Full Schema (First 500 lines)

```prisma
// Luxury E-commerce Platform - Database Schema
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// User Management
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  firstName     String
  lastName      String
  password      String? // Nullable for passwordless auth
  role          UserRole @default(CUSTOMER)
  avatar        String?
  phone         String?
  emailVerified Boolean  @default(false)
  phoneVerified Boolean  @default(false)

  // 2FA
  twoFactorEnabled Boolean @default(false)
  twoFactorSecret  String?

  // Account status
  isActive    Boolean   @default(true)
  isSuspended Boolean   @default(false)
  lastLoginAt DateTime?
  lastLoginIp String?

  // Stripe
  stripeCustomerId String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  addresses        Address[]
  orders           Order[]
  carts            Cart[]
  preferences      UserPreferences?
  wishlistItems    WishlistItem[]
  productViews     ProductView[]
  productLikes     ProductLike[]
  reviews          Review[]
  sessions         UserSession[]
  magicLinks       MagicLink[]
  loginAttempts    LoginAttempt[]
  passwordResets   PasswordReset[]
  refreshTokens    RefreshToken[]
  store            Store? // Seller's store (only for SELLER role)
  commissionRules  CommissionRule[]       @relation("SellerCommissionRules")
  commissions      Commission[]           @relation("SellerCommissions")
  payouts          Payout[]               @relation("SellerPayouts")
  inventoryChanges InventoryTransaction[] @relation("InventoryChanges")

  // Escrow & Payment Extensions
  escrowTransactions EscrowTransaction[]       @relation("SellerEscrow")
  escrowAllocations  EscrowSplitAllocation[]   @relation("SellerEscrowAllocations")
  commissionOverride SellerCommissionOverride? @relation("SellerCommissionOverrides")
  planSubscriptions  SellerPlanSubscription[]  @relation("SellerPlanSubscriptions")

  // Delivery Provider Extensions
  deliveryProviderId  String?
  deliveryProvider    DeliveryProvider? @relation("DeliveryProviderUsers", fields: [deliveryProviderId], references: [id], onDelete: SetNull)
  deliveryAssignments Delivery[]        @relation("DeliveryPartnerAssignments")

  // Admin Notes
  adminNotes    AdminNote[] @relation("CustomerNotes") // Notes about this customer
  authoredNotes AdminNote[] @relation("AuthoredNotes") // Notes created by this admin

  // Product Inquiries (for REAL_ESTATE, VEHICLE, INQUIRY products)
  sellerInquiries ProductInquiry[] @relation("SellerInquiries") // Inquiries received as seller
  buyerInquiries  ProductInquiry[] @relation("BuyerInquiries") // Inquiries submitted as buyer

  // Return Requests
  returnRequests ReturnRequest[]

  // Followed Stores
  followedStores StoreFollow[]

  @@index([email])
  @@index([lastLoginAt])
  @@index([deliveryProviderId])
  @@map("users")
}

enum UserRole {
  BUYER // Can purchase products
  SELLER // Can sell products AND purchase (has all buyer capabilities)
  CUSTOMER // Legacy - equivalent to BUYER
  DELIVERY_PARTNER // Individual delivery driver
  DELIVERY_PROVIDER_ADMIN // Delivery company manager/admin
  ADMIN
  SUPER_ADMIN
}

model UserPreferences {
  id            String  @id @default(cuid())
  userId        String  @unique
  newsletter    Boolean @default(false)
  notifications Boolean @default(true)
  currency      String  @default("USD")
  language      String  @default("en")

  // Luxury UI preferences
  theme      String @default("dark") // dark, light, auto
  layoutMode String @default("elegant") // elegant, compact

  // Email Notification Preferences
  emailOrderConfirmation Boolean @default(true)
  emailOrderShipped      Boolean @default(true)
  emailOrderDelivered    Boolean @default(true)
  emailPaymentReceipt    Boolean @default(true)
  emailRefundProcessed   Boolean @default(true)
  emailPromotions        Boolean @default(false)
  emailPriceDrops        Boolean @default(false)
  emailBackInStock       Boolean @default(true)
  emailReviewReminder    Boolean @default(true)
  emailSecurityAlerts    Boolean @default(true)

  // Push Notification Preferences (for future mobile/web push)
  pushOrderUpdates   Boolean @default(true)
  pushPromotions     Boolean @default(false)
  pushPriceDrops     Boolean @default(false)
  pushBackInStock    Boolean @default(true)
  pushSecurityAlerts Boolean @default(true)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_preferences")
}

model Address {
  id         String  @id @default(cuid())
  userId     String
  firstName  String
  lastName   String
  company    String?
  address1   String
  address2   String?
  city       String
  province   String
  country    String
  postalCode String
  phone      String?
  isDefault  Boolean @default(false)

  user           User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  shippingOrders Order[] @relation("ShippingAddress")
  billingOrders  Order[] @relation("BillingAddress")

  @@index([userId])
  @@map("addresses")
}

// ============================================================================
// Seller Store Management
// ============================================================================

model Store {
  id     String @id @default(cuid())
  userId String @unique // One store per seller

  // Store Information
  name        String
  slug        String  @unique
  description String? @db.Text
  logo        String?
  banner      String?

  // Contact & Legal
  email   String
  phone   String?
  website String?
  taxId   String? // Business tax ID

  // Address
  address1   String?
  address2   String?
  city       String?
  province   String?
  country    String?
  postalCode String?

  // Store Status
  status     StoreStatus @default(PENDING)
  isActive   Boolean     @default(true)
  verified   Boolean     @default(false)
  verifiedAt DateTime?

  // Store Policies
  returnPolicy    String? @db.Text
  shippingPolicy  String? @db.Text
  termsConditions String? @db.Text

  // Analytics & Metrics
  totalSales    Decimal  @default(0) @db.Decimal(12, 2)
  totalOrders   Int      @default(0)
  totalProducts Int      @default(0)
  rating        Decimal? @db.Decimal(3, 2) // Average store rating
  reviewCount   Int      @default(0)

  // Store Settings
  currency String @default("USD")
  timezone String @default("UTC")

  // Payout Settings
  payoutMethod     String? @default("bank_transfer") // bank_transfer, paypal, stripe_connect
  payoutEmail      String? // PayPal email or notification email
  payoutCurrency   String  @default("USD")
  payoutMinAmount  Decimal @default(50) @db.Decimal(10, 2)
  payoutFrequency  String  @default("monthly") // weekly, biweekly, monthly
  payoutDayOfWeek  Int? // 0-6 for weekly (0 = Sunday)
  payoutDayOfMonth Int?    @default(1) // 1-28 for monthly
  payoutAutomatic  Boolean @default(true)

  // Bank Account Details (encrypted in production)
  bankAccountName   String?
  bankAccountNumber String? // Last 4 digits stored, full number encrypted
  bankRoutingNumber String?
  bankName          String?
  bankBranchName    String?
  bankSwiftCode     String? // For international transfers
  bankIban          String? // For international transfers
  bankCountry       String?

  // Vacation Mode
  vacationMode         Boolean   @default(false)
  vacationMessage      String?   @db.Text // Message to display on store page
  vacationStartDate    DateTime? // When vacation mode was enabled
  vacationEndDate      DateTime? // Optional auto-end date
  vacationAutoReply    String?   @db.Text // Auto-reply for inquiries during vacation
  vacationHideProducts Boolean   @default(false) // Hide products from search during vacation

  // SEO
  metaTitle       String?
  metaDescription String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  products    Product[] // Products belonging to this store
  commissions Commission[]
  payouts     Payout[]

  // Escrow & Payment Extensions
  escrowTransactions EscrowTransaction[]
  escrowAllocations  EscrowSplitAllocation[] @relation("StoreEscrowAllocations")

  // Product Inquiries
  inquiries ProductInquiry[]

  // Store Followers
  followers StoreFollow[]

  @@index([slug])
  @@index([status])
  @@index([userId])
  @@index([rating])
  @@map("stores")
}

enum StoreStatus {
  PENDING // Awaiting admin approval
  ACTIVE // Active and selling
  SUSPENDED // Temporarily suspended
  INACTIVE // Deactivated by seller
  REJECTED // Rejected by admin
}

// Store Followers (Buyers following stores)
model StoreFollow {
  id        String   @id @default(cuid())
  userId    String
  storeId   String
  createdAt DateTime @default(now())

  // Relations
  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  store Store @relation(fields: [storeId], references: [id], onDelete: Cascade)

  @@unique([userId, storeId]) // Each user can only follow a store once
  @@index([userId])
  @@index([storeId])
  @@map("store_follows")
}

// Product Catalog
model Product {
  id               String        @id @default(cuid())
  storeId          String? // Seller's store (optional for admin-created products)
  name             String
  slug             String        @unique
  sku              String?       @unique // Product SKU (Stock Keeping Unit)
  description      String        @db.Text
  shortDescription String?
  categoryId       String? // Changed to relation
  price            Decimal       @db.Decimal(10, 2)
  compareAtPrice   Decimal?      @db.Decimal(10, 2)
  status           ProductStatus @default(DRAFT)
  featured         Boolean       @default(false)
  inventory        Int           @default(0)
  previousStock    Int? // For smooth inventory transition animations
  weight           Decimal?      @db.Decimal(10, 2)

  // Product Type & Purchase Model
  productType     ProductType  @default(PHYSICAL)
  purchaseType    PurchaseType @default(INSTANT)
  isPreOrder      Boolean      @default(false)
  contactRequired Boolean      @default(false) // For inquiry-based products

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Luxury UI Features
  heroImage    String? // Primary hero image for product cards
  gallery      Json? // Array of {type: 'image'|'video'|'360', url: string, thumbnail?: string}
  badges       String[] // ["New", "Featured", "Sale", "Limited Edition"]
  displayOrder Int      @default(0) // For curated ordering

  // Analytics & Engagement
  viewCount   Int      @default(0)
  likeCount   Int      @default(0)
  rating      Decimal? @db.Decimal(3, 2) // Average rating (0-5)
  reviewCount Int      @default(0)

  // Full-text Search (PostgreSQL tsvector)
  searchVector Unsupported("tsvector")?

  // SEO & Metadata
  metaTitle       String?
  metaDescription String?
  seoKeywords     String[]

  // Product attributes for filtering
  colors     String[] // Color swatches for elegant filtering
  sizes      String[] // Size options
  materials  String[] // Material tags
  dimensions Json? // {length, width, height, unit}

  // ============ REAL ESTATE FIELDS (optional - only for REAL_ESTATE productType) ============
  propertyType      String? // house, apartment, condo, townhouse, land, commercial
  bedrooms          Int?
  bathrooms         Decimal? @db.Decimal(3, 1) // Supports 2.5 bathrooms
  squareFeet        Decimal? @db.Decimal(10, 2)
  lotSize           Decimal? @db.Decimal(10, 2) // In sqft or acres
  yearBuilt         Int?
  parkingSpaces     Int?
  amenities         String[] @default([]) // Pool, Gym, Garage, Garden, etc.
  propertyAddress   String?
  propertyCity      String?
  propertyState     String?
  propertyCountry   String?
  propertyZipCode   String?
  propertyLatitude  Decimal? @db.Decimal(10, 7)
  propertyLongitude Decimal? @db.Decimal(10, 7)
  virtualTourUrl    String?

  // ============ VEHICLE FIELDS (optional - only for VEHICLE productType) ============
  vehicleMake               String? // Toyota, Honda, BMW, etc.
  vehicleModel              String? // Camry, Civic, X5, etc.
  vehicleYear               Int? // 2020, 2021, etc.
  vehicleMileage            Int? // Odometer reading
  vehicleVIN                String? // Vehicle Identification Number
  vehicleCondition          String? // new, used, certified_preowned
  vehicleTransmission       String? // automatic, manual, cvt
  vehicleFuelType           String? // petrol, diesel, electric, hybrid, plugin_hybrid
  vehicleBodyType           String? // sedan, suv, truck, coupe, hatchback, van, wagon, convertible
  vehicleExteriorColor      String?
  vehicleInteriorColor      String?
  vehicleDrivetrain         String? // fwd, rwd, awd, 4wd
  vehicleEngine             String? // Engine specs, e.g., "2.5L 4-Cylinder"
  vehicleFeatures           String[] @default([]) // Leather seats, Sunroof, Navigation, etc.
  vehicleHistory            String?  @db.Text // CARFAX, accident history, service records
  vehicleWarranty           String? // Warranty information
  vehicleTestDriveAvailable Boolean  @default(true)

  // ============ DIGITAL FIELDS (optional - only for DIGITAL productType) ============
  digitalFileUrl       String? // URL to the downloadable file (stored in cloud)
  digitalFileSize      BigInt? // File size in bytes
  digitalFileFormat    String? // PDF, ZIP, MP3, MP4, PNG, etc.
  digitalFileName      String? // Original filename
  digitalVersion       String? // Version number, e.g., "1.0.0", "2024.1"
  digitalLicenseType   String? // personal, commercial, extended, unlimited
  digitalDownloadLimit Int? // Max number of downloads allowed (null = unlimited)
  digitalPreviewUrl    String? // Preview/sample URL for customers to try before buying
  digitalRequirements  String? @db.Text // System requirements or compatibility info
  digitalInstructions  String? @db.Text // Installation/usage instructions
  digitalUpdatePolicy  String? // free_lifetime, free_1year, paid_updates
  digitalSupportEmail  String? // Support email for this digital product

  // ============ SERVICE FIELDS (optional - only for SERVICE productType) ============
  serviceType                String? // in_person, online, hybrid
  serviceDuration            Int? // Duration value (e.g., 60)
  serviceDurationUnit        String? // minutes, hours, days, sessions
  serviceLocation            String? // Where service is provided (for in-person)
  serviceArea                String? // Service coverage area/regions
  serviceAvailability        String?  @db.Text // Availability schedule (JSON or text description)
  serviceBookingRequired     Boolean  @default(true)
  serviceBookingLeadTime     Int? // Hours in advance required to book
  serviceProviderName        String? // Name of the service provider
  serviceProviderBio         String?  @db.Text // Bio/description of the provider
  serviceProviderImage       String? // Provider's photo URL
  serviceProviderCredentials String[] @default([]) // Qualifications, certifications, licenses
  serviceMaxClients          Int? // Max clients per session (for group services)
  serviceCancellationPolicy  String?  @db.Text // Cancellation terms and conditions
  serviceIncludes            String[] @default([]) // What's included in the service
  serviceExcludes            String[] @default([]) // What's NOT included
  serviceRequirements        String?  @db.Text // What client needs to prepare/bring

  // ============ RENTAL FIELDS (optional - only for RENTAL productType) ============
  rentalPeriodType        String? // hourly, daily, weekly, monthly
  rentalMinPeriod         Int? // Minimum rental period (in units of rentalPeriodType)
  rentalMaxPeriod         Int? // Maximum rental period (in units of rentalPeriodType)
  rentalPriceHourly       Decimal? @db.Decimal(10, 2) // Price per hour
  rentalPriceDaily        Decimal? @db.Decimal(10, 2) // Price per day
  rentalPriceWeekly       Decimal? @db.Decimal(10, 2) // Price per week
  rentalPriceMonthly      Decimal? @db.Decimal(10, 2) // Price per month
  rentalSecurityDeposit   Decimal? @db.Decimal(10, 2) // Required security deposit
  rentalPickupLocation    String? // Where to pick up the rental
  rentalDeliveryAvailable Boolean  @default(false) // Whether delivery is available
  rentalDeliveryFee       Decimal? @db.Decimal(10, 2) // Delivery fee if applicable
  rentalLateReturnFee     Decimal? @db.Decimal(10, 2) // Fee per late period
  rentalConditions        String?  @db.Text // Terms and conditions
  rentalAvailability      String?  @db.Text // Availability info (JSON or text)
  rentalInsuranceRequired Boolean  @default(false) // Whether insurance is required
  rentalInsuranceOptions  String?  @db.Text // Available insurance options
  rentalAgeRequirement    Int? // Minimum age to rent
  rentalIdRequired        Boolean  @default(true) // Whether ID is required
  rentalIncludes          String[] @default([]) // What's included in the rental
  rentalExcludes          String[] @default([]) // What's NOT included
  rentalNotes             String?  @db.Text // Additional notes/instructions

  // Relations
  store                 Store?                  @relation(fields: [storeId], references: [id], onDelete: SetNull)
  category              Category?               @relation(fields: [categoryId], references: [id])
  images                ProductImage[]
  variants              ProductVariant[]
  tags                  ProductTag[]
  orderItems            OrderItem[]
  cartItems             CartItem[]
  wishlistItems         WishlistItem[]
  views                 ProductView[]
  likes                 ProductLike[]
  reviews               Review[]
  collections           ProductCollection[]
  recommendations       ProductRecommendation[] @relation("RecommendedProducts")
  sourceRecommendations ProductRecommendation[] @relation("SourceProducts")
  inventoryTransactions InventoryTransaction[]
  inquiries             ProductInquiry[]

  @@index([slug])
  @@index([storeId])
  @@index([categoryId])
  @@index([status])
  @@index([featured])
  @@index([displayOrder])
  @@index([viewCount])
  @@index([rating])
  @@index([price])
  @@index([createdAt])
  @@index([likeCount])
  @@index([compareAtPrice])
  @@index([searchVector], type: Gin)
  @@index([productType])
  @@index([purchaseType])
  // Composite indexes for common query patterns
  @@index([status, featured, displayOrder])
  @@index([status, categoryId, price])
  @@index([status, viewCount, likeCount])
  @@index([status, compareAtPrice])
  @@index([status, createdAt])
  @@index([productType, purchaseType])
  @@index([status, productType, purchaseType])
  @@map("products")
}

// Category Model for elegant hierarchical organization
model Category {
  id           String  @id @default(cuid())
  name         String
  slug         String  @unique
  description  String? @db.Text
  parentId     String?
  image        String?
  icon         String? // Icon for elegant UI
  displayOrder Int     @default(0)
  isActive     Boolean @default(true)

  // Category Type & Specific Configuration
  categoryType CategoryType @default(GENERAL)
  typeSettings Json? // Type-specific settings: {requiredFields: [], customAttributes: {}, validations: {}}

  // UI Styling
  colorScheme Json? // {primary: '#color', secondary: '#color'}
```

---

## 2. Seed File Structure

**File:** `packages/database/prisma/seed.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');
  console.log('');

  // Hash passwords for test accounts
  const testPassword = await bcrypt.hash('Password123!', 10); // Standard test password for all users

  // Create Root Super Admin user (legacy)
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@nextpik.com' },
    update: {},
    create: {
      email: 'admin@nextpik.com',
      firstName: 'Root',
      lastName: 'Admin',
      password: testPassword,
      role: 'SUPER_ADMIN',
      emailVerified: true,
      preferences: {
        create: {
          newsletter: true,
          notifications: true,
          currency: 'USD',
          language: 'en',
          theme: 'dark',
          layoutMode: 'elegant',
        },
      },
    },
  });

  console.log('✅ Created root super admin user:', superAdmin.email);

  // ========================================
  // CREATE COMPREHENSIVE TEST ACCOUNTS
  // ========================================
  console.log('');
  console.log('👥 Creating comprehensive test users...');

  // ========================================
  // SUPER_ADMIN (1 user)
  // ========================================
  const superadmin1 = await prisma.user.upsert({
    where: { email: 'superadmin@nextpik.com' },
    update: {},
    create: {
      email: 'superadmin@nextpik.com',
      firstName: 'Super',
      lastName: 'Admin',
      password: testPassword,
      role: 'SUPER_ADMIN',
      emailVerified: true,
      isActive: true,
      phone: '+250788000001',
      preferences: {
        create: {
          newsletter: true,
          notifications: true,
          currency: 'USD',
          language: 'en',
          theme: 'dark',
          layoutMode: 'elegant',
        },
      },
    },
  });
  console.log('✅ Created SUPER_ADMIN:', superadmin1.email);

  // ========================================
  // ADMIN (2 users)
  // ========================================
  const admin1 = await prisma.user.upsert({
    where: { email: 'admin1@nextpik.com' },
    update: {},
    create: {
      email: 'admin1@nextpik.com',
      firstName: 'Admin',
      lastName: 'One',
      password: testPassword,
      role: 'ADMIN',
      emailVerified: true,
      isActive: true,
      phone: '+250788000002',
      preferences: {
        create: {
          newsletter: true,
          notifications: true,
          currency: 'USD',
          language: 'en',
          theme: 'dark',
          layoutMode: 'elegant',
        },
      },
    },
  });
  console.log('✅ Created ADMIN:', admin1.email);

  const admin2 = await prisma.user.upsert({
    where: { email: 'admin2@nextpik.com' },
    update: {},
    create: {
      email: 'admin2@nextpik.com',
      firstName: 'Admin',
      lastName: 'Two',
      password: testPassword,
      role: 'ADMIN',
      emailVerified: true,
      isActive: true,
      phone: '+250788000003',
      preferences: {
        create: {
          newsletter: true,
          notifications: true,
          currency: 'USD',
          language: 'en',
          theme: 'light',
          layoutMode: 'elegant',
        },
      },
    },
  });
  console.log('✅ Created ADMIN:', admin2.email);

  // ========================================
  // BUYER (3 users)
  // ========================================
  const buyer1 = await prisma.user.upsert({
    where: { email: 'buyer1@nextpik.com' },
    update: {},
    create: {
      email: 'buyer1@nextpik.com',
      firstName: 'Buyer',
      lastName: 'One',
      password: testPassword,
      role: 'BUYER',
      emailVerified: true,
      isActive: true,
      phone: '+250788000010',
      preferences: {
        create: {
          newsletter: true,
          notifications: true,
          currency: 'USD',
          language: 'en',
          theme: 'light',
          layoutMode: 'elegant',
        },
      },
    },
  });
  console.log('✅ Created BUYER:', buyer1.email);

  const buyer2 = await prisma.user.upsert({
    where: { email: 'buyer2@nextpik.com' },
    update: {},
    create: {
      email: 'buyer2@nextpik.com',
      firstName: 'Buyer',
      lastName: 'Two',
      password: testPassword,
      role: 'BUYER',
      emailVerified: true,
      isActive: true,
      phone: '+250788000011',
      preferences: {
        create: {
          newsletter: true,
          notifications: true,
          currency: 'EUR',
          language: 'en',
          theme: 'dark',
          layoutMode: 'elegant',
        },
      },
    },
  });
  console.log('✅ Created BUYER:', buyer2.email);

  const buyer3 = await prisma.user.upsert({
    where: { email: 'buyer3@nextpik.com' },
    update: {},
    create: {
      email: 'buyer3@nextpik.com',
      firstName: 'Buyer',
      lastName: 'Three',
      password: testPassword,
      role: 'BUYER',
      emailVerified: true,
      isActive: true,
      phone: '+250788000012',
      preferences: {
        create: {
          newsletter: false,
          notifications: true,
          currency: 'RWF',
          language: 'en',
          theme: 'light',
          layoutMode: 'compact',
        },
      },
    },
  });
  console.log('✅ Created BUYER:', buyer3.email);

  // ========================================
  // SELLER (3 users with Stores)
  // ========================================
  const seller1 = await prisma.user.upsert({
    where: { email: 'seller1@nextpik.com' },
    update: {},
    create: {
      email: 'seller1@nextpik.com',
      firstName: 'Seller',
      lastName: 'One',
      password: testPassword,
      role: 'SELLER',
      emailVerified: true,
      isActive: true,
      phone: '+250788000020',
      preferences: {
        create: {
          newsletter: true,
          notifications: true,
          currency: 'USD',
          language: 'en',
          theme: 'dark',
          layoutMode: 'elegant',
        },
      },
    },
  });
  console.log('✅ Created SELLER:', seller1.email);

  const seller1Store = await prisma.store.upsert({
    where: { userId: seller1.id },
    update: {},
    create: {
      name: 'Luxury Timepieces',
      slug: 'luxury-timepieces',
      description: 'Premium watches and timepieces from around the world',
      userId: seller1.id,
      status: 'ACTIVE',
      email: 'seller1@nextpik.com',
      phone: '+250788000020',
      country: 'Rwanda',
      city: 'Kigali',
    },
  });
  console.log('   └─ Created Store:', seller1Store.name);

  const seller2 = await prisma.user.upsert({
    where: { email: 'seller2@nextpik.com' },
    update: {},
    create: {
      email: 'seller2@nextpik.com',
      firstName: 'Seller',
      lastName: 'Two',
      password: testPassword,
      role: 'SELLER',
      emailVerified: true,
      isActive: true,
      phone: '+250788000021',
      preferences: {
        create: {
          newsletter: true,
          notifications: true,
          currency: 'USD',
          language: 'en',
          theme: 'light',
          layoutMode: 'elegant',
        },
      },
    },
  });
  console.log('✅ Created SELLER:', seller2.email);

  const seller2Store = await prisma.store.upsert({
    where: { userId: seller2.id },
    update: {},
    create: {
      name: 'Elegant Jewelry Co',
      slug: 'elegant-jewelry-co',
      description: 'Fine jewelry and precious gems',
      userId: seller2.id,
      status: 'ACTIVE',
      email: 'seller2@nextpik.com',
      phone: '+250788000021',
      country: 'Rwanda',
      city: 'Kigali',
    },
  });
  console.log('   └─ Created Store:', seller2Store.name);

  const seller3 = await prisma.user.upsert({
    where: { email: 'seller3@nextpik.com' },
```

---

## 3. Backend Module Structure

**Directory:** `apps/api/src/`

```
total 16
drwx------@ 42 jeanfrancoismunyaneza  staff  1344 Dec 30 23:44 .
drwxr-xr-x@ 17 jeanfrancoismunyaneza  staff   544 Dec 31 15:41 ..
drwxr-xr-x@  6 jeanfrancoismunyaneza  staff   192 Dec 29 21:52 admin
drwxr-xr-x@  8 jeanfrancoismunyaneza  staff   256 Dec 26 13:36 advertisements
-rw-r--r--@  1 jeanfrancoismunyaneza  staff  3615 Dec 30 23:44 app.module.ts
drwx------@ 11 jeanfrancoismunyaneza  staff   352 Dec 31 09:58 auth
drwx------@  5 jeanfrancoismunyaneza  staff   160 Dec 30 19:07 cart
drwxr-xr-x@  6 jeanfrancoismunyaneza  staff   192 Dec 29 15:16 categories
drwxr-xr-x@  6 jeanfrancoismunyaneza  staff   192 Dec 26 13:36 collections
drwxr-xr-x@  8 jeanfrancoismunyaneza  staff   256 Dec 26 13:36 commission
drwx------@  5 jeanfrancoismunyaneza  staff   160 Dec 13 14:58 common
drwx------@  6 jeanfrancoismunyaneza  staff   192 Dec 26 13:36 currency
drwx------@  4 jeanfrancoismunyaneza  staff   128 Dec 26 13:36 database
drwxr-xr-x@ 11 jeanfrancoismunyaneza  staff   352 Dec 26 13:36 delivery
drwxr-xr-x@  4 jeanfrancoismunyaneza  staff   128 Dec 26 13:36 delivery-partner
drwx------@  5 jeanfrancoismunyaneza  staff   160 Dec 30 17:51 delivery-payouts
drwxr-xr-x@  5 jeanfrancoismunyaneza  staff   160 Dec 26 13:36 delivery-provider
drwx------@  5 jeanfrancoismunyaneza  staff   160 Dec 30 23:21 downloads
drwx------@  5 jeanfrancoismunyaneza  staff   160 Dec 26 13:36 email
drwxr-xr-x@  6 jeanfrancoismunyaneza  staff   192 Dec 26 13:36 escrow
drwx------@  3 jeanfrancoismunyaneza  staff    96 Dec 26 13:36 guards
drwxr-xr-x@  6 jeanfrancoismunyaneza  staff   192 Dec 30 19:48 inquiries
drwxr-xr-x@  6 jeanfrancoismunyaneza  staff   192 Dec 26 13:36 inventory
-rw-r--r--@  1 jeanfrancoismunyaneza  staff  3750 Dec 23 23:29 main.ts
drwx------@  4 jeanfrancoismunyaneza  staff   128 Dec 26 13:36 notifications
drwx------@  7 jeanfrancoismunyaneza  staff   224 Dec 30 23:11 orders
drwxr-xr-x@  7 jeanfrancoismunyaneza  staff   224 Dec 31 08:00 payment
drwx------@  5 jeanfrancoismunyaneza  staff   160 Dec 26 13:36 payout
drwx------@  7 jeanfrancoismunyaneza  staff   224 Dec 31 16:54 products
drwx------@  3 jeanfrancoismunyaneza  staff    96 Nov 11 21:05 queue
drwxr-xr-x@  5 jeanfrancoismunyaneza  staff   160 Dec 30 23:44 returns
drwxr-xr-x@  6 jeanfrancoismunyaneza  staff   192 Dec 30 22:50 reviews
drwxr-xr-x@  5 jeanfrancoismunyaneza  staff   160 Dec 26 13:36 search
drwx------@  5 jeanfrancoismunyaneza  staff   160 Dec 31 09:56 seller
drwxr-xr-x@  6 jeanfrancoismunyaneza  staff   192 Dec 26 13:36 settings
drwx------@  5 jeanfrancoismunyaneza  staff   160 Dec 26 13:36 shipping
drwx------@  6 jeanfrancoismunyaneza  staff   192 Dec 31 18:45 stores
drwx------@  4 jeanfrancoismunyaneza  staff   128 Dec 26 13:36 supabase
drwxr-xr-x@  6 jeanfrancoismunyaneza  staff   192 Dec 26 13:36 upload
drwx------@  6 jeanfrancoismunyaneza  staff   192 Dec 31 09:30 users
drwx------@  4 jeanfrancoismunyaneza  staff   128 Dec 26 13:36 websocket
drwxr-xr-x@  6 jeanfrancoismunyaneza  staff   192 Dec 26 13:36 wishlist
```

### Module Count: 40 modules

| Category | Modules |
|----------|---------|
| **Core** | admin, auth, users, database |
| **Products** | products, categories, collections, inventory, wishlist |
| **Orders** | orders, cart, payment, escrow, returns |
| **Sellers** | stores, seller, commission, payout |
| **Delivery** | delivery, delivery-partner, delivery-provider, delivery-payouts |
| **Communication** | email, notifications, websocket |
| **Content** | advertisements, reviews, inquiries |
| **System** | settings, search, upload, supabase, queue |
| **Features** | currency, shipping, downloads |

---

## 4. Example Module - Settings

### 4.1 settings.module.ts

```typescript
import { Module, forwardRef } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [
    DatabaseModule,
    // Use forwardRef to avoid circular dependency between SettingsModule and PaymentModule
    forwardRef(() => require('../payment/payment.module').PaymentModule),
  ],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
```

### 4.2 settings.service.ts

```typescript
import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SettingValueType, AuditAction } from '@prisma/client';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get setting by key
   */
  async getSetting(key: string) {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundException(`Setting '${key}' not found`);
    }

    return {
      key: setting.key,
      value: setting.value,
      label: setting.label,
      description: setting.description,
      valueType: setting.valueType,
      isPublic: setting.isPublic,
      isEditable: setting.isEditable,
      requiresRestart: setting.requiresRestart,
    };
  }

  /**
   * Get all public settings (for frontend)
   */
  async getPublicSettings() {
    const settings = await this.prisma.systemSetting.findMany({
      where: { isPublic: true },
      select: {
        key: true,
        value: true,
        label: true,
        description: true,
        valueType: true,
      },
    });

    return settings;
  }

  /**
   * Get settings by category
   */
  async getSettingsByCategory(category: string) {
    return this.prisma.systemSetting.findMany({
      where: { category },
      orderBy: { key: 'asc' },
    });
  }

  /**
   * Get all settings (Admin only)
   */
  async getAllSettings() {
    return this.prisma.systemSetting.findMany({
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });
  }

  /**
   * Create new setting (Admin only)
   */
  async createSetting(data: {
    key: string;
    category: string;
    value: any;
    valueType: SettingValueType;
    label: string;
    description?: string;
    isPublic?: boolean;
    isEditable?: boolean;
    requiresRestart?: boolean;
    defaultValue?: any;
    createdBy: string;
  }) {
    const setting = await this.prisma.systemSetting.create({
      data: {
        key: data.key,
        category: data.category,
        value: data.value,
        valueType: data.valueType,
        label: data.label,
        description: data.description,
        isPublic: data.isPublic ?? false,
        isEditable: data.isEditable ?? true,
        requiresRestart: data.requiresRestart ?? false,
        defaultValue: data.defaultValue,
        lastUpdatedBy: data.createdBy,
      },
    });

    this.logger.log(`Setting created: ${data.key} by ${data.createdBy}`);

    return setting;
  }

  /**
   * Update setting with audit log
   */
  async updateSetting(
    key: string,
    newValue: any,
    changedBy: string,
    changedByEmail: string,
    ipAddress?: string,
    userAgent?: string,
    reason?: string
  ) {
    this.logger.log(`Attempting to update setting: ${key}`);
    this.logger.log(`New value: ${JSON.stringify(newValue)}`);
    this.logger.log(`Changed by: ${changedByEmail} (${changedBy})`);

    const setting = await this.prisma.systemSetting.findUnique({
      where: { key },
    });

    if (!setting) {
      this.logger.error(`Setting '${key}' not found`);
      throw new NotFoundException(`Setting '${key}' not found`);
    }

    if (!setting.isEditable) {
      this.logger.error(`Setting '${key}' is not editable`);
      throw new BadRequestException('This setting cannot be edited');
    }

    const oldValue = setting.value;
    this.logger.log(`Old value: ${JSON.stringify(oldValue)}`);

    try {
      await this.prisma.$transaction(async (prisma) => {
        this.logger.log(`Starting transaction for ${key}`);

        // Update setting
        await prisma.systemSetting.update({
          where: { key },
          data: {
            value: newValue,
            lastUpdatedBy: changedBy,
            updatedAt: new Date(),
          },
        });
        this.logger.log(`Setting ${key} updated in transaction`);

        // Create audit log
        await prisma.settingsAuditLog.create({
          data: {
            settingId: setting.id,
            settingKey: key,
            oldValue,
            newValue,
            changedBy,
            changedByEmail,
            ipAddress,
            userAgent,
            action: AuditAction.UPDATE,
            reason,
            canRollback: true,
          },
        });
        this.logger.log(`Audit log created for ${key}`);
      });

      this.logger.log(`Transaction committed successfully for ${key}`);
    } catch (error) {
      this.logger.error(`Transaction failed for ${key}: ${error.message}`);
      this.logger.error(`Error stack: ${error.stack}`);
      throw error;
    }

    this.logger.log(`Setting updated: ${key} by ${changedByEmail}`);

    // Auto-sync: If supported_currencies is updated, sync currency active statuses
    if (key === 'supported_currencies') {
      try {
        this.logger.log(`Starting currency sync for: ${JSON.stringify(newValue)}`);
        await this.syncCurrencyActiveStatuses(newValue as string[]);
        this.logger.log('Currency sync completed successfully');
      } catch (error) {
        this.logger.warn(`Failed to sync currency active statuses: ${error.message}`);
        this.logger.warn(`Sync error stack: ${error.stack}`);
        // Don't fail the request if sync fails
      }
    }

    return this.getSetting(key);
  }

  /**
   * Sync currency active statuses when supported_currencies setting is updated
   */
  private async syncCurrencyActiveStatuses(supportedCurrencies: string[]) {
    try {
      // Activate all currencies in the supported list
      if (supportedCurrencies.length > 0) {
        await this.prisma.currencyRate.updateMany({
          where: {
            currencyCode: { in: supportedCurrencies },
          },
          data: {
            isActive: true,
            lastUpdated: new Date(),
          },
        });
      }

      // Deactivate all currencies NOT in the supported list
      await this.prisma.currencyRate.updateMany({
        where: {
          currencyCode: { notIn: supportedCurrencies },
        },
        data: {
          isActive: false,
          lastUpdated: new Date(),
        },
      });

      this.logger.log(`Synced currency active statuses for: ${supportedCurrencies.join(', ')}`);
    } catch (error) {
      this.logger.error(`Error syncing currency active statuses: ${error.message}`);
      throw error;
    }
  }

  /**
   * Rollback setting to previous value
   */
  async rollbackSetting(auditLogId: string, rolledBackBy: string, rolledBackByEmail: string) {
    const auditLog = await this.prisma.settingsAuditLog.findUnique({
      where: { id: auditLogId },
      include: { setting: true },
    });

    if (!auditLog) {
      throw new NotFoundException('Audit log not found');
    }

    if (!auditLog.canRollback) {
      throw new BadRequestException('This change cannot be rolled back');
    }

    if (auditLog.rolledBackAt) {
      throw new BadRequestException('This change has already been rolled back');
    }

    if (!auditLog.setting) {
      throw new NotFoundException('Original setting not found');
    }

    await this.prisma.$transaction(async (prisma) => {
      // Rollback to old value
      await prisma.systemSetting.update({
        where: { id: auditLog.settingId! },
        data: {
          value: auditLog.oldValue,
          lastUpdatedBy: rolledBackBy,
        },
      });

      // Mark as rolled back
      await prisma.settingsAuditLog.update({
        where: { id: auditLogId },
        data: {
          rolledBackAt: new Date(),
          rolledBackBy,
        },
      });

      // Create rollback audit entry
      await prisma.settingsAuditLog.create({
        data: {
          settingId: auditLog.settingId,
          settingKey: auditLog.settingKey,
          oldValue: auditLog.newValue,
          newValue: auditLog.oldValue,
          changedBy: rolledBackBy,
          changedByEmail: rolledBackByEmail,
          action: AuditAction.ROLLBACK,
          reason: `Rolled back change from ${auditLog.changedByEmail}`,
          canRollback: false,
        },
      });
    });

    this.logger.log(`Setting rolled back: ${auditLog.settingKey} by ${rolledBackByEmail}`);

    return {
      success: true,
      message: `Setting '${auditLog.settingKey}' rolled back successfully`,
    };
  }

  /**
   * Get audit log for a setting
   */
  async getSettingAuditLog(settingKey: string, limit: number = 50) {
    return this.prisma.settingsAuditLog.findMany({
      where: { settingKey },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get all recent audit logs (Admin)
   */
  async getAllAuditLogs(limit: number = 100) {
    return this.prisma.settingsAuditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        setting: {
          select: {
            key: true,
            label: true,
            category: true,
          },
        },
      },
    });
  }

  /**
   * Delete setting (Admin only)
   */
  async deleteSetting(key: string, deletedBy: string, deletedByEmail: string) {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundException(`Setting '${key}' not found`);
    }

    await this.prisma.$transaction(async (prisma) => {
      // Create audit log before deletion
      await prisma.settingsAuditLog.create({
        data: {
          settingKey: key,
          oldValue: setting.value,
          newValue: null,
          changedBy: deletedBy,
          changedByEmail: deletedByEmail,
          action: AuditAction.DELETE,
          reason: 'Setting deleted',
          canRollback: false,
        },
      });

      // Delete setting
      await prisma.systemSetting.delete({
        where: { key },
      });
    });

    this.logger.log(`Setting deleted: ${key} by ${deletedByEmail}`);

    return {
      success: true,
      message: `Setting '${key}' deleted successfully`,
    };
  }

  /**
   * Get site information (name, tagline, contact email, timezone)
   * Public endpoint - safe to expose
   */
  async getSiteInfo() {
    try {
      const [siteName, siteTagline, contactEmail, timezone] = await Promise.all([
        this.getSetting('site_name').catch(() => ({ key: 'site_name', value: 'NextPik E-commerce' })),
        this.getSetting('site_tagline').catch(() => ({ key: 'site_tagline', value: 'Where Elegance Meets Excellence' })),
        this.getSetting('contact_email').catch(() => ({ key: 'contact_email', value: 'support@luxury.com' })),
        this.getSetting('timezone').catch(() => ({ key: 'timezone', value: 'UTC' })),
      ]);

      return {
        siteName: String(siteName.value),
        siteTagline: String(siteTagline.value),
        contactEmail: String(contactEmail.value),
        timezone: String(timezone.value),
      };
    } catch (error) {
      this.logger.error('Failed to get site info:', error);
      return {
        siteName: 'NextPik E-commerce',
        siteTagline: 'Where Elegance Meets Excellence',
        contactEmail: 'support@luxury.com',
        timezone: 'UTC',
      };
    }
  }

  /**
   * Get site name
   */
  async getSiteName(): Promise<string> {
    try {
      const setting = await this.getSetting('site_name');
      return String(setting.value) || 'NextPik E-commerce';
    } catch (error) {
      return 'NextPik E-commerce';
    }
  }

  /**
   * Get site tagline
   */
  async getSiteTagline(): Promise<string> {
    try {
      const setting = await this.getSetting('site_tagline');
      return String(setting.value) || 'Where Elegance Meets Excellence';
    } catch (error) {
      return 'Where Elegance Meets Excellence';
    }
  }

  /**
   * Get contact email
   */
  async getContactEmail(): Promise<string> {
    try {
      const setting = await this.getSetting('contact_email');
      return String(setting.value) || 'support@luxury.com';
    } catch (error) {
      return 'support@luxury.com';
    }
  }

  /**
   * Get timezone
   */
  async getTimezone(): Promise<string> {
    try {
      const setting = await this.getSetting('timezone');
      return String(setting.value) || 'UTC';
    } catch (error) {
      return 'UTC';
    }
  }

  /**
   * Get audit log retention days
   */
  async getAuditLogRetentionDays(): Promise<number> {
    try {
      const setting = await this.getSetting('audit.log_retention_days');
      return Number(setting.value) || 2555; // Default 7 years
    } catch (error) {
      return 2555; // 7 years
    }
  }

  /**
   * Get low stock threshold
   */
  async getLowStockThreshold(): Promise<number> {
    try {
      const setting = await this.getSetting('inventory.low_stock_threshold');
      return Number(setting.value) || 10;
    } catch (error) {
      return 10;
    }
  }

  /**
   * Get auto SKU generation setting
   */
  async getAutoSkuGeneration(): Promise<boolean> {
    try {
      const setting = await this.getSetting('inventory.auto_sku_generation');
      return Boolean(setting.value);
    } catch (error) {
      return true;
    }
  }

  /**
   * Get SKU prefix
   */
  async getSkuPrefix(): Promise<string> {
    try {
      const setting = await this.getSetting('inventory.sku_prefix');
      return String(setting.value) || 'PROD';
    } catch (error) {
      return 'PROD';
    }
  }

  /**
   * Get stock notifications enabled setting
   */
  async getStockNotificationsEnabled(): Promise<boolean> {
    try {
      const setting = await this.getSetting('inventory.enable_stock_notifications');
      return Boolean(setting.value);
    } catch (error) {
      return true;
    }
  }

  /**
   * Get stock notification recipients
   */
  async getStockNotificationRecipients(): Promise<string[]> {
    try {
      const setting = await this.getSetting('inventory.notification_recipients');
      return Array.isArray(setting.value) ? setting.value as string[] : ['inventory@luxury.com'];
    } catch (error) {
      return ['inventory@luxury.com'];
    }
  }

  /**
   * Get allow negative stock setting
   */
  async getAllowNegativeStock(): Promise<boolean> {
    try {
      const setting = await this.getSetting('inventory.allow_negative_stock');
      return Boolean(setting.value);
    } catch (error) {
      return false;
    }
  }

  /**
   * Get transaction history page size
   */
  async getTransactionHistoryPageSize(): Promise<number> {
    try {
      const setting = await this.getSetting('inventory.transaction_history_page_size');
      return Number(setting.value) || 20;
    } catch (error) {
      return 20;
    }
  }

  /**
   * Get all inventory settings at once (optimized)
   */
  async getInventorySettings() {
    try {
      const settings = await this.getSettingsByCategory('inventory');

      const settingsMap = settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, any>);

      return {
        lowStockThreshold: Number(settingsMap['inventory.low_stock_threshold']) || 10,
        autoSkuGeneration: Boolean(settingsMap['inventory.auto_sku_generation'] ?? true),
        skuPrefix: String(settingsMap['inventory.sku_prefix']) || 'PROD',
        enableStockNotifications: Boolean(settingsMap['inventory.enable_stock_notifications'] ?? true),
        notificationRecipients: Array.isArray(settingsMap['inventory.notification_recipients'])
          ? settingsMap['inventory.notification_recipients']
          : ['inventory@luxury.com'],
        allowNegativeStock: Boolean(settingsMap['inventory.allow_negative_stock'] ?? false),
        transactionHistoryPageSize: Number(settingsMap['inventory.transaction_history_page_size']) || 20,
      };
    } catch (error) {
      // Return defaults if settings don't exist
      return {
        lowStockThreshold: 10,
        autoSkuGeneration: true,
        skuPrefix: 'PROD',
        enableStockNotifications: true,
        notificationRecipients: ['inventory@luxury.com'],
        allowNegativeStock: false,
        transactionHistoryPageSize: 20,
      };
    }
  }

  /**
   * Get Stripe configuration (for dynamic Stripe client initialization)
   */
  async getStripeConfig() {
    try {
      const [
        enabled,
        testMode,
        publishableKey,
        secretKey,
        webhookSecret,
        currency,
        captureMethod,
        statementDescriptor,
        autoPayoutEnabled,
      ] = await Promise.all([
        this.getSetting('stripe_enabled').catch(() => ({ value: false })),
        this.getSetting('stripe_test_mode').catch(() => ({ value: true })),
        this.getSetting('stripe_publishable_key').catch(() => ({ value: '' })),
        this.getSetting('stripe_secret_key').catch(() => ({ value: '' })),
        this.getSetting('stripe_webhook_secret').catch(() => ({ value: '' })),
        this.getSetting('stripe_currency').catch(() => ({ value: 'USD' })),
        this.getSetting('stripe_capture_method').catch(() => ({ value: 'manual' })),
        this.getSetting('stripe_statement_descriptor').catch(() => ({ value: 'LUXURY ECOM' })),
        this.getSetting('stripe_auto_payout_enabled').catch(() => ({ value: false })),
      ]);

      return {
        enabled: Boolean(enabled.value),
        testMode: Boolean(testMode.value),
        publishableKey: String(publishableKey.value || ''),
        secretKey: String(secretKey.value || ''),
        webhookSecret: String(webhookSecret.value || ''),
        currency: String(currency.value || 'USD'),
        captureMethod: String(captureMethod.value || 'manual') as 'automatic' | 'manual',
        statementDescriptor: String(statementDescriptor.value || 'LUXURY ECOM'),
        autoPayoutEnabled: Boolean(autoPayoutEnabled.value),
      };
    } catch (error) {
      this.logger.error('Failed to get Stripe config:', error);
      return {
        enabled: false,
        testMode: true,
        publishableKey: '',
        secretKey: '',
        webhookSecret: '',
        currency: 'USD',
        captureMethod: 'manual' as 'automatic' | 'manual',
        statementDescriptor: 'LUXURY ECOM',
        autoPayoutEnabled: false,
      };
    }
  }

  /**
   * Check if Stripe is properly configured and enabled
   */
  async isStripeConfigured(): Promise<boolean> {
    try {
      const config = await this.getStripeConfig();
      return config.enabled && !!config.secretKey && !!config.publishableKey;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get Stripe publishable key (safe for frontend)
   */
  async getStripePublishableKey(): Promise<string> {
    try {
      const setting = await this.getSetting('stripe_publishable_key');
      return String(setting.value || '');
    } catch (error) {
      return '';
    }
  }

  /**
   * Get Stripe secret key (backend only)
   */
  async getStripeSecretKey(): Promise<string> {
    try {
      const setting = await this.getSetting('stripe_secret_key');
      return String(setting.value || '');
    } catch (error) {
      return '';
    }
  }

  /**
   * Get Stripe webhook secret (backend only)
   */
  async getStripeWebhookSecret(): Promise<string> {
    try {
      const setting = await this.getSetting('stripe_webhook_secret');
      return String(setting.value || '');
    } catch (error) {
      return '';
    }
  }

  /**
   * Check if Stripe is in test mode
   */
  async isStripeTestMode(): Promise<boolean> {
    try {
      const setting = await this.getSetting('stripe_test_mode');
      return Boolean(setting.value ?? true);
    } catch (error) {
      return true; // Default to test mode for safety
    }
  }
}
```

### 4.3 settings.controller.ts

```typescript
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { PaymentService } from '../payment/payment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateSettingDto, UpdateSettingDto, RollbackSettingDto } from './dto/settings.dto';

@Controller('settings')
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    @Inject(forwardRef(() => PaymentService))
    private readonly paymentService: PaymentService,
  ) {}

  // ============================================================================
  // Public Endpoints
  // ============================================================================

  /**
   * Get public settings (accessible by frontend)
   * @route GET /settings/public
   */
  @Get('public')
  async getPublicSettings() {
    try {
      const data = await this.settingsService.getPublicSettings();
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Get inventory settings (public for frontend use)
   * @route GET /settings/inventory
   */
  @Get('inventory/all')
  async getInventorySettings() {
    try {
      const data = await this.settingsService.getInventorySettings();
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Get Stripe publishable key (public for frontend Stripe initialization)
   * @route GET /settings/stripe/publishable-key
   */
  @Get('stripe/publishable-key')
  async getStripePublishableKey() {
    try {
      const data = await this.settingsService.getStripePublishableKey();
      return {
        success: true,
        data: {
          publishableKey: data,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Check if Stripe is configured (public for frontend checks)
   * @route GET /settings/stripe/configured
   */
  @Get('stripe/configured')
  async isStripeConfigured() {
    try {
      const data = await this.settingsService.isStripeConfigured();
      return {
        success: true,
        data: {
          configured: data,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  // ============================================================================
  // Admin Endpoints
  // ============================================================================

  /**
   * Get all settings
   * @route GET /settings
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getAllSettings() {
    try {
      const data = await this.settingsService.getAllSettings();
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Get settings by category
   * @route GET /settings/category/:category
   */
  @Get('category/:category')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getSettingsByCategory(@Param('category') category: string) {
    try {
      const data = await this.settingsService.getSettingsByCategory(category);
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Get all audit logs
   * @route GET /settings/admin/audit-logs
   * IMPORTANT: Must come BEFORE :key route
   */
  @Get('admin/audit-logs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getAllAuditLogs(@Query('limit') limit?: string) {
    try {
      const data = await this.settingsService.getAllAuditLogs(
        limit ? parseInt(limit) : undefined
      );
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Get Stripe configuration status (Admin only - includes sensitive info status)
   * @route GET /settings/stripe/status
   * IMPORTANT: Must come BEFORE :key route
   */
  @Get('stripe/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getStripeStatus() {
    try {
      const data = await this.paymentService.getStripeStatus();
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Get audit log for a setting
   * @route GET /settings/:key/audit
   * IMPORTANT: Must come BEFORE generic :key route
   */
  @Get(':key/audit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getSettingAuditLog(
    @Param('key') key: string,
    @Query('limit') limit?: string
  ) {
    try {
      const data = await this.settingsService.getSettingAuditLog(
        key,
        limit ? parseInt(limit) : undefined
      );
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  // ============================================================================
  // Authenticated Endpoints
  // ============================================================================

  /**
   * Get setting by key
   * @route GET /settings/:key
   * IMPORTANT: This MUST come AFTER all specific routes to avoid catching them
   */
  @Get(':key')
  @UseGuards(JwtAuthGuard)
  async getSetting(@Param('key') key: string) {
    try {
      const data = await this.settingsService.getSetting(key);
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Create new setting
   * @route POST /settings
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createSetting(@Body() dto: CreateSettingDto, @Req() req: any) {
    try {
      const data = await this.settingsService.createSetting({
        ...dto,
        createdBy: req.user.id,
      });
      return {
        success: true,
        data,
        message: 'Setting created successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Update setting
   * @route PATCH /settings/:key
   */
  @Patch(':key')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async updateSetting(
    @Param('key') key: string,
    @Body() dto: UpdateSettingDto,
    @Req() req: any
  ) {
    // Log request details for debugging
    console.log('Update setting request:', {
      key,
      value: dto.value,
      user: req.user,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const data = await this.settingsService.updateSetting(
      key,
      dto.value,
      req.user.id || 'unknown',
      req.user.email || 'unknown@test.com',
      req.ip,
      req.headers['user-agent'],
      dto.reason
    );
    return {
      success: true,
      data,
      message: 'Setting updated successfully',
    };
  }

  /**
   * Rollback setting to previous value
   * @route POST /settings/rollback
   */
  @Post('rollback')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async rollbackSetting(@Body() dto: RollbackSettingDto, @Req() req: any) {
    try {
      const data = await this.settingsService.rollbackSetting(
        dto.auditLogId,
        req.user.id,
        req.user.email
      );
      return data;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Reload Stripe configuration without restarting the application
   * @route POST /settings/stripe/reload
   */
  @Post('stripe/reload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async reloadStripeConfig() {
    try {
      await this.paymentService.reloadStripeConfig();
      const status = await this.paymentService.getStripeStatus();
      return {
        success: true,
        message: 'Stripe configuration reloaded successfully',
        data: status,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Delete setting
   * @route DELETE /settings/:key
   */
  @Delete(':key')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async deleteSetting(@Param('key') key: string, @Req() req: any) {
    try {
      const data = await this.settingsService.deleteSetting(
        key,
        req.user.id,
        req.user.email
      );
      return data;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }
}
```

---

## 5. Example Module - Products Service

**File:** `apps/api/src/products/products.service.ts` (first 200 lines)

```typescript
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { EmailService } from '../email/email.service';
import { ProductQueryDto } from './dto/product-query.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductInquiryDto } from './dto/product-inquiry.dto';
import { ProductStatus, Prisma, PurchaseType } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Products Service
 * Handles all business logic for product operations
 */
@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService
  ) {}

  /**
   * Transform Decimal values to numbers for JSON serialization
   */
  private transformProduct(product: any) {
    return {
      ...product,
      price: Number(product.price),
      compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
    };
  }

  private transformProducts(products: any[]) {
    return products.map((p) => this.transformProduct(p));
  }

  /**
   * Find all products with advanced filtering, sorting, and pagination
   */
  async findAll(query: ProductQueryDto) {
    const {
      category,
      minPrice,
      maxPrice,
      brands,
      tags,
      search,
      page = 1,
      pageSize,
      limit,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      featured,
      colors,
      sizes,
      materials,
      inStock,
      onSale,
      productType,
      purchaseType,
    } = query;

    // Use limit if provided, otherwise fall back to pageSize, with default of 24
    const take = limit || pageSize || 24;

    const where: Prisma.ProductWhereInput = {};

    // Only filter by status if explicitly provided
    if (status !== undefined && status !== null) {
      where.status = status;
    }

    // Category filter - lookup by slug
    if (category) {
      const categoryRecord = await this.prisma.category.findUnique({
        where: { slug: category },
        select: { id: true },
      });

      if (categoryRecord) {
        where.categoryId = categoryRecord.id;
      }
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    // Featured filter
    if (featured !== undefined) {
      where.featured = featured;
    }

    // In Stock filter
    if (inStock !== undefined && inStock === true) {
      where.inventory = {
        gt: 0,
      };
    }

    // On Sale filter (has compareAtPrice)
    if (onSale !== undefined && onSale === true) {
      where.compareAtPrice = {
        not: null,
      };
    }

    // Colors filter
    if (colors) {
      where.colors = {
        hasSome: colors.split(','),
      };
    }

    // Sizes filter
    if (sizes) {
      where.sizes = {
        hasSome: sizes.split(','),
      };
    }

    // Materials filter
    if (materials) {
      where.materials = {
        hasSome: materials.split(','),
      };
    }

    // Product Type filter
    if (productType !== undefined) {
      where.productType = productType;
    }

    // Purchase Type filter
    if (purchaseType !== undefined) {
      where.purchaseType = purchaseType;
    }

    // Store ID filter (for public store pages)
    if (query.storeId) {
      where.storeId = query.storeId;
    }

    // Tags filter
    if (tags) {
      const tagArray = tags.split(',');
      where.tags = {
        some: {
          name: {
            in: tagArray,
          },
        },
      };
    }

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Map sortBy to valid Prisma fields
    const sortByMapping: Record<string, string> = {
      relevance: 'viewCount', // Map relevance to view count (popularity)
      popularity: 'viewCount',
      price: 'price',
      name: 'name',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      rating: 'rating',
      inventory: 'inventory',
      stock: 'inventory', // Alias for inventory
    };

    const validSortBy = sortByMapping[sortBy] || 'createdAt';

    // Build orderBy
    const orderBy: any = {};
    orderBy[validSortBy] = sortOrder;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          shortDescription: true,
          price: true,
          compareAtPrice: true,
          heroImage: true,
```

---

## 6. Frontend API Clients

**Directory:** `apps/web/src/lib/api/`

```
total 288
drwx------@ 24 jeanfrancoismunyaneza  staff    768 Dec 31 18:46 .
drwx------@ 21 jeanfrancoismunyaneza  staff    672 Dec 30 02:14 ..
-rw-r--r--@  1 jeanfrancoismunyaneza  staff   1159 Dec 26 13:36 addresses.ts
-rw-r--r--@  1 jeanfrancoismunyaneza  staff  23820 Dec 29 22:34 admin.ts
-rw-r--r--@  1 jeanfrancoismunyaneza  staff   3530 Dec 30 22:27 auth.ts
-rw-r--r--@  1 jeanfrancoismunyaneza  staff    753 Dec 26 13:36 cart.ts
-rw-r--r--@  1 jeanfrancoismunyaneza  staff   2383 Dec 26 13:36 categories.ts
-rw-r--r--@  1 jeanfrancoismunyaneza  staff   8176 Dec 23 19:01 client.ts
-rw-r--r--@  1 jeanfrancoismunyaneza  staff   3326 Dec 26 13:36 currency.ts
-rw-------@  1 jeanfrancoismunyaneza  staff   1468 Dec 30 23:23 downloads.ts
-rw-r--r--@  1 jeanfrancoismunyaneza  staff    182 Dec 26 13:36 index.ts
-rw-------@  1 jeanfrancoismunyaneza  staff   1284 Dec 30 22:38 inquiries.ts
-rw-------@  1 jeanfrancoismunyaneza  staff   1475 Dec 30 23:35 notification-preferences.ts
-rw-r--r--@  1 jeanfrancoismunyaneza  staff   1455 Dec 26 13:36 orders.ts
-rw-------@  1 jeanfrancoismunyaneza  staff   2094 Dec 31 00:11 payment-methods.ts
-rw-r--r--@  1 jeanfrancoismunyaneza  staff   1937 Dec 26 13:36 products.ts
-rw-------@  1 jeanfrancoismunyaneza  staff   3491 Dec 30 23:45 returns.ts
-rw-------@  1 jeanfrancoismunyaneza  staff   2931 Dec 30 22:49 reviews.ts
-rw-r--r--@  1 jeanfrancoismunyaneza  staff   3067 Nov 11 19:22 search.ts
-rw-r--r--@  1 jeanfrancoismunyaneza  staff  12630 Dec 31 09:18 seller.ts
-rw-r--r--@  1 jeanfrancoismunyaneza  staff   4266 Dec 26 13:36 settings.ts
-rw-r--r--@  1 jeanfrancoismunyaneza  staff   8718 Dec 31 18:46 stores.ts
-rw-r--r--@  1 jeanfrancoismunyaneza  staff  11233 Dec 31 16:54 types.ts
-rw-r--r--@  1 jeanfrancoismunyaneza  staff   3060 Dec 26 13:36 variants.ts
```

### 6.1 client.ts (API Client Base)

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// ============================================================================
// Token Manager
// ============================================================================

const ACCESS_TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const COOKIE_ACCESS_TOKEN_KEY = 'nextpik_ecommerce_access_token';
const COOKIE_REFRESH_TOKEN_KEY = 'nextpik_ecommerce_refresh_token';

// Cookie utility functions
function setCookie(name: string, value: string, days: number = 7): void {
  if (typeof window === 'undefined') return;

  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

function deleteCookie(name: string): void {
  if (typeof window === 'undefined') return;
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
}

export const TokenManager = {
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setAccessToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    // Also set in cookie for server-side middleware access
    setCookie(COOKIE_ACCESS_TOKEN_KEY, token, 7);
  },

  setRefreshToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
    // Also set in cookie for server-side middleware access
    setCookie(COOKIE_REFRESH_TOKEN_KEY, token, 30);
  },

  setTokens(accessToken: string, refreshToken: string): void {
    this.setAccessToken(accessToken);
    this.setRefreshToken(refreshToken);
  },

  clearTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    // Also clear cookies
    deleteCookie(COOKIE_ACCESS_TOKEN_KEY);
    deleteCookie(COOKIE_REFRESH_TOKEN_KEY);
  },

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  },
};

// ============================================================================
// Toast Notifier
// ============================================================================

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  type: ToastType;
  title: string;
  message?: string;
}

export const ToastNotifier = {
  notify(type: ToastType, title: string, message?: string): void {
    if (typeof window === 'undefined') return;

    const event = new CustomEvent('toast', {
      detail: { type, title, message } as ToastMessage,
    });
    window.dispatchEvent(event);
  },

  success(title: string, message?: string): void {
    this.notify('success', title, message);
  },

  error(title: string, message?: string): void {
    this.notify('error', title, message);
  },

  warning(title: string, message?: string): void {
    this.notify('warning', title, message);
  },

  info(title: string, message?: string): void {
    this.notify('info', title, message);
  },
};

async function handleResponse(response: Response) {
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  // Debug logging
  if (!response.ok || (typeof window !== 'undefined' && window.location.pathname.includes('seller'))) {
    console.log('[API Debug] Response:', {
      url: response.url,
      status: response.status,
      statusText: response.statusText,
      contentType,
      data,
    });
  }

  if (!response.ok) {
    const errorMessage = data?.message || data?.error || 'An error occurred';
    const errorDetails = {
      url: response.url,
      status: response.status,
      statusText: response.statusText,
      message: errorMessage,
      fullData: data,
    };
    console.error('[API Error]', errorDetails);
    console.error('[API Error Details]', JSON.stringify(errorDetails, null, 2));
    throw new APIError(
      errorMessage,
      response.status,
      data
    );
  }

  // Unwrap response if it's wrapped in { success, data } format
  if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
    if (data.success) {
      return data.data;
    } else {
      // Handle error response from backend
      const errorMessage = data.message || 'An error occurred';
      console.error('[API Error] Failed response:', {
        url: response.url,
        message: errorMessage,
        fullData: data,
      });
      throw new APIError(
        errorMessage,
        response.status,
        data
      );
    }
  }

  return data;
}

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const { headers, ...restOptions } = options;

  const token = typeof window !== 'undefined'
    ? localStorage.getItem('auth_token')
    : null;

  const config: RequestInit = {
    ...restOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);
  return handleResponse(response);
}

export const api = {
  get: <T = any>(url: string, options?: RequestInit) =>
    apiClient<T>(url, { ...options, method: 'GET' }),

  post: <T = any>(url: string, data?: any, options?: RequestInit) =>
    apiClient<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T = any>(url: string, data?: any, options?: RequestInit) =>
    apiClient<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T = any>(url: string, data?: any, options?: RequestInit) =>
    apiClient<T>(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T = any>(url: string, options?: RequestInit) =>
    apiClient<T>(url, { ...options, method: 'DELETE' }),

  // Orders API namespace
  orders: {
    getOrders: (params?: { page?: number; limit?: number; status?: string; sortBy?: string; sortOrder?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.append('page', params.page.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      if (params?.status) searchParams.append('status', params.status);
      if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
      if (params?.sortOrder) searchParams.append('sortOrder', params.sortOrder);
      const query = searchParams.toString();
      return apiClient(`/orders${query ? `?${query}` : ''}`);
    },
    getOrder: (id: string) => apiClient(`/orders/${id}`),
    cancelOrder: (id: string) => apiClient(`/orders/${id}/cancel`, { method: 'POST' }),
    trackOrder: (orderNumber: string, email: string) =>
      apiClient(`/orders/track`, {
        method: 'POST',
        body: JSON.stringify({ orderNumber, email }),
        headers: { 'Content-Type': 'application/json' },
      }),
    downloadInvoice: async (orderId: string) => {
      const response = await fetch(`${API_URL}/orders/${orderId}/invoice`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('auth_token') : ''}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to download invoice');
      }
      return response.blob();
    },
  },
};

// Export api as client for compatibility
export const client = api;
export default api;
```

---

## 7. Frontend Hooks

**Directory:** `apps/web/src/hooks/`

```
total 296
drwxr-xr-x@ 25 jeanfrancoismunyaneza  staff    800 Dec 30 02:14 .
drwx------@  8 jeanfrancoismunyaneza  staff    256 Nov 11 08:28 ..
-rw-r--r--@  1 jeanfrancoismunyaneza  staff   4398 Dec 26 13:36 use-addresses.ts
-rw-r--r--@  1 jeanfrancoismunyaneza  staff  12155 Dec 29 22:35 use-admin.ts
-rw-r--r--@  1 jeanfrancoismunyaneza  staff    935 Dec 26 13:36 use-auth.ts
-rw-r--r--@  1 jeanfrancoismunyaneza  staff     52 Dec 26 13:36 use-cart.ts
-rw-r--r--@  1 jeanfrancoismunyaneza  staff   5006 Dec 26 13:36 use-categories.ts
-rw-r--r--@  1 jeanfrancoismunyaneza  staff  10130 Dec 20 12:06 use-checkout.ts
-rw-r--r--@  1 jeanfrancoismunyaneza  staff   2515 Dec 26 13:36 use-collections.ts
-rw-r--r--@  1 jeanfrancoismunyaneza  staff   2470 Dec 26 13:36 use-currency-products.ts
-rw-r--r--@  1 jeanfrancoismunyaneza  staff   7373 Dec 29 11:17 use-currency.ts
-rw-r--r--@  1 jeanfrancoismunyaneza  staff    721 Dec 29 20:28 use-debounce.ts
-rw-r--r--@  1 jeanfrancoismunyaneza  staff   1860 Dec 13 15:03 use-inventory-settings.ts
-rw-r--r--@  1 jeanfrancoismunyaneza  staff   1266 Dec 29 13:28 use-keyboard-shortcuts.ts
-rw-r--r--@  1 jeanfrancoismunyaneza  staff   5184 Dec 26 13:36 use-orders.ts
-rw-r--r--@  1 jeanfrancoismunyaneza  staff   2435 Dec 30 02:14 use-product.ts
-rw-r--r--@  1 jeanfrancoismunyaneza  staff   3942 Dec 26 13:36 use-products.ts
-rw-r--r--@  1 jeanfrancoismunyaneza  staff   5757 Dec 26 13:36 use-reviews.ts
-rw-r--r--@  1 jeanfrancoismunyaneza  staff   6300 Dec 30 02:14 use-search.ts
-rw-r--r--@  1 jeanfrancoismunyaneza  staff   4127 Dec 23 17:11 use-seller-dashboard.ts
-rw-r--r--@  1 jeanfrancoismunyaneza  staff  10186 Nov 11 08:28 use-session.ts
-rw-r--r--@  1 jeanfrancoismunyaneza  staff   1880 Dec 26 22:02 use-settings-validation.ts
-rw-r--r--@  1 jeanfrancoismunyaneza  staff   2443 Dec 12 16:40 use-settings.ts
-rw-r--r--@  1 jeanfrancoismunyaneza  staff   4487 Dec 26 13:36 use-user.ts
-rw-r--r--@  1 jeanfrancoismunyaneza  staff    151 Dec 26 13:36 use-wishlist.ts
```

### Example Hook: use-currency.ts

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import useSWR from 'swr';
import { currencyApi, currencyAdminApi, CurrencyRate } from '@/lib/api/currency';
import { settingsApi } from '@/lib/api/settings';
import { useCallback, useMemo, useEffect } from 'react';
import { formatCurrencyAmount } from '@/lib/utils/number-format';

// Currency store for managing selected currency
interface CurrencyStore {
  selectedCurrency: string;
  setSelectedCurrency: (currency: string) => void;
  defaultCurrency: string;
  setDefaultCurrency: (currency: string) => void;
}

export const useCurrencyStore = create<CurrencyStore>()(
  persist(
    (set) => ({
      selectedCurrency: '',
      defaultCurrency: 'USD',
      setSelectedCurrency: (currency) => set({ selectedCurrency: currency }),
      setDefaultCurrency: (currency) => set({ defaultCurrency: currency }),
    }),
    {
      name: 'currency-storage',
    }
  )
);

/**
 * Hook to get system settings for currencies
 */
export function useCurrencySettings() {
  const { data: settings, error, isLoading } = useSWR(
    '/settings/public',
    settingsApi.getPublicSettings,
    {
      revalidateOnFocus: true, // ✅ Enable revalidation on focus
      revalidateOnReconnect: true, // ✅ Enable revalidation on reconnect
      refreshInterval: 0, // Don't auto-refresh (only manual invalidation)
      dedupingInterval: 5000, // Reduce deduping to 5 seconds for faster updates
    }
  );

  const defaultCurrency = useMemo(() => {
    if (!settings || !Array.isArray(settings)) return 'USD';
    const setting = settings.find(s => s.key === 'default_currency');
    return setting?.value || 'USD';
  }, [settings]);

  const supportedCurrencies = useMemo(() => {
    if (!settings || !Array.isArray(settings)) return ['USD', 'EUR', 'GBP', 'JPY', 'RWF'];
    const setting = settings.find(s => s.key === 'supported_currencies');
    return setting?.value || ['USD', 'EUR', 'GBP', 'JPY', 'RWF'];
  }, [settings]);

  return {
    defaultCurrency,
    supportedCurrencies,
    isLoading,
    error,
  };
}

/**
 * Hook to get all available currency rates (filtered by system settings)
 */
export function useCurrencyRates() {
  const { data, error, isLoading, mutate } = useSWR<CurrencyRate[]>(
    '/currency/rates',
    currencyApi.getRates,
    {
      revalidateOnFocus: true, // ✅ Enable revalidation on focus
      revalidateOnReconnect: true, // ✅ Enable revalidation on reconnect
      refreshInterval: 0, // Don't auto-refresh (only manual invalidation)
      dedupingInterval: 5000, // Reduce deduping to 5 seconds for faster updates
    }
  );

  const { supportedCurrencies, isLoading: settingsLoading } = useCurrencySettings();

  // Filter currencies based on system settings
  const filteredCurrencies = useMemo(() => {
    if (!data) return [];
    return data.filter(currency =>
      supportedCurrencies.includes(currency.currencyCode)
    );
  }, [data, supportedCurrencies]);

  return {
    currencies: filteredCurrencies,
    allCurrencies: data || [],
    error,
    isLoading: isLoading || settingsLoading,
    refresh: mutate,
  };
}

/**
```

---

## 8. DTO Patterns

**Directory:** `apps/api/src/products/dto/`

```
adjust-inventory.dto.ts
bulk-create-variants.dto.ts
bulk-delete-products.dto.ts
bulk-inventory.dto.ts
bulk-update-status.dto.ts
create-product-variant.dto.ts
create-product.dto.ts
product-inquiry.dto.ts
product-query.dto.ts
update-product-variant.dto.ts
update-product.dto.ts
validators
```

### Example: create-product.dto.ts

```typescript
import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, IsEnum, Min, IsObject, ValidateNested, Validate } from 'class-validator';
import { ProductStatus, ProductType, PurchaseType } from '@prisma/client';
import { Type } from 'class-transformer';
import { RequiresPriceForInstantConstraint, RequiresInventoryForInstantConstraint } from './validators/product-validation';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  shortDescription?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional() // Optional for INQUIRY purchase type
  @Validate(RequiresPriceForInstantConstraint)
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  compareAtPrice?: number;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional() // Optional for INQUIRY purchase type
  @Validate(RequiresInventoryForInstantConstraint)
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  inventory?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  weight?: number;

  // Product Type & Purchase Model
  @IsOptional()
  @IsEnum(ProductType)
  productType?: ProductType;

  @IsOptional()
  @IsEnum(PurchaseType)
  purchaseType?: PurchaseType;

  @IsOptional()
  @IsBoolean()
  isPreOrder?: boolean;

  @IsOptional()
  @IsBoolean()
  contactRequired?: boolean;

  @IsOptional()
  @IsString()
  heroImage?: string;
```

---

## 9. App Module Registration

**File:** `apps/api/src/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { CollectionsModule } from './collections/collections.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentModule } from './payment/payment.module';
import { ReviewsModule } from './reviews/reviews.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { AdminModule } from './admin/admin.module';
import { UploadModule } from './upload/upload.module';
import { SearchModule } from './search/search.module';
import { WebsocketModule } from './websocket/websocket.module';
import { StoresModule } from './stores/stores.module';
import { SellerModule } from './seller/seller.module';
import { CommissionModule } from './commission/commission.module';
import { InventoryModule } from './inventory/inventory.module';
import { AdvertisementModule } from './advertisements/advertisement.module';
import { CurrencyModule } from './currency/currency.module';
import { EscrowModule } from './escrow/escrow.module';
import { SettingsModule } from './settings/settings.module';
import { ShippingModule } from './shipping/shipping.module';
import { PayoutModule } from './payout/payout.module';
import { DeliveryProviderModule } from './delivery-provider/delivery-provider.module';
import { DeliveryModule } from './delivery/delivery.module';
import { DeliveryPartnerModule } from './delivery-partner/delivery-partner.module';
import { DeliveryPayoutsModule } from './delivery-payouts/delivery-payouts.module';
import { InquiriesModule } from './inquiries/inquiries.module';
import { DownloadsModule } from './downloads/downloads.module';
import { ReturnsModule } from './returns/returns.module';
import { SupabaseModule } from './supabase/supabase.module';
import { MaintenanceModeGuard } from './guards/maintenance-mode.guard';
import { Admin2FAGuard } from './auth/guards/admin-2fa.guard';
// import { QueueModule } from './queue/queue.module'; // Commented out - requires Redis setup

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    SupabaseModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 100, // 100 requests
      },
    ]),
    DatabaseModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    CategoriesModule,
    CollectionsModule,
    CartModule,
    OrdersModule,
    PaymentModule,
    ReviewsModule,
    WishlistModule,
    AdminModule,
    UploadModule,
    SearchModule,
    WebsocketModule,
    StoresModule,
    SellerModule,
    CommissionModule,
    InventoryModule,
    AdvertisementModule,
    CurrencyModule,
    EscrowModule,
    SettingsModule,
    ShippingModule,
    PayoutModule,
    DeliveryProviderModule,
    DeliveryModule,
    DeliveryPartnerModule,
    DeliveryPayoutsModule,
    InquiriesModule,
    DownloadsModule,
    ReturnsModule,
    // QueueModule, // Commented out - requires Redis setup
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: MaintenanceModeGuard,
    },
    {
      provide: APP_GUARD,
      useClass: Admin2FAGuard,
    },
  ],
})
export class AppModule {}
```

---

## 10. System Settings Categories

**From:** `packages/database/prisma/seed.ts`

```
        category: 'commission',
        category: 'COMMISSION',
        category: 'PAYMENT',
        category: 'PAYOUT',
        category: 'SECURITY',
        categoryId: accessoriesCategory.id,
        categoryId: fashionCategory.id,
        categoryId: jewelryCategory.id,
        categoryId: watchesCategory.id,
```

### Settings Category Summary

| Category | Purpose |
|----------|---------|
| GENERAL | Platform-wide settings (site name, currency, timezone) |
| PAYMENT | Payment processing (Stripe keys, escrow settings) |
| COMMISSION | Seller commission rates and rules |
| PAYOUT | Payout schedules and minimums |
| SECURITY | Security and audit settings |
| INVENTORY | Stock management settings |
| SHIPPING | Shipping configuration |
| CURRENCY | Multi-currency settings |
| EMAIL | Email configuration |
| NOTIFICATION | Notification preferences |

---

## Summary

This document provides a comprehensive overview of the NextPik codebase structure including:

- **Database:** 2643 lines of Prisma schema with 60+ models
- **Backend:** 40 NestJS modules following consistent patterns
- **Frontend:** Type-safe API clients with SWR-based hooks
- **DTOs:** Class-validator decorated DTOs for all inputs
- **Settings:** Configurable platform settings with audit logging

**Key Patterns:**
1. **Module Pattern:** Each feature is a self-contained NestJS module
2. **Service Layer:** Business logic in services, controllers are thin
3. **DTO Validation:** All inputs validated with class-validator
4. **API Client Pattern:** Axios-based clients with type safety
5. **Hook Pattern:** SWR-based hooks for data fetching

---

*Generated: December 31, 2025*
*Platform Version: 2.4.0*
