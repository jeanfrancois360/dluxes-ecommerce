#!/bin/bash

echo "🔍 Testing Settings API Endpoints"
echo "=================================="
echo ""

# Colors
GREEN='\033[0.32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

API_URL="http://localhost:4000/api/v1"

# Test 1: Get shipping settings
echo "1️⃣ Testing GET /settings (category=shipping)"
echo "curl -s \"$API_URL/settings?category=shipping\""
RESPONSE=$(curl -s "$API_URL/settings?category=shipping")
echo "Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Test 2: Get specific setting
echo "2️⃣ Testing GET /settings/shipping_mode"
echo "curl -s \"$API_URL/settings/shipping_mode\""
RESPONSE=$(curl -s "$API_URL/settings/shipping_mode")
echo "Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Extract current value
CURRENT_MODE=$(echo "$RESPONSE" | jq -r '.data.value // .value' 2>/dev/null)
echo "Current shipping_mode value: $CURRENT_MODE"
echo ""

# Test 3: Get all shipping settings
echo "3️⃣ All shipping-related settings:"
curl -s "$API_URL/settings?category=shipping" | jq '.data[] | { key: .key, value: .value, type: .valueType }' 2>/dev/null || echo "Failed to parse"
echo ""

echo "=================================="
echo "✅ API test complete!"
echo ""
echo "If you see 401 Unauthorized, you need to be logged in as admin."
echo "Try accessing from the browser where you're already logged in."
