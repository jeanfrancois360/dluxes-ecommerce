/**
 * NextPik Subscription Testing Helper
 *
 * USAGE:
 * 1. Open http://localhost:3001 in your browser
 * 2. Login as a seller (seller1@nextpik.com / Password123!)
 * 3. Open DevTools Console (F12 → Console)
 * 4. Copy and paste this entire file into the console
 * 5. Run: testSubscriptionFlow()
 */

// =============================================================================
// Test Helper Functions
// =============================================================================

const API_BASE = 'http://localhost:4000/api/v1';

/**
 * Get auth token from localStorage
 */
function getToken() {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    console.error('❌ No auth token found. Please login first.');
    return null;
  }
  return token;
}

/**
 * Make authenticated API call
 */
async function apiCall(endpoint, method = 'GET', body = null) {
  const token = getToken();
  if (!token) return null;

  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await response.json();
    return {
      status: response.status,
      ok: response.ok,
      data,
    };
  } catch (error) {
    console.error('API call failed:', error);
    return null;
  }
}

// =============================================================================
// Test Functions
// =============================================================================

/**
 * Test 1: Get Subscription Info
 */
async function testGetSubscription() {
  console.log('\n🧪 TEST 1: Get Subscription Info');
  console.log('=====================================');

  const result = await apiCall('/subscription/my-subscription');

  if (!result) {
    console.error('❌ Failed to get subscription');
    return false;
  }

  if (result.ok && result.data.success) {
    const { subscription, plan } = result.data.data;
    console.log('✅ Subscription retrieved successfully');
    console.log('📋 Plan:', plan.name);
    console.log('📊 Tier:', plan.tier);
    console.log('📦 Active Listings:', subscription.activeListingsCount, '/', plan.maxActiveListings);
    console.log('⭐ Featured Slots Used:', subscription.featuredSlotsUsed, '/', plan.featuredSlotsPerMonth);
    console.log('💳 Credits:', subscription.creditsAllocated - subscription.creditsUsed, '/', subscription.creditsAllocated);
    console.log('✨ Status:', subscription.status);
    return { subscription, plan };
  } else {
    console.error('❌ Failed:', result.data.message || 'Unknown error');
    return false;
  }
}

/**
 * Test 2: Check if can list PHYSICAL product
 */
async function testCanListPhysical() {
  console.log('\n🧪 TEST 2: Check Can List PHYSICAL Product');
  console.log('===========================================');

  const result = await apiCall('/subscription/can-list/PHYSICAL');

  if (!result) {
    console.error('❌ Failed to check listing permission');
    return false;
  }

  if (result.ok && result.data.success) {
    const { canList, reasons } = result.data.data;
    console.log(canList ? '✅ Can list PHYSICAL products' : '❌ Cannot list PHYSICAL products');
    console.log('📋 Reasons:');
    console.log('  - Product type allowed:', reasons.productTypeAllowed ? '✅' : '❌');
    console.log('  - Meets tier requirement:', reasons.meetsTierRequirement ? '✅' : '❌');
    console.log('  - Has listing capacity:', reasons.hasListingCapacity ? '✅' : '❌');
    console.log('  - Has credits:', reasons.hasCredits ? '✅' : '❌');
    return { canList, reasons };
  } else {
    console.error('❌ Failed:', result.data.message || 'Unknown error');
    return false;
  }
}

/**
 * Test 3: Check if can list VEHICLE product
 */
async function testCanListVehicle() {
  console.log('\n🧪 TEST 3: Check Can List VEHICLE Product');
  console.log('==========================================');

  const result = await apiCall('/subscription/can-list/VEHICLE');

  if (!result) {
    console.error('❌ Failed to check listing permission');
    return false;
  }

  if (result.ok && result.data.success) {
    const { canList, reasons } = result.data.data;
    console.log(canList ? '✅ Can list VEHICLE products' : '❌ Cannot list VEHICLE products (expected for FREE plan)');
    console.log('📋 Reasons:');
    console.log('  - Product type allowed:', reasons.productTypeAllowed ? '✅' : '❌');
    console.log('  - Meets tier requirement:', reasons.meetsTierRequirement ? '✅' : '❌');
    console.log('  - Has listing capacity:', reasons.hasListingCapacity ? '✅' : '❌');
    console.log('  - Has credits:', reasons.hasCredits ? '✅' : '❌');
    return { canList, reasons };
  } else {
    console.error('❌ Failed:', result.data.message || 'Unknown error');
    return false;
  }
}

/**
 * Test 4: Get seller's products
 */
async function testGetProducts() {
  console.log('\n🧪 TEST 4: Get Seller Products');
  console.log('================================');

  const result = await apiCall('/seller/products?page=1&limit=20');

  if (!result) {
    console.error('❌ Failed to get products');
    return false;
  }

  if (result.ok && result.data.success) {
    const { data, pagination } = result.data;
    console.log('✅ Products retrieved successfully');
    console.log('📦 Total products:', pagination.total);
    console.log('📊 Active products:', data.filter(p => p.status === 'ACTIVE').length);
    console.log('📋 Product list:');
    data.slice(0, 5).forEach(p => {
      console.log(`  - ${p.name} (${p.status})`);
    });
    return { products: data, pagination };
  } else {
    console.error('❌ Failed:', result.data.message || 'Unknown error');
    return false;
  }
}

/**
 * Test 5: Attempt to create product (will fail if at limit)
 */
