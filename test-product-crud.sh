#!/bin/bash

# Product CRUD API Test Script
# Tests both Seller and Admin product operations
# Usage: ./test-product-crud.sh <SELLER_TOKEN> <ADMIN_TOKEN>

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

API_URL="http://localhost:4000/api/v1"
SELLER_TOKEN="$1"
ADMIN_TOKEN="$2"

if [ -z "$SELLER_TOKEN" ]; then
    echo -e "${RED}Error: SELLER_TOKEN required${NC}"
    echo "Usage: ./test-product-crud.sh <SELLER_TOKEN> <ADMIN_TOKEN>"
    echo ""
    echo "To get tokens:"
    echo "1. Login as seller at http://localhost:3000"
    echo "2. Open browser console"
    echo "3. Run: localStorage.getItem('accessToken')"
    echo "4. Copy the token"
    exit 1
fi

if [ -z "$ADMIN_TOKEN" ]; then
    echo -e "${YELLOW}Warning: ADMIN_TOKEN not provided, skipping admin tests${NC}"
fi

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  NextPik Product CRUD Test Suite      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

PASSED=0
FAILED=0
SKIPPED=0

# Test function
test_api() {
    local test_name="$1"
    local method="$2"
    local endpoint="$3"
    local token="$4"
    local data="$5"
    local expected_status="$6"

    echo -e "${BLUE}Testing:${NC} $test_name"

    if [ -z "$token" ]; then
        echo -e "${YELLOW}  ⊘ SKIPPED${NC} (No token provided)"
        SKIPPED=$((SKIPPED + 1))
        echo ""
        return
    fi

    local curl_cmd="curl -s -w '\n%{http_code}' -X $method '$API_URL$endpoint' \
        -H 'Authorization: Bearer $token' \
        -H 'Content-Type: application/json'"

    if [ -n "$data" ]; then
        curl_cmd="$curl_cmd -d '$data'"
    fi

    local response=$(eval $curl_cmd)
    local status=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')

    if [ "$status" -eq "$expected_status" ]; then
        echo -e "${GREEN}  ✓ PASS${NC} (HTTP $status)"
        PASSED=$((PASSED + 1))

        # Pretty print response (first 200 chars)
        if [ -n "$body" ]; then
            echo "$body" | jq -C '.' 2>/dev/null | head -n 5 || echo "$body" | head -c 200
        fi
    else
        echo -e "${RED}  ✗ FAIL${NC} (Expected $expected_status, got $status)"
        FAILED=$((FAILED + 1))

        # Show error details
        if [ -n "$body" ]; then
            echo "$body" | jq -C '.' 2>/dev/null || echo "$body"
        fi
    fi

    echo ""
}

# Store created product IDs for cleanup
SELLER_PRODUCT_ID=""
ADMIN_PRODUCT_ID=""

echo -e "${YELLOW}════════════════════════════════════════${NC}"
echo -e "${YELLOW}  SELLER PRODUCT TESTS${NC}"
echo -e "${YELLOW}════════════════════════════════════════${NC}"
echo ""

# Test 1: Create product with all required fields
test_api \
    "Create product with required fields" \
    "POST" \
    "/seller/products" \
    "$SELLER_TOKEN" \
    '{
        "name": "Test Product API",
        "slug": "test-product-api-'$(date +%s)'",
        "description": "Created via API test script",
        "price": 99.99,
        "inventory": 10,
        "status": "ACTIVE",
        "productType": "PHYSICAL",
        "purchaseType": "INSTANT"
    }' \
    201

# Extract product ID from last test (simplified - in real script would parse JSON)
# For now, we'll use a placeholder

# Test 2: Create product without category (empty string test)
test_api \
    "Create product without category" \
    "POST" \
    "/seller/products" \
    "$SELLER_TOKEN" \
    '{
        "name": "Test No Category",
        "slug": "test-no-category-'$(date +%s)'",
        "description": "Testing empty category handling",
        "price": 49.99,
        "inventory": 5,
        "categoryId": ""
    }' \
    201

# Test 3: List seller products
test_api \
    "List seller products" \
    "GET" \
    "/seller/products" \
    "$SELLER_TOKEN" \
    "" \
    200

# Test 4: Get seller dashboard (bonus test)
test_api \
    "Get seller dashboard" \
    "GET" \
    "/seller/dashboard" \
    "$SELLER_TOKEN" \
    "" \
    200

# Test 5: Create product with invalid data (negative price)
test_api \
    "Create product with negative price (should fail)" \
    "POST" \
    "/seller/products" \
    "$SELLER_TOKEN" \
    '{
        "name": "Invalid Product",
        "slug": "invalid-product",
        "description": "Should fail",
        "price": -10,
        "inventory": 5
    }' \
    400

# Test 6: Create product with missing required fields
test_api \
    "Create product with missing fields (should fail)" \
    "POST" \
    "/seller/products" \
    "$SELLER_TOKEN" \
    '{
        "name": "Incomplete Product"
    }' \
    400

echo -e "${YELLOW}════════════════════════════════════════${NC}"
echo -e "${YELLOW}  ADMIN PRODUCT TESTS${NC}"
echo -e "${YELLOW}════════════════════════════════════════${NC}"
echo ""

# Test 7: Admin creates product
test_api \
    "Admin creates product" \
    "POST" \
    "/products" \
    "$ADMIN_TOKEN" \
    '{
        "name": "Admin Test Product",
        "slug": "admin-test-product-'$(date +%s)'",
        "description": "Created by admin via API",
        "price": 199.99,
        "inventory": 15,
        "status": "ACTIVE"
    }' \
    201

# Test 8: Admin lists all products
test_api \
    "Admin lists all products" \
    "GET" \
    "/products" \
    "$ADMIN_TOKEN" \
    "" \
    200

# Test 9: Public product listing (no auth)
test_api \
    "Public product listing (no auth)" \
    "GET" \
    "/products" \
    "" \
    "" \
    200

echo -e "${YELLOW}════════════════════════════════════════${NC}"
echo -e "${YELLOW}  EDGE CASE TESTS${NC}"
echo -e "${YELLOW}════════════════════════════════════════${NC}"
echo ""

# Test 10: Product with special characters
test_api \
    "Product with special characters" \
    "POST" \
    "/seller/products" \
    "$SELLER_TOKEN" \
    '{
        "name": "Product with \"quotes\" & <tags>",
        "slug": "special-chars-'$(date +%s)'",
        "description": "Testing special chars: @#$%^&*()",
        "price": 29.99,
        "inventory": 3
    }' \
    201

# Test 11: Product with very long description
test_api \
    "Product with long description" \
    "POST" \
    "/seller/products" \
    "$SELLER_TOKEN" \
    '{
        "name": "Long Description Product",
        "slug": "long-desc-'$(date +%s)'",
        "description": "'"$(printf 'A%.0s' {1..1000})"'",
        "price": 39.99,
        "inventory": 5
    }' \
    201

# Test 12: Unauthorized access
test_api \
    "Unauthorized access (should fail)" \
    "GET" \
    "/seller/products" \
    "" \
    "" \
    401

echo ""
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  TEST SUMMARY                          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Passed:  $PASSED${NC}"
echo -e "${RED}Failed:  $FAILED${NC}"
echo -e "${YELLOW}Skipped: $SKIPPED${NC}"
echo ""

TOTAL=$((PASSED + FAILED + SKIPPED))
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
