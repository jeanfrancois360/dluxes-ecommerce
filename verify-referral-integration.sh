#!/bin/bash

# ============================================================================
# Referral System Integration Verification
# Quick checks to ensure frontend-backend sync
# ============================================================================

echo "🔍 Verifying Referral System Integration"
echo "========================================="
echo ""

ERRORS=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

check() {
    local name=$1
    local condition=$2

    echo -n "Checking: $name... "
    if eval "$condition"; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}✗${NC}"
        ((ERRORS++))
    fi
}

# ============================================================================
# 1. Backend Files
# ============================================================================
echo "📦 Backend Integration"
echo "--------------------"

check "Auth DTO has referralCode field" \
    "grep -q 'referralCode' apps/api/src/auth/dto/auth.dto.ts"

check "Auth service imports ReferralService" \
    "grep -q 'ReferralService' apps/api/src/auth/auth.service.ts"

check "Auth service calls generateReferralCode" \
    "grep -q 'generateReferralCode' apps/api/src/auth/auth.service.ts"

check "Auth service calls applyReferralCode" \
    "grep -q 'applyReferralCode' apps/api/src/auth/auth.service.ts"

check "Payment service checks buyer qualification" \
    "grep -q 'checkBuyerQualification' apps/api/src/payment/payment.service.ts"

check "Products service checks seller qualification" \
    "grep -q 'checkSellerQualification' apps/api/src/products/products.service.ts"

echo ""

# ============================================================================
# 2. Frontend Files
# ============================================================================
echo "🎨 Frontend Integration"
echo "---------------------"

check "API client exists" \
    "test -f apps/web/src/lib/api/referral.ts"

check "Referral hooks exist" \
    "test -f apps/web/src/hooks/use-referral.ts"

check "ReferralSection component exists" \
    "test -f apps/web/src/components/account/referral-section.tsx"

check "Admin referrals page exists" \
    "test -f apps/web/src/app/admin/referrals/page.tsx"

check "RegisterData type has referralCode" \
    "grep -A 10 'interface RegisterData' apps/web/src/lib/api/types.ts | grep -q 'referralCode'"

check "ReferralSummary type is defined" \
    "grep -q 'interface ReferralSummary' apps/web/src/lib/api/types.ts"

check "ReferralSection uses useReferralSummary hook" \
    "grep -q 'useReferralSummary' apps/web/src/components/account/referral-section.tsx"

check "Register page extracts ?ref query param" \
    "grep -q 'searchParams.get.*ref' apps/web/src/app/auth/register/page.tsx"

check "Register page passes referralCode to register" \
    "grep -q 'referralCode.*&&.*referralCode' apps/web/src/app/auth/register/page.tsx"

check "Admin sidebar has referrals link" \
    "grep -q '/admin/referrals' apps/web/src/components/admin/admin-sidebar.tsx"

check "Date formatting utilities exist" \
    "test -f apps/web/src/lib/utils/date-format.ts"

echo ""

# ============================================================================
# 3. API Endpoints Match
# ============================================================================
echo "🔗 API Endpoint Consistency"
echo "-------------------------"

check "Frontend calls /referral/generate" \
    "grep -q \"'/referral/generate'\" apps/web/src/lib/api/referral.ts"

check "Frontend calls /referral/summary" \
    "grep -q \"'/referral/summary'\" apps/web/src/lib/api/referral.ts"

check "Frontend calls /referral/history" \
    "grep -q \"'/referral/history'\" apps/web/src/lib/api/referral.ts"

check "Frontend calls /referral/validate" \
    "grep -q \"'/referral/validate'\" apps/web/src/lib/api/referral.ts"

check "Frontend calls /referral/admin/all" \
    "grep -q \"'/referral/admin/all'\" apps/web/src/lib/api/referral.ts"

check "Frontend calls /referral/admin/statistics" \
    "grep -q \"'/referral/admin/statistics'\" apps/web/src/lib/api/referral.ts"

echo ""

# ============================================================================
# 4. Data Flow Verification
# ============================================================================
echo "🔄 Data Flow"
echo "----------"

check "ReferralSection uses formatCurrencyAmount" \
    "grep -q 'formatCurrencyAmount' apps/web/src/components/account/referral-section.tsx"

check "Admin page uses formatCurrencyAmount" \
    "grep -q 'formatCurrencyAmount' apps/web/src/app/admin/referrals/page.tsx"

check "Admin page uses formatDate" \
    "grep -q 'formatDate' apps/web/src/app/admin/referrals/page.tsx"

check "ReferralSection has WhatsApp share" \
    "grep -q 'handleWhatsAppShare' apps/web/src/components/account/referral-section.tsx"

check "Register page shows referral banner" \
    "grep -q 'referralCode &&' apps/web/src/app/auth/register/page.tsx"

check "Buyer dashboard includes ReferralSection" \
    "grep -q 'ReferralSection' apps/web/src/app/dashboard/buyer/page.tsx"

echo ""

# ============================================================================
# 5. Type Safety
# ============================================================================
echo "🛡️  Type Safety"
echo "-------------"

check "All TypeScript files compile" \
    "pnpm type-check > /dev/null 2>&1"

echo ""

# ============================================================================
# Results
# ============================================================================
echo "========================================="
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Integration is solid.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Start backend: pnpm dev:api"
    echo "2. Start frontend: pnpm dev:web"
    echo "3. Run end-to-end tests: ./test-referral-system.sh"
    exit 0
else
    echo -e "${RED}❌ Found $ERRORS issue(s)${NC}"
    echo ""
    echo "Please review the failures above and fix them."
    exit 1
fi
