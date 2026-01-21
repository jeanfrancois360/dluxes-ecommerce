#!/bin/bash

# Integration Health Check Script
# Validates all key services and endpoints are operational

API_URL="http://localhost:4000/api/v1"
PASSED=0
FAILED=0

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "🔍 Integration Health Check"
echo "======================================"
echo ""

# Test API endpoint availability
test_endpoint() {
    local name="$1"
    local url="$2"
    local method="${3:-GET}"

    echo -n "  ├─ $name... "

    if [ "$method" = "GET" ]; then
        status_code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    else
        status_code=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$url")
    fi

    # 200, 201, 400, 401 are all "accessible" (not 404 or 500)
    if [[ "$status_code" =~ ^(200|201|400|401|403)$ ]]; then
        echo -e "${GREEN}✅ ($status_code)${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ ($status_code)${NC}"
        ((FAILED++))
        return 1
    fi
}

# Test database connectivity (via API health endpoint if available)
test_database() {
    echo -n "  ├─ Database connectivity... "

    # Try to hit an endpoint that requires DB
    response=$(curl -s "${API_URL}/products?limit=1" 2>/dev/null)

    if echo "$response" | grep -q '"success"'; then
        echo -e "${GREEN}✅${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌${NC}"
        ((FAILED++))
        return 1
    fi
}

echo -e "${BLUE}🌐 Backend API Endpoints${NC}"
echo "======================================"

echo "Core Services:"
test_endpoint "Health check" "${API_URL}/health" || test_endpoint "Root endpoint" "${API_URL}/"
test_database

echo ""
echo "Authentication:"
test_endpoint "Login" "${API_URL}/auth/login" "POST"
test_endpoint "Register" "${API_URL}/auth/register" "POST"

echo ""
echo "Products:"
test_endpoint "List products" "${API_URL}/products"
test_endpoint "Product categories" "${API_URL}/categories"

echo ""
echo "Cart:"
test_endpoint "Get cart" "${API_URL}/cart"
test_endpoint "Cart items" "${API_URL}/cart/items" "POST"

echo ""
echo "Orders:"
test_endpoint "List orders" "${API_URL}/orders"
test_endpoint "Create order" "${API_URL}/orders" "POST"

echo ""
echo "Payment:"
test_endpoint "Create payment intent" "${API_URL}/payment/create-intent" "POST"
test_endpoint "Payment webhook" "${API_URL}/payment/webhook" "POST"

echo ""
echo "Search:"
test_endpoint "Search" "${API_URL}/search"
test_endpoint "Autocomplete" "${API_URL}/search/autocomplete"

echo ""
echo "Settings:"
test_endpoint "Public settings" "${API_URL}/settings/public"

echo ""
echo "Currency:"
test_endpoint "List currencies" "${API_URL}/currency"

echo ""
echo -e "${BLUE}🔧 Service Dependencies${NC}"
echo "======================================"

echo -n "  ├─ API Server (port 4000)... "
if lsof -ti:4000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Running${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ Not running${NC}"
    ((FAILED++))
fi

echo -n "  ├─ Frontend (port 3000)... "
if lsof -ti:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Running${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  Not running${NC} (optional for API tests)"
fi

echo -n "  ├─ PostgreSQL (port 5432)... "
if lsof -ti:5432 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Running${NC}"
    ((PASSED++))
else
    echo -n ""
    if lsof -ti:5433 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Running (Docker port 5433)${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ Not running${NC}"
        ((FAILED++))
    fi
fi

echo -n "  ├─ Redis (port 6379)... "
if lsof -ti:6379 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Running${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  Not detected${NC}"
fi

echo -n "  ├─ Meilisearch (port 7700)... "
if lsof -ti:7700 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Running${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  Not detected${NC}"
fi

echo ""
echo -e "${BLUE}📊 Integration Summary${NC}"
echo "======================================"
echo ""
echo "Total Checks: $((PASSED + FAILED))"
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All critical services operational${NC}"
    echo ""
    echo "System ready for integration testing:"
    echo "  ✓ Backend API accessible"
    echo "  ✓ Database connected"
    echo "  ✓ Core endpoints responding"
    echo "  ✓ Services integrated properly"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Some services not operational${NC}"
    echo ""
    echo "Review failed checks above"
    echo ""
    exit 1
fi
