#!/bin/bash

# ============================================================================
# End-to-End Testing Script for Store Credits UX Implementation
# ============================================================================

set -e

API_URL="http://localhost:4000/api/v1"
WEB_URL="http://localhost:3000"

echo "============================================================================"
echo "🧪 COMPREHENSIVE E2E TESTING: Store Credits UX"
echo "============================================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

# Test result function
test_result() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC}: $2"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}❌ FAIL${NC}: $2"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

echo "============================================================================"
echo "📋 TEST 1: Database Verification"
echo "============================================================================"
echo ""

# Check if subscription_grace_days setting exists
echo "Checking if subscription_grace_days setting exists..."
SETTING_CHECK=$(psql -h localhost -p 5433 -U nextpik_user -d nextpik_ecommerce -t -c \
    "SELECT COUNT(*) FROM \"SystemSetting\" WHERE key = 'subscription_grace_days';" 2>&1 || echo "0")

SETTING_COUNT=$(echo "$SETTING_CHECK" | tr -d ' ')

if [ "$SETTING_COUNT" = "1" ]; then
    test_result 0 "subscription_grace_days setting exists in database"

    # Get setting details
    SETTING_DETAILS=$(psql -h localhost -p 5433 -U nextpik_user -d nextpik_ecommerce -t -c \
        "SELECT key, value, \"valueType\", category FROM \"SystemSetting\" WHERE key = 'subscription_grace_days';" 2>&1)
    echo -e "${BLUE}Setting details:${NC} $SETTING_DETAILS"
else
    test_result 1 "subscription_grace_days setting NOT found in database"
    echo -e "${YELLOW}⚠️  You need to run: pnpm --filter @nextpik/database prisma db seed${NC}"
fi

echo ""

