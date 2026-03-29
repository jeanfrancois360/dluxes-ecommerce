#!/usr/bin/env node

/**
 * Test script for Gelato image refresh functionality
 * Tests the download + re-upload to Supabase flow
 */

const productId = 'cmly4pqhw0002oslnnx7b891d';
const apiUrl = 'http://localhost:4000/api/v1';

async function testImageRefresh() {
  console.log('🧪 Testing Gelato Image Refresh...\n');

  // Step 1: Check current image state in database
  console.log('Step 1: Checking current image state...');
  const { Pool } = require('pg');
  const pool = new Pool({
    host: 'localhost',
    port: 5433,
    user: 'postgres',
    password: 'User@123!',
    database: 'nextpik_ecommerce',
  });

  try {
    const result = await pool.query(
      `SELECT id, url, original_url, "displayOrder"
       FROM product_images
       WHERE "productId" = $1 AND alt = 'gelato-cached'
       ORDER BY "displayOrder"`,
      [productId]
    );

    console.log(`Found ${result.rows.length} cached image(s):\n`);
    result.rows.forEach((img) => {
      console.log(`  Order ${img.displayOrder}:`);
      console.log(`    URL: ${img.url.substring(0, 80)}...`);
      console.log(`    Original URL: ${img.original_url || 'NULL'}`);
      console.log(`    Has AWS URL: ${img.url.includes('amazonaws.com') ? 'YES ❌' : 'NO ✅'}\n`);
    });

    // Step 2: Test if we can fetch the image
    if (result.rows.length > 0) {
      const imageUrl = result.rows[0].url;
      console.log('Step 2: Testing image download from Gelato...');

      const fetch = (await import('node-fetch')).default;
      const response = await fetch(imageUrl);

      if (response.ok) {
        const buffer = await response.arrayBuffer();
        console.log(`✅ Downloaded image: ${Buffer.byteLength(Buffer.from(buffer))} bytes`);
        console.log(`   Content-Type: ${response.headers.get('content-type')}\n`);
      } else {
        console.log(`❌ Failed to download: ${response.status} ${response.statusText}\n`);
      }
    }

    // Step 3: Call refresh endpoint (requires auth)
    console.log('Step 3: Testing refresh endpoint...');
    console.log('⚠️  Note: Endpoint requires authentication');
    console.log(`   To test manually: POST ${apiUrl}/gelato/products/${productId}/refresh-images`);
    console.log('   Or: Configure a new Gelato product (triggers automatic refresh)\n');

    // Step 4: Summary
    console.log('📊 Test Summary:');
    console.log(`   Product ID: ${productId}`);
    console.log(`   Cached Images: ${result.rows.length}`);
    console.log(
      `   Images with AWS URLs: ${result.rows.filter((r) => r.url.includes('amazonaws.com')).length}`
    );
    console.log(
      `   Images with Supabase URLs: ${result.rows.filter((r) => !r.url.includes('amazonaws.com')).length}`
    );

    if (result.rows.some((r) => r.url.includes('amazonaws.com'))) {
      console.log('\n⚠️  Action Needed: Run image refresh to upload to Supabase');
      console.log('   • Wait for daily cron (2am UTC)');
      console.log('   • OR trigger manually via API endpoint');
    } else {
      console.log('\n✅ All images already using Supabase URLs!');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run test
testImageRefresh()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
