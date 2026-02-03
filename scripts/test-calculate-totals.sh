#!/bin/bash

# Test script for P0-002: Pre-Checkout Total Calculation Endpoint
# SAFE: Read-only endpoint, doesn't create any orders

echo "🧪 Testing POST /orders/calculate-totals endpoint"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if API is running
echo "1️⃣  Checking if API is running..."
API_URL="${API_URL:-http://localhost:4000/api/v1}"
if curl -s "$API_URL" > /dev/null; then
    echo -e "${GREEN}✅ API is running at $API_URL${NC}"
else
    echo -e "${RED}❌ API is not running. Please start with: pnpm dev:api${NC}"
    exit 1
fi

# Get auth token (you'll need to replace this with actual login)
echo ""
echo "2️⃣  Authentication..."
echo -e "${YELLOW}⚠️  You need to set BUYER_TOKEN environment variable${NC}"
echo "   Example: export BUYER_TOKEN=\"your-jwt-token\""
echo ""

if [ -z "$BUYER_TOKEN" ]; then
    echo -e "${RED}❌ BUYER_TOKEN not set. Skipping authenticated tests.${NC}"
    echo ""
    echo "To get a token:"
    echo "  1. Login via: curl -X POST $API_URL/auth/login -d '{\"email\":\"buyer1@nextpik.com\",\"password\":\"password123\"}'"
    echo "  2. Copy the token from response"
    echo "  3. export BUYER_TOKEN=\"<your-token>\""
    exit 1
fi

# Test 1: Calculate totals for single item
echo ""
echo "3️⃣  Test 1: Calculate totals for single item order"
echo "================================================"

# You'll need to replace these IDs with actual values from your database
PRODUCT_ID="${PRODUCT_ID:-prod_123}"
ADDRESS_ID="${ADDRESS_ID:-addr_123}"

echo "Request:"
cat << EOF
{
  "items": [
    {
      "productId": "$PRODUCT_ID",
      "quantity": 1,
      "price": 100.00
    }
  ],
  "shippingAddressId": "$ADDRESS_ID",
  "shippingMethod": "standard",
  "currency": "USD"
}
EOF

echo ""
echo "Sending request..."

RESPONSE=$(curl -s -X POST "$API_URL/orders/calculate-totals" \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"items\": [
      {
        \"productId\": \"$PRODUCT_ID\",
        \"quantity\": 1,
        \"price\": 100.00
      }
    ],
    \"shippingAddressId\": \"$ADDRESS_ID\",
    \"shippingMethod\": \"standard\",
    \"currency\": \"USD\"
  }")

echo ""
echo "Response:"
echo "$RESPONSE" | jq '.'

# Check if successful
if echo "$RESPONSE" | jq -e '.success == true' > /dev/null; then
    echo -e "${GREEN}✅ Test 1 PASSED${NC}"
else
    echo -e "${RED}❌ Test 1 FAILED${NC}"
fi

# Test 2: Calculate totals for multi-item order
echo ""
echo "4️⃣  Test 2: Calculate totals for multi-item order"
echo "================================================"

RESPONSE=$(curl -s -X POST "$API_URL/orders/calculate-totals" \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"items\": [
      {
        \"productId\": \"$PRODUCT_ID\",
        \"quantity\": 2,
        \"price\": 100.00
      },
      {
        \"productId\": \"$PRODUCT_ID\",
        \"quantity\": 1,
        \"price\": 50.00
      }
    ],
    \"shippingAddressId\": \"$ADDRESS_ID\",
    \"currency\": \"USD\"
  }")

echo "Response:"
echo "$RESPONSE" | jq '.'

if echo "$RESPONSE" | jq -e '.success == true' > /dev/null; then
    echo -e "${GREEN}✅ Test 2 PASSED${NC}"

    # Verify calculation
    SUBTOTAL=$(echo "$RESPONSE" | jq -r '.data.subtotal')
    echo ""
    echo "Calculation breakdown:"
    echo "  Subtotal: \$$SUBTOTAL (should be 250.00: 2x100 + 1x50)"
    echo "  Shipping: \$$(echo "$RESPONSE" | jq -r '.data.shipping.price')"
    echo "  Tax:      \$$(echo "$RESPONSE" | jq -r '.data.tax.amount')"
    echo "  Total:    \$$(echo "$RESPONSE" | jq -r '.data.total')"
else
    echo -e "${RED}❌ Test 2 FAILED${NC}"
fi

# Test 3: Test different shipping methods
echo ""
echo "5️⃣  Test 3: Calculate with different shipping methods"
echo "================================================"

for METHOD in "standard" "express" "overnight"; do
    echo ""
    echo "Testing shipping method: $METHOD"

    RESPONSE=$(curl -s -X POST "$API_URL/orders/calculate-totals" \
      -H "Authorization: Bearer $BUYER_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"items\": [{\"productId\": \"$PRODUCT_ID\", \"quantity\": 1, \"price\": 100.00}],
        \"shippingAddressId\": \"$ADDRESS_ID\",
        \"shippingMethod\": \"$METHOD\",
        \"currency\": \"USD\"
      }")

    SHIPPING_COST=$(echo "$RESPONSE" | jq -r '.data.shipping.price')
    echo "  Shipping cost: \$$SHIPPING_COST"
done

echo ""
echo "6️⃣  Test 4: Price verification (security test)"
echo "================================================"
echo "Sending inflated price to test if backend uses database price..."

RESPONSE=$(curl -s -X POST "$API_URL/orders/calculate-totals" \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"items\": [{\"productId\": \"$PRODUCT_ID\", \"quantity\": 1, \"price\": 1.00}],
    \"shippingAddressId\": \"$ADDRESS_ID\",
    \"currency\": \"USD\"
  }")

echo "$RESPONSE" | jq '.'

if echo "$RESPONSE" | jq -e '.data.warnings' > /dev/null; then
    echo -e "${GREEN}✅ Security test PASSED - Price verification working${NC}"
    echo "Warnings:"
    echo "$RESPONSE" | jq -r '.data.warnings[]'
else
    echo -e "${YELLOW}⚠️  No warnings found - check if price matches database${NC}"
fi

echo ""
echo "================================================"
echo "✅ All tests completed!"
echo ""
echo "Summary:"
echo "  - Endpoint: POST $API_URL/orders/calculate-totals"
echo "  - Status: $(curl -s -X POST "$API_URL/orders/calculate-totals" -H "Authorization: Bearer $BUYER_TOKEN" -H "Content-Type: application/json" -d '{}' | jq -r '.success')"
echo ""
echo "Next steps:"
echo "  1. Verify calculations match expected values"
echo "  2. Test with different currencies"
echo "  3. Test with different shipping addresses (different states/countries)"
echo "  4. Create order using calculated totals to verify consistency"
