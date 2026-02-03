#!/bin/bash

echo "🧪 Testing Backend Integration Points"
echo "========================================"
echo ""

# Login to get JWT token
echo "1. Logging in as admin..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Test@123"}')

TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed"
  echo "$LOGIN_RESPONSE" | python3 -m json.tool
  exit 1
fi

echo "✅ Login successful"
echo ""

# Test 2: Get all settings (admin only)
echo "2. Testing GET /api/v1/settings (all settings)..."
ALL_SETTINGS=$(curl -s http://localhost:4000/api/v1/settings \
  -H "Authorization: Bearer $TOKEN")
SETTINGS_COUNT=$(echo $ALL_SETTINGS | python3 -c "import sys, json; print(len(json.load(sys.stdin)['data']))" 2>/dev/null)
echo "   Settings count: $SETTINGS_COUNT/38"
if [ "$SETTINGS_COUNT" == "38" ]; then
  echo "   ✅ All 38 settings retrieved"
else
  echo "   ❌ Expected 38, got $SETTINGS_COUNT"
fi
echo ""

# Test 3: Get critical settings
echo "3. Testing critical settings retrieval..."
CRITICAL_KEYS=("escrow_enabled" "escrow_default_hold_days" "min_payout_amount" "global_commission_rate")

for KEY in "${CRITICAL_KEYS[@]}"; do
  RESPONSE=$(curl -s http://localhost:4000/api/v1/settings/$KEY \
    -H "Authorization: Bearer $TOKEN")
  VALUE=$(echo $RESPONSE | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['data']['value'])" 2>/dev/null)

  if [ ! -z "$VALUE" ]; then
    echo "   ✅ $KEY = $VALUE"
  else
    echo "   ❌ $KEY not found"
  fi
done
echo ""

# Test 4: Test settings by category
echo "4. Testing GET /api/v1/settings/category/payment..."
PAYMENT_SETTINGS=$(curl -s http://localhost:4000/api/v1/settings/category/payment \
  -H "Authorization: Bearer $TOKEN")
PAYMENT_COUNT=$(echo $PAYMENT_SETTINGS | python3 -c "import sys, json; print(len(json.load(sys.stdin)['data']))" 2>/dev/null)
echo "   Payment settings count: $PAYMENT_COUNT/6"
if [ "$PAYMENT_COUNT" == "6" ]; then
  echo "   ✅ All payment settings retrieved"
else
  echo "   ❌ Expected 6, got $PAYMENT_COUNT"
fi
echo ""

# Test 5: Test update setting
echo "5. Testing PATCH /api/v1/settings/site_name..."
UPDATE_RESPONSE=$(curl -s -X PATCH http://localhost:4000/api/v1/settings/site_name \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value":"NextPik E-commerce Test"}')

UPDATE_SUCCESS=$(echo $UPDATE_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('success', False))" 2>/dev/null)
if [ "$UPDATE_SUCCESS" == "True" ]; then
  echo "   ✅ Setting updated successfully"

  # Verify update
  VERIFY_RESPONSE=$(curl -s http://localhost:4000/api/v1/settings/site_name \
    -H "Authorization: Bearer $TOKEN")
  NEW_VALUE=$(echo $VERIFY_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['value'])" 2>/dev/null)
  echo "   New value: $NEW_VALUE"

  # Revert change
  curl -s -X PATCH http://localhost:4000/api/v1/settings/site_name \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"value":"NextPik E-commerce"}' > /dev/null
  echo "   ✅ Reverted to original value"
else
  echo "   ❌ Update failed"
fi
echo ""

echo "✅ Backend integration tests complete!"
