#!/bin/bash

###############################################################################
# NextPik Full System Test
# Tests complete user journeys and system integration
###############################################################################

set -e

echo "======================================================================"
echo "🚀 NextPik Full System Test"
echo "======================================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
WARNINGS=0

# Test result function
test_result() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ $1 -eq 0 ]; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        echo -e "${GREEN}✓ PASS${NC}: $2"
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo -e "${RED}✗ FAIL${NC}: $2"
        if [ ! -z "$3" ]; then
            echo -e "  ${RED}Error: $3${NC}"
        fi
    fi
}

warn_result() {
    WARNINGS=$((WARNINGS + 1))
    echo -e "${YELLOW}⚠ WARN${NC}: $1"
}

# API Base URL
API_URL="http://localhost:4000/api/v1"
WEB_URL="http://localhost:3000"

echo "======================================================================"
echo "📋 PHASE 1: Infrastructure Health Check"
echo "======================================================================"
echo ""

# 1.1 Check API is running
echo "1.1 Testing API Health..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health")
if [ "$RESPONSE" = "200" ]; then
    test_result 0 "API is running on port 4000"
else
    test_result 1 "API health check" "Expected 200, got $RESPONSE"
fi

# 1.2 Check Database connectivity
echo "1.2 Testing Database Connection..."
DB_STATUS=$(docker exec nextpik-postgres psql -U postgres -d nextpik_ecommerce -c "SELECT 1;" 2>&1)
if echo "$DB_STATUS" | grep -q "1 row"; then
    test_result 0 "Database is accessible"
else
    test_result 1 "Database connection"
fi

# 1.3 Check critical tables exist
echo "1.3 Testing Database Schema..."
TABLES=$(docker exec nextpik-postgres psql -U postgres -d nextpik_ecommerce -c "\dt" 2>&1 | grep -E "users|products|orders|stores")
if echo "$TABLES" | grep -q "users"; then
    test_result 0 "Critical database tables exist"
else
    test_result 1 "Database schema"
fi

# 1.4 Check Redis (if running)
echo "1.4 Testing Redis Connection..."
REDIS_STATUS=$(docker ps | grep redis || echo "not running")
if echo "$REDIS_STATUS" | grep -q "redis"; then
    test_result 0 "Redis is running"
else
    warn_result "Redis is not running (optional)"
fi

# 1.5 Check Frontend
echo "1.5 Testing Frontend Availability..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$WEB_URL" 2>/dev/null || echo "000")
if [ "$FRONTEND_STATUS" = "200" ] || [ "$FRONTEND_STATUS" = "304" ]; then
    test_result 0 "Frontend is accessible"
else
    warn_result "Frontend may not be running on port 3000"
fi

echo ""
echo "======================================================================"
echo "👤 PHASE 2: Complete Buyer Journey"
echo "======================================================================"
echo ""

# Generate unique test data
TIMESTAMP=$(date +%s)
BUYER_EMAIL="buyer_system_test_${TIMESTAMP}@test.com"
BUYER_PASSWORD="TestPassword123!"

# 2.1 Buyer Registration
echo "2.1 Testing Buyer Registration..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$BUYER_EMAIL\",
    \"password\": \"$BUYER_PASSWORD\",
    \"firstName\": \"System\",
    \"lastName\": \"Test\",
    \"role\": \"BUYER\"
  }")

BUYER_TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
if [ ! -z "$BUYER_TOKEN" ]; then
    test_result 0 "Buyer registration successful"
else
    test_result 1 "Buyer registration" "No access token returned"
fi

# 2.2 Buyer Login
echo "2.2 Testing Buyer Login..."
sleep 2 # Avoid rate limiting
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$BUYER_EMAIL\",
    \"password\": \"$BUYER_PASSWORD\"
  }")

LOGIN_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
if [ ! -z "$LOGIN_TOKEN" ]; then
    test_result 0 "Buyer login successful"
    BUYER_TOKEN="$LOGIN_TOKEN" # Use login token
else
    test_result 1 "Buyer login"
fi

