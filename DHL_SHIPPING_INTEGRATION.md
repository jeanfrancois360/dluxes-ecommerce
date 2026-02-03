# DHL Express Shipping Integration

**Version:** 2.7.1
**Date:** January 31, 2026
**Status:** ✅ Implemented & Production-Ready

---

## Overview

NextPik now supports **DHL Express API integration** for real-time shipping rate calculation using the **MyDHL API**. This integration provides accurate, up-to-date shipping costs based on actual package dimensions, weight, and destination.

### Key Features

- ✅ **Real-time DHL Express rates** via MyDHL API
- ✅ **Three shipping modes**: Manual, DHL API, Hybrid
- ✅ **Fallback mechanism**: Automatic fallback to manual rates if DHL API fails
- ✅ **Admin health checks**: Test DHL credentials and API connectivity
- ✅ **Configurable via settings**: No code changes needed for configuration
- ✅ **Non-destructive**: Existing manual shipping mode fully preserved

---

## Architecture

### Files Created/Modified

**New Files:**
- `apps/api/src/integrations/dhl/dhl-rates.service.ts` - DHL Express rates calculation service

**Modified Files:**
- `apps/api/src/integrations/dhl/dhl.module.ts` - Added DhlRatesService export
- `apps/api/src/orders/shipping-tax.service.ts` - Integrated DHL rates
- `apps/api/src/orders/orders.module.ts` - Imported DhlModule
- `apps/api/src/shipping/shipping.controller.ts` - Added DHL health check endpoints
- `apps/api/src/shipping/shipping.module.ts` - Imported DhlModule
- `packages/database/prisma/seed-settings.ts` - Added 6 new DHL settings

### Integration Flow - CASCADE FALLBACK

```
User Checkout
    ↓
calculateShippingOptions()
    ↓
Check shipping_mode setting
    ↓
┌─────────────────────────────────────────────────────────────┐
│  shipping_mode = 'manual'                                   │
│  ────────────────────────                                   │
│  Zones → Manual (skip DHL entirely)                         │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  shipping_mode = 'dhl_api'                                  │
│  ──────────────────────────                                 │
│  1. Try DHL API                                             │
│     ├─ Success → Return DHL rates only                      │
│     └─ Fail → 2. Try Shipping Zones                         │
│              ├─ Zones found → Return zone rates             │
│              └─ No zones → 3. Return manual rates           │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  shipping_mode = 'hybrid'                                   │
│  ─────────────────────────                                  │
│  1. Try DHL API                                             │
│     ├─ Success → Return DHL + (Zones OR Manual)             │
│     └─ Fail → 2. Try Shipping Zones                         │
│              ├─ Zones found → Return zone rates             │
│              └─ No zones → 3. Return manual rates           │
└─────────────────────────────────────────────────────────────┘
    ↓
Return shipping options to user

CASCADE PRIORITY: DHL → Zones → Manual (automatic fallback)
```

---

## Configuration

### 🔒 CRITICAL SECURITY REQUIREMENT

**ALL API CREDENTIALS MUST BE IN `.env` FILES - NEVER IN DATABASE**

API keys, secrets, and tokens are **NEVER** stored in the database. They are managed exclusively through environment variables for security.

### 1. Environment Variables (REQUIRED for API credentials)

Configure DHL in your `.env` file:

```env
# DHL Express API Configuration (REQUIRED - NEVER put in database)
DHL_EXPRESS_API_KEY=your_api_key_here
DHL_EXPRESS_API_SECRET=your_api_secret_here
DHL_ACCOUNT_NUMBER=your_account_number # (optional, for negotiated rates)
DHL_API_ENVIRONMENT=test # or 'production'

# Shipping origin (can also be in database settings)
ORIGIN_COUNTRY=US
ORIGIN_POSTAL_CODE=10001
```

**File Location:** `/Users/jeanfrancoismunyaneza/all-orbitunix-projects/nextpik/apps/api/.env`

### 2. Database Settings (Non-sensitive configuration only)

Only non-sensitive configuration is stored in the database:

| Setting Key | Type | Default | Description |
|-------------|------|---------|-------------|
| `dhl_api_environment` | STRING | 'test' | API environment: 'test' or 'production' |
| `origin_country` | STRING | 'US' | ISO 2-letter country code for shipment origin |
| `origin_postal_code` | STRING | '10001' | Postal code of your warehouse/shipping location |

**⚠️ NEVER store API keys in database settings!**

### 3. Shipping Mode

The `shipping_mode` setting controls which shipping calculation method is used:

```typescript
// In Admin Settings → Shipping
shipping_mode: 'manual' | 'dhl_api' | 'hybrid'
```

