# DHL Integration - End-to-End Testing Guide

**Status:** ✅ Production-Ready (Awaiting Production Credentials)
**Last Updated:** February 6, 2026

---

## 📊 Current Integration Status

### ✅ What's Implemented

1. **DHL Rates Service** - Get shipping quotes
2. **DHL Shipment Service** - Create shipments & generate labels
3. **DHL Tracking Service** - Track packages
4. **DHL Sync Service** - Auto-sync tracking updates (cron)
5. **Admin API Endpoints** - Health checks & testing
6. **Database Integration** - Store shipment data
7. **Frontend Components** - Seller shipment UI

### 🔐 Current Credentials

```env
DHL_EXPRESS_API_KEY=apX4zW0jQ5cX8l
DHL_EXPRESS_API_SECRET=J#9hE$6dU@7fW!9a
DHL_ACCOUNT_NUMBER=278579181
DHL_API_ENVIRONMENT=sandbox
DHL_TRACKING_ENABLED=false  # ⚠️ Set to true when testing
```

**⚠️ Important:** These are TEST credentials. You need to request PRODUCTION credentials from DHL MyDHL+ Portal.

---

## 🧪 End-to-End Testing Guide

### Phase 1: Local Backend Testing

#### Step 1.1: Enable DHL Tracking

```bash
cd /Users/jeanfrancoismunyaneza/all-orbitunix-projects/nextpik/apps/api
```

Edit `.env` and change:

```env
DHL_TRACKING_ENABLED=true  # Change from false
```

#### Step 1.2: Start API Server

```bash
cd /Users/jeanfrancoismunyaneza/all-orbitunix-projects/nextpik
pnpm dev:api
```

#### Step 1.3: Test DHL Health

```bash
# Login as admin
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin1@nextpik.com", "password": "Password123!"}'

# Save the access_token, then test health
curl -X GET http://localhost:4000/api/v1/shipping/admin/dhl/health \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response:**

```json
{
  "enabled": true,
  "hasApiKey": true,
  "apiUrl": "https://express.api.dhl.com",
  "status": "configured"
}
```

#### Step 1.4: Test Rate Calculation

```bash
curl -X POST http://localhost:4000/api/v1/shipping/admin/dhl/test-rates \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "originCountry": "US",
    "originPostalCode": "10001",
    "destinationCountry": "GB",
    "destinationPostalCode": "SW1A 1AA",
    "weight": 2.5
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "message": "DHL API is working correctly",
  "ratesCount": 3,
  "rates": [
    {
      "serviceName": "DHL Express Worldwide",
      "price": { "amount": 45.5, "currency": "USD" },
      "deliveryTime": { "min": 2, "max": 3 }
    }
  ]
}
```

---

### Phase 2: Test Shipment Creation

#### Step 2.1: Create Test Order

1. Login to your frontend as a buyer
2. Add products to cart
3. Complete checkout
4. Note the Order ID

#### Step 2.2: Mark Order as Shipped (Seller)

```bash
# Login as seller
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "seller1@nextpik.com", "password": "Password123!"}'

# Create shipment
curl -X POST http://localhost:4000/api/v1/seller/orders/{orderId}/ship \
  -H "Authorization: Bearer SELLER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "carrier": "DHL",
    "trackingNumber": "1234567890",
    "shipmentDate": "2026-02-06",
    "items": [
      {
        "orderItemId": "item-id-here",
        "quantity": 1
      }
    ]
  }'