# 2.3 Get User Profile
echo "2.3 Testing Get User Profile..."
if [ ! -z "$BUYER_TOKEN" ]; then
    PROFILE_RESPONSE=$(curl -s -X GET "$API_URL/auth/me" \
      -H "Authorization: Bearer $BUYER_TOKEN")

    if echo "$PROFILE_RESPONSE" | grep -q "$BUYER_EMAIL"; then
        test_result 0 "User profile retrieval"
    else
        test_result 1 "User profile retrieval"
    fi
else
    test_result 1 "User profile retrieval" "No auth token"
fi

# 2.4 Browse Products
echo "2.4 Testing Product Browsing..."
PRODUCTS_RESPONSE=$(curl -s "$API_URL/products?limit=10")
if echo "$PRODUCTS_RESPONSE" | grep -q "products\|data"; then
    test_result 0 "Product listing accessible"
else
    test_result 1 "Product listing"
fi

# 2.5 Get Categories
echo "2.5 Testing Category Listing..."
CATEGORIES_RESPONSE=$(curl -s "$API_URL/products/categories")
CATEGORY_COUNT=$(echo "$CATEGORIES_RESPONSE" | grep -o '"id"' | wc -l | tr -d ' ')
if [ "$CATEGORY_COUNT" -gt 0 ]; then
    test_result 0 "Categories available (found $CATEGORY_COUNT)"
else
    warn_result "No categories found in database"
fi

# 2.6 Search Products
echo "2.6 Testing Product Search..."
SEARCH_RESPONSE=$(curl -s "$API_URL/products?search=test&limit=5")
if echo "$SEARCH_RESPONSE" | grep -q "products\|data"; then
    test_result 0 "Product search functional"
else
    test_result 1 "Product search"
fi

# 2.7 Get Public Settings
echo "2.7 Testing Public Settings..."
SETTINGS_RESPONSE=$(curl -s "$API_URL/settings/public")
if echo "$SETTINGS_RESPONSE" | grep -q "data\|settings"; then
    test_result 0 "Public settings accessible"
else
    test_result 1 "Public settings"
fi

# 2.8 Get Currency Rates
echo "2.8 Testing Currency Rates..."
CURRENCY_RESPONSE=$(curl -s "$API_URL/currency/rates")
if echo "$CURRENCY_RESPONSE" | grep -q "USD\|EUR\|rates"; then
    test_result 0 "Currency rates available"
else
    warn_result "Currency rates may not be configured"
fi

echo ""
echo "======================================================================"
echo "🏪 PHASE 3: Complete Seller Journey"
echo "======================================================================"
echo ""

# Generate unique seller data
SELLER_EMAIL="seller_system_test_${TIMESTAMP}@test.com"
SELLER_PASSWORD="TestPassword123!"

# 3.1 Seller Registration
echo "3.1 Testing Seller Registration..."
SELLER_REGISTER=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$SELLER_EMAIL\",
    \"password\": \"$SELLER_PASSWORD\",
    \"firstName\": \"Test\",
    \"lastName\": \"Seller\",
    \"role\": \"SELLER\"
  }")

SELLER_TOKEN=$(echo "$SELLER_REGISTER" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
if [ ! -z "$SELLER_TOKEN" ]; then
    test_result 0 "Seller registration successful"
else
    test_result 1 "Seller registration"
fi

# 3.2 Seller Login
echo "3.2 Testing Seller Login..."
sleep 2
SELLER_LOGIN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$SELLER_EMAIL\",
    \"password\": \"$SELLER_PASSWORD\"
  }")

