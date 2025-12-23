# 🎯 Delivery Assignment System - Complete Guide

## Overview
The NextPik platform features an **intelligent auto-assignment system** that automatically selects the best delivery provider for each order based on multiple factors.

---

## 🤖 How Auto-Assignment Works

### Assignment Triggers

Delivery providers are assigned automatically when:
1. **Order is Confirmed** - After payment is successful
2. **Admin Creates Delivery** - Via API or admin panel
3. **Webhook Event** - External order system integration

### Intelligent Selection Algorithm

The system scores each provider (0-200 points) based on:

#### 1. **Provider Type** (10-30 points)
- **API_INTEGRATED** (30 pts) - FedEx, DHL, UPS
  - Real-time tracking
  - Automated status updates
  - International reliability

- **PARTNER** (20 pts) - NextPik Express
  - Local knowledge
  - Flexible delivery options
  - Better for regional deliveries

- **MANUAL** (10 pts) - Manual tracking providers
  - Basic tracking only

#### 2. **Cost Efficiency** (5-25 points)
- **Low Commission (<10%)** - 25 points
- **Medium Commission (10-15%)** - 15 points
- **High Commission (>15%)** - 5 points

Example:
```
NextPik Express: $5 fixed → 25 points (lowest cost)
DHL Express: 10% → 25 points
FedEx: 12.5% → 15 points
UPS: 11% → 15 points
```

#### 3. **API Capabilities** (20 points)
- **API Enabled** - Automatic tracking updates
- **Webhook Support** - Real-time status notifications
- **Integration Quality** - Reliability of API

#### 4. **High-Value Order Handling** (15 points)
- Orders **>$1000** prefer API-integrated providers
- Established carriers for insurance/reliability
- Better tracking for expensive items

#### 5. **Urgency Handling** (25-30 points)
- **Standard Delivery** - No preference
- **Express Delivery** - Providers with "Express" in name
- **Overnight Delivery** - FedEx prioritized

#### 6. **International Reliability** (20 points)
- **Major Carriers** - FedEx, DHL, UPS
  - Established global network
  - Proven track record
  - Better international coverage

#### 7. **Regional Specialists** (25 points)
- **African Countries** (RW, KE, UG, TZ, etc.)
  - Local PARTNER providers get boost
  - Better knowledge of region
  - More cost-effective for local deliveries

---

## 📊 Scoring Examples

### Example 1: Local Delivery to Rwanda

**Order Details:**
- Destination: Kigali, Rwanda (RW)
- Value: $150
- Urgency: Standard

**Provider Scores:**

| Provider | Base | Type | Cost | Region | API | **Total** |
|----------|------|------|------|--------|-----|-----------|
| **NextPik Express** | 100 | +20 | +25 | **+25** | 0 | **170** ✅ |
| FedEx International | 100 | +30 | +15 | +20 | +20 | 185 |
| DHL Express | 100 | +30 | +25 | +20 | +20 | 195 |
| UPS Worldwide | 100 | +30 | +15 | +20 | +20 | 185 |

**Winner: DHL Express** - Best combination of API capability and cost

---

### Example 2: International Delivery to USA

**Order Details:**
- Destination: New York, USA
- Value: $2,500 (high-value)
- Urgency: Express

**Provider Scores:**

| Provider | Base | Type | Cost | High-Value | Express | Intl | API | **Total** |
|----------|------|------|------|------------|---------|------|-----|-----------|
| NextPik Express | 100 | +20 | +25 | 0 | 0 | 0 | 0 | **145** |
| **FedEx International** | 100 | +30 | +15 | **+15** | 0 | +20 | +20 | **200** ✅ |
| DHL Express | 100 | +30 | +25 | +15 | **+25** | +20 | +20 | **235** |
| UPS Worldwide | 100 | +30 | +15 | +15 | 0 | +20 | +20 | 200 |

**Winner: DHL Express** - Express capability with excellent international service

---

### Example 3: Overnight Delivery

**Order Details:**
- Destination: London, UK
- Value: $800
- Urgency: Overnight

