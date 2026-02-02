import axios from 'axios';

/**
 * Test DHL API Directly
 * This script bypasses the application and calls DHL API directly
 * to verify if requests are reaching DHL's servers
 */

const DHL_API_KEY = 'kqLym2I6Qlk1lbc40Jj7dIpI1elUQ3en';
const DHL_API_SECRET = 'GIOvqXF5fvGGx1do';
const DHL_SANDBOX_URL = 'https://express.api.dhl.com/mydhlapi/test';

async function testDhlDirectly() {
  console.log('🔍 Testing DHL API Directly (Bypass Application)\n');
  console.log('='.repeat(60));

  // Create Basic Auth token
  const authToken = Buffer.from(`${DHL_API_KEY}:${DHL_API_SECRET}`).toString('base64');

  console.log('\n📋 Test Configuration:');
  console.log(`   DHL API URL: ${DHL_SANDBOX_URL}/rates`);
  console.log(`   API Key: ${DHL_API_KEY.substring(0, 10)}...`);
  console.log(`   Auth Method: Basic Auth`);
  console.log(`   Auth Token: Basic ${authToken.substring(0, 20)}...`);

  // Test payload matching DHL API spec
  const payload = {
    customerDetails: {
      shipperDetails: {
        postalCode: '10001',
        cityName: 'New York',
        countryCode: 'US',
      },
      receiverDetails: {
        postalCode: 'SW1A 1AA',
        cityName: 'London',
        countryCode: 'GB',
      },
    },
    accounts: [],
    plannedShippingDateAndTime: new Date().toISOString().split('T')[0],
    unitOfMeasurement: 'metric',
    isCustomsDeclarable: true,
    packages: [
      {
        weight: 1,
        dimensions: {
          length: 10,
          width: 10,
          height: 10,
        },
      },
    ],
    estimatedDeliveryDate: {
      isRequested: true,
      typeCode: 'QDDF',
    },
  };

  console.log('\n📦 Request Payload:');
  console.log(JSON.stringify(payload, null, 2));

  console.log('\n🚀 Sending request to DHL...\n');

  try {
    const startTime = Date.now();

    const response = await axios.post(
      `${DHL_SANDBOX_URL}/rates`,
      payload,
      {
        headers: {
          'Authorization': `Basic ${authToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timeout: 30000,
        validateStatus: () => true, // Don't throw on any status code
      }
    );

    const duration = Date.now() - startTime;

    console.log('='.repeat(60));
    console.log('📥 DHL API RESPONSE');
    console.log('='.repeat(60));
    console.log(`\n⏱️  Response Time: ${duration}ms`);
    console.log(`📊 Status Code: ${response.status} ${response.statusText}`);

    console.log('\n📋 Response Headers:');
    console.log(`   Content-Type: ${response.headers['content-type']}`);
    console.log(`   Server: ${response.headers['server'] || 'N/A'}`);
    console.log(`   X-Request-Id: ${response.headers['x-request-id'] || response.headers['x-correlation-id'] || 'N/A'}`);

    console.log('\n📄 Response Body:');
    console.log(JSON.stringify(response.data, null, 2));

    // Analyze the response
    console.log('\n' + '='.repeat(60));
    console.log('🔍 ANALYSIS');
    console.log('='.repeat(60));

    if (response.status === 200 || response.status === 201) {
      console.log('\n✅ SUCCESS! Request reached DHL and returned successfully.');
      console.log(`   Products found: ${response.data.products?.length || 0}`);

      if (response.data.products && response.data.products.length > 0) {
        console.log('\n📦 Available Services:');
        response.data.products.forEach((product: any, index: number) => {
          console.log(`\n   ${index + 1}. ${product.productName}`);
          console.log(`      Price: ${product.totalPrice?.price} ${product.totalPrice?.priceCurrency}`);
          console.log(`      Transit Days: ${product.deliveryCapabilities?.totalTransitDays || 'N/A'}`);
        });
      }
    } else if (response.status === 401 || response.status === 403) {
      console.log('\n❌ AUTHENTICATION FAILED');
      console.log('   The request reached DHL, but credentials are invalid.');
      console.log('   Error: ' + (response.data.detail || response.data.message || JSON.stringify(response.data)));
      console.log('\n💡 Next Steps:');
      console.log('   1. Verify credentials at https://developer.dhl.com');
      console.log('   2. Check if API subscription is active');
      console.log('   3. Ensure "MyDHL API - Express" is enabled');
    } else if (response.status === 400) {
      console.log('\n⚠️  BAD REQUEST');
      console.log('   The request reached DHL, but the payload is invalid.');
      console.log('   Error: ' + (response.data.detail || response.data.message || JSON.stringify(response.data)));
      console.log('\n💡 This confirms requests ARE reaching DHL API!');
    } else if (response.status === 404) {
      console.log('\n❌ ENDPOINT NOT FOUND');
      console.log('   Either the URL is wrong or the API subscription is not active.');
      console.log('   This might mean requests are NOT reaching the correct DHL endpoint.');
    } else if (response.status === 429) {
      console.log('\n⚠️  RATE LIMIT EXCEEDED');
      console.log('   The request reached DHL, but rate limit exceeded.');
      console.log('   DHL sandbox: 250 requests/day, 1 req/5 seconds');
      console.log('\n💡 This confirms requests ARE reaching DHL API!');
    } else if (response.status >= 500) {
      console.log('\n⚠️  DHL SERVER ERROR');
      console.log('   The request reached DHL, but their server returned an error.');
      console.log('   Error: ' + (response.data.detail || response.data.message || JSON.stringify(response.data)));
      console.log('\n💡 This confirms requests ARE reaching DHL API!');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST COMPLETE');
    console.log('='.repeat(60));
    console.log('\n🎯 Conclusion:');

    if (response.status === 200 || response.status === 201) {
      console.log('   ✅ Requests ARE reaching DHL API successfully!');
      console.log('   ✅ Credentials are valid!');
      console.log('   ✅ Integration is working!');
    } else if ([400, 401, 403, 429].includes(response.status)) {
      console.log('   ✅ Requests ARE reaching DHL API!');
      console.log('   ⚠️  But there\'s an issue with credentials or request format.');
      console.log('   📝 Status code indicates DHL server processed the request.');
    } else if (response.status === 404) {
      console.log('   ❌ Endpoint not found - verify API subscription.');
    } else {
      console.log('   ⚠️  Received response from DHL, but with error status.');
    }

  } catch (error: any) {
    console.log('='.repeat(60));
    console.log('❌ CONNECTION ERROR');
    console.log('='.repeat(60));

    if (error.code === 'ECONNREFUSED') {
      console.log('\n❌ Connection refused - DHL server is not reachable.');
      console.log('   This could mean:');
      console.log('   - Network connectivity issue');
      console.log('   - Firewall blocking requests');
      console.log('   - Incorrect DHL API URL');
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
      console.log('\n❌ Connection timeout or DNS error.');
      console.log('   Error code: ' + error.code);
      console.log('   This could mean:');
      console.log('   - Network connectivity issue');
      console.log('   - DNS resolution problem');
      console.log('   - DHL API is down');
    } else if (error.response) {
      console.log('\n📥 Received error response from server:');
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
      console.log('\n✅ This means requests ARE reaching a server!');
    } else {
      console.log('\n❌ Unexpected error:');
      console.log(`   ${error.message}`);
    }

    console.log('\n🔧 Debug Info:');
    console.log(`   Error Code: ${error.code || 'N/A'}`);
    console.log(`   Error Message: ${error.message}`);

    if (error.config) {
      console.log(`   Request URL: ${error.config.url}`);
      console.log(`   Request Method: ${error.config.method?.toUpperCase()}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('💡 HOW TO VERIFY REQUESTS ARE REACHING DHL:');
  console.log('='.repeat(60));
  console.log('\n1. Status Code Indicators:');
  console.log('   - 200/201: ✅ Success, requests reaching DHL');
  console.log('   - 400: ✅ Bad request, but reached DHL server');
  console.log('   - 401/403: ✅ Auth error, but reached DHL server');
  console.log('   - 404: ⚠️  Endpoint issue or subscription problem');
  console.log('   - 429: ✅ Rate limit, definitely reaching DHL');
  console.log('   - 500+: ✅ DHL server error, reached their server');
  console.log('   - Connection error: ❌ Not reaching DHL');

  console.log('\n2. Response Headers:');
  console.log('   - Look for DHL-specific headers (X-Request-Id, etc.)');
  console.log('   - Server header should indicate DHL infrastructure');

  console.log('\n3. Error Messages:');
  console.log('   - DHL API returns specific error formats');
  console.log('   - Generic errors = not reaching DHL');
  console.log('   - Detailed DHL errors = reached their API');

  console.log('\n4. Response Time:');
  console.log('   - Fast (<50ms) = local error, not reaching DHL');
  console.log('   - Moderate (100-2000ms) = likely reaching DHL');
  console.log('   - Slow (>30s) = timeout, network issue');

  console.log('\n');
}

// Run the test
testDhlDirectly()
  .then(() => {
    console.log('✅ Direct DHL test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  });
