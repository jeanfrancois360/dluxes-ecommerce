# Delivery Provider System - Database Schema & Architecture

## Database Schema Extensions

### 1. DeliveryProvider Table
```prisma
model DeliveryProvider {
  id                String   @id @default(cuid())
  name              String   // "FedEx", "UPS", "DHL", "Local Courier"
  slug              String   @unique
  type              DeliveryProviderType // API_INTEGRATED, MANUAL, PARTNER
  description       String?

  // Contact Information
  contactEmail      String
  contactPhone      String?
  website           String?

  // API Integration (for automated tracking)
  apiEnabled        Boolean  @default(false)
  apiKey            String?  @db.Text
  apiSecret         String?  @db.Text
  apiEndpoint       String?
  webhookUrl        String?

  // Service Areas
  serviceZones      ShippingZone[] @relation("ProviderServiceZones")
  countries         String[] // Array of country codes they serve

  // Commission Settings
  commissionType    CommissionType @default(PERCENTAGE)
  commissionRate    Decimal  @default(5.0) @db.Decimal(5, 2)

  // Status
  isActive          Boolean  @default(true)
  verificationStatus ProviderVerificationStatus @default(PENDING)

  // Relationships
  users             User[]   @relation("DeliveryProviderUsers")
  deliveries        Delivery[]
  payouts           DeliveryProviderPayout[]

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([slug])
  @@index([isActive])
}

enum DeliveryProviderType {
  API_INTEGRATED  // FedEx, UPS, DHL with API integration
  MANUAL          // Manual tracking updates
  PARTNER         // Platform delivery partners
}

enum ProviderVerificationStatus {
  PENDING
  VERIFIED
  SUSPENDED
}
```

### 2. Delivery Table (Enhanced Order Delivery Tracking)
```prisma
model Delivery {
  id                String   @id @default(cuid())
  orderId           String   @unique
  order             Order    @relation(fields: [orderId], references: [id])

  // Provider Assignment
  providerId        String?
  provider          DeliveryProvider? @relation(fields: [providerId], references: [id])
  assignedBy        String?
  assignedAt        DateTime?

  // Delivery Partner User (actual person delivering)
  deliveryPartnerId String?
  deliveryPartner   User?    @relation("DeliveryPartnerAssignments", fields: [deliveryPartnerId], references: [id])

  // Tracking Information
  trackingNumber    String?  @unique
  trackingUrl       String?
  currentStatus     DeliveryStatus @default(PENDING_PICKUP)

  // Addresses
  pickupAddress     Json     // Seller/warehouse address
  deliveryAddress   Json     // Customer address

  // Timeline
  pickupScheduledAt DateTime?
  pickedUpAt        DateTime?
  inTransitAt       DateTime?
  outForDeliveryAt  DateTime?
  deliveredAt       DateTime?

  // Delivery Confirmation
  confirmedBy       String?  // User ID who confirmed
  confirmationType  DeliveryConfirmationType?
  proofOfDelivery   Json?    // { signature, photos, notes }

  // Issues & Disputes
  hasIssue          Boolean  @default(false)
  issueDescription  String?
  issueReportedAt   DateTime?
  issueResolvedAt   DateTime?

  // Commission
  deliveryFee       Decimal  @db.Decimal(10, 2)
  partnerCommission Decimal  @db.Decimal(10, 2)
  platformFee       Decimal  @db.Decimal(10, 2)

  // Ratings
  customerRating    Int?     // 1-5 stars
  customerFeedback  String?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([orderId])
  @@index([providerId])
  @@index([deliveryPartnerId])
  @@index([currentStatus])
  @@index([trackingNumber])
}

enum DeliveryStatus {
  PENDING_PICKUP
  PICKUP_SCHEDULED
  PICKED_UP
  IN_TRANSIT
  OUT_FOR_DELIVERY
  DELIVERED
  FAILED_DELIVERY
  RETURNED
  CANCELLED
}

enum DeliveryConfirmationType {
  CUSTOMER         // Customer confirmed via app/email link
  DELIVERY_PARTNER // Delivery partner confirmed with proof
  ADMIN            // Admin manually confirmed
  AUTO_CONFIRMED   // Auto-confirmed after X days
}
```

### 3. DeliveryProviderPayout Table
```prisma
model DeliveryProviderPayout {
  id              String   @id @default(cuid())
  providerId      String
  provider        DeliveryProvider @relation(fields: [providerId], references: [id])

  // Payout Details
  amount          Decimal  @db.Decimal(10, 2)
  currency        String   @default("USD")

  // Delivery Period
  periodStart     DateTime
  periodEnd       DateTime
  deliveryCount   Int      // Number of deliveries in this payout

  // Status
  status          PayoutStatus @default(PENDING)

  // Payment Information
  paymentMethod   String?  // Bank transfer, PayPal, etc.
  paymentReference String?
  processedAt     DateTime?
  completedAt     DateTime?

  // Metadata
  notes           String?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([providerId])
  @@index([status])
}
```

### 4. Update User Model
```prisma
// Add to existing User model
model User {
  // ... existing fields

  // Delivery Partner specific
  deliveryProviderId String?
  deliveryProvider   DeliveryProvider? @relation("DeliveryProviderUsers", fields: [deliveryProviderId], references: [id])
  deliveryAssignments Delivery[] @relation("DeliveryPartnerAssignments")

  // ... rest of fields
}

// Add to UserRole enum
enum UserRole {
  // ... existing roles
  DELIVERY_PARTNER
}
```

