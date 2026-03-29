#!/bin/bash

echo "🧪 Testing Gelato Image Refresh..."
echo ""

PRODUCT_ID="cmly4pqhw0002oslnnx7b891d"

echo "Step 1: Checking current image state..."
docker exec -i nextpik-postgres psql -U postgres -d nextpik_ecommerce << SQL
SELECT 
  id,
  CASE 
    WHEN url LIKE '%amazonaws.com%' THEN '❌ AWS S3 (expires)'
    WHEN url LIKE '%supabase%' THEN '✅ Supabase (permanent)'
    ELSE '❓ Other'
  END as url_status,
  CASE 
    WHEN original_url IS NULL THEN 'NULL (not migrated)'
    ELSE 'Set ✅'
  END as original_url_status,
  "displayOrder"
FROM product_images
WHERE "productId" = '$PRODUCT_ID' AND alt = 'gelato-cached'
ORDER BY "displayOrder";
SQL

echo ""
echo "Step 2: Testing image download capability..."
IMAGE_URL=$(docker exec -i nextpik-postgres psql -U postgres -d nextpik_ecommerce -t << SQL
SELECT url FROM product_images
WHERE "productId" = '$PRODUCT_ID' AND alt = 'gelato-cached'
ORDER BY "displayOrder" LIMIT 1;
SQL
)

if [ ! -z "$IMAGE_URL" ]; then
  IMAGE_URL=$(echo $IMAGE_URL | xargs)  # trim whitespace
  echo "Testing download from: ${IMAGE_URL:0:80}..."
  
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$IMAGE_URL")
  if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Image is downloadable (HTTP $HTTP_CODE)"
  else
    echo "❌ Image download failed (HTTP $HTTP_CODE)"
  fi
else
  echo "⚠️  No image found to test"
fi

echo ""
echo "📊 Test Summary:"
echo "   Product ID: $PRODUCT_ID"
echo "   To trigger refresh: POST /api/v1/gelato/products/$PRODUCT_ID/refresh-images"
echo "   Or wait for daily cron at 2am UTC"
echo ""
echo "✅ Test completed"