async function testCreateProduct() {
  console.log('\n🧪 TEST 5: Attempt to Create Product');
  console.log('======================================');
  console.log('⚠️  This will attempt to create a product. It should fail if you are at limit.');

  const testProduct = {
    name: 'Test Product - Subscription Check',
    description: 'This is a test product to verify subscription limits',
    price: 99.99,
    inventory: 10,
    productType: 'PHYSICAL',
    status: 'DRAFT', // Use DRAFT to avoid cluttering active listings
  };

  const result = await apiCall('/seller/products', 'POST', testProduct);

  if (!result) {
    console.error('❌ API call failed');
    return false;
  }

  if (result.ok && result.data.success) {
    console.log('✅ Product created successfully');
    console.log('📦 Product ID:', result.data.data.id);
    console.log('⚠️  Remember to delete this test product!');
    return result.data.data;
  } else {
    if (result.status === 403 || result.status === 400) {
      console.log('✅ Product creation blocked (expected if at limit)');
      console.log('📋 Reason:', result.data.message);
      return { blocked: true, reason: result.data.message };
    } else {
      console.error('❌ Unexpected error:', result.data.message || 'Unknown error');
      return false;
    }
  }
}

/**
 * Test 6: Get available subscription plans
 */
async function testGetPlans() {
  console.log('\n🧪 TEST 6: Get Available Subscription Plans');
  console.log('============================================');

  const result = await apiCall('/subscription/plans');

  if (!result) {
    console.error('❌ Failed to get plans');
    return false;
  }

  if (result.ok && result.data.success) {
    const plans = result.data.data;
    console.log('✅ Plans retrieved successfully');
    console.log('📋 Available plans:', plans.length);
    plans.forEach(plan => {
      console.log(`\n  🎯 ${plan.name} (${plan.tier})`);
      console.log(`     💰 Price: $${plan.monthlyPrice}/mo | $${plan.yearlyPrice}/yr`);
      console.log(`     📦 Max Listings: ${plan.maxActiveListings === -1 ? '∞' : plan.maxActiveListings}`);
      console.log(`     💳 Credits: ${plan.monthlyCredits}/mo`);
      console.log(`     ⭐ Featured Slots: ${plan.featuredSlotsPerMonth}`);
      console.log(`     ✅ Active: ${plan.isActive}`);
    });
    return plans;
  } else {
    console.error('❌ Failed:', result.data.message || 'Unknown error');
    return false;
  }
}

// =============================================================================
// Main Test Runner
// =============================================================================

/**
 * Run all subscription tests
 */
async function testSubscriptionFlow() {
  console.clear();
  console.log('🚀 NextPik Subscription Flow Test');
  console.log('==================================');
  console.log('Starting comprehensive subscription tests...\n');

  const results = {
    subscription: null,
    canListPhysical: null,
    canListVehicle: null,
    products: null,
    createAttempt: null,
    plans: null,
  };

  // Run tests sequentially
  results.subscription = await testGetSubscription();
  await new Promise(r => setTimeout(r, 500)); // Small delay between tests

  results.canListPhysical = await testCanListPhysical();
  await new Promise(r => setTimeout(r, 500));

  results.canListVehicle = await testCanListVehicle();
  await new Promise(r => setTimeout(r, 500));

  results.products = await testGetProducts();
  await new Promise(r => setTimeout(r, 500));

  results.plans = await testGetPlans();
  await new Promise(r => setTimeout(r, 500));

  // Only test product creation if user confirms
  const confirmCreate = confirm(
    '⚠️ Do you want to test product creation?\n\n' +
    'This will attempt to create a test product.\n' +
    'It will fail if you are at your listing limit.\n\n' +
    'Click OK to proceed, Cancel to skip.'
  );

  if (confirmCreate) {
    results.createAttempt = await testCreateProduct();
  } else {
    console.log('\n⏭️  Skipped product creation test');
  }

  // Summary
  console.log('\n\n📊 TEST SUMMARY');
  console.log('================');
  const passed = Object.values(results).filter(r => r !== null && r !== false).length;
  const total = Object.keys(results).length;
  console.log(`✅ Tests Passed: ${passed}/${total}`);

  if (results.subscription && results.subscription.subscription) {
    const { subscription, plan } = results.subscription;
    const usage = (subscription.activeListingsCount / plan.maxActiveListings) * 100;
    console.log(`\n📊 Your Subscription Status:`);
    console.log(`   Plan: ${plan.name}`);
    console.log(`   Usage: ${subscription.activeListingsCount}/${plan.maxActiveListings} (${usage.toFixed(0)}%)`);

    if (usage >= 100) {
      console.log('   ⚠️  AT LIMIT - Cannot create new listings');
    } else if (usage >= 80) {
      console.log('   ⚠️  WARNING - Approaching limit');
    } else if (usage >= 70) {
      console.log('   ✅ OK - Consider upgrading soon');
    } else {
      console.log('   ✅ OK - Plenty of capacity');
    }
  }

  console.log('\n✅ All tests completed!');
  console.log('\n💡 TIP: Check the network tab for API call details');
  console.log('💡 TIP: Visit /seller/products/new to test the UI flow');

  return results;
}

// =============================================================================
// Individual Test Exports
// =============================================================================

// Export functions for individual testing
window.subscriptionTests = {
  testGetSubscription,
  testCanListPhysical,
  testCanListVehicle,
  testGetProducts,
  testCreateProduct,
  testGetPlans,
  testSubscriptionFlow,
};

console.log('✅ Subscription test helper loaded!');
console.log('📝 Run: testSubscriptionFlow() to start all tests');
console.log('📝 Or run individual tests: subscriptionTests.testGetSubscription()');
