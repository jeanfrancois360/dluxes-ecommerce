# DHL Endpoint Testing Guide

## Prerequisites

1. **API Server Must Be Running**
   ```bash
   pnpm dev:api
   ```

2. **DHL API Credentials Configured**
   Edit `apps/api/.env` and ensure:
   ```env
   DHL_TRACKING_ENABLED=true
   DHL_API_KEY=your-dhl-api-key-here
   DHL_API_BASE_URL=https://api-eu.dhl.com
   DHL_TRACKING_CACHE_TTL=300
   ```

## Available DHL Endpoints

### 1. DHL API Health Check
**Endpoint:** `GET /api/v1/shipping/admin/dhl/health`
**Auth:** Admin/Super Admin only
**Purpose:** Tests DHL API configuration and credentials

**Response:**
```json
{
  "enabled": true,
  "hasApiKey": true,
  "apiUrl": "https://api-eu.dhl.com",
  "status": "configured"
}
```

### 2. DHL Test Rates
**Endpoint:** `POST /api/v1/shipping/admin/dhl/test-rates`
**Auth:** Admin/Super Admin only
**Purpose:** Test DHL rate calculation with sample shipment data

**Request Body (all optional):**
```json
{
  "originCountry": "US",
  "originPostalCode": "10001",
  "destinationCountry": "GB",
  "destinationPostalCode": "SW1A 1AA",
  "weight": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "DHL API is working correctly",
  "ratesCount": 3,
  "rates": [
    {
      "serviceName": "DHL Express Worldwide",
      "price": {
        "amount": 45.50,
        "currency": "USD"
      },
      "deliveryTime": {
        "min": 2,
        "max": 3,
        "estimatedDate": "2026-02-05"
      }
    }
  ]
}
```

## Testing Methods

### Method 1: Using the Test Script (Recommended)

1. Start the API server:
   ```bash
   pnpm dev:api
   ```

2. Run the test script:
   ```bash
   npx tsx test-dhl-endpoints.ts
   ```

The script will test:
- ✓ Admin authentication
- ✓ DHL API health check
- ✓ DHL rate calculation with default parameters
- ✓ DHL rate calculation with custom routes (Rwanda → USA, Germany → Japan)
- ✓ Security (authentication required)

### Method 2: Using cURL

#### Test 1: Login as Admin
```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin1@nextpik.com",
    "password": "Password123!"
  }'
```

Save the `access_token` from the response.

#### Test 2: DHL Health Check
```bash
curl -X GET http://localhost:4000/api/v1/shipping/admin/dhl/health \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Test 3: DHL Test Rates (Default)
```bash
curl -X POST http://localhost:4000/api/v1/shipping/admin/dhl/test-rates \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

#### Test 4: DHL Test Rates (Custom Route: Rwanda → USA)
```bash
curl -X POST http://localhost:4000/api/v1/shipping/admin/dhl/test-rates \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "originCountry": "RW",
    "originPostalCode": "00000",
    "destinationCountry": "US",
    "destinationPostalCode": "10001",
    "weight": 2.5
  }'
```

### Method 3: Using Postman/Insomnia

1. **Create a new request collection**

2. **Authentication Request:**
   - Method: POST
   - URL: `http://localhost:4000/api/v1/auth/login`
   - Body (JSON):
     ```json
     {
       "email": "admin1@nextpik.com",
       "password": "Password123!"
     }
     ```
   - Save the `access_token`

3. **DHL Health Check Request:**
   - Method: GET
   - URL: `http://localhost:4000/api/v1/shipping/admin/dhl/health`
   - Headers:
     - `Authorization`: `Bearer YOUR_ACCESS_TOKEN`

4. **DHL Test Rates Request:**
   - Method: POST
   - URL: `http://localhost:4000/api/v1/shipping/admin/dhl/test-rates`
   - Headers:
     - `Authorization`: `Bearer YOUR_ACCESS_TOKEN`
     - `Content-Type`: `application/json`
   - Body (JSON):
     ```json
     {
       "originCountry": "RW",
       "originPostalCode": "00000",
       "destinationCountry": "US",
       "destinationPostalCode": "10001",
       "weight": 2.5
     }
     ```

## Expected Results

### When DHL is Configured Correctly:
- ✅ Health check returns `enabled: true` and `hasApiKey: true`
- ✅ Test rates return shipping options with prices and delivery times
- ✅ Multiple service options (Express, Standard, etc.)

### When DHL is Not Configured:
- ⚠️ Health check returns `enabled: false`
- ⚠️ Test rates return error message about missing configuration

### When DHL API Key is Invalid:
- ❌ Health check may return `hasApiKey: true` (configured but not validated until used)
- ❌ Test rates return authentication error from DHL API

## Test Scenarios

### Scenario 1: Domestic US Shipping
```json
{
  "originCountry": "US",
  "originPostalCode": "10001",
  "destinationCountry": "US",
  "destinationPostalCode": "90210",
  "weight": 1
}
```

### Scenario 2: International (Rwanda → USA)
```json
{
  "originCountry": "RW",
  "originPostalCode": "00000",
  "destinationCountry": "US",
  "destinationPostalCode": "10001",
  "weight": 2.5
}
```

### Scenario 3: International (Germany → Japan)
```json
{
  "originCountry": "DE",
  "originPostalCode": "10115",
  "destinationCountry": "JP",
  "destinationPostalCode": "100-0001",
  "weight": 5
}
```

### Scenario 4: Heavy Package
```json
{
  "originCountry": "US",
  "originPostalCode": "10001",
  "destinationCountry": "UK",
  "destinationPostalCode": "SW1A 1AA",
  "weight": 20
}
```

## Troubleshooting

### Issue: "Authentication required" error
**Solution:** Make sure you're using a valid admin token in the Authorization header

### Issue: "DHL API is disabled"
**Solution:** Set `DHL_TRACKING_ENABLED=true` in `apps/api/.env`

### Issue: "Invalid DHL API key"
**Solution:**
1. Get credentials from https://developer.dhl.com
2. Subscribe to "Shipment Tracking - Unified API"
3. Update `DHL_API_KEY` in `apps/api/.env`
4. Restart API server

### Issue: "Rate limit exceeded"
**Solution:** DHL API has rate limits (250 calls/day initially). Wait or upgrade your plan.

### Issue: "Invalid country code"
**Solution:** Use ISO 2-letter country codes (e.g., "US", "RW", "GB", "DE")

## Admin Credentials

**Email:** `admin1@nextpik.com`
**Password:** `Password123!`

Alternative admin accounts:
- `admin2@nextpik.com` / `Password123!`
- `superadmin@nextpik.com` / `Password123!`

## Related Documentation

- **Full DHL Integration:** See `DHL_API_INTEGRATION_SUMMARY.md`
- **API Controller:** `apps/api/src/shipping/shipping.controller.ts` (lines 156-204)
- **DHL Services:** `apps/api/src/integrations/dhl/`
- **Test Users:** See `TEST_USERS.md`

## Quick Start

```bash
# 1. Start API server
pnpm dev:api

# 2. Run test script
npx tsx test-dhl-endpoints.ts

# 3. Check results
# The script will output detailed test results for all DHL endpoints
```

---

**Last Updated:** February 2, 2026
**Status:** Ready for testing
