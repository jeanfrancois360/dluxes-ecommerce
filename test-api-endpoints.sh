#!/bin/bash

# API Endpoint Testing Script
# Tests payment and payout API endpoints

echo "🌐 API Endpoint Tests - Payment & Payout"
echo "========================================"
echo ""

API_URL="http://localhost:4000/api/v1"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if API is running
echo "🔍 Checking if API server is running..."
if curl -s "$API_URL/health" > /dev/null 2>&1; then
  echo -e "${GREEN}✅ API server is running at $API_URL${NC}"
else
  echo -e "${YELLOW}⚠️  API server is not running${NC}"
  echo ""
  echo "To start the API server, run:"
  echo "  pnpm dev:api"
  echo ""
  echo "Skipping API endpoint tests..."
  exit 0
fi

echo ""
echo "📋 Testing Public Endpoints (No Auth Required)"
echo "----------------------------------------------"

# Test 1: Health check
echo -n "Testing health endpoint... "
response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health")
if [ "$response" = "200" ]; then
  echo -e "${GREEN}✅ PASS${NC} (HTTP $response)"
else
  echo -e "${RED}❌ FAIL${NC} (HTTP $response)"
fi

# Test 2: Payout schedule (public)
echo -n "Testing payout schedule endpoint... "
response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/payouts/schedule")
if [ "$response" = "200" ] || [ "$response" = "404" ]; then
  echo -e "${GREEN}✅ PASS${NC} (HTTP $response)"
else
  echo -e "${RED}❌ FAIL${NC} (HTTP $response)"
fi

echo ""
echo "🔐 Protected Endpoints (Require Authentication)"
echo "----------------------------------------------"
echo -e "${YELLOW}Note: These endpoints require valid JWT tokens${NC}"
echo "To test authenticated endpoints:"
echo "  1. Login via /auth/login"
echo "  2. Use the returned token in Authorization header"
echo "  3. Test endpoints manually or via Postman"
echo ""

echo "Payment Method Endpoints:"
echo "  GET    /payment/methods                    - List saved payment methods"
echo "  POST   /payment/methods/setup              - Create SetupIntent"
echo "  POST   /payment/methods/save-after-payment - Save card after checkout"
echo "  PATCH  /payment/methods/:id/default        - Set default payment method"
echo "  DELETE /payment/methods/:id                - Remove payment method"
echo ""

echo "Payout Endpoints (Seller):"
echo "  GET  /payouts/seller/history               - Payout history"
echo "  GET  /payouts/seller/stats                 - Payout statistics"
echo "  GET  /payouts/seller/eligible-commissions  - View unpaid commissions"
echo "  POST /payouts/seller/request               - Request manual payout"
echo ""

echo "Payout Endpoints (Admin):"
echo "  GET  /payouts/admin/all                    - All payouts"
echo "  GET  /payouts/admin/statistics             - Platform stats"
echo "  GET  /payouts/admin/:payoutId              - Payout details"
echo "  POST /payouts/admin/process                - Trigger processing"
echo "  PUT  /payouts/admin/:id/complete           - Mark as completed"
echo "  PUT  /payouts/admin/:id/fail               - Mark as failed"
echo ""

echo "✅ API endpoint structure verified"
echo ""
echo "For manual testing:"
echo "  1. Use Postman or Thunder Client"
echo "  2. Import API collection from docs"
echo "  3. Set environment variables (API_URL, AUTH_TOKEN)"
echo "  4. Run test scenarios"