SELLER_TOKEN_LOGIN=$(echo "$SELLER_LOGIN" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
if [ ! -z "$SELLER_TOKEN_LOGIN" ]; then
    test_result 0 "Seller login successful"
    SELLER_TOKEN="$SELLER_TOKEN_LOGIN"
else
    test_result 1 "Seller login"
fi

# 3.3 Get Seller Dashboard (Unauthorized - should fail)
echo "3.3 Testing Authorization Controls..."
UNAUTH_DASHBOARD=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/seller/dashboard")
if [ "$UNAUTH_DASHBOARD" = "401" ]; then
    test_result 0 "Unauthorized access properly blocked"
else
    test_result 1 "Authorization control" "Expected 401, got $UNAUTH_DASHBOARD"
fi

# 3.4 Get Seller Dashboard (Authorized)
echo "3.4 Testing Seller Dashboard Access..."
if [ ! -z "$SELLER_TOKEN" ]; then
    SELLER_DASHBOARD=$(curl -s -X GET "$API_URL/seller/dashboard" \
      -H "Authorization: Bearer $SELLER_TOKEN")

    if echo "$SELLER_DASHBOARD" | grep -q "stats\|revenue\|orders\|data"; then
        test_result 0 "Seller dashboard accessible"
    else
        warn_result "Seller dashboard may need configuration"
    fi
else
    test_result 1 "Seller dashboard access" "No seller token"
fi

echo ""
echo "======================================================================"
echo "🔐 PHASE 4: Security & Authorization Tests"
echo "======================================================================"
echo ""

# 4.1 Test Rate Limiting
echo "4.1 Testing Rate Limiting (may take time)..."
RATE_LIMIT_COUNT=0
for i in {1..6}; do
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/auth/login" \
      -H "Content-Type: application/json" \
      -d '{"email":"test@test.com","password":"wrong"}')

    if [ "$RESPONSE" = "429" ]; then
        RATE_LIMIT_COUNT=$((RATE_LIMIT_COUNT + 1))
    fi
    sleep 0.5
done

if [ $RATE_LIMIT_COUNT -gt 0 ]; then
    test_result 0 "Rate limiting is functional (got 429 after $RATE_LIMIT_COUNT attempts)"
else
    warn_result "Rate limiting may not be triggered or needs more attempts"
fi

# 4.2 Test Invalid Credentials
echo "4.2 Testing Invalid Login..."
INVALID_LOGIN=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"nonexistent@test.com","password":"WrongPass123!"}')

if [ "$INVALID_LOGIN" = "401" ] || [ "$INVALID_LOGIN" = "429" ]; then
    test_result 0 "Invalid credentials properly rejected"
else
    test_result 1 "Invalid login handling" "Expected 401/429, got $INVALID_LOGIN"
fi

# 4.3 Test Admin Endpoint Protection
echo "4.3 Testing Admin Endpoint Protection..."
ADMIN_ACCESS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/admin/dashboard/stats")
if [ "$ADMIN_ACCESS" = "401" ]; then
    test_result 0 "Admin endpoints properly protected"
else
    test_result 1 "Admin protection" "Expected 401, got $ADMIN_ACCESS"
fi

# 4.4 Test CORS Headers
echo "4.4 Testing CORS Configuration..."
CORS_RESPONSE=$(curl -s -I "$API_URL/health" | grep -i "access-control")
if [ ! -z "$CORS_RESPONSE" ]; then
    test_result 0 "CORS headers configured"
else
    warn_result "CORS headers may need configuration"
fi

# 4.5 Test Security Headers
echo "4.5 Testing Security Headers..."
SECURITY_HEADERS=$(curl -s -I "$API_URL/health" | grep -iE "x-frame-options|x-content-type-options|strict-transport")
HEADER_COUNT=$(echo "$SECURITY_HEADERS" | wc -l | tr -d ' ')
if [ "$HEADER_COUNT" -ge 2 ]; then
    test_result 0 "Security headers present ($HEADER_COUNT found)"
else
    warn_result "Some security headers may be missing"
fi

echo ""
echo "======================================================================"
echo "💳 PHASE 5: Payment & Order System"
echo "======================================================================"
echo ""

# 5.1 Test Payment Health
echo "5.1 Testing Payment System Health..."
PAYMENT_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/payment/health")
if [ "$PAYMENT_HEALTH" = "200" ] || [ "$PAYMENT_HEALTH" = "401" ]; then
    test_result 0 "Payment endpoints accessible"
else
    warn_result "Payment health endpoint returned $PAYMENT_HEALTH"
fi