# Check if Store table has credit fields
echo "Verifying Store table has credit fields..."
STORE_COLUMNS=$(psql -h localhost -p 5433 -U nextpik_user -d nextpik_ecommerce -t -c \
    "SELECT column_name FROM information_schema.columns
     WHERE table_name = 'Store' AND column_name IN ('creditsBalance', 'creditsExpiresAt', 'creditsGraceEndsAt', 'creditsLastDeducted');" 2>&1)

COLUMN_COUNT=$(echo "$STORE_COLUMNS" | grep -c -E "credits" || echo "0")

if [ "$COLUMN_COUNT" -ge 4 ]; then
    test_result 0 "Store table has all required credit fields"
    echo -e "${BLUE}Found columns:${NC} $STORE_COLUMNS"
else
    test_result 1 "Store table missing credit fields"
fi

echo ""

# Check if SellerSubscription table exists
echo "Verifying SellerSubscription table exists..."
SUBSCRIPTION_TABLE=$(psql -h localhost -p 5433 -U nextpik_user -d nextpik_ecommerce -t -c \
    "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'SellerSubscription';" 2>&1)

SUBSCRIPTION_COUNT=$(echo "$SUBSCRIPTION_TABLE" | tr -d ' ')

if [ "$SUBSCRIPTION_COUNT" = "1" ]; then
    test_result 0 "SellerSubscription table exists"

    # Check credit fields
    SUBSCRIPTION_COLUMNS=$(psql -h localhost -p 5433 -U nextpik_user -d nextpik_ecommerce -t -c \
        "SELECT column_name FROM information_schema.columns
         WHERE table_name = 'SellerSubscription' AND column_name IN ('creditsAllocated', 'creditsUsed');" 2>&1)

    SUB_COLUMN_COUNT=$(echo "$SUBSCRIPTION_COLUMNS" | grep -c -E "credits" || echo "0")

    if [ "$SUB_COLUMN_COUNT" -ge 2 ]; then
        test_result 0 "SellerSubscription has creditsAllocated and creditsUsed fields"
    else
        test_result 1 "SellerSubscription missing credit fields"
    fi
else
    test_result 1 "SellerSubscription table NOT found"
fi

echo ""
echo "============================================================================"
echo "📋 TEST 2: Backend API Endpoint Testing"
echo "============================================================================"
echo ""

# First, let's try to get a valid JWT token by logging in
echo "Attempting to authenticate as seller..."

# Try to login with seller credentials (you'll need to adjust these)
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "seller@test.com",
        "password": "password123"
    }' 2>&1)

# Check if login was successful
if echo "$LOGIN_RESPONSE" | grep -q "accessToken"; then
    ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    test_result 0 "Successfully authenticated as seller"
    echo -e "${BLUE}Token (first 20 chars):${NC} ${ACCESS_TOKEN:0:20}..."

    echo ""
    echo "Testing GET /subscription/seller/credit-summary endpoint..."

    CREDIT_SUMMARY=$(curl -s -X GET "$API_URL/subscription/seller/credit-summary" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" 2>&1)

    # Check if response is valid JSON
    if echo "$CREDIT_SUMMARY" | python3 -m json.tool > /dev/null 2>&1; then
        test_result 0 "API endpoint returns valid JSON"

        # Check if response has required fields
        if echo "$CREDIT_SUMMARY" | grep -q "storeCredits"; then
            test_result 0 "Response contains storeCredits"
        else
            test_result 1 "Response missing storeCredits"
        fi

        if echo "$CREDIT_SUMMARY" | grep -q "subscriptionCredits"; then
            test_result 0 "Response contains subscriptionCredits"
        else
            test_result 1 "Response missing subscriptionCredits"
        fi

        if echo "$CREDIT_SUMMARY" | grep -q "subscription"; then
            test_result 0 "Response contains subscription info"
        else
            test_result 1 "Response missing subscription info"
        fi

        # Pretty print the response
        echo ""
        echo -e "${BLUE}API Response:${NC}"
        echo "$CREDIT_SUMMARY" | python3 -m json.tool | head -50

    else
        test_result 1 "API endpoint returns invalid JSON"
        echo -e "${RED}Response:${NC} $CREDIT_SUMMARY"
    fi

else
    test_result 1 "Failed to authenticate (seller@test.com doesn't exist or wrong password)"
    echo -e "${YELLOW}⚠️  Skipping API endpoint tests (authentication required)${NC}"
    echo -e "${BLUE}Tip:${NC} Create a seller account or update credentials in this script"
fi

echo ""
echo "============================================================================"
echo "📋 TEST 3: Frontend Component Verification"
echo "============================================================================"
echo ""

# Check if component file exists
echo "Checking if credit-summary.tsx component exists..."
if [ -f "apps/web/src/components/seller/credit-summary.tsx" ]; then
    test_result 0 "Component file exists"

    # Check component has key features
    COMPONENT_CONTENT=$(cat apps/web/src/components/seller/credit-summary.tsx)

    if echo "$COMPONENT_CONTENT" | grep -q "storeCredits"; then
        test_result 0 "Component imports/uses storeCredits"
    else
        test_result 1 "Component missing storeCredits usage"
    fi

    if echo "$COMPONENT_CONTENT" | grep -q "subscriptionCredits"; then
        test_result 0 "Component imports/uses subscriptionCredits"
    else
        test_result 1 "Component missing subscriptionCredits usage"
    fi

    if echo "$COMPONENT_CONTENT" | grep -q "subscriptionApi.getSellerCreditSummary"; then
        test_result 0 "Component calls getSellerCreditSummary API"
    else
        test_result 1 "Component doesn't call getSellerCreditSummary API"
    fi

    if echo "$COMPONENT_CONTENT" | grep -q "useSWR"; then
        test_result 0 "Component uses SWR for data fetching"
    else
        test_result 1 "Component doesn't use SWR"
    fi

    # Check for UI elements
    if echo "$COMPONENT_CONTENT" | grep -q "Store Credits"; then
        test_result 0 "Component has 'Store Credits' card"
    else
        test_result 1 "Component missing 'Store Credits' card"
    fi

    if echo "$COMPONENT_CONTENT" | grep -q "Listing Credits"; then
        test_result 0 "Component has 'Listing Credits' card"
    else
        test_result 1 "Component missing 'Listing Credits' card"
    fi

    if echo "$COMPONENT_CONTENT" | grep -q "Buy More Credits"; then
        test_result 0 "Component has 'Buy More Credits' button"
    else
        test_result 1 "Component missing 'Buy More Credits' button"
    fi

    if echo "$COMPONENT_CONTENT" | grep -q "Upgrade Plan"; then
        test_result 0 "Component has 'Upgrade Plan' button"
    else
        test_result 1 "Component missing 'Upgrade Plan' button"
    fi

else
    test_result 1 "Component file NOT found"
fi

echo ""

# Check if component is integrated in seller dashboard
echo "Checking if component is integrated in seller dashboard..."
if [ -f "apps/web/src/app/seller/page.tsx" ]; then
    DASHBOARD_CONTENT=$(cat apps/web/src/app/seller/page.tsx)

    if echo "$DASHBOARD_CONTENT" | grep -q "import.*CreditSummary"; then
        test_result 0 "Dashboard imports CreditSummary component"
    else
        test_result 1 "Dashboard doesn't import CreditSummary component"
    fi

    if echo "$DASHBOARD_CONTENT" | grep -q "<CreditSummary"; then
        test_result 0 "Dashboard renders CreditSummary component"
    else
        test_result 1 "Dashboard doesn't render CreditSummary component"
    fi
else
    test_result 1 "Seller dashboard file NOT found"
fi

echo ""
echo "============================================================================"
echo "📋 TEST 4: TypeScript Compilation"
echo "============================================================================"
echo ""

echo "Running type check..."
TYPE_CHECK_OUTPUT=$(pnpm type-check 2>&1)

if echo "$TYPE_CHECK_OUTPUT" | grep -q "successful"; then
    test_result 0 "TypeScript compilation successful"
else
    test_result 1 "TypeScript compilation failed"
    echo -e "${RED}Errors:${NC}"
    echo "$TYPE_CHECK_OUTPUT" | grep -A 5 "error TS"
fi

echo ""
echo "============================================================================"
echo "📋 TEST 5: API Client Methods"
echo "============================================================================"
echo ""

# Check if API method exists
echo "Checking if getSellerCreditSummary method exists in API client..."
if [ -f "apps/web/src/lib/api/subscription.ts" ]; then
    API_CLIENT_CONTENT=$(cat apps/web/src/lib/api/subscription.ts)

    if echo "$API_CLIENT_CONTENT" | grep -q "getSellerCreditSummary"; then
        test_result 0 "getSellerCreditSummary method exists in API client"
    else
        test_result 1 "getSellerCreditSummary method NOT found in API client"
    fi

    if echo "$API_CLIENT_CONTENT" | grep -q "/subscription/seller/credit-summary"; then
        test_result 0 "API client calls correct endpoint"
    else
        test_result 1 "API client uses wrong endpoint"
    fi
else
    test_result 1 "API client file NOT found"
fi

echo ""
echo "============================================================================"
echo "📋 TEST 6: Grace Period Logic"
echo "============================================================================"
echo ""

# Check subscription service has grace period logic
echo "Checking grace period implementation in subscription service..."
if [ -f "apps/api/src/subscription/subscription.service.ts" ]; then
    SERVICE_CONTENT=$(cat apps/api/src/subscription/subscription.service.ts)

    if echo "$SERVICE_CONTENT" | grep -q "subscription_grace_days"; then
        test_result 0 "Service references subscription_grace_days setting"
    else
        test_result 1 "Service doesn't reference subscription_grace_days setting"
    fi

    if echo "$SERVICE_CONTENT" | grep -q "inGracePeriod"; then
        test_result 0 "Service calculates grace period status"
    else
        test_result 1 "Service doesn't calculate grace period status"
    fi

    if echo "$SERVICE_CONTENT" | grep -q "PAST_DUE"; then
        test_result 0 "Service handles PAST_DUE status"
    else
        test_result 1 "Service doesn't handle PAST_DUE status"
    fi

    if echo "$SERVICE_CONTENT" | grep -q "getSellerCreditSummary"; then
        test_result 0 "Service has getSellerCreditSummary method"
    else
        test_result 1 "Service missing getSellerCreditSummary method"
    fi
else
    test_result 1 "Subscription service file NOT found"
fi

echo ""
echo "============================================================================"
echo "📋 TEST 7: Controller Endpoint"
echo "============================================================================"
echo ""

# Check controller has endpoint
echo "Checking controller endpoint implementation..."
if [ -f "apps/api/src/subscription/subscription.controller.ts" ]; then
    CONTROLLER_CONTENT=$(cat apps/api/src/subscription/subscription.controller.ts)

    if echo "$CONTROLLER_CONTENT" | grep -q "seller/credit-summary"; then
        test_result 0 "Controller has seller/credit-summary endpoint"
    else
        test_result 1 "Controller missing seller/credit-summary endpoint"
    fi

    if echo "$CONTROLLER_CONTENT" | grep -q "@Get.*seller/credit-summary"; then
        test_result 0 "Endpoint uses GET method"
    else
        test_result 1 "Endpoint doesn't use GET method"
    fi

    if echo "$CONTROLLER_CONTENT" | grep -A 10 "seller/credit-summary" | grep -q "JwtAuthGuard"; then
        test_result 0 "Endpoint protected by JwtAuthGuard"
    else
        test_result 1 "Endpoint not protected by JwtAuthGuard"
    fi

    if echo "$CONTROLLER_CONTENT" | grep -A 10 "seller/credit-summary" | grep -q "RolesGuard"; then
        test_result 0 "Endpoint protected by RolesGuard"
    else
        test_result 1 "Endpoint not protected by RolesGuard"
    fi

    if echo "$CONTROLLER_CONTENT" | grep -A 10 "seller/credit-summary" | grep -q "SELLER"; then
        test_result 0 "Endpoint allows SELLER role"
    else
        test_result 1 "Endpoint doesn't allow SELLER role"
    fi
else
    test_result 1 "Subscription controller file NOT found"
fi

echo ""
echo "============================================================================"
echo "📊 TEST SUMMARY"
echo "============================================================================"
echo ""

echo -e "Total Tests: ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"

echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    exit 0
else
    PASS_RATE=$(echo "scale=2; ($TESTS_PASSED * 100) / $TOTAL_TESTS" | bc)
    echo -e "${YELLOW}⚠️  Some tests failed. Pass rate: ${PASS_RATE}%${NC}"
    exit 1
fi
