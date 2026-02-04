import axios from 'axios';

const API_URL = 'http://localhost:4000/api/v1';

// Test DHL endpoints with admin authentication
async function testDhlEndpoints() {
  console.log('🚀 Starting DHL Endpoint Tests\n');
  console.log('='.repeat(60));

  let adminToken: string;

  try {
    // ========================================
    // Step 1: Admin Login
    // ========================================
    console.log('\n📋 Step 1: Admin Authentication');

    try {
      const loginResponse = await axios.post(`${API_URL}/auth/login`, {
        email: 'admin1@nextpik.com',
        password: 'Password123!',
      });

      adminToken = loginResponse.data.accessToken;
      console.log('✅ Admin authenticated successfully');
      console.log(`   Token: ${adminToken.substring(0, 20)}...`);
    } catch (error: any) {
      console.error('❌ Admin login failed:', error.response?.data || error.message);
      console.log('\n💡 Please update the admin credentials in the script');
      console.log('   Common admin emails: admin@nextpik.com, admin@test.com');
      return;
    }

    // ========================================
    // Test 1: DHL API Health Check
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('📋 Test 1: DHL API Health Check');
    console.log('   Endpoint: GET /shipping/admin/dhl/health');
    console.log('='.repeat(60));

    try {
      const healthResponse = await axios.get(
        `${API_URL}/shipping/admin/dhl/health`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      console.log('\n✅ DHL Health Check Response:');
      console.log(JSON.stringify(healthResponse.data, null, 2));

      if (healthResponse.data.enabled) {
        console.log('\n✓ DHL API is ENABLED');
        console.log(`✓ API URL: ${healthResponse.data.apiUrl}`);
        console.log(`✓ API Key configured: ${healthResponse.data.hasApiKey ? 'Yes' : 'No'}`);
      } else {
        console.log('\n⚠️  DHL API is DISABLED');
        console.log('   To enable, set DHL_TRACKING_ENABLED=true in .env');
      }
    } catch (error: any) {
      console.error('\n❌ DHL Health Check Failed:');
      console.error('   Status:', error.response?.status);
      console.error('   Error:', error.response?.data || error.message);

      if (error.response?.status === 403) {
        console.log('\n⚠️  Access Denied - Make sure you\'re logged in as ADMIN or SUPER_ADMIN');
      }
    }

    // ========================================
    // Test 2: DHL Test Rates - Default Parameters
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('📋 Test 2: DHL Test Rates - Default Parameters');
    console.log('   Endpoint: POST /shipping/admin/dhl/test-rates');
    console.log('   Route: US (10001) → UK (SW1A 1AA), 1kg');
    console.log('='.repeat(60));

    try {
      const ratesResponse = await axios.post(
        `${API_URL}/shipping/admin/dhl/test-rates`,
        {}, // Empty body uses default parameters
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('\n✅ DHL Test Rates Response:');
      console.log(`   Success: ${ratesResponse.data.success}`);
      console.log(`   Message: ${ratesResponse.data.message}`);
      console.log(`   Rates Found: ${ratesResponse.data.ratesCount}`);

      if (ratesResponse.data.rates && ratesResponse.data.rates.length > 0) {
        console.log('\n📦 Available Shipping Options:');
        ratesResponse.data.rates.forEach((rate: any, index: number) => {
          console.log(`\n   Option ${index + 1}:`);
          console.log(`     Service: ${rate.serviceName}`);
          console.log(`     Price: ${rate.price.amount} ${rate.price.currency}`);
          console.log(`     Transit Days: ${rate.deliveryTime.min}-${rate.deliveryTime.max} business days`);
          console.log(`     Estimated Delivery: ${rate.deliveryTime.estimatedDate}`);
        });
      }
    } catch (error: any) {
      console.error('\n❌ DHL Test Rates Failed:');
      console.error('   Status:', error.response?.status);
      console.error('   Error:', error.response?.data || error.message);

      if (error.response?.data?.error) {
        console.log('\n💡 Possible Issues:');
        console.log('   - DHL_TRACKING_ENABLED not set to true in .env');
        console.log('   - DHL_API_KEY not configured or invalid');
        console.log('   - DHL API credentials expired');
        console.log('   - Network connectivity issues');
      }
    }

    // ========================================
    // Test 3: DHL Test Rates - Custom Route (Rwanda → USA)
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('📋 Test 3: DHL Test Rates - Custom Route');
    console.log('   Route: Rwanda (Kigali) → USA (New York), 2.5kg');
    console.log('='.repeat(60));

    try {
      const customRatesResponse = await axios.post(
        `${API_URL}/shipping/admin/dhl/test-rates`,
        {
          originCountry: 'RW',
          originPostalCode: '00000',
          destinationCountry: 'US',
          destinationPostalCode: '10001',
          weight: 2.5,
        },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('\n✅ DHL Custom Route Test Response:');
      console.log(`   Success: ${customRatesResponse.data.success}`);
      console.log(`   Message: ${customRatesResponse.data.message}`);
      console.log(`   Rates Found: ${customRatesResponse.data.ratesCount}`);

      if (customRatesResponse.data.rates && customRatesResponse.data.rates.length > 0) {
        console.log('\n📦 Available Shipping Options:');
        customRatesResponse.data.rates.forEach((rate: any, index: number) => {
          console.log(`\n   Option ${index + 1}:`);
          console.log(`     Service: ${rate.serviceName}`);
          console.log(`     Price: ${rate.price.amount} ${rate.price.currency}`);
          console.log(`     Transit Days: ${rate.deliveryTime.min}-${rate.deliveryTime.max} business days`);
        });
      }
    } catch (error: any) {
      console.error('\n❌ DHL Custom Route Test Failed:');
      console.error('   Status:', error.response?.status);
      console.error('   Error:', error.response?.data || error.message);
    }

    // ========================================
    // Test 4: DHL Test Rates - International Heavy Package
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('📋 Test 4: DHL Test Rates - Heavy Package');
    console.log('   Route: Germany → Japan, 10kg');
    console.log('='.repeat(60));

    try {
      const heavyPackageResponse = await axios.post(
        `${API_URL}/shipping/admin/dhl/test-rates`,
        {
          originCountry: 'DE',
          originPostalCode: '10115',
          destinationCountry: 'JP',
          destinationPostalCode: '100-0001',
          weight: 10,
        },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('\n✅ DHL Heavy Package Test Response:');
      console.log(`   Success: ${heavyPackageResponse.data.success}`);
      console.log(`   Message: ${heavyPackageResponse.data.message}`);
      console.log(`   Rates Found: ${heavyPackageResponse.data.ratesCount}`);

      if (heavyPackageResponse.data.rates && heavyPackageResponse.data.rates.length > 0) {
        console.log('\n📦 Available Shipping Options:');
        heavyPackageResponse.data.rates.forEach((rate: any, index: number) => {
          console.log(`\n   Option ${index + 1}:`);
          console.log(`     Service: ${rate.serviceName}`);
          console.log(`     Price: ${rate.price.amount} ${rate.price.currency}`);
          console.log(`     Transit Days: ${rate.deliveryTime.min}-${rate.deliveryTime.max} business days`);
        });
      }
    } catch (error: any) {
      console.error('\n❌ DHL Heavy Package Test Failed:');
      console.error('   Status:', error.response?.status);
      console.error('   Error:', error.response?.data || error.message);
    }

    // ========================================
    // Test 5: DHL Test Rates - Unauthorized Access
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('📋 Test 5: Security - Test Without Auth Token');
    console.log('='.repeat(60));

    try {
      await axios.get(`${API_URL}/shipping/admin/dhl/health`);
      console.log('\n❌ SECURITY ISSUE: Endpoint accessible without authentication!');
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.log('\n✅ Security Check Passed: Endpoint requires authentication');
      } else {
        console.error('\n⚠️  Unexpected error:', error.response?.status);
      }
    }

    // ========================================
    // Summary
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('🎉 DHL ENDPOINT TESTS COMPLETED!');
    console.log('='.repeat(60));
    console.log('\n✅ Tests Run:');
    console.log('   1. ✓ DHL API Health Check');
    console.log('   2. ✓ DHL Test Rates - Default Route');
    console.log('   3. ✓ DHL Test Rates - Custom Route (Rwanda → USA)');
    console.log('   4. ✓ DHL Test Rates - Heavy Package (Germany → Japan)');
    console.log('   5. ✓ Security - Authentication Required');

    console.log('\n📚 Documentation:');
    console.log('   - See DHL_API_INTEGRATION_SUMMARY.md for full details');
    console.log('   - DHL API Docs: https://developer.dhl.com');

    console.log('\n🔧 Configuration:');
    console.log('   - Check apps/api/.env for DHL settings');
    console.log('   - Required: DHL_TRACKING_ENABLED=true');
    console.log('   - Required: DHL_API_KEY=your-key-here');

  } catch (error: any) {
    console.error('\n❌ TEST EXECUTION FAILED:', error.message);
    throw error;
  }
}

// Run the tests
testDhlEndpoints()
  .then(() => {
    console.log('\n✅ Test script execution completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test script execution failed');
    console.error(error);
    process.exit(1);
  });