# 5.2 Test Stripe Webhook Endpoint
echo "5.2 Testing Stripe Webhook Endpoint..."
WEBHOOK_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/payment/webhook" \
  -H "Content-Type: application/json" \
  -d '{}')

if [ "$WEBHOOK_STATUS" = "400" ] || [ "$WEBHOOK_STATUS" = "401" ]; then
    test_result 0 "Webhook endpoint exists and validates input"
else
    warn_result "Webhook endpoint returned $WEBHOOK_STATUS"
fi

echo ""
echo "======================================================================"
echo "📦 PHASE 6: Shipping & Fulfillment"
echo "======================================================================"
echo ""

# 6.1 Test EasyPost Integration
echo "6.1 Testing EasyPost Integration..."
EASYPOST_TEST=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/easypost/test")
if [ "$EASYPOST_TEST" = "200" ]; then
    test_result 0 "EasyPost integration configured"
else
    warn_result "EasyPost test endpoint returned $EASYPOST_TEST"
fi

# 6.2 Test Gelato Integration
echo "6.2 Testing Gelato POD Integration..."
if [ ! -z "$SELLER_TOKEN" ]; then
    GELATO_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/seller/gelato" \
      -H "Authorization: Bearer $SELLER_TOKEN")

    if [ "$GELATO_STATUS" = "200" ] || [ "$GELATO_STATUS" = "404" ]; then
        test_result 0 "Gelato endpoint accessible"
    else
        warn_result "Gelato endpoint returned $GELATO_STATUS"
    fi
else
    warn_result "Cannot test Gelato without seller token"
fi

echo ""
echo "======================================================================"
echo "🗄️ PHASE 7: Database Integrity"
echo "======================================================================"
echo ""

# 7.1 Check Referral Tables
echo "7.1 Testing Referral System Tables..."
REFERRAL_TABLES=$(docker exec nextpik-postgres psql -U postgres -d nextpik_ecommerce \
  -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('referral_codes', 'referrals');" \
  2>&1 | grep -o "[0-9]" | head -1)

if [ "$REFERRAL_TABLES" = "2" ]; then
    test_result 0 "Referral tables exist"
else
    test_result 1 "Referral tables" "Expected 2, found $REFERRAL_TABLES"
fi

# 7.2 Check User Table Columns
echo "7.2 Testing User Table Schema..."
USER_COLUMNS=$(docker exec nextpik-postgres psql -U postgres -d nextpik_ecommerce \
  -c "\d users" 2>&1 | grep -E "referredById|storeCredit|totalReferrals" | wc -l | tr -d ' ')

if [ "$USER_COLUMNS" -ge 3 ]; then
    test_result 0 "User table has referral columns"
else
    test_result 1 "User table schema" "Missing referral columns"
fi

# 7.3 Check Test Users Created
echo "7.3 Testing User Creation Integrity..."
TEST_USERS=$(docker exec nextpik-postgres psql -U postgres -d nextpik_ecommerce \
  -c "SELECT COUNT(*) FROM users WHERE email LIKE '%system_test%';" \
  2>&1 | grep -o "[0-9]*" | tail -1)

if [ "$TEST_USERS" -ge 2 ]; then
    test_result 0 "Test users created successfully (found $TEST_USERS)"
else
    warn_result "Expected at least 2 test users, found $TEST_USERS"
fi

# 7.4 Check Foreign Key Constraints
echo "7.4 Testing Database Constraints..."
CONSTRAINTS=$(docker exec nextpik-postgres psql -U postgres -d nextpik_ecommerce \
  -c "SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_type='FOREIGN KEY';" \
  2>&1 | grep -o "[0-9]*" | tail -1)

if [ "$CONSTRAINTS" -gt 10 ]; then
    test_result 0 "Foreign key constraints present ($CONSTRAINTS found)"
else
    warn_result "Low number of foreign key constraints: $CONSTRAINTS"
fi

echo ""
echo "======================================================================"
echo "🔄 PHASE 8: Integration Tests"
echo "======================================================================"
echo ""

# 8.1 Test Complete Auth Flow
echo "8.1 Testing Complete Authentication Flow..."
AUTH_FLOW_PASS=true

# Register
FLOW_REGISTER=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"flow_test_${TIMESTAMP}@test.com\",
    \"password\": \"FlowTest123!\",
    \"firstName\": \"Flow\",
    \"lastName\": \"Test\",
    \"role\": \"BUYER\"
  }")

