const axios = require('axios');

const DHL_API_KEY = 'apX4zWOjQScX8l';
const DHL_API_SECRET = 'J#9hESedU@7fWI9a';
const DHL_BASE_URL = 'https://express.api.dhl.com/mydhlapi/test';

async function testDHLFrance() {
  const auth = Buffer.from(`${DHL_API_KEY}:${DHL_API_SECRET}`).toString('base64');

  const requestBody = {
    customerDetails: {
      shipperDetails: {
        postalCode: '10001',
        cityName: 'New York',
        countryCode: 'US',
      },
      receiverDetails: {
        postalCode: '75004',
        cityName: 'Paris',
        countryCode: 'FR',
      },
    },
    accounts: [
      {
        typeCode: 'shipper',
        number: '123456789',
      },
    ],
    productCode: '',
    plannedShippingDateAndTime: new Date().toISOString(),
    unitOfMeasurement: 'metric',
    isCustomsDeclarable: true,
    monetaryAmount: [
      {
        typeCode: 'declaredValue',
        value: 50,
        currency: 'USD',
      },
    ],
    packages: [
      {
        weight: 0.5,
        dimensions: {
          length: 15,
          width: 10,
          height: 10,
        },
      },
    ],
  };

  try {
    console.log('Testing DHL API for France shipping...\n');
    console.log('From: New York, US 10001');
    console.log('To: Paris, FR 75004\n');

    const response = await axios.post(`${DHL_BASE_URL}/rates`, requestBody, {
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    console.log('SUCCESS! Products available:', response.data.products?.length || 0);

    if (response.data.products) {
      response.data.products.forEach((product, idx) => {
        const price = product.totalPrice?.find((p) => p.priceCurrency === 'USD');
        console.log(`\n${idx + 1}. ${product.productName}`);
        console.log(`   Price: $${price?.price || 'N/A'}`);
        console.log(`   Transit: ${product.deliveryCapabilities?.totalTransitDays || 'N/A'} days`);
      });
    }
  } catch (error) {
    console.error('FAILED!\n');
    console.error('Status:', error.response?.status);
    console.error('Error:', JSON.stringify(error.response?.data || error.message, null, 2));
  }
}

testDHLFrance();