**Provider Scores:**

| Provider | Base | Type | Cost | Overnight | Intl | API | **Total** |
|----------|------|------|------|-----------|------|-----|-----------|
| NextPik Express | 100 | +20 | +25 | 0 | 0 | 0 | **145** |
| **FedEx International** | 100 | +30 | +15 | **+30** | +20 | +20 | **215** ✅ |
| DHL Express | 100 | +30 | +25 | 0 | +20 | +20 | 195 |
| UPS Worldwide | 100 | +30 | +15 | 0 | +20 | +20 | 185 |

**Winner: FedEx International** - Known for overnight service

---

## 🔄 Assignment Flow

### Automatic Flow (Recommended)

```
Order Created
    ↓
Payment Confirmed
    ↓
Order Status → CONFIRMED
    ↓
[AUTO-ASSIGNMENT TRIGGERED]
    ↓
Get Destination Country from Shipping Address
    ↓
Query Active Providers for Country
    ↓
Score Each Provider (Algorithm Above)
    ↓
Select Highest Scoring Provider
    ↓
Calculate Commission & Delivery Date
    ↓
Create Delivery Record
    ↓
Generate Tracking Number
    ↓
Assign Delivery Partner (if PARTNER type)
    ↓
Send Notification to Buyer
```

### Manual Override Flow

Admins can always override auto-assignment:

```
Admin Views Order
    ↓
Clicks "Assign Delivery Provider"
    ↓
System Shows Recommendations with Scores
    ↓
Admin Selects Provider (or chooses recommended)
    ↓
Delivery Created with Selected Provider
```

---

## 💻 Implementation Details

### Backend Service

**File:** `apps/api/src/delivery/delivery-assignment.service.ts`

**Key Method:**
```typescript
async autoAssignProvider(criteria: AssignmentCriteria): Promise<DeliveryProvider | null>
```

**Usage in Order Flow:**
```typescript
// In orders.service.ts - after payment confirmation
async confirmPayment(orderId: string) {
  // ... payment confirmation logic ...

  // Auto-create delivery
  await this.deliveryService.autoCreateDeliveryForOrder(orderId);
}
```

**API Endpoints:**
```
POST   /api/v1/delivery/auto-create/:orderId
GET    /api/v1/delivery/recommendations/:orderId
POST   /api/v1/delivery/assign  (manual override)
```

---

## 🎛️ Configuration

### Provider Settings

Admins can configure providers to influence selection:

1. **Commission Rate** - Lower rates get higher scores
2. **Service Countries** - Define coverage area
3. **API Settings** - Enable/disable API integration
4. **Provider Type** - API_INTEGRATED, PARTNER, MANUAL
5. **Active Status** - Only active providers considered

### Assignment Rules

Customize in `delivery-assignment.service.ts`:

```typescript
// Adjust scoring weights
if (provider.type === 'API_INTEGRATED') {
  score += 30; // Increase/decrease this value
}

// Add custom rules
if (orderValue > 5000 && provider.name.includes('Premium')) {
  score += 50; // Custom rule for premium service
}
```

---

## 📈 Performance Optimization

### Caching Strategy

```typescript
// Cache active providers by country (TTL: 5 minutes)
const cacheKey = `providers:${country}`;
const cachedProviders = await redis.get(cacheKey);

if (cachedProviders) {
  return JSON.parse(cachedProviders);
}

// Query database if cache miss
const providers = await this.prisma.deliveryProvider.findMany({...});
await redis.setex(cacheKey, 300, JSON.stringify(providers));
```

### Database Indexing

Ensure these indexes exist:
```sql
CREATE INDEX idx_provider_country ON delivery_providers USING GIN (countries);
CREATE INDEX idx_provider_active_verified ON delivery_providers (is_active, verification_status);
```

---

## 🧪 Testing Assignment Logic

### Test Scenarios

**Test 1: Local Delivery (Rwanda)**
```bash
curl -X POST http://localhost:4000/api/v1/delivery/auto-create/ORDER_ID \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"destinationCountry": "RW", "orderValue": 100}'

# Expected: NextPik Express (local specialist)
```

