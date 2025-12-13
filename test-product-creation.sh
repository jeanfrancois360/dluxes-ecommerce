#!/bin/bash

# Test Product Creation with SKU and Inventory
# This script tests if SKU and stock fields are being saved correctly

BASE_URL="http://localhost:4000/api/v1"

echo "======================================"
echo "Product Creation Test - SKU & Inventory"
echo "======================================"
echo ""

# Step 1: Login as admin
echo "Step 1: Logging in as admin..."
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@luxury.com","password":"Password123!"}')

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -1)
LOGIN_BODY=$(echo "$LOGIN_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" != "200" ] && [ "$HTTP_CODE" != "201" ]; then
    echo "❌ Login failed (HTTP $HTTP_CODE)"
    echo "$LOGIN_BODY"
    exit 1
fi

AUTH_TOKEN=$(echo "$LOGIN_BODY" | jq -r '.access_token // .data.accessToken // .accessToken // empty' 2>/dev/null)

if [ -z "$AUTH_TOKEN" ] || [ "$AUTH_TOKEN" = "null" ]; then
    echo "❌ Failed to extract auth token"
    echo "Response: $LOGIN_BODY"
    exit 1
fi

echo "✅ Login successful"
echo ""

# Step 2: Create a test product with SKU and inventory
echo "Step 2: Creating test product with SKU and inventory..."
TEST_PRODUCT=$(cat <<'EOF'
{
  "name": "Test Product SKU",
  "slug": "test-product-sku-$(date +%s)",
  "sku": "TEST-SKU-$(date +%s)",
  "description": "Testing SKU and inventory persistence",
  "shortDescription": "Test product",
  "price": 99.99,
  "inventory": 25,
  "status": "DRAFT",
  "productType": "PHYSICAL",
  "purchaseType": "INSTANT"
}
EOF
)

# Replace the timestamp placeholders
TIMESTAMP=$(date +%s)
TEST_PRODUCT=$(echo "$TEST_PRODUCT" | sed "s/\$(date +%s)/$TIMESTAMP/g")

CREATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/products" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -d "$TEST_PRODUCT")

HTTP_CODE=$(echo "$CREATE_RESPONSE" | tail -1)
CREATE_BODY=$(echo "$CREATE_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" != "200" ] && [ "$HTTP_CODE" != "201" ]; then
    echo "❌ Product creation failed (HTTP $HTTP_CODE)"
    echo "$CREATE_BODY" | jq '.' 2>/dev/null || echo "$CREATE_BODY"
    exit 1
fi

echo "✅ Product created successfully"
echo ""

# Extract product details
PRODUCT_ID=$(echo "$CREATE_BODY" | jq -r '.id // .data.id // empty' 2>/dev/null)
PRODUCT_SKU=$(echo "$CREATE_BODY" | jq -r '.sku // .data.sku // empty' 2>/dev/null)
PRODUCT_INVENTORY=$(echo "$CREATE_BODY" | jq -r '.inventory // .data.inventory // empty' 2>/dev/null)

echo "Created Product Details:"
echo "  ID: $PRODUCT_ID"
echo "  SKU: $PRODUCT_SKU"
echo "  Inventory: $PRODUCT_INVENTORY"
echo ""

# Step 3: Verify SKU and inventory were saved
echo "Step 3: Verifying SKU and inventory..."

if [ -z "$PRODUCT_SKU" ] || [ "$PRODUCT_SKU" = "null" ]; then
    echo "❌ SKU NOT SAVED - Field is null or empty"
    SKU_STATUS="FAILED ❌"
else
    echo "✅ SKU saved correctly: $PRODUCT_SKU"
    SKU_STATUS="PASSED ✅"
fi

if [ -z "$PRODUCT_INVENTORY" ] || [ "$PRODUCT_INVENTORY" = "null" ]; then
    echo "❌ INVENTORY NOT SAVED - Field is null or empty"
    INVENTORY_STATUS="FAILED ❌"
elif [ "$PRODUCT_INVENTORY" = "25" ]; then
    echo "✅ Inventory saved correctly: $PRODUCT_INVENTORY"
    INVENTORY_STATUS="PASSED ✅"
else
    echo "⚠️  Inventory value unexpected: $PRODUCT_INVENTORY (expected 25)"
    INVENTORY_STATUS="WARNING ⚠️"
fi

echo ""

# Step 4: Fetch product again to double-check persistence
if [ -n "$PRODUCT_ID" ] && [ "$PRODUCT_ID" != "null" ]; then
    echo "Step 4: Re-fetching product to verify persistence..."

    FETCH_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/products/id/$PRODUCT_ID" \
        -H "Authorization: Bearer $AUTH_TOKEN")

    HTTP_CODE=$(echo "$FETCH_RESPONSE" | tail -1)
    FETCH_BODY=$(echo "$FETCH_RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" = "200" ]; then
        FETCHED_SKU=$(echo "$FETCH_BODY" | jq -r '.sku // .data.sku // empty' 2>/dev/null)
        FETCHED_INVENTORY=$(echo "$FETCH_BODY" | jq -r '.inventory // .data.inventory // empty' 2>/dev/null)

        echo "  Fetched SKU: $FETCHED_SKU"
        echo "  Fetched Inventory: $FETCHED_INVENTORY"

        if [ "$FETCHED_SKU" = "$PRODUCT_SKU" ] && [ -n "$FETCHED_SKU" ]; then
            echo "  ✅ SKU persisted correctly"
        else
            echo "  ❌ SKU persistence failed"
            SKU_STATUS="FAILED ❌"
        fi

        if [ "$FETCHED_INVENTORY" = "25" ]; then
            echo "  ✅ Inventory persisted correctly"
        else
            echo "  ❌ Inventory persistence failed"
            INVENTORY_STATUS="FAILED ❌"
        fi
    else
        echo "  ⚠️  Could not re-fetch product for verification"
    fi
    echo ""
fi

# Summary
echo "======================================"
echo "TEST SUMMARY"
echo "======================================"
echo "SKU Test:       $SKU_STATUS"
echo "Inventory Test: $INVENTORY_STATUS"
echo ""

if [ "$SKU_STATUS" = "PASSED ✅" ] && [ "$INVENTORY_STATUS" = "PASSED ✅" ]; then
    echo "🎉 ALL TESTS PASSED!"
    echo ""
    echo "✅ SKU field is now saving correctly"
    echo "✅ Inventory field is now saving correctly"
    exit 0
else
    echo "❌ SOME TESTS FAILED"
    echo ""
    echo "Full product response:"
    echo "$CREATE_BODY" | jq '.' 2>/dev/null || echo "$CREATE_BODY"
    exit 1
fi
