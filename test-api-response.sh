#!/bin/bash

# Login with buyer@gmail.com user who has orders
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"buyer@gmail.com","password":"Test@123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
  echo "✓ Login successful with buyer@gmail.com"
  echo ""
  echo "API Response:"
  curl -s -H "Authorization: Bearer $TOKEN" \
    "http://localhost:4000/api/v1/orders?page=1&limit=2" | python3 -m json.tool
else
  echo "✗ Login failed - trying to check if user exists"
  echo "$LOGIN_RESPONSE"
fi
