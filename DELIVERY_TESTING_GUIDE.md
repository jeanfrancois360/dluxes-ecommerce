# 🚚 Delivery System Testing Guide

## Overview
This guide will help you test the fully-implemented delivery & logistics system in the NextPik luxury e-commerce platform.

---

## 🎯 Prerequisites

1. **Backend Running**: `pnpm --filter=@luxury/api start` (port 4000)
2. **Frontend Running**: `pnpm --filter=@luxury/web dev` (port 3000)
3. **Database Seeded**: Run `pnpm tsx seed-delivery-test-data.ts`

---

## 📦 Test Accounts

### Delivery Partner Account
```
Email: delivery-partner@test.com
Password: DeliveryTest@123
Role: DELIVERY_PARTNER
Provider: NextPik Express
```

### Buyer Account
```
Email: buyer@test.com
Password: Test@123
```

### Admin Account
```
Email: admin@test.com
Password: Test@123
```

---

## ✅ Testing Checklist

### 1. Buyer Experience - Order Delivery Tracking

#### A. View Orders with Delivery Tracking
1. Login as **buyer@test.com**
2. Navigate to **Account → Orders** (http://localhost:3000/account/orders)
3. **Expected**: See orders list
4. Click on an order with delivery
5. **Expected**: See delivery tracking section at the top with:
   - Current delivery status (color-coded badge)
   - Tracking number with copy button
   - Carrier name and website link
   - Expected delivery date
   - "View Full Tracking Details" button

#### B. Public Tracking Page
1. Get tracking number from order details
2. Navigate to **http://localhost:3000/track/{trackingNumber}**
3. **Expected**: See comprehensive tracking page with:
   - Visual progress timeline
   - Delivery status updates
   - Expected delivery date
   - Carrier information
   - Delivery address
   - Support contact

#### C. Search for Tracking Number
1. Go to **http://localhost:3000/track**
2. Enter tracking number in search box
3. Click "Track Package"
4. **Expected**: Redirected to tracking page with details

---

### 2. Delivery Partner Experience

#### A. Login to Dashboard
1. Login as **delivery-partner@test.com**
2. **Expected**: Access delivery partner dashboard
3. Navigate to **/delivery-partner/dashboard**
4. **Expected**: See:
   - Active deliveries count
   - Completed deliveries
   - Total earnings
   - Performance metrics

#### B. View Assigned Deliveries
1. Navigate to **/delivery-partner/deliveries**
2. **Expected**: See list of assigned deliveries
3. Each delivery should show:
   - Order number
   - Customer name
   - Delivery address
   - Current status
   - Delivery fee

#### C. Update Delivery Status
1. Click on a delivery
2. Update status (e.g., from "In Transit" to "Out for Delivery")
3. **Expected**: Status updated successfully
4. **Verify**: Status visible to buyer in tracking page

#### D. Confirm Delivery
1. Select a delivery that's "Out for Delivery"
2. Click "Confirm Delivery"
3. Upload proof of delivery (optional):
   - Signature
   - Photos
   - GPS location
   - Notes
4. **Expected**: Delivery marked as completed
5. **Verify**: Buyer sees "Delivered" status

#### E. View Earnings
1. Navigate to **/delivery-partner/earnings**
2. **Expected**: See:
   - Total earnings
   - Pending payouts
   - Completed payouts
   - Earnings history with breakdown

---

### 3. Admin Experience - Provider Management

#### A. View Delivery Providers
1. Login as **admin@test.com**
2. Navigate to **/admin/delivery-providers**
3. **Expected**: See list of providers:
   - FedEx International
   - DHL Express
   - UPS Worldwide
   - NextPik Express

#### B. Add New Provider
1. Click "Add Provider"
2. Fill in details:
   ```
   Name: Test Courier
   Type: PARTNER
   Contact Email: test@courier.com
   Countries: [US, CA]
   Commission Type: PERCENTAGE
   Commission Rate: 10%
   ```
3. Save
4. **Expected**: Provider added successfully

#### C. Edit Provider
1. Select a provider
2. Click "Edit"
3. Update commission rate
4. **Expected**: Changes saved

#### D. Manage Payouts
1. Navigate to **/admin/delivery-payouts**
2. **Expected**: See pending payouts for delivery partners
3. Select payouts to process
4. Click "Process Payout"
5. **Expected**: Payout marked as completed

#### E. View Delivery Performance
1. Navigate to **/admin/deliveries**
2. **Expected**: See all deliveries across the platform
3. Filter by:
   - Status
   - Provider
   - Date range
4. **Expected**: Filtered results displayed

---

## 🧪 Test Scenarios

### Scenario 1: Complete Delivery Flow
1. **Buyer** places order → Order created with PENDING status
2. **System** auto-creates delivery record
3. **Admin** assigns to delivery provider
4. **System** generates tracking number
5. **Delivery Partner** picks up package → Status: PICKED_UP
6. **Delivery Partner** updates status → Status: IN_TRANSIT
7. **Buyer** tracks package on /track page
8. **Delivery Partner** marks as OUT_FOR_DELIVERY
9. **Buyer** receives notification
10. **Delivery Partner** confirms delivery with proof
11. **Buyer** sees DELIVERED status
12. **System** processes commission payment

### Scenario 2: Failed Delivery
1. Delivery partner attempts delivery
2. Customer not available
3. Partner marks as FAILED_DELIVERY
4. Add notes: "Customer not home"
5. Reschedule delivery
6. Buyer receives notification
7. Buyer can contact support

### Scenario 3: Multi-Provider Orders
1. Create order with multiple items from different sellers
2. System creates separate deliveries for each seller
3. Each delivery assigned to optimal provider based on:
   - Seller location
   - Buyer location
   - Provider coverage area
   - Cost optimization

---

## 📊 Key Features to Verify

### ✅ Real-Time Tracking
- [x] Tracking number generated automatically
- [x] Status updates reflect immediately
- [x] Timeline shows delivery progression
- [x] Estimated delivery date calculated

### ✅ Provider Management
- [x] Multiple provider types supported (API, Manual, Partner)
- [x] Commission rules (Percentage, Fixed)
- [x] Service area configuration (countries)
- [x] API integration settings

### ✅ Delivery Partner Portal
- [x] Dashboard with metrics
- [x] Delivery list and filters
- [x] Status update workflow
- [x] Proof of delivery upload
- [x] Earnings tracking

### ✅ Buyer Experience
- [x] Order details show delivery info
- [x] Public tracking page
- [x] Tracking number search
- [x] Visual timeline
- [x] Carrier information

### ✅ Admin Controls
- [x] Provider CRUD operations
- [x] Payout management
- [x] Delivery monitoring
- [x] Performance analytics

---

## 🔍 Testing Tips

### Database Verification
```sql
-- Check delivery providers
SELECT * FROM delivery_providers;

-- Check deliveries
SELECT * FROM deliveries ORDER BY created_at DESC LIMIT 10;

-- Check delivery confirmations
SELECT * FROM delivery_confirmations;

-- Check payouts
SELECT * FROM delivery_provider_payouts WHERE status = 'PENDING';
```

### API Testing
```bash
# Get delivery by tracking number (requires auth)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4000/api/v1/delivery/track/FEDEX1766241973733220

# Get delivery providers
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4000/api/v1/delivery-provider

# Update delivery status (delivery partner)
curl -X PATCH \
  -H "Authorization: Bearer PARTNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "OUT_FOR_DELIVERY"}' \
  http://localhost:4000/api/v1/delivery-partner/deliveries/{id}/status
```

---

## 🐛 Common Issues & Solutions

### Issue: "No delivery information available"
**Solution**: Ensure the order has a delivery record. Run seed script or create delivery manually.

### Issue: "Tracking number not found"
**Solution**: Verify tracking number is correct and delivery exists in database.

### Issue: "Cannot access delivery partner dashboard"
**Solution**: Ensure logged in as DELIVERY_PARTNER role with valid provider assignment.

### Issue: "Provider commission not calculating"
**Solution**: Check commission rules are set correctly in provider settings.

---

## 📈 Performance Metrics

Track these KPIs during testing:

1. **Delivery Success Rate**: % of delivered vs. total deliveries
2. **Average Delivery Time**: Time from pickup to delivery
3. **On-Time Delivery Rate**: Deliveries completed before expected date
4. **Partner Earnings**: Total commission paid
5. **Customer Satisfaction**: Delivery ratings

---

## 🎉 Success Criteria

Your delivery system is working if:

- ✅ Buyers can track packages in real-time
- ✅ Delivery partners can manage deliveries efficiently
- ✅ Admins can monitor and control all deliveries
- ✅ Commission payouts calculate correctly
- ✅ Status updates reflect across all user interfaces
- ✅ Tracking page loads without errors
- ✅ Delivery information displays in order details

---

## 📚 Related Documentation

- **DELIVERY_SYSTEM_GUIDE.md** - Complete system architecture
- **TEST_CREDENTIALS.md** - All test account credentials
- **COMPREHENSIVE_TECHNICAL_DOCUMENTATION.md** - Full platform documentation

---

**Happy Testing! 🚀**
