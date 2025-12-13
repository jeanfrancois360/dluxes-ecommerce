#!/bin/bash

# Test Inventory Management System
# This script tests all inventory features end-to-end

echo "🧪 Testing Inventory Management System"
echo "======================================="
echo ""

BASE_URL="http://localhost:4000/api/v1"
AUTH_TOKEN=""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local expected_status=$5
    local use_auth=$6

    TESTS_RUN=$((TESTS_RUN + 1))
    echo -e "${YELLOW}Test $TESTS_RUN:${NC} $name"

    if [ "$use_auth" = "true" ] && [ -n "$AUTH_TOKEN" ]; then
        if [ -z "$data" ]; then
            response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
                -H "Authorization: Bearer $AUTH_TOKEN")
        else
            response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $AUTH_TOKEN" \
                -d "$data")
        fi
    else
        if [ -z "$data" ]; then
            response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint")
        else
            response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -d "$data")
        fi
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        echo -e "${RED}✗ FAILED${NC} (Expected HTTP $expected_status, got $http_code)"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        echo "$body"
    fi
    echo ""
}

# Authenticate as admin
echo -e "${BLUE}🔐 Authenticating as admin...${NC}"
echo ""
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@luxury.com","password":"Password123!"}')

LOGIN_CODE=$(echo "$LOGIN_RESPONSE" | tail -n1)
LOGIN_BODY=$(echo "$LOGIN_RESPONSE" | sed '$d')

if [ "$LOGIN_CODE" = "200" ] || [ "$LOGIN_CODE" = "201" ]; then
    AUTH_TOKEN=$(echo "$LOGIN_BODY" | jq -r '.access_token // .data.accessToken // .accessToken // empty' 2>/dev/null)
    if [ -n "$AUTH_TOKEN" ]; then
        echo -e "${GREEN}✓ Authentication successful${NC}"
        USER_ROLE=$(echo "$LOGIN_BODY" | jq -r '.user.role // empty' 2>/dev/null)
        echo -e "${BLUE}Role:${NC} $USER_ROLE"
        echo ""
    else
        echo -e "${RED}✗ Failed to extract auth token${NC}"
        echo "$LOGIN_BODY"
        echo ""
    fi
else
    echo -e "${RED}✗ Authentication failed (HTTP $LOGIN_CODE)${NC}"
    echo "$LOGIN_BODY"
    echo ""
    echo -e "${YELLOW}⚠ Continuing with public endpoint tests only${NC}"
    echo ""
fi

echo "📦 1. Testing Inventory Settings Endpoints"
echo "==========================================="
echo ""

test_endpoint \
    "Get all inventory settings" \
    "GET" \
    "/settings/inventory/all" \
    "" \
    "200"

test_endpoint \
    "Get inventory category settings" \
    "GET" \
    "/settings/category/inventory" \
    "" \
    "200" \
    "true"

test_endpoint \
    "Get low stock threshold setting" \
    "GET" \
    "/settings/inventory.low_stock_threshold" \
    "" \
    "200" \
    "true"

echo "📊 2. Testing Inventory Endpoints"
echo "=================================="
echo ""

test_endpoint \
    "Get inventory summary" \
    "GET" \
    "/products/inventory/summary" \
    "" \
    "200" \
    "true"

test_endpoint \
    "Get low stock products" \
    "GET" \
    "/products/inventory/low-stock" \
    "" \
    "200" \
    "true"

test_endpoint \
    "Get out of stock products" \
    "GET" \
    "/products/inventory/out-of-stock" \
    "" \
    "200" \
    "true"

echo "🔍 3. Testing Product Endpoints"
echo "================================"
echo ""

# Get a product to test with
echo "Getting first product..."
PRODUCT_RESPONSE=$(curl -s "$BASE_URL/products?limit=1")
PRODUCT_ID=$(echo "$PRODUCT_RESPONSE" | jq -r '.data.products[0].id // .data[0].id // empty' 2>/dev/null)