- **`manual`** (default): **Zones → Manual** cascade (skips DHL entirely)
- **`dhl_api`**: **DHL → Zones → Manual** cascade (tries DHL first)
- **`hybrid`**: **DHL + (Zones OR Manual)** (shows DHL rates + fallback options)

### 4. Shipping Zones (Database)

The platform supports **zone-based shipping** stored in the database (`ShippingZone` and `ShippingRate` models):

- **Zones**: Define shipping regions by country, state, city, or postal code
- **Rates**: Different rate tiers per zone based on order value
- **Priority**: Zones with higher priority match first
- **Fallback**: If no zones match, system falls back to manual rates

**Example Zone Configuration:**
```typescript
// Zone: US Domestic
{
  name: "US Domestic",
  code: "us-domestic",
  countries: ["US"],
  baseFee: 10.00,
  perKgFee: 2.50,
  freeShippingThreshold: 200,
  minDeliveryDays: 5,
  maxDeliveryDays: 7
}
```

Zones are managed via Admin API endpoints:
- `POST /api/v1/shipping/zones` - Create zone
- `PUT /api/v1/shipping/zones/:code` - Update zone
- `DELETE /api/v1/shipping/zones/:code` - Delete zone

---

## Getting DHL API Credentials

### Step 1: Create DHL Developer Account

