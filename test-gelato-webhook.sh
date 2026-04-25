#!/bin/bash

# Test Gelato Webhook Endpoint
# Usage: ./test-gelato-webhook.sh

WEBHOOK_URL="http://localhost:4000/api/v1/webhooks/gelato"
WEBHOOK_SECRET="8a2e38e3b936cad3e0e97497e95352c7751056e8898d2b65b30fd573e9c87529"

echo "Testing Gelato Webhook Endpoint..."
echo "URL: $WEBHOOK_URL"
echo ""

# Test 1: Order Status Updated
echo "📦 Test 1: Order Status Updated (SHIPPED)"
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: $WEBHOOK_SECRET" \
  -d '{
    "event": "order_status_updated",
    "id": "evt_test_001",
    "createdAt": "2026-02-20T12:00:00Z",
    "data": {
      "id": "gelato_order_123",
      "status": "shipped",
      "comment": "Order shipped via DHL"
    }
  }' | jq '.'

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 2: Tracking Code Updated
echo "📍 Test 2: Tracking Code Updated"
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: $WEBHOOK_SECRET" \
  -d '{
    "event": "order_item_tracking_code_updated",
    "id": "evt_test_002",
    "createdAt": "2026-02-20T12:05:00Z",
    "data": {
      "orderId": "gelato_order_123",
      "trackingCode": "1234567890",
      "trackingUrl": "https://track.dhl.com/1234567890",
      "carrier": "DHL"
    }
  }' | jq '.'

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 3: Invalid Secret (should fail)
echo "❌ Test 3: Invalid Secret (should fail with 401)"
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: wrong_secret" \
  -d '{
    "event": "order_status_updated",
    "id": "evt_test_003",
    "createdAt": "2026-02-20T12:10:00Z",
    "data": {
      "id": "gelato_order_456",
      "status": "delivered"
    }
  }' | jq '.'

echo ""
echo "✅ Webhook tests completed!"
