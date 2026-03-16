# EasyPost Integration - Setup Complete ✅

**Date:** March 16, 2026
**Status:** Operational
**Mode:** Test (Development)

---

## ✅ What Was Done

### 1. Database Migration Applied

- **Migration:** `20260315000000_add_easypost_integration`
- **Tables Created:**
  - `easypost_shipments` - Stores label purchases and tracking
  - `easypost_tracking_events` - Stores tracking history
  - `easypost_webhook_logs` - Webhook event logging for idempotency
- **Enums Created:**
  - `EasyPostShipmentStatus` - Shipment status tracking
  - `EasyPostRefundStatus` - Refund status tracking

### 2. System Settings Configured

Created 10 EasyPost settings in database:

- `easypost_enabled` = `true` ✅
- `easypost_api_key` = `EZTKc44aba3f57f...` ✅
- `easypost_test_mode` = `true` ✅
- `easypost_webhook_secret` = (empty for now)
- `easypost_default_label_format` = `PDF`
- `easypost_address_verification` = `true`
- `easypost_default_carriers` = `['USPS', 'UPS', 'FedEx']`
- `origin_street1` = `123 Main Street`
- `origin_city` = `New York`
- `origin_state` = `NY`

### 3. Environment Variables Set

Added to `apps/api/.env`:

```bash
EASYPOST_API_KEY=EZTKc44aba3f57f8471ca9f0277ab3200059q76d49lVTwqLyXrRLEhB5Q
EASYPOST_TEST_MODE=true
EASYPOST_WEBHOOK_SECRET=
```

### 4. Test Endpoint Added

- **Endpoint:** `GET /api/v1/easypost/test`
- **Purpose:** Verify API connection and credentials
- **Test Result:** ✅ Success
- **Test Address ID:** `adr_be5c4fa6217f11f1acfc3cecef1b359e`

---

## 📋 Available Endpoints

### Public Test

```bash
GET /api/v1/easypost/test
```

### Shipping Rates (Requires Auth)

```bash
POST /api/v1/easypost/rates
POST /api/v1/easypost/rates/lowest
```

### Label Management (Seller/Admin only)

```bash
POST /api/v1/easypost/purchase         # Purchase shipping label
POST /api/v1/easypost/return-label     # Create return label
POST /api/v1/easypost/refund/:id       # Refund label
POST /api/v1/easypost/convert/:id      # Convert label format
```

### Shipment Tracking

```bash
GET /api/v1/easypost/shipment/:id
GET /api/v1/easypost/order/:orderId/shipments
GET /api/v1/easypost/tracking/:shipmentId
POST /api/v1/easypost/tracker           # Create external tracker
```

### Address Verification

```bash
POST /api/v1/easypost/verify-address
```

---

## 🧪 Testing Examples

### 1. Test Connection (Already Tested ✅)

```bash
curl http://localhost:4000/api/v1/easypost/test
```

**Response:**

```json
{
  "success": true,
  "message": "EasyPost API connection successful ✅",
  "data": {
    "testMode": true,
    "testAddressId": "adr_be5c4fa6217f11f1acfc3cecef1b359e",
    "apiKeyFormat": "Valid EasyPost test key"
  }
}
```

### 2. Get Shipping Rates (Requires Auth Token)

```bash
curl -X POST http://localhost:4000/api/v1/easypost/rates \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fromAddress": {
      "street1": "388 Townsend St",
      "city": "San Francisco",
      "state": "CA",
      "zip": "94107",
      "country": "US"
    },
    "toAddress": {
      "street1": "1 E 161st St",
      "city": "Bronx",
      "state": "NY",
      "zip": "10451",
      "country": "US"
    },
    "parcel": {
      "length": 10,
      "width": 8,
      "height": 4,
      "weight": 16
    }
  }'
```

### 3. Verify Address

```bash
curl -X POST http://localhost:4000/api/v1/easypost/verify-address \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "street1": "388 Townsend St",
    "city": "San Francisco",
    "state": "CA",
    "zip": "94107",
    "country": "US"
  }'
```

---

## 🔄 Integration with Shipping Flow

EasyPost is now integrated into the shipping calculation cascade as **TIER 1**:

```
TIER 0: Gelato (POD items only)
  ↓
TIER 1: EasyPost (if enabled) ← NEW
  ↓
TIER 2: DHL API (if configured)
  ↓
TIER 3: Shipping Zones
  ↓
TIER 4: Manual Rates (fallback)
```