## API Endpoints

### Delivery Provider Management (Admin)
```
GET    /api/v1/admin/delivery-providers              # List all providers
POST   /api/v1/admin/delivery-providers              # Create provider
GET    /api/v1/admin/delivery-providers/:id          # Get provider details
PUT    /api/v1/admin/delivery-providers/:id          # Update provider
DELETE /api/v1/admin/delivery-providers/:id          # Delete provider
PUT    /api/v1/admin/delivery-providers/:id/activate # Activate/deactivate
POST   /api/v1/admin/delivery-providers/:id/verify   # Verify provider
```

### Delivery Assignment (Admin/Seller)
```
POST   /api/v1/orders/:orderId/assign-delivery       # Assign delivery to provider
PUT    /api/v1/orders/:orderId/delivery-tracking     # Update tracking info
GET    /api/v1/orders/:orderId/delivery-status       # Get delivery status
```

### Delivery Partner Portal
```
GET    /api/v1/delivery-partner/dashboard            # Dashboard stats
GET    /api/v1/delivery-partner/deliveries           # Assigned deliveries
GET    /api/v1/delivery-partner/deliveries/:id       # Delivery details
PUT    /api/v1/delivery-partner/deliveries/:id/pickup    # Confirm pickup
PUT    /api/v1/delivery-partner/deliveries/:id/status    # Update status
POST   /api/v1/delivery-partner/deliveries/:id/confirm   # Confirm delivery with proof
POST   /api/v1/delivery-partner/deliveries/:id/issue     # Report delivery issue
GET    /api/v1/delivery-partner/earnings             # View earnings
GET    /api/v1/delivery-partner/payouts              # View payout history
```

### Tracking API (Public - for customers)
```
GET    /api/v1/track/:trackingNumber                 # Track delivery by tracking number
```

### Provider API Integration (Webhooks)
```
POST   /api/v1/webhooks/delivery-providers/:provider # Webhook endpoint for provider updates
```

## Integration with Escrow System

### Workflow:
1. **Order Placed** → Payment in escrow (HELD)
2. **Delivery Assigned** → Provider/partner assigned
3. **Picked Up** → Delivery partner confirms pickup
4. **In Transit** → Tracking updates via API or manual
5. **Delivered** → Delivery partner uploads proof
6. **Delivery Confirmed** → Escrow status → PENDING_RELEASE
7. **Hold Period** → 7 days countdown starts
8. **Auto-Release** → Funds released to seller
9. **Delivery Partner Payout** → Partner commission paid out

### Commission Flow:
```
Example: $100 order
├─ Platform Commission (10%): $10
├─ Delivery Partner Split (5% of seller amount): $4.50
└─ Seller Receives: $85.50

Breakdown:
- Total: $100
- Platform Fee: $10
- Seller Gross: $90
- Delivery Partner: $4.50 (5% of $90)
- Seller Net: $85.50
```

## Frontend Pages Needed

### 1. Admin Pages
- `/admin/delivery-providers` - Manage providers
- `/admin/delivery-providers/[id]` - Provider details & settings
- `/admin/delivery-assignments` - View all delivery assignments
- `/admin/delivery-payouts` - Process delivery partner payouts

### 2. Delivery Partner Portal
- `/delivery-partner/dashboard` - Dashboard
- `/delivery-partner/deliveries` - Assigned deliveries
- `/delivery-partner/deliveries/[id]` - Delivery details & actions
- `/delivery-partner/earnings` - Earnings & payouts
- `/delivery-partner/profile` - Profile & settings

### 3. Seller Integration
- Add delivery assignment to seller order management
- View delivery status and tracking
- Request delivery for orders

### 4. Customer Tracking
- `/track/[trackingNumber]` - Public tracking page
- Delivery status in customer order history

## System Settings Integration

Add to existing `SystemSetting` table:

```typescript
// Delivery Provider Settings
{
  key: 'delivery.auto_assign_enabled',
  value: false,
  description: 'Automatically assign deliveries to providers based on shipping zone'
}

{
  key: 'delivery.default_provider_id',
  value: null,
  description: 'Default delivery provider for auto-assignment'
}

{
  key: 'delivery.confirmation_required',
  value: true,
  description: 'Require delivery confirmation before escrow release'
}

{
  key: 'delivery.proof_required',
  value: true,
  description: 'Require proof of delivery (signature/photo)'
}

{
  key: 'delivery.auto_confirm_days',
  value: 7,
  description: 'Auto-confirm delivery after X days if no issue reported'
}

{
  key: 'delivery.partner_payout_frequency',
  value: 'WEEKLY',
  description: 'Payout frequency for delivery partners'
}
```

## Security Considerations

1. **Provider Verification** - Verify delivery providers before activation
2. **Proof of Delivery** - Require signature/photo/GPS confirmation
3. **Fraud Prevention** - Track delivery partner performance and flag suspicious activity
4. **Access Control** - Delivery partners can only see assigned deliveries
5. **API Security** - Secure API keys for third-party integrations
6. **Audit Trail** - Log all delivery status changes and confirmations

## Next Steps

1. **Phase 1**: Database schema migration
2. **Phase 2**: Admin provider management page
3. **Phase 3**: Delivery assignment and tracking APIs
4. **Phase 4**: Delivery partner portal
5. **Phase 5**: Third-party API integrations (FedEx, UPS, etc.)
6. **Phase 6**: Customer tracking interface
