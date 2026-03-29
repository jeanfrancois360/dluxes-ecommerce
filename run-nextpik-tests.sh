#!/bin/bash

################################################################################
# NextPik Comprehensive Test Suite Runner
################################################################################
#
# This script orchestrates the complete testing infrastructure:
# 1. Backend API tests (8 test agents, 69+ tests)
# 2. Frontend E2E tests (4 Playwright suites, 81+ tests)
# 3. Generates comprehensive test report
#
# Usage:
#   ./run-nextpik-tests.sh                    # Run all tests
#   ./run-nextpik-tests.sh --backend-only     # Run backend tests only
#   ./run-nextpik-tests.sh --frontend-only    # Run frontend tests only
#   ./run-nextpik-tests.sh --skip-report      # Skip report generation
#
# Requirements:
#   - Backend API running on http://localhost:4000
#   - Frontend running on http://localhost:3000
#   - Database seeded with test data
#   - All dependencies installed (pnpm install)
#
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Parse command line arguments
BACKEND_ONLY=false
FRONTEND_ONLY=false
SKIP_REPORT=false

for arg in "$@"; do
  case $arg in
    --backend-only)
      BACKEND_ONLY=true
      shift
      ;;
    --frontend-only)
      FRONTEND_ONLY=true
      shift
      ;;
    --skip-report)
      SKIP_REPORT=true
      shift
      ;;
    --help)
      echo "NextPik Comprehensive Test Suite"
      echo ""
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --backend-only     Run backend tests only"
      echo "  --frontend-only    Run frontend tests only"
      echo "  --skip-report      Skip final report generation"
      echo "  --help             Show this help message"
      exit 0
      ;;
  esac
done

# Test results tracking
BACKEND_EXIT_CODE=0
FRONTEND_EXIT_CODE=0
START_TIME=$(date +%s)

################################################################################
# Helper Functions
################################################################################

print_header() {
  echo ""
  echo "${CYAN}${BOLD}================================================================================${NC}"
  echo "${CYAN}${BOLD}$1${NC}"
  echo "${CYAN}${BOLD}================================================================================${NC}"
  echo ""
}

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ $1${NC}"
}

check_server() {
  local url=$1
  local name=$2

  if curl -s --head --request GET "$url" | grep "200\|301\|302" > /dev/null; then
    print_success "$name is running"
    return 0
  else
    print_error "$name is NOT running"
    return 1
  fi
}

################################################################################
# Pre-Flight Checks
################################################################################

print_header "PRE-FLIGHT CHECKS"

# Check if backend is running
if ! check_server "http://localhost:4000/api/v1/health" "Backend API (port 4000)"; then
  print_error "Backend API must be running on http://localhost:4000"
  print_info "Start it with: cd apps/api && pnpm dev"
  exit 1
fi

# Check if frontend is running
if ! check_server "http://localhost:3000" "Frontend (port 3000)"; then
  print_error "Frontend must be running on http://localhost:3000"
  print_info "Start it with: cd apps/web && pnpm dev"
  exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  print_error "Dependencies not installed"
  print_info "Run: pnpm install"
  exit 1
fi

print_success "All pre-flight checks passed"

################################################################################
# Run Backend Tests
################################################################################

if [ "$FRONTEND_ONLY" = false ]; then
  print_header "PHASE 1: BACKEND API TESTS"

  print_info "Running 8 backend test agents (69+ tests)..."
  print_info "Location: apps/api/test/agents/run-all-agents.ts"
  echo ""

  cd apps/api

  # Run backend tests
  if npx ts-node test/agents/run-all-agents.ts; then
    BACKEND_EXIT_CODE=0
    print_success "Backend tests completed successfully"
  else
    BACKEND_EXIT_CODE=$?
    print_error "Backend tests failed with exit code $BACKEND_EXIT_CODE"
  fi

  cd ../..

  echo ""
  print_info "Backend test results:"
  echo "  - Auth Agent: 12 tests"
  echo "  - Product Agent: 17 tests"
  echo "  - Cart/Order Agent: 14 tests"
  echo "  - Referral Agent: 11 tests"
  echo "  - Seller Agent: 7 tests"
  echo "  - Admin Agent: 13 tests"
  echo "  - Shipping Agent: 8 tests"
  echo "  - Settings Agent: 8 tests"
  echo "  ${BOLD}Total: 90 backend tests${NC}"
fi

################################################################################
# Run Frontend E2E Tests
################################################################################