When `easypost_enabled = true` in settings, the system will:

1. Call EasyPost API for real-time carrier rates
2. Return rates from USPS, UPS, FedEx, and other carriers
3. Fall back to DHL/zones/manual if EasyPost fails

---

## 📦 Label Purchase Flow

1. **Get Rates:** Call `POST /easypost/rates` with shipment details
2. **Select Rate:** Frontend displays rates to seller
3. **Purchase Label:** Call `POST /easypost/purchase` with selected rate
4. **Store Shipment:** System stores label URL, tracking number in `easypost_shipments` table
5. **Update Order:** Order status updated to SHIPPED with tracking info
6. **Email Customer:** Tracking number sent to customer

---

## 🔐 Security Notes

- ✅ Test API key is safely stored in database
- ✅ All label purchase endpoints require authentication
- ✅ Sellers can only purchase labels for their own orders
- ⚠️ Webhook secret not configured yet (optional for now)
- ⚠️ Origin address needs to be updated in settings (currently placeholder)

---

## 🚀 Next Steps

### Required for Production

1. **Update Origin Address:**
   - Go to Admin Settings → Delivery
   - Update `origin_street1`, `origin_city`, `origin_state` with actual warehouse address

2. **Get Production API Key:**
   - Log in to EasyPost dashboard
   - Go to API Keys tab
   - Create production API key
   - Update `easypost_api_key` setting
   - Set `easypost_test_mode = false`

3. **Configure Webhook (Optional but Recommended):**
   - Create webhook in EasyPost dashboard
   - URL: `https://api.nextpik.com/api/v1/webhooks/easypost`
   - Get webhook secret
   - Update `easypost_webhook_secret` setting

### Optional Enhancements

- [ ] Add EasyPost settings to Admin UI (Settings page)
- [ ] Add tracking display to customer order details page
- [ ] Add "Buy Label" button to seller order management
- [ ] Set up webhook for automatic tracking updates
- [ ] Add label printing functionality to seller dashboard

---

## 📝 Files Modified/Created

### Backend (API)

- `apps/api/.env` - Added EasyPost env vars
- `apps/api/src/integrations/easypost/` - Complete EasyPost service suite (13 files)
- `apps/api/src/integrations/easypost/easypost.controller.ts` - Added test endpoint
- `apps/api/src/app.module.ts` - EasyPost module already imported

### Database

- `packages/database/prisma/schema.prisma` - EasyPost models already exist
- `packages/database/prisma/migrations/20260315000000_add_easypost_integration/` - Migration applied
- `packages/database/seed-easypost.js` - Settings seed script (fixed typo: validationRule)
- `packages/database/enable-easypost.js` - Created activation script

### Frontend (Pending)

- `apps/web/src/components/settings/easypost-settings.tsx` - Not yet integrated
- `apps/web/src/components/orders/easypost-tracking-display.tsx` - Not yet integrated
- `apps/web/src/hooks/use-easypost-tracking.ts` - Not yet integrated

---

## 🎯 Current Status

| Feature          | Status        | Notes                               |
| ---------------- | ------------- | ----------------------------------- |
| Database Schema  | ✅ Applied    | 3 tables, 2 enums                   |
| System Settings  | ✅ Configured | 10 settings added                   |
| API Integration  | ✅ Working    | Test endpoint verified              |
| Rate Retrieval   | ✅ Ready      | Endpoint available                  |
| Label Purchase   | ✅ Ready      | Endpoint available                  |
| Tracking         | ✅ Ready      | Endpoint available                  |
| Webhooks         | ⚠️ Pending    | URL available, secret not set       |
| Admin UI         | ⚠️ Pending    | Components exist but not integrated |
| Seller Dashboard | ⚠️ Pending    | Label button not integrated         |

---

## 🐛 Troubleshooting

### "EasyPost is not enabled"

- Run: `node packages/database/enable-easypost.js`

### "API key not configured"

- Check `easypost_api_key` setting in database
- Ensure `.env` has `EASYPOST_API_KEY`

### "Insufficient balance" (Production)

- Add funds to EasyPost account
- Check account balance in dashboard

### "Address verification failed"

- Use complete, valid addresses
- Include postal code and country
- Set `strict=false` query param for lenient verification

---

## 📞 Support

- **EasyPost Docs:** https://docs.easypost.com
- **Test Dashboard:** https://www.easypost.com/account
- **API Reference:** https://docs.easypost.com/api

---

**✅ EasyPost integration is now operational in test mode!**
