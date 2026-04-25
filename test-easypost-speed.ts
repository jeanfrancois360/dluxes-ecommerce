import EasyPost from '@easypost/api';

const apiKey = 'EZTKc44aba3f57f8471ca9f0277ab3200059q76d49lVTwqLyXrRLEhB5Q';

async function testEasyPostSpeed() {
  console.log('🧪 Testing EasyPost API speed...\n');

  const client = new EasyPost(apiKey);

  // Test 1: Simple API call to verify account
  console.log('Test 1: Retrieving account info...');
  const start1 = Date.now();
  try {
    const user = await client.User.retrieveMe();
    const duration1 = Date.now() - start1;
    console.log(`✅ Success! Duration: ${duration1}ms`);
    console.log(`   User ID: ${user.id}`);
  } catch (error: any) {
    const duration1 = Date.now() - start1;
    console.log(`❌ Failed after ${duration1}ms: ${error.message}`);
  }

  console.log('\nTest 2: Creating a shipment for rate shopping...');
  const start2 = Date.now();
  try {
    const shipment = await client.Shipment.create({
      from_address: {
        street1: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'US',
      },
      to_address: {
        street1: '456 Market St',
        city: 'San Francisco',
        state: 'CA',
        zip: '94103',
        country: 'US',
      },
      parcel: {
        length: 10,
        width: 8,
        height: 4,
        weight: 16, // 16 oz = 1 lb
      },
    });

    const duration2 = Date.now() - start2;
    console.log(`✅ Success! Duration: ${duration2}ms`);
    console.log(`   Shipment ID: ${shipment.id}`);
    console.log(`   Available rates: ${shipment.rates?.length || 0}`);

    if (shipment.rates && shipment.rates.length > 0) {
      console.log('\nTop 3 cheapest rates:');
      shipment.rates.slice(0, 3).forEach((rate: any, i: number) => {
        console.log(
          `   ${i + 1}. ${rate.carrier} ${rate.service}: $${rate.rate} (${rate.delivery_days} days)`
        );
      });
    }
  } catch (error: any) {
    const duration2 = Date.now() - start2;
    console.log(`❌ Failed after ${duration2}ms: ${error.message}`);
  }

  console.log('\n📊 Summary:');
  console.log('If both tests took >2000ms, EasyPost API is slow from your location');
  console.log('If tests are fast, the issue is in our shipping calculation code');
}

testEasyPostSpeed().catch(console.error);
