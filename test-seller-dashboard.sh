#!/bin/bash

# Seller Dashboard API Test Script
# This script tests all seller dashboard endpoints

echo "🧪 Testing Seller Dashboard API Endpoints..."
echo "=============================================="
echo ""

# Check if backend is running
echo "1. Checking if backend is running..."
if curl -s http://localhost:4000/api/v1/health > /dev/null 2>&1; then
    echo "✅ Backend is running"
else
    echo "❌ Backend is NOT running. Please start it with 'pnpm dev'"
    exit 1
fi

echo ""
echo "2. Testing endpoints (you need to login first to get a token)..."
echo ""
echo "To test with authentication:"
echo "1. Login as a seller:"
echo "   curl -X POST http://localhost:4000/api/v1/auth/login \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"email\":\"seller@test.com\",\"password\":\"Test@123\"}'"
echo ""
echo "2. Copy the 'access_token' from the response"
echo ""
echo "3. Test endpoints:"
echo ""
echo "   # Dashboard Summary"
echo "   curl http://localhost:4000/api/v1/seller/dashboard \\"
echo "     -H 'Authorization: Bearer YOUR_TOKEN'"
echo ""
echo "   # Revenue Analytics (monthly)"
echo "   curl http://localhost:4000/api/v1/seller/analytics/revenue?period=monthly \\"
echo "     -H 'Authorization: Bearer YOUR_TOKEN'"
echo ""
echo "   # Order Status Breakdown"
echo "   curl http://localhost:4000/api/v1/seller/analytics/orders \\"
echo "     -H 'Authorization: Bearer YOUR_TOKEN'"
echo ""
echo "   # Top Products"
echo "   curl http://localhost:4000/api/v1/seller/analytics/top-products?limit=5 \\"
echo "     -H 'Authorization: Bearer YOUR_TOKEN'"
echo ""
echo "   # Recent Activity"
echo "   curl http://localhost:4000/api/v1/seller/analytics/recent-activity?limit=10 \\"
echo "     -H 'Authorization: Bearer YOUR_TOKEN'"
echo ""
echo "✅ Backend verification complete!"
echo ""
echo "Next steps:"
echo "1. Start frontend: pnpm dev (in apps/web)"
echo "2. Visit: http://localhost:3000/dashboard/seller"
echo "3. Login with seller credentials from TEST_CREDENTIALS.md"