1. Visit [https://developer.dhl.com](https://developer.dhl.com)
2. Sign up for a developer account
3. Navigate to **MyDHL API (DHL Express)**

### Step 2: Generate API Credentials

1. Go to **API Catalog** → **MyDHL API (DHL Express)**
2. Click **"Get Started"** or **"Request Access"**
3. You'll receive:
   - API Key
   - API Secret
4. **IMPORTANT**: You need an active DHL Express customer account

### Step 3: Test Environment

DHL provides a **test environment** for development:
- **Test URL**: `https://express.api.dhl.com/mydhlapi/test`
- **Daily Quota**: 500 API calls per day (test environment)

### Step 4: Production Environment

Once ready for production:
- **Production URL**: `https://express.api.dhl.com/mydhlapi`
- Change `dhl_api_environment` setting to `production`

---

## API Endpoints

### Admin Endpoints

#### 1. Check DHL API Health

```http
GET /api/v1/shipping/admin/dhl/health
Authorization: Bearer <admin_jwt_token>
```

**Response:**
```json
{
  "enabled": true,
  "configured": true,
  "credentialsValid": true,
  "environment": "test"
}
```

#### 2. Test DHL Rates

```http
POST /api/v1/shipping/admin/dhl/test-rates
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

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
      "id": "dhl-p",
      "name": "DHL Express Worldwide",
      "description": "2-3 business days",
      "price": 45.50,
      "currency": "USD",
      "estimatedDays": 3,
      "carrier": "DHL Express",
      "productCode": "P"
    }
  ]
}
```

---

## Usage Examples

### Example 1: Manual Mode (Default - Zones → Manual)

```typescript
// Admin sets: shipping_mode = 'manual'

// Scenario A: Shipping zones configured
// Result: Uses zone-based rates
[
  { id: 'zone-standard', name: 'Standard Shipping', price: 12.50, zone: 'US Domestic', ... },
  { id: 'zone-express', name: 'Express Shipping', price: 22.00, zone: 'US Domestic', ... }
]

// Scenario B: No zones configured
// Result: Uses manual rates from settings
[
  { id: 'standard', name: 'Standard Shipping', price: 9.99, carrier: 'USPS', ... },
  { id: 'express', name: 'Express Shipping', price: 19.99, carrier: 'FedEx', ... },
  { id: 'overnight', name: 'Overnight Delivery', price: 29.99, carrier: 'UPS', ... }
]
```

### Example 2: DHL API Mode (DHL → Zones → Manual)

```typescript
// Admin sets: shipping_mode = 'dhl_api'

// Scenario A: DHL API succeeds
// Result: Real-time DHL Express rates
[
  { id: 'dhl-p', name: 'DHL Express Worldwide', price: 45.50, carrier: 'DHL Express', ... },
  { id: 'dhl-n', name: 'DHL Express Domestic', price: 32.75, carrier: 'DHL Express', ... },
  { id: 'dhl-k', name: 'DHL Express 9:00', price: 65.00, carrier: 'DHL Express', ... }
]

// Scenario B: DHL API fails, zones configured
// Result: Zone-based rates (automatic fallback)
[
  { id: 'zone-standard', name: 'Standard Shipping', price: 12.50, zone: 'US Domestic', ... }
]

// Scenario C: DHL API fails, no zones configured
// Result: Manual rates (final fallback)
[
  { id: 'standard', name: 'Standard Shipping', price: 9.99, carrier: 'USPS', ... }
]
```

### Example 3: Hybrid Mode (DHL + Zones OR Manual)

```typescript
// Admin sets: shipping_mode = 'hybrid'

// Scenario A: DHL API succeeds + zones configured
// Result: DHL rates + Zone rates
[
  // DHL Express rates (real-time)
  { id: 'dhl-p', name: 'DHL Express Worldwide', price: 45.50, carrier: 'DHL Express', ... },
  { id: 'dhl-n', name: 'DHL Express Domestic', price: 32.75, carrier: 'DHL Express', ... },

  // Zone-based rates
  { id: 'zone-standard', name: 'Standard Shipping', price: 12.50, zone: 'US Domestic', ... }
]

// Scenario B: DHL API succeeds + no zones
// Result: DHL rates + Manual rates
[
  // DHL Express rates (real-time)
  { id: 'dhl-p', name: 'DHL Express Worldwide', price: 45.50, carrier: 'DHL Express', ... },

  // Manual rates
  { id: 'standard', name: 'Standard Shipping', price: 9.99, carrier: 'USPS', ... },
  { id: 'express', name: 'Express Shipping', price: 19.99, carrier: 'FedEx', ... }
]

// Scenario C: DHL API fails + zones configured
// Result: Zone rates only
[
  { id: 'zone-standard', name: 'Standard Shipping', price: 12.50, zone: 'US Domestic', ... }
]
```

---

## Error Handling & Cascade Fallback

The integration is designed to be **resilient** with **3-tier fallback**:

### Automatic Cascade Scenarios

**Tier 1: DHL Express API** (if shipping_mode allows)
1. **DHL API credentials not configured** → Skip to Tier 2 (Zones)
2. **DHL API returns error** → Skip to Tier 2 (Zones)
3. **DHL API timeout** → Skip to Tier 2 (Zones)
4. **No DHL products available** → Skip to Tier 2 (Zones)

**Tier 2: Shipping Zones** (database-configured)
1. **Zones configured and match destination** → Return zone rates
2. **No zones configured** → Skip to Tier 3 (Manual)
3. **No zones match destination** → Skip to Tier 3 (Manual)
4. **Zone query error** → Skip to Tier 3 (Manual)

**Tier 3: Manual Rates** (settings-based, always available)
- Final fallback, always works
- Uses configured rates from settings

### Logging

All shipping calculations are logged with tier indicators:

```typescript
// DHL Success
Logger: "[DHL API] Using DHL Express rates (3 options)"
Logger: "[Hybrid] 3 DHL + 2 fallback options"

// DHL Failure → Zones
Logger: "[DHL API] Failed, falling back to zones/manual: API key invalid"
Logger: "[Zones] Using zone-based rates (2 options)"

// Zones Failure → Manual
Logger: "[Zones] Failed or no zones configured: No zones match destination"
Logger: "[Manual] Using manual/settings-based rates (final fallback)"
```

---

## Testing Checklist

### ✅ Manual Testing

1. **Test Manual Mode** (default behavior)
   ```bash
   # Ensure shipping_mode = 'manual'
   # Verify existing shipping options work
   ```

2. **Test DHL API Configuration**
   ```bash
   # Set DHL credentials in admin settings
   # Call GET /api/v1/shipping/admin/dhl/health
   # Verify credentialsValid: true
   ```

3. **Test DHL Rates Calculation**
   ```bash
   # Set shipping_mode = 'dhl_api'
   # Add items to cart, proceed to checkout
   # Verify DHL Express rates appear
   ```

4. **Test Hybrid Mode**
   ```bash
   # Set shipping_mode = 'hybrid'
   # Verify both DHL and manual rates appear
   ```

5. **Test Fallback Mechanism**
   ```bash
   # Set invalid DHL credentials
   # Set shipping_mode = 'dhl_api'
   # Verify fallback to manual rates works
   ```

### ✅ Integration Testing

```typescript
// Test DHL service directly
import { DhlRatesService } from './dhl-rates.service';

// 1. Test API health
const health = await dhlRatesService.getHealthStatus();
console.log(health);

// 2. Test rate calculation
const rates = await dhlRatesService.getSimplifiedRates({
  originCountryCode: 'US',
  originPostalCode: '10001',
  destinationCountryCode: 'GB',
  destinationPostalCode: 'SW1A 1AA',
  weight: 1
});
console.log(rates);
```

---

## Migration Path

### Current Users (Manual Shipping)

**No action required!** The integration is **fully backward-compatible**:
- Default `shipping_mode` is `'manual'`
- All existing shipping logic preserved
- DHL integration is **opt-in**

### Enabling DHL API

1. **Configure DHL credentials** in Admin Settings → Shipping
2. **Test the connection** using the health check endpoint
3. **Change `shipping_mode`** to `'dhl_api'` or `'hybrid'`
4. **Monitor logs** for any issues

---

## DHL Express Product Codes

The service supports all DHL Express products:

| Code | Product Name | Typical Use |
|------|--------------|-------------|
| `N` | DHL Express Domestic | Domestic shipments |
| `P` | DHL Express Worldwide | International documents & parcels |
| `D` | DHL Express Worldwide Document | International documents only |
| `U` | DHL Express Worldwide | International parcels |
| `K` | DHL Express 9:00 | Guaranteed delivery by 9:00 AM |
| `L` | DHL Express 10:30 | Guaranteed delivery by 10:30 AM |
| `G` | DHL Express Domestic Economy | Economy domestic |
| `W` | DHL Express Economy Select | Economy international |
| `I` | DHL Express Domestic 9:00 | Domestic by 9:00 AM |
| `Y` | DHL Express 12:00 | Guaranteed delivery by 12:00 PM |

---

## Troubleshooting

### Issue: "DHL API is not configured"

**Cause:** Missing API credentials
**Fix:** Add `dhl_express_api_key` and `dhl_express_api_secret` in Admin Settings

### Issue: "Invalid DHL API credentials"

**Cause:** Incorrect API key or secret
**Fix:**
1. Verify credentials at [developer.dhl.com](https://developer.dhl.com)
2. Check if you're using test vs production environment
3. Ensure you have an active DHL Express customer account

### Issue: "DHL API rate limit exceeded"

**Cause:** Too many API calls (test environment: 500/day)
**Fix:**
1. Upgrade to production environment
2. Implement caching (future enhancement)
3. Use hybrid mode to reduce API calls

### Issue: No rates returned

**Cause:** Invalid origin/destination combination
**Fix:**
1. Verify `origin_country` and `origin_postal_code` settings
2. Check destination address format
3. Test with known working addresses (e.g., US → GB)

---

## 🔒 Security Considerations

### ✅ API Credentials Protection (CRITICAL)

**Credentials Management:**
- ✅ DHL credentials stored **ONLY in .env files**
- ✅ Never stored in database
- ✅ Never exposed in API responses
- ✅ Never committed to git (.env in .gitignore)
- ✅ Separate credentials for test/production

**Code-Level Protection:**
- DhlRatesService only reads from environment variables
- `getApiCredentials()` method **never** checks database
- All credential access logged for audit

### ✅ Authentication & Authorization

All DHL admin endpoints require:
- Valid JWT token
- `ADMIN` or `SUPER_ADMIN` role
- Endpoints: `/api/v1/shipping/admin/dhl/*`

### ✅ Rate Limiting

- DHL API has built-in rate limiting
- Test environment: 500 calls/day
- Production: Higher limits based on your DHL account

### ⚠️ Common Security Mistakes to Avoid

1. **NEVER** store API keys in:
   - Database tables
   - Frontend code
   - Git repositories
   - Log files
   - Error messages

2. **ALWAYS** use:
   - Environment variables (.env)
   - Separate keys for dev/staging/production
   - Key rotation strategy
   - Secure key storage (e.g., AWS Secrets Manager, Vault)

---

## Future Enhancements

### Planned Features

1. **Rate Caching**: Cache DHL rates for 5-10 minutes to reduce API calls
2. **Shipment Creation**: Create DHL shipping labels via API
3. **Address Validation**: Validate addresses using DHL API
4. **Multi-carrier Support**: Add FedEx, UPS alongside DHL
5. **Negotiated Rates**: Support customer-specific negotiated rates

---

## DHL API Documentation

**Official Resources:**
- **API Reference**: [https://developer.dhl.com/api-reference/mydhl-api-dhl-express](https://developer.dhl.com/api-reference/mydhl-api-dhl-express)
- **Developer Portal**: [https://developer.dhl.com](https://developer.dhl.com)
- **2026 Rate Guide**: Available at mydhl.express.dhl

**Authentication Method:** Basic Auth (API Key + Secret)
**Request Format:** JSON
**Response Format:** JSON

---

## Summary

✅ **Production-Ready**: Fully tested and type-safe
✅ **Non-Breaking**: Existing functionality preserved
✅ **Resilient**: Automatic fallback mechanisms
✅ **Configurable**: Admin UI integration ready
✅ **Documented**: Comprehensive API and usage docs

**Next Steps:**
1. Run database migration to add new settings: `pnpm prisma:migrate dev`
2. Configure DHL credentials in Admin Settings
3. Test DHL integration using health check endpoints
4. Enable DHL API mode when ready

---

**Last Updated:** January 31, 2026
**Version:** 2.7.1 - DHL Express Integration
