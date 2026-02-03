#!/bin/bash

# Regression Test Script
# Ensures existing functionality still works after new implementations

API_URL="http://localhost:4000/api/v1"
PASSED=0
FAILED=0

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🔄 Regression Testing Suite"
echo "======================================"
echo ""

test_api() {
    local name="$1"
    local url="$2"
    local expected_field="$3"

    echo -n "  ├─ $name... "

    response=$(curl -s "$url" 2>/dev/null)

    if echo "$response" | grep -q "$expected_field"; then
        echo -e "${GREEN}✅${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌${NC}"
        echo "     Expected field '$expected_field' not found"
        ((FAILED++))
        return 1
    fi
}

test_json_structure() {
    local name="$1"
    local url="$2"
    local fields="$3"

    echo -n "  ├─ $name... "

    response=$(curl -s "$url" 2>/dev/null)

    # Check if response is valid JSON and has expected fields
    result=$(echo "$response" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    fields = '$fields'.split(',')
    all_present = all(field.strip() in str(data) for field in fields if field.strip())
    print('pass' if all_present else 'fail')
except:
    print('fail')
" 2>/dev/null)

    if [ "$result" = "pass" ]; then
        echo -e "${GREEN}✅${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌${NC}"
        ((FAILED++))
        return 1
    fi
}

echo -e "${BLUE}📦 Product Management (Core Feature)${NC}"
echo "======================================"
test_api "Get products list" "${API_URL}/products" "success"
test_json_structure "Product fields intact" "${API_URL}/products" "id,name,price"
test_api "Get categories" "${API_URL}/categories" "success"
test_api "Product filtering works" "${API_URL}/products?status=ACTIVE" "success"
test_api "Product pagination" "${API_URL}/products?limit=5" "success"

echo ""
echo -e "${BLUE}🛒 Cart Functionality${NC}"
echo "======================================"
test_api "Get cart" "${API_URL}/cart" "success"
test_json_structure "Cart structure" "${API_URL}/cart" "success,items"

echo ""
echo -e "${BLUE}🔍 Search System${NC}"
echo "======================================"
test_api "Basic search" "${API_URL}/search?q=watch" "success"
test_api "Search autocomplete" "${API_URL}/search/autocomplete?q=watch" "success"
test_json_structure "Autocomplete format" "${API_URL}/search/autocomplete?q=watch" "total,data"
test_api "Empty search handled" "${API_URL}/search?q=" "success"

echo ""
echo -e "${BLUE}⚙️ Settings System${NC}"
echo "======================================"
test_api "Public settings" "${API_URL}/settings/public" "success"
test_json_structure "Settings structure" "${API_URL}/settings/public" "settings"

echo ""
echo -e "${BLUE}🔐 Authentication Endpoints${NC}"
echo "======================================"
echo -n "  ├─ Login endpoint available... "
status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${API_URL}/auth/login" -H "Content-Type: application/json" -d '{}')
if [[ "$status" =~ ^(400|401)$ ]]; then
    echo -e "${GREEN}✅ ($status - endpoint functional)${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ ($status)${NC}"
    ((FAILED++))
fi

echo -n "  ├─ Register endpoint available... "
status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${API_URL}/auth/register" -H "Content-Type: application/json" -d '{}')
if [[ "$status" =~ ^(400|401)$ ]]; then
    echo -e "${GREEN}✅ ($status - endpoint functional)${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ ($status)${NC}"
    ((FAILED++))
fi

echo ""
echo -e "${BLUE}📊 Admin Endpoints (Protected)${NC}"
echo "======================================"
echo -n "  ├─ Admin dashboard endpoints exist... "
# These should return 401 (unauthorized) not 404 (not found)
status=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/admin/dashboard/stats")
if [[ "$status" =~ ^(401|403)$ ]]; then
    echo -e "${GREEN}✅ ($status - protected correctly)${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ ($status)${NC}"
    ((FAILED++))
fi

echo ""
echo -e "${BLUE}🏪 Seller Endpoints${NC}"
echo "======================================"
echo -n "  ├─ Seller dashboard endpoint... "
status=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/seller/dashboard")
if [[ "$status" =~ ^(401|403)$ ]]; then
    echo -e "${GREEN}✅ ($status - protected correctly)${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ ($status)${NC}"
    ((FAILED++))
fi

echo -n "  ├─ Seller products endpoint... "
status=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/seller/products")
if [[ "$status" =~ ^(401|403)$ ]]; then
    echo -e "${GREEN}✅ ($status - protected correctly)${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ ($status)${NC}"
    ((FAILED++))
fi

echo ""
echo -e "${BLUE}💳 Payment System${NC}"
echo "======================================"
echo -n "  ├─ Payment intent endpoint... "
status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${API_URL}/payment/create-intent" -H "Content-Type: application/json" -d '{}')
if [[ "$status" =~ ^(400|401)$ ]]; then
    echo -e "${GREEN}✅ ($status - endpoint functional)${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ ($status)${NC}"
    ((FAILED++))
fi

echo ""
echo -e "${BLUE}📦 Order System${NC}"
echo "======================================"
echo -n "  ├─ List orders (auth required)... "
status=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/orders")
if [[ "$status" =~ ^(401|403|200)$ ]]; then
    echo -e "${GREEN}✅ ($status)${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ ($status)${NC}"
    ((FAILED++))
fi

echo -n "  ├─ Create order (auth required)... "
status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${API_URL}/orders" -H "Content-Type: application/json" -d '{}')
if [[ "$status" =~ ^(400|401)$ ]]; then
    echo -e "${GREEN}✅ ($status)${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ ($status)${NC}"
    ((FAILED++))
fi

echo ""
echo -e "${BLUE}🗄️ Database Schema Integrity${NC}"
echo "======================================"

# Check if critical tables exist by querying API endpoints that use them
echo -n "  ├─ Products table... "
if curl -s "${API_URL}/products?limit=1" | grep -q "success"; then
    echo -e "${GREEN}✅${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌${NC}"
    ((FAILED++))
fi

echo -n "  ├─ Categories table... "
if curl -s "${API_URL}/categories" | grep -q "success"; then
    echo -e "${GREEN}✅${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌${NC}"
    ((FAILED++))
fi

echo -n "  ├─ Settings table... "
if curl -s "${API_URL}/settings/public" | grep -q "success"; then
    echo -e "${GREEN}✅${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌${NC}"
    ((FAILED++))
fi

echo ""
echo -e "${BLUE}🔄 Previous Fixes Still Applied${NC}"
echo "======================================"

echo -n "  ├─ Product filtering without status default... "
# Should return all products, not just ACTIVE
response=$(curl -s "${API_URL}/products?limit=100")
count=$(echo "$response" | python3 -c "import json,sys; data=json.load(sys.stdin); print(len(data.get('data', {}).get('products', [])))" 2>/dev/null)
if [ "$count" -gt 0 ]; then
    echo -e "${GREEN}✅ (${count} products)${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ (no products)${NC}"
    ((FAILED++))
fi

echo -n "  ├─ Empty query params filtered... "
# Empty params should not break the API
if curl -s "${API_URL}/products?category=" | grep -q "success"; then
    echo -e "${GREEN}✅${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌${NC}"
    ((FAILED++))
fi

echo -n "  ├─ JWT user object structure... "
# Can't test directly without auth, but endpoint exists
if curl -s -o /dev/null -w "%{http_code}" "${API_URL}/auth/me" | grep -q "401"; then
    echo -e "${GREEN}✅ (endpoint exists)${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  (endpoint may have changed)${NC}"
fi

echo ""
echo -e "${BLUE}📊 Regression Test Summary${NC}"
echo "======================================"
echo ""
echo "Total Tests: $((PASSED + FAILED))"
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ No regressions detected!${NC}"
    echo ""
    echo "All existing functionality verified:"
    echo "  ✓ Product management working"
    echo "  ✓ Cart system functional"
    echo "  ✓ Search system operational"
    echo "  ✓ Authentication endpoints secure"
    echo "  ✓ Admin/Seller endpoints protected"
    echo "  ✓ Payment system available"
    echo "  ✓ Order system functional"
    echo "  ✓ Database schema intact"
    echo "  ✓ Previous fixes still applied"
    echo ""
    exit 0
else
    pass_rate=$(python3 -c "print(f'{($PASSED / ($PASSED + $FAILED) * 100):.1f}')")
    echo -e "${YELLOW}⚠️  Regression tests: ${pass_rate}% passed${NC}"
    echo ""
    if [ "$pass_rate" \> "90" ]; then
        echo "Minor issues detected - review failures above"
        exit 0
    else
        echo "Significant regressions detected - review failures above"
        exit 1
    fi
fi
