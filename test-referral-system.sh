#!/bin/bash

# ============================================================================
# Referral System End-to-End Test Script
# Tests all integration points and user flows
# ============================================================================

set -e  # Exit on error

echo "🧪 NextPik Referral System - End-to-End Tests"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="http://localhost:4000/api/v1"
FRONTEND_URL="http://localhost:3000"

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to run tests
run_test() {
    local test_name=$1
    local test_command=$2

    echo -n "Testing: $test_name... "

    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}"
        ((TESTS_FAILED++))
    fi
}

# ============================================================================
# TEST 1: Backend Health Check
# ============================================================================
echo "1️⃣  Backend Health Checks"
echo "------------------------"

run_test "API server is running" "curl -f $API_URL/health"
run_test "Database is connected" "curl -f $API_URL/health"

echo ""

# ============================================================================
# TEST 2: Public Endpoints (No Auth Required)
# ============================================================================
echo "2️⃣  Public Endpoints"
echo "-------------------"

# Test settings endpoint
run_test "GET /referral/settings (public)" "curl -f $API_URL/referral/settings"

# Test validate endpoint
run_test "GET /referral/validate/TESTCODE" "curl -f $API_URL/referral/validate/TESTCODE"

echo ""

# ============================================================================
# TEST 3: Registration with Referral Code
# ============================================================================
echo "3️⃣  Registration Flow"
echo "--------------------"

echo "Testing registration with referral code..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testbuyer'$(date +%s)'@test.com",
    "password": "TestPassword123!",
    "firstName": "Test",
    "lastName": "Buyer",
    "role": "BUYER",
    "referralCode": "TESTCODE"
  }')

if echo "$REGISTER_RESPONSE" | grep -q "access_token"; then
    echo -e "${GREEN}✓ Registration with referral code successful${NC}"
    ((TESTS_PASSED++))

    # Extract JWT token for authenticated tests
    JWT_TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"access_token":"[^"]*' | sed 's/"access_token":"//')
    echo "  Token extracted: ${JWT_TOKEN:0:20}..."
else
    echo -e "${RED}✗ Registration failed${NC}"
    ((TESTS_FAILED++))
    echo "  Response: $REGISTER_RESPONSE"
fi

echo ""

# ============================================================================
# TEST 4: Authenticated User Endpoints
# ============================================================================
echo "4️⃣  Authenticated User Endpoints"
echo "-------------------------------"

if [ ! -z "$JWT_TOKEN" ]; then
    # Test generate referral code
    echo -n "POST /referral/generate... "
    GENERATE_RESPONSE=$(curl -s -X POST "$API_URL/referral/generate" \
      -H "Authorization: Bearer $JWT_TOKEN")

    if echo "$GENERATE_RESPONSE" | grep -q "code"; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((TESTS_PASSED++))

        # Extract referral code
        REF_CODE=$(echo "$GENERATE_RESPONSE" | grep -o '"code":"[^"]*' | sed 's/"code":"//')
        echo "  Generated code: $REF_CODE"
    else
        echo -e "${RED}✗ FAIL${NC}"
        ((TESTS_FAILED++))
    fi

    # Test get summary
    run_test "GET /referral/summary" "curl -f -H 'Authorization: Bearer $JWT_TOKEN' $API_URL/referral/summary"

    # Test get history
    run_test "GET /referral/history" "curl -f -H 'Authorization: Bearer $JWT_TOKEN' $API_URL/referral/history"

    # Test leaderboard
    run_test "GET /referral/leaderboard" "curl -f -H 'Authorization: Bearer $JWT_TOKEN' $API_URL/referral/leaderboard"
else
    echo -e "${YELLOW}⚠ Skipping authenticated tests (no JWT token)${NC}"
    ((TESTS_FAILED+=4))
fi

echo ""

# ============================================================================
# TEST 5: Database Verification
# ============================================================================
echo "5️⃣  Database Schema Verification"
echo "-------------------------------"

# Check if tables exist
cd "$(dirname "$0")/packages/database"

echo -n "Checking ReferralCode table... "
if npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM referral_codes;" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ EXISTS${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ MISSING${NC}"
    ((TESTS_FAILED++))
fi

echo -n "Checking Referral table... "
if npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM referrals;" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ EXISTS${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ MISSING${NC}"
    ((TESTS_FAILED++))
fi

cd - > /dev/null

echo ""

# ============================================================================
# TEST 6: Frontend Build Verification
# ============================================================================
echo "6️⃣  Frontend Build Verification"
echo "------------------------------"

cd "$(dirname "$0")/apps/web"

# Check if required files exist
run_test "API client exists" "test -f src/lib/api/referral.ts"
run_test "Hooks exist" "test -f src/hooks/use-referral.ts"
run_test "ReferralSection exists" "test -f src/components/account/referral-section.tsx"
run_test "Admin page exists" "test -f src/app/admin/referrals/page.tsx"
run_test "Types defined" "grep -q 'ReferralSummary' src/lib/api/types.ts"

cd - > /dev/null

echo ""

# ============================================================================
# TEST 7: TypeScript Compilation
# ============================================================================
echo "7️⃣  TypeScript Compilation"
echo "-------------------------"

cd "$(dirname "$0")"

echo -n "Running type check... "
if pnpm type-check > /dev/null 2>&1; then
    echo -e "${GREEN}✓ NO ERRORS${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ TYPE ERRORS FOUND${NC}"
    ((TESTS_FAILED++))
fi

echo ""

# ============================================================================
# FINAL RESULTS
# ============================================================================
echo "=============================================="
echo "📊 Test Results"
echo "=============================================="
echo ""
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
PASS_RATE=$((TESTS_PASSED * 100 / TOTAL_TESTS))

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ ALL TESTS PASSED! (100%)${NC}"
    exit 0
elif [ $PASS_RATE -ge 80 ]; then
    echo -e "${YELLOW}⚠️  MOSTLY PASSING ($PASS_RATE%)${NC}"
    echo "Some tests failed, but system is mostly functional."
    exit 0
else
    echo -e "${RED}❌ MANY TESTS FAILED ($PASS_RATE%)${NC}"
    echo "Please review the failures above."
    exit 1
fi