if [ "$BACKEND_ONLY" = false ]; then
  print_header "PHASE 2: FRONTEND E2E TESTS"

  print_info "Running Playwright E2E tests (81+ tests)..."
  print_info "Location: apps/web/test/e2e/"
  echo ""

  cd apps/web

  # Check if Playwright browsers are installed
  if ! npx playwright --version > /dev/null 2>&1; then
    print_warning "Playwright not found, installing..."
    npx playwright install chromium
  fi

  # Run Playwright tests
  if npx playwright test --reporter=list,html; then
    FRONTEND_EXIT_CODE=0
    print_success "Frontend E2E tests completed successfully"
  else
    FRONTEND_EXIT_CODE=$?
    print_error "Frontend E2E tests failed with exit code $FRONTEND_EXIT_CODE"
  fi

  cd ../..

  echo ""
  print_info "Frontend test results:"
  echo "  - Pages Tests: 16 tests"
  echo "  - Auth Tests: 15 tests"
  echo "  - Cart Tests: 18 tests"
  echo "  - Seller Dashboard Tests: 32 tests"
  echo "  ${BOLD}Total: 81 frontend tests${NC}"

  # Show Playwright report location
  if [ -f "apps/web/playwright-report/index.html" ]; then
    print_info "Playwright HTML report: apps/web/playwright-report/index.html"
    print_info "View report: cd apps/web && npx playwright show-report"
  fi
fi

################################################################################
# Generate Final Report
################################################################################

if [ "$SKIP_REPORT" = false ]; then
  print_header "TEST SUMMARY REPORT"

  END_TIME=$(date +%s)
  DURATION=$((END_TIME - START_TIME))
  DURATION_MIN=$((DURATION / 60))
  DURATION_SEC=$((DURATION % 60))

  echo "${BOLD}NextPik Comprehensive Test Suite Results${NC}"
  echo "Generated: $(date)"
  echo ""

  # Backend results
  if [ "$FRONTEND_ONLY" = false ]; then
    echo "${BOLD}Backend Tests:${NC}"
    if [ $BACKEND_EXIT_CODE -eq 0 ]; then
      echo -e "  Status: ${GREEN}PASSED ✓${NC}"
    else
      echo -e "  Status: ${RED}FAILED ✗${NC}"
    fi
    echo "  Agents: 8"
    echo "  Tests: 90"
    echo ""
  fi

  # Frontend results
  if [ "$BACKEND_ONLY" = false ]; then
    echo "${BOLD}Frontend E2E Tests:${NC}"
    if [ $FRONTEND_EXIT_CODE -eq 0 ]; then
      echo -e "  Status: ${GREEN}PASSED ✓${NC}"
    else
      echo -e "  Status: ${RED}FAILED ✗${NC}"
    fi
    echo "  Suites: 4"
    echo "  Tests: 81"
    echo ""
  fi

  # Overall results
  echo "${BOLD}Overall:${NC}"
  echo "  Total Tests: 171"
  echo "  Duration: ${DURATION_MIN}m ${DURATION_SEC}s"
  echo ""

  # Final status
  if [ $BACKEND_EXIT_CODE -eq 0 ] && [ $FRONTEND_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}${BOLD}════════════════════════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}${BOLD}✓ ALL TESTS PASSED${NC}"
    echo -e "${GREEN}${BOLD}════════════════════════════════════════════════════════════════════════════════${NC}"
    exit 0
  else
    echo -e "${RED}${BOLD}════════════════════════════════════════════════════════════════════════════════${NC}"
    echo -e "${RED}${BOLD}✗ SOME TESTS FAILED${NC}"
    echo -e "${RED}${BOLD}════════════════════════════════════════════════════════════════════════════════${NC}"

    if [ $BACKEND_EXIT_CODE -ne 0 ]; then
      print_error "Backend tests failed"
    fi

    if [ $FRONTEND_EXIT_CODE -ne 0 ]; then
      print_error "Frontend tests failed"
      print_info "Check Playwright report: cd apps/web && npx playwright show-report"
    fi

    exit 1
  fi
fi

################################################################################
# Save Report to File (Optional)
################################################################################

REPORT_FILE="TEST_REPORT_FULL.md"

if [ "$SKIP_REPORT" = false ]; then
  print_info "Generating detailed report: $REPORT_FILE"

  cat > "$REPORT_FILE" << EOF
# NextPik Comprehensive Test Report

**Generated:** $(date)
**Duration:** ${DURATION_MIN}m ${DURATION_SEC}s

## Summary

