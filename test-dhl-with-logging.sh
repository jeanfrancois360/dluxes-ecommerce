#!/bin/bash

# Test DHL endpoints with detailed logging
# This script will show you exactly what's being sent to DHL

echo "🔍 Testing DHL Integration with Detailed Logging"
echo "============================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Login as admin
echo "📋 Step 1: Authenticating as admin..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin1@nextpik.com","password":"Password123!"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Login failed${NC}"
  echo "$LOGIN_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ Authenticated successfully${NC}"
echo "Token: ${TOKEN:0:20}..."
echo ""

# Step 2: Test DHL Health (this doesn't call DHL API)
echo "============================================================"
echo "📋 Step 2: Testing DHL Health Check"
echo "============================================================"
echo ""

HEALTH_RESPONSE=$(curl -s -X GET http://localhost:4000/api/v1/shipping/admin/dhl/health \
  -H "Authorization: Bearer $TOKEN")

echo "Response:"
echo "$HEALTH_RESPONSE" | jq '.' 2>/dev/null || echo "$HEALTH_RESPONSE"
echo ""

# Step 3: Test DHL Rates (this DOES call DHL API)
echo "============================================================"
echo "📋 Step 3: Testing DHL Rates (Calls DHL API)"
echo "============================================================"
echo ""
echo "⏳ Sending request to DHL via our API..."
echo "   Our API → DHL API"
echo ""

# Make the request and show full response
RATES_RESPONSE=$(curl -s -w "\n\nHTTP_STATUS:%{http_code}\nTIME_TOTAL:%{time_total}s" \
  -X POST http://localhost:4000/api/v1/shipping/admin/dhl/test-rates \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "originCountry": "US",
    "originPostalCode": "10001",
    "destinationCountry": "GB",
    "destinationPostalCode": "SW1A 1AA",
    "weight": 1
  }')

# Parse response
RESPONSE_BODY=$(echo "$RATES_RESPONSE" | sed -n '1,/^HTTP_STATUS/p' | sed '$d')
HTTP_STATUS=$(echo "$RATES_RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
TIME_TOTAL=$(echo "$RATES_RESPONSE" | grep "TIME_TOTAL" | cut -d':' -f2)

echo "Response Status: $HTTP_STATUS"
echo "Response Time: $TIME_TOTAL"
echo ""
echo "Response Body:"
echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
echo ""

# Analyze the response
echo "============================================================"
echo "🔍 ANALYSIS - Did Request Reach DHL?"
echo "============================================================"
echo ""

# Check if error message contains DHL-specific errors
if echo "$RESPONSE_BODY" | grep -q "DHL API"; then
  echo -e "${GREEN}✅ YES! Request reached DHL API${NC}"
  echo "   Evidence: Error message contains 'DHL API' - this means our app"
  echo "   successfully sent a request to DHL and received a response."
  echo ""

  if echo "$RESPONSE_BODY" | grep -q "Invalid request parameters"; then
    echo -e "${YELLOW}⚠️  DHL returned: Invalid request parameters${NC}"
    echo "   This could mean:"
    echo "   - Credentials are test/sandbox keys with limited access"
    echo "   - Request format not accepted by sandbox environment"
    echo "   - Need production credentials"
  elif echo "$RESPONSE_BODY" | grep -q "Invalid DHL API credentials"; then
    echo -e "${YELLOW}⚠️  DHL returned: Invalid credentials${NC}"
    echo "   - Credentials are incorrect or expired"
  elif echo "$RESPONSE_BODY" | grep -q "rate limit"; then
    echo -e "${YELLOW}⚠️  DHL rate limit exceeded${NC}"
    echo "   - Too many requests (confirms DHL is being reached!)"
  fi
elif echo "$RESPONSE_BODY" | grep -q "success.*true"; then
  echo -e "${GREEN}✅ YES! Request successful${NC}"
  echo "   DHL API returned rate quotes successfully!"
else
  echo -e "${RED}❌ UNCLEAR - Request may not have reached DHL${NC}"
  echo "   The error doesn't contain DHL-specific messages"
fi

echo ""
echo "============================================================"
echo "💡 HOW TO CONFIRM REQUESTS ARE REACHING DHL:"
echo "============================================================"
echo ""
echo "1. ✅ Check API logs for 'DHL Rates API error' messages"
echo "      Location: Terminal where 'pnpm dev:api' is running"
echo "      Look for: [DhlRatesService] errors"
echo ""
echo "2. ✅ Look for DHL-specific error messages in response:"
echo "      - 'Invalid request parameters' = Reached DHL ✓"
echo "      - 'Invalid DHL API credentials' = Reached DHL ✓"
echo "      - 'DHL API rate limit exceeded' = Reached DHL ✓"
echo ""
echo "3. ✅ Check response time:"
echo "      - >0.1s = Likely made external API call"
echo "      - <0.05s = Probably failed before calling DHL"
echo ""
echo "4. ✅ Run direct test (bypasses our app):"
echo "      npx tsx test-dhl-direct.ts"
echo ""
echo "5. ✅ Check DHL developer dashboard:"
echo "      https://developer.dhl.com/user/apps"
echo "      View API call statistics"
echo ""

# Suggest next steps
echo "============================================================"
echo "🔧 RECOMMENDED NEXT STEPS:"
echo "============================================================"
echo ""
echo "1. Run direct DHL test:"
echo "   npx tsx test-dhl-direct.ts"
echo ""
echo "2. Check API server logs:"
echo "   Look for [DhlRatesService] messages in your terminal"
echo ""
echo "3. Enable debug logging (optional):"
echo "   Set LOG_LEVEL=debug in apps/api/.env"
echo ""
echo "4. Verify credentials at:"
echo "   https://developer.dhl.com/user/apps"
echo ""