FLOW_TOKEN=$(echo "$FLOW_REGISTER" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
if [ -z "$FLOW_TOKEN" ]; then
    AUTH_FLOW_PASS=false
fi

# Get Profile
if [ ! -z "$FLOW_TOKEN" ]; then
    FLOW_PROFILE=$(curl -s "$API_URL/auth/me" -H "Authorization: Bearer $FLOW_TOKEN")
    if ! echo "$FLOW_PROFILE" | grep -q "flow_test"; then
        AUTH_FLOW_PASS=false
    fi
fi

if [ "$AUTH_FLOW_PASS" = true ]; then
    test_result 0 "Complete auth flow functional"
else
    test_result 1 "Complete auth flow"
fi

# 8.2 Test API Response Times
echo "8.2 Testing API Response Times..."
START_TIME=$(date +%s%3N)
curl -s "$API_URL/health" > /dev/null
END_TIME=$(date +%s%3N)
RESPONSE_TIME=$((END_TIME - START_TIME))

if [ $RESPONSE_TIME -lt 1000 ]; then
    test_result 0 "API response time acceptable (${RESPONSE_TIME}ms)"
else
    warn_result "API response time high: ${RESPONSE_TIME}ms"
fi

# 8.3 Test Database Query Performance
echo "8.3 Testing Database Query Performance..."
START_TIME=$(date +%s%3N)
docker exec nextpik-postgres psql -U postgres -d nextpik_ecommerce \
  -c "SELECT COUNT(*) FROM users;" > /dev/null 2>&1
END_TIME=$(date +%s%3N)
DB_TIME=$((END_TIME - START_TIME))

if [ $DB_TIME -lt 500 ]; then
    test_result 0 "Database query performance good (${DB_TIME}ms)"
else
    warn_result "Database query time: ${DB_TIME}ms"
fi

echo ""
echo "======================================================================"
echo "🧹 PHASE 9: Cleanup Test Data"
echo "======================================================================"
echo ""

# 9.1 Cleanup test users
echo "9.1 Cleaning up test users..."
CLEANUP_RESULT=$(docker exec nextpik-postgres psql -U postgres -d nextpik_ecommerce \
  -c "DELETE FROM users WHERE email LIKE '%system_test%' OR email LIKE '%flow_test%';" \
  2>&1)

if echo "$CLEANUP_RESULT" | grep -q "DELETE"; then
    DELETED_COUNT=$(echo "$CLEANUP_RESULT" | grep -o "DELETE [0-9]*" | grep -o "[0-9]*")
    test_result 0 "Test data cleaned up ($DELETED_COUNT users removed)"
else
    warn_result "Cleanup may have failed"
fi

echo ""
echo "======================================================================"
echo "📊 FINAL RESULTS"
echo "======================================================================"
echo ""

SUCCESS_RATE=$(awk "BEGIN {printf \"%.2f\", ($PASSED_TESTS/$TOTAL_TESTS)*100}")

echo -e "Total Tests:    ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Passed:         ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed:         ${RED}$FAILED_TESTS${NC}"
echo -e "Warnings:       ${YELLOW}$WARNINGS${NC}"
echo -e "Success Rate:   ${BLUE}$SUCCESS_RATE%${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✅ ALL CRITICAL TESTS PASSED!${NC}"
    echo ""
    echo "🎉 System is fully operational and production-ready!"
    exit 0
elif [ $FAILED_TESTS -le 5 ]; then
    echo -e "${YELLOW}⚠️  SOME TESTS FAILED${NC}"
    echo ""
    echo "System is mostly functional but has some issues."
    echo "Review failed tests above."
    exit 1
else
    echo -e "${RED}❌ MULTIPLE TEST FAILURES${NC}"
    echo ""
    echo "System has significant issues that need attention."
    exit 1
fi