```

**Expected Response:**

```json
{
  "id": "shipment-id",
  "trackingNumber": "1234567890",
  "carrier": "DHL",
  "status": "SHIPPED",
  "trackingUrl": "https://www.dhl.com/...",
  "estimatedDelivery": "2026-02-10"
}
```

#### Step 2.3: Verify in Database

```bash
cd packages/database
npx prisma studio
```

Navigate to `Shipment` table and verify:

- Shipment created
- Tracking number stored
- Status is `SHIPPED`

---

### Phase 3: Test on DHL MyDHL+ Portal

#### Step 3.1: Access DHL MyDHL+ Portal

1. **Go to:** https://mydhlplus.dhl.com
2. **Login with:**
   - Account: 278579181
   - Credentials: (request from DHL support)
3. **Or for developers:** https://developer.dhl.com/api-catalog

#### Step 3.2: Verify API Credentials

1. Login to https://developer.dhl.com
2. Go to "My Apps"
3. Find: "NEXTPIK. DHL EXPRESS - MYDHL API"
4. Verify:
   - ✅ Rating API enabled
   - ✅ Shipment API enabled
   - ✅ Tracking API enabled
5. Copy API Key & Secret if different from .env

#### Step 3.3: Test Rate Quote in DHL Portal

1. Navigate to "Rating" section
2. Enter same parameters as your API test:
   - Origin: US, 10001
   - Destination: GB, SW1A 1AA
   - Weight: 2.5 KG
3. Compare rates with API response
4. **Expected:** Rates should match your API results

#### Step 3.4: Create Test Shipment in Portal

1. Go to "Create Shipment"
2. Fill in:

   ```
   Shipper:
   - Name: Test Store
   - Address: 123 Test St, New York, NY 10001, US
   - Phone: +1-555-0123

   Receiver:
   - Name: Test Customer
   - Address: 10 Downing St, London, SW1A 1AA, GB
   - Phone: +44-20-7925-0918

   Package:
   - Weight: 2.5 KG
   - Dimensions: 30x20x15 CM
   - Contents: "Test Product"
   - Value: $100 USD
   ```

3. Select Service: DHL Express Worldwide
4. Click "Create Shipment"
5. **Save:** Tracking number (e.g., 1234567890)

#### Step 3.5: Download Shipping Label

1. After creating shipment, click "Download Label"
2. Save as PDF
3. **Verify:** Label contains tracking number & barcode

---

### Phase 4: Test Tracking

#### Step 4.1: Track via API

```bash
curl -X GET http://localhost:4000/api/v1/shipments/track/1234567890 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**

```json
{
  "trackingNumber": "1234567890",
  "status": "IN_TRANSIT",
  "currentLocation": "New York, US",
  "estimatedDelivery": "2026-02-10",
  "events": [
    {
      "timestamp": "2026-02-06T10:30:00Z",
      "location": "New York, US",
      "status": "Shipment picked up",
      "description": "Shipment picked up from origin"
    }
  ]
}
```

#### Step 4.2: Track in DHL Portal

1. Go to https://www.dhl.com/track
2. Enter tracking number: 1234567890
3. **Verify:** Same status as API response
4. **Expected:** Detailed tracking timeline

#### Step 4.3: Test Webhook (if enabled)

```bash
# In DHL portal, configure webhook
Webhook URL: https://your-domain.com/api/v1/webhooks/dhl
Events: tracking-update, delivery-confirmed
```

Then trigger a status update in DHL portal and monitor:

```bash
# Monitor API logs
tail -f apps/api/logs/dhl-webhook.log
```

---

### Phase 5: Frontend Testing

#### Step 5.1: Seller Dashboard - Mark as Shipped

1. Login as seller: http://localhost:3000/auth/login
2. Email: seller1@nextpik.com / Password123!
3. Navigate to: Orders > [Select Order]
4. Click "Mark as Shipped"
5. Fill in:
   - Carrier: DHL
   - Tracking Number: 1234567890
   - Shipment Date: Today
6. Submit

**Expected:**

- ✅ Success toast
- ✅ Order status changes to "SHIPPED"
- ✅ Tracking number visible

#### Step 5.2: Buyer Dashboard - Track Shipment

1. Login as buyer: buyer1@nextpik.com / Password123!
2. Navigate to: Orders > [Select Order]
3. **Verify:**
   - ✅ "Track Shipment" button visible
   - ✅ Tracking number displayed
   - ✅ Estimated delivery date shown
4. Click "Track Shipment"
5. **Verify:** Opens DHL tracking page with correct tracking number

---

## 🔍 Verification Checklist

### Backend Integration

- [ ] DHL health check returns success
- [ ] Rate quotes return valid prices
- [ ] Shipments can be created via API
- [ ] Tracking data is fetched correctly
- [ ] Webhooks receive updates (if enabled)
- [ ] Database stores shipment records
- [ ] Cron jobs sync tracking updates

### DHL Portal