**Test 2: International Express**
```bash
curl -X POST http://localhost:4000/api/v1/delivery/auto-create/ORDER_ID \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"destinationCountry": "US", "urgency": "express", "orderValue": 500}'

# Expected: DHL Express or FedEx
```

**Test 3: High-Value Order**
```bash
curl -X POST http://localhost:4000/api/v1/delivery/auto-create/ORDER_ID \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"destinationCountry": "GB", "orderValue": 3000}'

# Expected: FedEx or DHL (reliable international)
```

---

## 📊 Monitoring & Analytics

### Key Metrics to Track

1. **Assignment Success Rate** - % of orders assigned successfully
2. **Provider Distribution** - How orders are split among providers
3. **Cost Efficiency** - Average commission per order
4. **Delivery Performance** - On-time delivery rate by provider
5. **Customer Satisfaction** - Ratings by provider

### Admin Dashboard Queries

```sql
-- Provider usage distribution
SELECT
  dp.name,
  COUNT(d.id) as deliveries,
  AVG(d.delivery_fee) as avg_fee,
  AVG(d.partner_commission) as avg_commission
FROM deliveries d
JOIN delivery_providers dp ON d.provider_id = dp.id
WHERE d.created_at >= NOW() - INTERVAL '30 days'
GROUP BY dp.id, dp.name
ORDER BY deliveries DESC;

-- Assignment effectiveness
SELECT
  DATE(d.created_at) as date,
  COUNT(*) as total_deliveries,
  AVG(CASE WHEN d.current_status = 'DELIVERED' THEN 1 ELSE 0 END) * 100 as success_rate,
  AVG(EXTRACT(EPOCH FROM (d.delivered_at - d.created_at))/86400) as avg_days
FROM deliveries d
WHERE d.created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(d.created_at)
ORDER BY date DESC;
```

---

## 🎯 Best Practices

### For Admins

1. **Monitor Provider Performance** - Regularly review delivery success rates
2. **Adjust Commission Rates** - Balance cost and quality
3. **Verify New Providers** - Only activate after verification
4. **Update Service Areas** - Keep country lists current
5. **Review Assignment Logs** - Understand why providers are selected

### For Developers

1. **Always Log Assignments** - Track decision reasoning
2. **Handle No Provider Scenario** - Graceful fallback
3. **Test Edge Cases** - No providers, all inactive, etc.
4. **Monitor Performance** - Assignment should be <100ms
5. **Cache Provider Data** - Reduce database load

---

## 🚀 Future Enhancements

### Planned Features

1. **Machine Learning** - Learn from delivery success/failure patterns
2. **Real-Time Capacity** - Consider provider workload
3. **Customer Preferences** - Let customers choose preferred carriers
4. **Cost Optimization** - Dynamic routing for lowest cost
5. **SLA Tracking** - Automatically downgrade underperforming providers
6. **Multi-Package Orders** - Split orders across providers intelligently

---

## 📚 Related Documentation

- **DELIVERY_SYSTEM_GUIDE.md** - Complete system architecture
- **DELIVERY_TESTING_GUIDE.md** - Testing procedures
- **API_DOCUMENTATION.md** - Full API reference

---

## ✅ Summary

**Assignment Methods:**
- ✅ **Automatic** - Intelligent scoring algorithm (Recommended)
- ✅ **Manual** - Admin override with recommendations
- ✅ **API-Driven** - External system integration

**Selection Criteria:**
- ✅ Destination country coverage
- ✅ Cost efficiency (commission rates)
- ✅ Service quality (API integration)
- ✅ Order value and urgency
- ✅ Regional expertise

**Result:**
Every order gets the **best possible delivery provider** based on:
- **Performance** - Reliable, tracked delivery
- **Cost** - Optimized commission rates
- **Speed** - Appropriate for urgency level
- **Quality** - International standards

---

**Last Updated**: December 20, 2025
**System Status**: ✅ Fully Functional