if [ -n "$PRODUCT_ID" ]; then
    echo -e "${GREEN}Found product:${NC} $PRODUCT_ID"
    CURRENT_STOCK=$(echo "$PRODUCT_RESPONSE" | jq -r '.data.products[0].inventory // .data[0].stock // 0' 2>/dev/null)
    echo -e "${BLUE}Current stock:${NC} $CURRENT_STOCK"
    echo ""

    test_endpoint \
        "Get product inventory transactions" \
        "GET" \
        "/products/$PRODUCT_ID/inventory/transactions" \
        "" \
        "200" \
        "true"

    if [ -n "$AUTH_TOKEN" ]; then
        echo -e "${BLUE}🔧 Testing Authenticated Inventory Operations${NC}"
        echo ""

        test_endpoint \
            "Adjust product inventory (RESTOCK +5)" \
            "PATCH" \
            "/products/$PRODUCT_ID/inventory" \
            '{"quantity":5,"type":"RESTOCK","reason":"Stock replenishment test","notes":"Automated test"}' \
            "200" \
            "true"

        test_endpoint \
            "Adjust product inventory (SALE -2)" \
            "PATCH" \
            "/products/$PRODUCT_ID/inventory" \
            '{"quantity":2,"type":"SALE","reason":"Test sale transaction","notes":"Automated test"}' \
            "200" \
            "true"

        test_endpoint \
            "Get updated inventory transactions" \
            "GET" \
            "/products/$PRODUCT_ID/inventory/transactions?limit=5" \
            "" \
            "200" \
            "true"

        test_endpoint \
            "Sync product inventory from variants" \
            "POST" \
            "/products/$PRODUCT_ID/inventory/sync" \
            "" \
            "201" \
            "true"
    fi
else
    echo -e "${RED}No products found in database${NC}"
    echo ""
fi

if [ -n "$AUTH_TOKEN" ]; then
    echo ""
    echo "📋 4. Testing Bulk Inventory Operations"
    echo "========================================"
    echo ""

    # Get multiple products for bulk test
    PRODUCTS_RESPONSE=$(curl -s "$BASE_URL/products?limit=3")
    PRODUCT_IDS=$(echo "$PRODUCTS_RESPONSE" | jq -r '.data.products[].id // .data[].id' 2>/dev/null)

    if [ -n "$PRODUCT_IDS" ]; then
        PRODUCT_ARRAY=$(echo "$PRODUCT_IDS" | head -2 | jq -R . | jq -s .)
        BULK_DATA='{"updates":['
        FIRST=true
        for pid in $(echo "$PRODUCT_IDS" | head -2); do
            if [ "$FIRST" = true ]; then
                BULK_DATA="${BULK_DATA}{\"productId\":\"$pid\",\"quantity\":3,\"type\":\"ADJUSTMENT\",\"reason\":\"Bulk test\"}"
                FIRST=false
            else
                BULK_DATA="${BULK_DATA},{\"productId\":\"$pid\",\"quantity\":3,\"type\":\"ADJUSTMENT\",\"reason\":\"Bulk test\"}"
            fi
        done
        BULK_DATA="${BULK_DATA}]}"

        test_endpoint \
            "Bulk inventory adjustment (2 products)" \
            "POST" \
            "/products/inventory/bulk-update" \
            "$BULK_DATA" \
            "201" \
            "true"
    fi

    echo ""
    echo "🎯 5. Testing Settings Update Operations"
    echo "========================================="
    echo ""

    test_endpoint \
        "Update low stock threshold setting" \
        "PATCH" \
        "/settings/inventory.low_stock_threshold" \
        '{"value":15}' \
        "200" \
        "true"

    test_endpoint \
        "Verify updated low stock threshold" \
        "GET" \
        "/settings/inventory.low_stock_threshold" \
        "" \
        "200" \
        "true"

    test_endpoint \
        "Update SKU prefix setting" \
        "PATCH" \
        "/settings/inventory.sku_prefix" \
        '{"value":"LUX"}' \
        "200" \
        "true"

    test_endpoint \
        "Restore low stock threshold to default" \
        "PATCH" \
        "/settings/inventory.low_stock_threshold" \
        '{"value":10}' \
        "200" \
        "true"

    test_endpoint \
        "Restore SKU prefix to default" \
        "PATCH" \
        "/settings/inventory.sku_prefix" \
        '{"value":"PROD"}' \
        "200" \
        "true"
fi

echo "📈 Summary"
echo "=========="
echo ""
echo "Tests Run:    $TESTS_RUN"
echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
if [ $TESTS_FAILED -gt 0 ]; then
    echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"
else
    echo "Tests Failed: 0"
fi
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
