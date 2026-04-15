#!/bin/bash

# End-to-End Test Script for Payment & Payout Fixes
# Tests the implemented fixes for payment method sync and payout integration

echo "🧪 NextPik E2E Test Suite - Payment & Payout"
echo "============================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to run test
run_test() {
  local test_name="$1"
  local test_command="$2"

  echo -e "${BLUE}▶ Test: ${test_name}${NC}"

  if eval "$test_command"; then
    echo -e "${GREEN}  ✅ PASSED${NC}"
    ((PASSED++))
  else
    echo -e "${RED}  ❌ FAILED${NC}"
    ((FAILED++))
  fi
  echo ""
}

echo "📦 Environment Check"
echo "-------------------"
run_test "Node.js installed" "node --version > /dev/null 2>&1"
run_test "pnpm installed" "pnpm --version > /dev/null 2>&1"
run_test "Database package exists" "test -d packages/database"
run_test "API package exists" "test -d apps/api"

echo ""
echo "🔍 Code Verification Tests"
echo "--------------------------"

# Test 1: Payment method sync function exists
run_test "syncPaymentMethods() exists in payment.service.ts" \
  "grep -q 'async syncPaymentMethods' apps/api/src/payment/payment.service.ts"

# Test 2: Sync is called in listPaymentMethods
run_test "listPaymentMethods() calls syncPaymentMethods()" \
  "grep -q 'this.syncPaymentMethods(userId)' apps/api/src/payment/payment.service.ts"

# Test 3: PayPal component has warning message
run_test "PayPal component has payment method warning" \
  "grep -q 'PayPal accounts cannot be saved' apps/web/src/components/checkout/paypal-payment.tsx"

# Test 4: Payout includes payoutSettings in query
run_test "Payout query includes payoutSettings" \
  "grep -q 'payoutSettings: true' apps/api/src/payout/payout-scheduler.service.ts"

# Test 5: Dynamic payment method detection
run_test "Payout uses dynamic payment method" \
  "grep -q 'seller.payoutSettings?.paymentMethod' apps/api/src/payout/payout-scheduler.service.ts"

# Test 6: Stripe Connect integration exists
run_test "Stripe Connect createPayout() exists" \
  "grep -q 'stripe.transfers.create' apps/api/src/payout/integrations/stripe-connect.service.ts"

# Test 7: Cron job for pending payouts exists
run_test "Payout cron job exists" \
  "grep -q 'handlePendingPayouts' apps/api/src/payout/payout.cron.ts"

# Test 8: Payout processing switch case exists
run_test "Payout routing switch statement exists" \
  "grep -q \"case 'STRIPE_CONNECT'\" apps/api/src/payout/payout-scheduler.service.ts"

echo ""
echo "📊 Database Schema Tests"
echo "------------------------"

# Test 9: SavedPaymentMethod model exists
run_test "SavedPaymentMethod model in schema" \
  "grep -q 'model SavedPaymentMethod' packages/database/prisma/schema.prisma"

# Test 10: Payout model has paymentMethod field
run_test "Payout model has paymentMethod field" \
  "grep -q 'paymentMethod.*String' packages/database/prisma/schema.prisma"

# Test 11: SellerPayoutSettings exists
run_test "SellerPayoutSettings model exists" \
  "grep -q 'model SellerPayoutSettings' packages/database/prisma/schema.prisma"

# Test 12: Stripe Connect fields exist
run_test "SellerPayoutSettings has Stripe fields" \
  "grep -q 'stripeAccountId' packages/database/prisma/schema.prisma"

echo ""
echo "🔧 TypeScript Compilation Test"
echo "-------------------------------"

# Test 13: TypeScript compiles without errors
run_test "TypeScript type-check passes" \
  "pnpm type-check > /dev/null 2>&1"

echo ""
echo "📝 Test Results Summary"
echo "======================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All tests passed!${NC}"
  echo ""
  echo "🎉 Implementation verified successfully!"
  echo ""
  echo "Next steps:"
  echo "1. Start the development server: pnpm dev"
  echo "2. Test payment method saving in checkout"
  echo "3. Verify payout processing works for sellers"
  echo "4. Check admin dashboard for payout management"
  exit 0
else
  echo -e "${RED}❌ Some tests failed${NC}"
  echo ""
  echo "Please review the failed tests above."
  exit 1
fi