- [ ] Can login to MyDHL+ portal
- [ ] API credentials are visible in "My Apps"
- [ ] Can create test shipments in portal
- [ ] Shipping labels can be downloaded
- [ ] Tracking numbers are valid
- [ ] Rate quotes match API results
- [ ] Account has sufficient credits

### Frontend

- [ ] Seller can mark orders as shipped
- [ ] Buyer can see tracking information
- [ ] Tracking links work correctly
- [ ] Shipment cards display properly
- [ ] Real-time updates appear (if synced)

---

## 🚀 Production Deployment Checklist

### Before Going Live

1. **Get Production Credentials**

   ```bash
   # Request from: https://developer.dhl.com
   # Or contact: support@dhl.com
   # Account: 278579181
   ```

2. **Update .env (Production)**

   ```env
   DHL_EXPRESS_API_KEY=prod-api-key-here
   DHL_EXPRESS_API_SECRET=prod-api-secret-here
   DHL_API_ENVIRONMENT=production
   DHL_TRACKING_ENABLED=true
   DHL_WEBHOOK_ENABLED=true
   DHL_WEBHOOK_URL=https://api.nextpik.com/api/v1/webhooks/dhl
   ```

3. **Configure Webhooks in DHL Portal**
   - Login to MyDHL+ portal
   - Navigate to "Webhooks"
   - Add: https://api.nextpik.com/api/v1/webhooks/dhl
   - Events: `tracking-update`, `delivery-confirmed`, `exception`

4. **Test with Real Addresses**
   - Use your actual business address as shipper
   - Use a real customer address as receiver
   - Create 2-3 test shipments
   - Verify tracking works end-to-end

5. **Monitor API Usage**
   - Check transaction limits (1500/month for rating)
   - Set up alerts for rate limit warnings
   - Monitor API response times

6. **Backup Plan**
   - Keep manual shipping as fallback
   - Document manual process
   - Train staff on both methods

---

## 🐛 Troubleshooting

### Issue: "DHL API authentication failed"

**Solution:**

```bash
# Verify credentials
echo $DHL_EXPRESS_API_KEY
echo $DHL_EXPRESS_API_SECRET

# Test directly
curl -u "$DHL_EXPRESS_API_KEY:$DHL_EXPRESS_API_SECRET" \
  https://express.api.dhl.com/mydhlapi/test/rates
```

### Issue: "Invalid tracking number"

**Solution:**

- Tracking numbers must be created in DHL portal first
- Format: 10 digits (e.g., 1234567890)
- Cannot use dummy numbers for production

### Issue: "Rate limit exceeded"

**Solution:**

- Check MyDHL+ portal for transaction count
- Sandbox: 250 calls/day
- Production: 1500/month (rating), 500/month (shipment)
- Upgrade plan if needed

### Issue: "Shipment not found in DHL portal"

**Solution:**

- Verify using correct DHL account: 278579181
- Check API environment (sandbox vs production)
- Confirm shipment was created successfully (check response)

---

## 📞 DHL Support Contacts

**Technical Support:**

- Email: tech.support@dhl.com
- Developer Portal: https://developer.dhl.com/support
- Phone: +1-800-225-5345 (US)

**Account Management:**

- MyDHL+ Support: https://mydhlplus.dhl.com/support
- Account Number: 278579181
- Email: dm.belgoservices@dmbscom.com

**API Credentials Request:**

- Portal: https://developer.dhl.com/user/apps
- App Name: NEXTPIK. DHL EXPRESS - MYDHL API
- Status: Application submitted (in progress)

---

## 📚 Additional Resources

- **DHL API Documentation:** https://developer.dhl.com/api-reference/mydhl-api-dhl-express
- **Rate Calculator:** https://mydhlplus.dhl.com/tools/rate-calculator
- **Tracking Portal:** https://www.dhl.com/track
- **Integration Guide:** DHL_API_INTEGRATION_SUMMARY.md
- **Test Scripts:**
  - `test-dhl-endpoints.ts` - Full endpoint tests
  - `test-dhl-direct.ts` - Direct API tests
  - `test-shipments.ts` - Shipment workflow tests

---

**Need Help?** Check existing documentation:

- DHL_INTEGRATION_SUMMARY.md
- DHL_ENDPOINT_TEST_GUIDE.md
- SHIPMENT_TRACKING_IMPLEMENTATION.md
