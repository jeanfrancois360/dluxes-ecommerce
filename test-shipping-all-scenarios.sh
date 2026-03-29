#!/bin/bash

echo "🧪 COMPREHENSIVE SHIPPING TEST SUITE"
echo "===================================="
echo ""

API_BASE="http://localhost:4000/api/v1"

# Test shipping address (domestic US)
FROM_ADDR='{
  "street1": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zip": "10001",
  "country": "US"
}'

TO_ADDR='{
  "street1": "456 Market St",
  "city": "San Francisco",
  "state": "CA",
  "zip": "94103",
  "country": "US"
}'

PARCEL='{
  "length": 10,
  "width": 8,
  "height": 4,
  "weight": 16
}'

echo "📦 Test Package:"
echo "  - From: New York, NY → San Francisco, CA"
echo "  - Weight: 16 oz (1 lb)"
echo "  - Dimensions: 10x8x4 inches"
echo ""

# Test 1: Direct EasyPost API test
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 1: Direct EasyPost Rates (No Timeout)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
START=$(date +%s%3N)
curl -s -X POST "$API_BASE/easypost/rates/lowest" \
  -H "Content-Type: application/json" \
  -d "{
    \"fromAddress\": $FROM_ADDR,
    \"toAddress\": $TO_ADDR,
    \"parcel\": $PARCEL
  }" --max-time 10 | jq '{
    lowestRate: .lowestRate | {carrier, service, rate, deliveryDays},
    topRates: .allRates[:3] | map({carrier, service, rate, deliveryDays})
  }'
END=$(date +%s%3N)
DURATION=$((END - START))
echo "⏱️  Duration: ${DURATION}ms"
echo ""

# Test 2: EasyPost with 2-second timeout (simulate checkout)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 2: EasyPost with 2s Timeout (Checkout Simulation)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
START=$(date +%s%3N)
timeout 3s curl -s -X POST "$API_BASE/easypost/rates/lowest" \
  -H "Content-Type: application/json" \
  -d "{
    \"fromAddress\": $FROM_ADDR,
    \"toAddress\": $TO_ADDR,
    \"parcel\": $PARCEL
  }" --max-time 2 | jq '{
    lowestRate: .lowestRate | {carrier, service, rate, deliveryDays},
    topRates: .allRates[:3] | map({carrier, service, rate, deliveryDays})
  }' 2>/dev/null || echo "❌ TIMEOUT - Would fallback to DHL/Manual"
END=$(date +%s%3N)
DURATION=$((END - START))
echo "⏱️  Duration: ${DURATION}ms"
echo ""

# Test 3: EasyPost health check
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 3: EasyPost Health Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s "$API_BASE/easypost/health" | jq '{
  enabled: .data.enabled,
  configured: .data.configured,
  credentialsValid: .data.credentialsValid,
  testMode: .data.testMode,
  message: .data.message,
  connectionError: .data.connectionError
}'
echo ""

# Test 4: Settings check
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 4: Shipping Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Checking key settings..."
curl -s "$API_BASE/settings/easypost_enabled" | jq -r '.data.value' | xargs -I {} echo "  EasyPost Enabled: {}"
curl -s "$API_BASE/settings/easypost_test_mode" | jq -r '.data.value' | xargs -I {} echo "  Test Mode: {}"
curl -s "$API_BASE/settings/shipping_mode" | jq -r '.data.value' | xargs -I {} echo "  Shipping Mode: {}"
echo ""

# Test 5: What rates is the frontend actually getting?
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 5: Frontend Shipping Rates Simulation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "This simulates what the checkout sees..."
echo "(Requires auth token - run manually if needed)"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Expected Results:"
echo "  ✅ Test 1: Should return rates ~\$9-15 (USPS, FedEx)"
echo "  ⚠️  Test 2: May timeout if EasyPost slow"
echo "  ℹ️  Test 3: Health check status"
echo "  ℹ️  Test 4: Configuration summary"
echo ""
echo "If checkout shows \$24-55 rates:"
echo "  → EasyPost is timing out"
echo "  → Falling back to DHL (wrong international rates)"
echo "  → Solution: Disable DHL, use manual rates"
echo ""
