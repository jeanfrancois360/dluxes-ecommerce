#!/bin/bash

# Login and get token
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"buyer@test.com","password":"Test@123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
  echo "✓ Login successful"
  echo ""
  echo "Testing orders API..."
  curl -s -H "Authorization: Bearer $TOKEN" \
    "http://localhost:4000/api/v1/orders?page=1&limit=5"
else
  echo "✗ Login failed"
  echo "$LOGIN_RESPONSE"
fi
