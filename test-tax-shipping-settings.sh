#!/bin/bash

# Tax & Shipping Settings Test Script
# Tests the new admin-configurable tax and shipping system

API_URL="http://localhost:4000/api/v1"
ADMIN_TOKEN="${ADMIN_TOKEN:-your-admin-jwt-token}"

echo "================================================"
echo "🧪 TAX & SHIPPING SETTINGS TEST SUITE"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Helper function to test
test_setting() {
    local test_name="$1"
    local key="$2"
    local expected="$3"

    echo -n "Testing: $test_name... "

    result=$(curl -s "${API_URL}/settings/${key}" | jq -r '.value' 2>/dev/null)

    if [ "$result" == "$expected" ]; then
        echo -e "${GREEN}✓ PASS${NC} (value: $result)"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC} (expected: $expected, got: $result)"
        ((FAILED++))
    fi
}

echo "================================================"
echo "📋 PART 1: Verify Default Settings"
echo "================================================"
echo ""

test_setting "Tax Mode" "tax_calculation_mode" "disabled"
test_setting "Tax Default Rate" "tax_default_rate" "0.1"
test_setting "Standard Shipping Rate" "shipping_standard_rate" "9.99"
test_setting "Express Shipping Rate" "shipping_express_rate" "19.99"
test_setting "Overnight Shipping Rate" "shipping_overnight_rate" "29.99"
test_setting "International Surcharge" "shipping_international_surcharge" "15"

echo ""
echo "================================================"
echo "🔧 PART 2: Test Settings Updates (Requires Admin Token)"
echo "================================================"
echo ""

if [ "$ADMIN_TOKEN" == "your-admin-jwt-token" ]; then
    echo -e "${YELLOW}⚠️  SKIPPED: No admin token provided${NC}"
    echo "   Set ADMIN_TOKEN environment variable to run update tests"
    echo ""
else
    echo "Testing: Update tax_calculation_mode to 'simple'... "
    response=$(curl -s -X PATCH "${API_URL}/settings/tax_calculation_mode" \
        -H "Authorization: Bearer ${ADMIN_TOKEN}" \
        -H "Content-Type: application/json" \
        -d '{"value": "simple"}')

    if echo "$response" | jq -e '.value == "simple"' > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}"
        ((FAILED++))
    fi

    echo "Testing: Update shipping_standard_rate to 12.99... "
    response=$(curl -s -X PATCH "${API_URL}/settings/shipping_standard_rate" \
        -H "Authorization: Bearer ${ADMIN_TOKEN}" \
        -H "Content-Type: application/json" \
        -d '{"value": 12.99}')

    if echo "$response" | jq -e '.value == 12.99' > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}"
        ((FAILED++))
    fi
fi

echo ""
echo "================================================"
echo "🛒 PART 3: Test Frontend Tax Display"
echo "================================================"
echo ""

echo "1. Current Settings:"
echo "   - Tax Mode: $(curl -s "${API_URL}/settings/tax_calculation_mode" | jq -r '.value')"
echo "   - Tax Rate: $(curl -s "${API_URL}/settings/tax_default_rate" | jq -r '.value')"
echo ""
echo "2. Expected Cart Behavior:"
echo "   ✓ If mode = 'disabled': No tax line shown"
echo "   ✓ If mode = 'simple': Shows 'Tax (10%)' with amount"
echo "   ✓ If mode = 'by_state': Shows 'Tax (Calculated at checkout)'"
echo ""
echo "👉 Please verify in browser: http://localhost:3000/cart"
echo ""

echo "================================================"
echo "📦 PART 4: Test Shipping Calculation"
echo "================================================"
echo ""

echo "Testing: Backend shipping calculation... "
# This would require a full order calculation test with actual cart data
echo -e "${YELLOW}⚠️  MANUAL TEST REQUIRED${NC}"
echo "   1. Add item to cart"
echo "   2. Verify shipping options match settings:"
echo "      - Standard: \$$(curl -s "${API_URL}/settings/shipping_standard_rate" | jq -r '.value')"
echo "      - Express: \$$(curl -s "${API_URL}/settings/shipping_express_rate" | jq -r '.value')"
echo "      - Overnight: \$$(curl -s "${API_URL}/settings/shipping_overnight_rate" | jq -r '.value')"
echo ""

echo "================================================"
echo "📊 PART 5: Test Admin UI"
echo "================================================"
echo ""

echo "Manual Testing Steps:"
echo ""
echo "1. Navigate to: http://localhost:3000/admin/settings"
echo "2. Click on 'Tax' tab"
echo "   ✓ Verify Tax Calculation Mode dropdown shows 3 options"
echo "   ✓ Change to 'Simple' mode"
echo "   ✓ Verify Default Tax Rate field appears"
echo "   ✓ Set tax rate to 0.15 (15%)"
echo "   ✓ Click Save"
echo ""
echo "3. Click on 'Shipping' tab"
echo "   ✓ Verify Shipping Mode dropdown (manual selected)"
echo "   ✓ Verify 4 rate input fields are visible"
echo "   ✓ Change Standard Rate to 11.99"
echo "   ✓ Click Save"
echo ""
echo "4. Verify changes in cart:"
echo "   ✓ Go to cart page"
echo "   ✓ Should show 'Tax (15%)' with calculated amount"
echo "   ✓ Shipping should show updated rate"
echo ""

echo "================================================"
echo "🎯 PART 6: Integration Test - Full Order Flow"
echo "================================================"
echo ""

echo "End-to-End Test Checklist:"
echo ""
echo "□ Cart displays correct tax based on mode"
echo "□ Cart displays correct shipping rates"
echo "□ Checkout calculates accurate totals"
echo "□ Order creation uses settings-based calculations"
echo "□ Settings changes apply immediately (no restart needed)"
echo "□ Audit log tracks all setting changes"
echo "□ Settings revert properly on reset"
echo ""

echo "================================================"
echo "📈 TEST RESULTS SUMMARY"
echo "================================================"
echo ""
echo -e "Passed: ${GREEN}${PASSED}${NC}"
echo -e "Failed: ${RED}${FAILED}${NC}"
echo "Manual Tests Required: See sections above"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All automated tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
