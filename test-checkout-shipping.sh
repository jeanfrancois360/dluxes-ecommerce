#!/bin/bash

echo "🛒 CHECKOUT SHIPPING TEST (What Your Client Sees)"
echo "================================================="
echo ""

# First, verify EasyPost works directly
echo "1️⃣  Testing EasyPost Direct API..."
EASYPOST_RATES=$(curl -s http://localhost:4000/api/v1/easypost/rates/lowest \
  -H "Content-Type: application/json" \
  -d '{
    "fromAddress": {"street1": "123 Main St", "city": "New York", "state": "NY", "zip": "10001", "country": "US"},
    "toAddress": {"street1": "456 Market St", "city": "San Francisco", "state": "CA", "zip": "94103", "country": "US"},
    "parcel": {"length": 10, "width": 8, "height": 4, "weight": 16}
  }' --max-time 3 2>/dev/null)

if echo "$EASYPOST_RATES" | jq -e '.lowestRate.rate' > /dev/null 2>&1; then
  LOWEST_RATE=$(echo "$EASYPOST_RATES" | jq -r '.lowestRate.rate')
  CARRIER=$(echo "$EASYPOST_RATES" | jq -r '.lowestRate.carrier')
  echo "   ✅ EasyPost works: $CARRIER = \$$LOWEST_RATE"
else
  echo "   ❌ EasyPost failed or timed out"
fi

echo ""
echo "2️⃣  Checking EasyPost Settings..."
EASYPOST_ENABLED=$(curl -s http://localhost:4000/api/v1/settings/public | jq -r '.data.easypost_enabled // "not found"')
echo "   easypost_enabled: $EASYPOST_ENABLED"

echo ""
echo "3️⃣  What checkout will see:"
echo "   - If EasyPost setting = true → Should show \$9-15 rates"
echo "   - If EasyPost times out → Falls back to DHL/Manual → \$24-55 rates"
echo ""
echo "📝 RECOMMENDATION:"
echo "   Go to checkout now and check if prices are \$9-15 (good) or \$24-55 (bad)"
echo ""
