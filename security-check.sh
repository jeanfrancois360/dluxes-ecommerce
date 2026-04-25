#!/bin/bash

# Security Check Script for NextPik
# Run this before each deployment to catch potential security issues

set -e  # Exit on any error

echo "🔒 NextPik Security Check"
echo "========================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track if any warnings were found
WARNINGS=0

# 1. TypeScript Type Check
echo "1/7 Running TypeScript type check..."
if pnpm type-check; then
    echo -e "${GREEN}✓ TypeScript check passed${NC}"
else
    echo -e "${RED}✗ TypeScript errors found${NC}"
    exit 1
fi
echo ""

# 2. Dependency Audit
echo "2/7 Checking for vulnerable dependencies..."
if pnpm audit --audit-level=high > /dev/null 2>&1; then
    echo -e "${GREEN}✓ No high-severity vulnerabilities found${NC}"
else
    echo -e "${YELLOW}⚠ High severity vulnerabilities detected${NC}"
    echo "Run 'pnpm audit' for details"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# 3. Check for exposed secrets in staged files
echo "3/7 Scanning for exposed secrets..."
if git diff --cached --name-only | xargs grep -l "API_KEY\|SECRET\|PASSWORD\|TOKEN" 2>/dev/null; then
    echo -e "${RED}⚠ Possible secrets found in staged files!${NC}"
    echo "Review the following patterns:"
    git diff --cached | grep -E "API_KEY|SECRET|PASSWORD|TOKEN" || true
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✓ No secrets detected in staged files${NC}"
fi
echo ""

# 4. Check for dangerous code patterns
echo "4/7 Scanning for dangerous code patterns..."
DANGEROUS_PATTERNS=0

# Check for eval()
if grep -r "eval(" apps/web/src/ apps/api/src/ 2>/dev/null | grep -v "node_modules" | grep -v ".next"; then
    echo -e "${RED}⚠ Found eval() usage${NC}"
    DANGEROUS_PATTERNS=$((DANGEROUS_PATTERNS + 1))
fi

# Check for dangerouslySetInnerHTML (excluding seo.tsx which uses it safely)
if grep -r "dangerouslySetInnerHTML" apps/web/src/ 2>/dev/null | grep -v "seo.tsx" | grep -v "node_modules" | grep -v ".next"; then
    echo -e "${YELLOW}⚠ Found dangerouslySetInnerHTML usage${NC}"
    DANGEROUS_PATTERNS=$((DANGEROUS_PATTERNS + 1))
fi

# Check for Function constructor
if grep -r "new Function(" apps/web/src/ apps/api/src/ 2>/dev/null | grep -v "node_modules" | grep -v ".next"; then
    echo -e "${RED}⚠ Found Function constructor usage${NC}"
    DANGEROUS_PATTERNS=$((DANGEROUS_PATTERNS + 1))
fi

if [ $DANGEROUS_PATTERNS -eq 0 ]; then
    echo -e "${GREEN}✓ No dangerous patterns detected${NC}"
else
    WARNINGS=$((WARNINGS + DANGEROUS_PATTERNS))
fi
echo ""

# 5. Check critical files haven't been tampered with
echo "5/7 Checking critical file integrity..."
CRITICAL_FILES=(
    "apps/web/src/components/layout/footer.tsx"
    "apps/web/src/app/layout.tsx"
    "apps/web/next.config.js"
)

MODIFIED_CRITICAL=0
for file in "${CRITICAL_FILES[@]}"; do
    if git diff --name-only HEAD | grep -q "$file"; then
        echo -e "${YELLOW}⚠ Critical file modified: $file${NC}"
        MODIFIED_CRITICAL=$((MODIFIED_CRITICAL + 1))
    fi
done

if [ $MODIFIED_CRITICAL -eq 0 ]; then
    echo -e "${GREEN}✓ No critical files modified${NC}"
else
    echo -e "${YELLOW}⚠ $MODIFIED_CRITICAL critical file(s) modified - review carefully${NC}"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# 6. Check for suspicious external links
echo "6/7 Scanning for suspicious external links..."
if grep -r "http" apps/web/src/components/layout/ 2>/dev/null | \
   grep -v "localhost" | \
   grep -v "nextpik.com" | \
   grep -v "instagram.com\|facebook.com\|twitter.com\|linkedin.com\|pinterest.com\|youtube.com\|tiktok.com" | \
   grep -v "fonts.googleapis.com\|fonts.gstatic.com" | \
   grep -v "upload.wikimedia.org" | \
   grep -v "stripe.com\|paypal.com\|supabase.co" | \
   grep -v ".svg"; then
    echo -e "${RED}⚠ Suspicious external links found in layout components${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✓ No suspicious external links detected${NC}"
fi
echo ""

# 7. Build test
echo "7/7 Testing production build..."
if pnpm build; then
    echo -e "${GREEN}✓ Production build successful${NC}"
else
    echo -e "${RED}✗ Production build failed${NC}"
    exit 1
fi
echo ""

# Summary
echo "========================"
if [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ All security checks passed!${NC}"
    echo ""
    echo "Safe to deploy ✈️"
    exit 0
else
    echo -e "${YELLOW}⚠️  Security check completed with $WARNINGS warning(s)${NC}"
    echo ""
    echo "Review warnings above before deploying."
    echo "To proceed anyway, fix the issues or add exceptions to this script."
    exit 1
fi