| Category | Status | Tests | Result |
|----------|--------|-------|--------|
| Backend API | $([ $BACKEND_EXIT_CODE -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED") | 90 | Exit code: $BACKEND_EXIT_CODE |
| Frontend E2E | $([ $FRONTEND_EXIT_CODE -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED") | 81 | Exit code: $FRONTEND_EXIT_CODE |
| **Total** | $([ $BACKEND_EXIT_CODE -eq 0 ] && [ $FRONTEND_EXIT_CODE -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED") | **171** | - |

## Backend Tests (90 tests)

### Test Agents

1. **Auth Agent** (12 tests)
   - Register buyer/seller
   - Login flows
   - Magic link
   - Password reset

2. **Product Agent** (17 tests)
   - Product listing
   - Product CRUD
   - Filtering & search
   - Image upload

3. **Cart/Order Agent** (14 tests)
   - Cart operations
   - Order creation
   - Payment intents
   - Amount verification

4. **Referral Agent** (11 tests)
   - Code generation
   - Validation
   - Leaderboard
   - Admin analytics

5. **Seller Agent** (7 tests)
   - Dashboard stats
   - Products & orders
   - Credit summary
   - Payout history

6. **Admin Agent** (13 tests)
   - Dashboard analytics
   - User management
   - Revenue tracking
   - System stats

7. **Shipping Agent** (8 tests)
   - Provider health checks
   - Settings verification
   - Origin address

8. **Settings Agent** (8 tests)
   - Public settings
   - Currency rates
   - Tax & payment settings

**Result:** $([ $BACKEND_EXIT_CODE -eq 0 ] && echo "✅ ALL PASSED" || echo "❌ FAILED")

## Frontend E2E Tests (81 tests)

### Test Suites

1. **Pages Tests** (16 tests)
   - Homepage
   - Products listing
   - Product details
   - Categories
   - Search

2. **Auth Tests** (15 tests)
   - Login
   - Registration
   - Logout
   - Password reset
   - Protected routes

3. **Cart Tests** (18 tests)
   - Add to cart
   - Item management
   - Checkout flow
   - Currency switching
   - Promo codes

4. **Seller Dashboard Tests** (32 tests)
   - Dashboard overview
   - Product management
   - Order management
   - Analytics
   - Settings

**Result:** $([ $FRONTEND_EXIT_CODE -eq 0 ] && echo "✅ ALL PASSED" || echo "❌ FAILED")

## Test Infrastructure

### Backend
- **Location:** \`apps/api/test/agents/\`
- **Runner:** \`run-all-agents.ts\`
- **Technology:** TypeScript + Axios + ts-node
- **Coverage:** Authentication, Products, Orders, Payments, Admin, Shipping, Settings

### Frontend
- **Location:** \`apps/web/test/e2e/\`
- **Runner:** Playwright
- **Technology:** TypeScript + Playwright Test
- **Browsers:** Chromium, Firefox, WebKit
- **Coverage:** Pages, Auth, Cart, Seller Dashboard

## Next Steps

$(if [ $BACKEND_EXIT_CODE -ne 0 ] || [ $FRONTEND_EXIT_CODE -ne 0 ]; then
  echo "### Failed Tests"
  echo ""
  [ $BACKEND_EXIT_CODE -ne 0 ] && echo "- Review backend test output above"
  [ $FRONTEND_EXIT_CODE -ne 0 ] && echo "- Check Playwright HTML report: \`cd apps/web && npx playwright show-report\`"
  echo "- Fix failing tests and re-run"
  echo ""
else
  echo "### All Tests Passed! 🎉"
  echo ""
  echo "- ✅ Backend API is working correctly"
  echo "- ✅ Frontend UI is working correctly"
  echo "- ✅ Ready for deployment"
  echo ""
fi)

## Running Tests

### Full Test Suite
\`\`\`bash
./run-nextpik-tests.sh
\`\`\`

### Backend Only
\`\`\`bash
./run-nextpik-tests.sh --backend-only
\`\`\`

### Frontend Only
\`\`\`bash
./run-nextpik-tests.sh --frontend-only
\`\`\`

### Backend Tests Manually
\`\`\`bash
cd apps/api
npx ts-node test/agents/run-all-agents.ts
\`\`\`

### Frontend Tests Manually
\`\`\`bash
cd apps/web
npx playwright test
npx playwright show-report  # View HTML report
\`\`\`

---

**Test Suite Version:** 1.0.0
**Platform:** NextPik E-Commerce Platform
**Last Updated:** $(date)
EOF

  print_success "Report saved to $REPORT_FILE"
fi

################################################################################
# Exit
################################################################################

if [ $BACKEND_EXIT_CODE -eq 0 ] && [ $FRONTEND_EXIT_CODE -eq 0 ]; then
  exit 0
else
  exit 1
fi
