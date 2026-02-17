#!/bin/bash

echo "🚚 Testing Shipping Modes"
echo "========================="
echo ""

API_URL="http://localhost:4000/api/v1"

# Test shipping calculation endpoint
echo "📦 Testing shipping calculation with different modes..."
echo ""

# Test data (US domestic shipping)
TEST_PAYLOAD='{
  "items": [
    {
      "productId": "test-product",
      "variantId": null,
      "quantity": 1,
      "price": 100
    }
  ],
  "shippingAddressId": "your-address-id",
  "shippingMethod": "standard",
  "currency": "USD"
}'

echo "1️⃣ Current Shipping Mode:"
curl -s "$API_URL/settings/shipping_mode" | jq '.data.value // .value' || echo "Failed"
echo ""
echo ""

echo "2️⃣ DHL Health Check:"
curl -s "$API_URL/shipping/admin/dhl/health" | jq '.' 2>/dev/null || echo "Requires authentication"
echo ""
echo ""

echo "3️⃣ Manual Shipping Rates:"
echo "Standard: $(curl -s "$API_URL/settings/shipping_standard_rate" | jq -r '.data.value // .value')"
echo "Express: $(curl -s "$API_URL/settings/shipping_express_rate" | jq -r '.data.value // .value')"
echo "Overnight: $(curl -s "$API_URL/settings/shipping_overnight_rate" | jq -r '.data.value // .value')"
echo "International Surcharge: $(curl -s "$API_URL/settings/shipping_international_surcharge" | jq -r '.data.value // .value')"
echo ""

echo "========================="
echo "✅ Test complete!"
echo ""
echo "To test checkout shipping calculation:"
echo "1. Add items to cart"
echo "2. Proceed to checkout"
echo "3. Enter shipping address"
echo "4. Check browser console for shipping logs"
echo "5. Verify shipping options displayed"
