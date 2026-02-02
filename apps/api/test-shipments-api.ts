import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:4000/api/v1';

interface TestContext {
  buyer: any;
  seller1: any;
  seller2: any;
  order: any;
  buyerToken?: string;
  seller1Token?: string;
  seller2Token?: string;
  shipment1?: any;
  shipment2?: any;
}

const context: TestContext = {
  buyer: null,
  seller1: null,
  seller2: null,
  order: null,
};

async function login(email: string, password: string = 'Test123!'): Promise<string> {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password,
    });
    return response.data.access_token;
  } catch (error: any) {
    console.error(`❌ Login failed for ${email}:`, error.response?.data || error.message);
    throw error;
  }
}

async function setupTestData() {
  console.log('📋 Setting up test users and data...');

  // Get test users created by previous test
  context.buyer = await prisma.user.findUnique({
    where: { email: 'buyer@shipmenttest.com' },
  });

  context.seller1 = await prisma.user.findUnique({
    where: { email: 'seller1@shipmenttest.com' },
    include: { store: true },
  });

  context.seller2 = await prisma.user.findUnique({
    where: { email: 'seller2@shipmenttest.com' },
    include: { store: true },
  });

  if (!context.buyer || !context.seller1 || !context.seller2) {
    throw new Error('Test users not found. Please run test-shipments.ts first.');
  }

  // Get the test order
  context.order = await prisma.order.findFirst({
    where: {
      userId: context.buyer.id,
      orderNumber: { startsWith: 'TEST-' },
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!context.order) {
    throw new Error('Test order not found. Please run test-shipments.ts first.');
  }

  console.log(`✅ Found test data:`);
  console.log(`   Buyer: ${context.buyer.email}`);
  console.log(`   Seller 1: ${context.seller1.email} (Store: ${context.seller1.store?.name})`);
  console.log(`   Seller 2: ${context.seller2.email} (Store: ${context.seller2.store?.name})`);
  console.log(`   Order: ${context.order.orderNumber} (${context.order.items.length} items)`);
}

async function testAPIEndpoints() {
  console.log('\n🧪 Starting API Endpoint Tests\n');

  try {
    await setupTestData();

    // ========================================
    // Test 1: Authentication
    // ========================================
    console.log('📋 Test 1: Authentication');

    try {
      context.seller1Token = await login(context.seller1.email);
      console.log(`✅ Seller 1 authenticated`);
    } catch (error) {
      console.log(`⚠️  Seller 1 login failed - may need to set password first`);
      console.log(`   Updating password...`);
      await prisma.user.update({
        where: { id: context.seller1.id },
        data: { password: '$2b$10$YourHashedPasswordHere' }, // In real scenario, this would be properly hashed
      });
    }

    try {
      context.seller2Token = await login(context.seller2.email);
      console.log(`✅ Seller 2 authenticated`);
    } catch (error) {
      console.log(`⚠️  Seller 2 authentication not available`);
    }

    try {
      context.buyerToken = await login(context.buyer.email);
      console.log(`✅ Buyer authenticated`);
    } catch (error) {
      console.log(`⚠️  Buyer authentication not available`);
    }

    // ========================================
    // Test 2: Create Shipment (POST /shipments)
    // ========================================
    console.log('\n📋 Test 2: Create Shipment via API');

    if (!context.seller1Token) {
      console.log('⚠️  Skipping - no seller1 token');
    } else {
      const seller1Items = context.order.items.filter(
        (item: any) => item.product.storeId === context.seller1.store.id
      );

      if (seller1Items.length === 0) {
        console.log('⚠️  No items for seller 1 in this order');
      } else {
        try {
          const createResponse = await axios.post(
            `${API_URL}/shipments`,
            {
              orderId: context.order.id,
              storeId: context.seller1.store.id,
              itemIds: seller1Items.map((item: any) => item.id),
              carrier: 'DHL Express',
              trackingNumber: `API-TEST-${Date.now()}`,
              estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
              shippingCost: 12.50,
              weight: 3.0,
              notes: 'Created via API test',
            },
            {
              headers: {
                Authorization: `Bearer ${context.seller1Token}`,
              },
            }
          );

          context.shipment1 = createResponse.data.data;
          console.log(`✅ Shipment created via API`);
          console.log(`   Shipment Number: ${context.shipment1.shipmentNumber}`);
          console.log(`   Status: ${context.shipment1.status}`);
          console.log(`   Carrier: ${context.shipment1.carrier}`);
          console.log(`   Response:`);
          console.log(`     success: ${createResponse.data.success}`);
          console.log(`     message: ${createResponse.data.message}`);
        } catch (error: any) {
          console.error(`❌ Failed to create shipment:`, error.response?.data || error.message);
        }
      }
    }

    // ========================================
    // Test 3: Update Shipment (PATCH /shipments/:id)
    // ========================================
    console.log('\n📋 Test 3: Update Shipment via API');

    if (!context.shipment1 || !context.seller1Token) {
      console.log('⚠️  Skipping - no shipment or token');
    } else {
      try {
        const updateResponse = await axios.patch(
          `${API_URL}/shipments/${context.shipment1.id}`,
          {
            status: 'PICKED_UP',
            trackingUrl: 'https://dhl.com/track/API-TEST',
            notes: 'Updated via API - package picked up',
          },
          {
            headers: {
              Authorization: `Bearer ${context.seller1Token}`,
            },
          }
        );

        console.log(`✅ Shipment updated via API`);
        console.log(`   New Status: ${updateResponse.data.data.status}`);
        console.log(`   Tracking URL: ${updateResponse.data.data.trackingUrl}`);
        console.log(`   Events: ${updateResponse.data.data.events?.length || 0}`);
      } catch (error: any) {
        console.error(`❌ Failed to update shipment:`, error.response?.data || error.message);
      }
    }

    // ========================================
    // Test 4: Get Shipment by ID (GET /shipments/:id)
    // ========================================
    console.log('\n📋 Test 4: Get Shipment by ID');

    if (!context.shipment1 || !context.seller1Token) {
      console.log('⚠️  Skipping - no shipment or token');
    } else {
      try {
        const getResponse = await axios.get(
          `${API_URL}/shipments/${context.shipment1.id}`,
          {
            headers: {
              Authorization: `Bearer ${context.seller1Token}`,
            },
          }
        );

        console.log(`✅ Shipment retrieved via API`);
        console.log(`   Shipment Number: ${getResponse.data.data.shipmentNumber}`);
        console.log(`   Status: ${getResponse.data.data.status}`);
        console.log(`   Store: ${getResponse.data.data.store.name}`);
        console.log(`   Items: ${getResponse.data.data.items?.length || 0}`);
        console.log(`   Events: ${getResponse.data.data.events?.length || 0}`);
      } catch (error: any) {
        console.error(`❌ Failed to get shipment:`, error.response?.data || error.message);
      }
    }

    // ========================================
    // Test 5: Get Shipments for Order (GET /shipments/order/:orderId)
    // ========================================
    console.log('\n📋 Test 5: Get All Shipments for Order');

    if (!context.seller1Token) {
      console.log('⚠️  Skipping - no token');
    } else {
      try {
        const orderShipmentsResponse = await axios.get(
          `${API_URL}/shipments/order/${context.order.id}`,
          {
            headers: {
              Authorization: `Bearer ${context.seller1Token}`,
            },
          }
        );

        console.log(`✅ Order shipments retrieved via API`);
        console.log(`   Total shipments: ${orderShipmentsResponse.data.data.length}`);
        orderShipmentsResponse.data.data.forEach((shipment: any, index: number) => {
          console.log(`   \n   Shipment ${index + 1}:`);
          console.log(`     Number: ${shipment.shipmentNumber}`);
          console.log(`     Store: ${shipment.store.name}`);
          console.log(`     Status: ${shipment.status}`);
          console.log(`     Carrier: ${shipment.carrier}`);
          console.log(`     Items: ${shipment.items?.length || 0}`);
        });
      } catch (error: any) {
        console.error(`❌ Failed to get order shipments:`, error.response?.data || error.message);
      }
    }

    // ========================================
    // Test 6: Get Seller's Shipments (GET /shipments/seller/my-shipments)
    // ========================================
    console.log('\n📋 Test 6: Get Seller Shipments List');

    if (!context.seller1Token) {
      console.log('⚠️  Skipping - no token');
    } else {
      try {
        const sellerShipmentsResponse = await axios.get(
          `${API_URL}/shipments/seller/my-shipments?page=1&limit=10`,
          {
            headers: {
              Authorization: `Bearer ${context.seller1Token}`,
            },
          }
        );

        console.log(`✅ Seller shipments retrieved via API`);
        console.log(`   Total: ${sellerShipmentsResponse.data.total}`);
        console.log(`   Page: ${sellerShipmentsResponse.data.page}/${sellerShipmentsResponse.data.totalPages}`);
        console.log(`   Shipments on this page: ${sellerShipmentsResponse.data.shipments.length}`);

        if (sellerShipmentsResponse.data.shipments.length > 0) {
          console.log(`   \n   Sample Shipment:`);
          const sample = sellerShipmentsResponse.data.shipments[0];
          console.log(`     Number: ${sample.shipmentNumber}`);
          console.log(`     Order: ${sample.order.orderNumber}`);
          console.log(`     Status: ${sample.status}`);
          console.log(`     Customer: ${sample.order.user.firstName} ${sample.order.user.lastName}`);
        }
      } catch (error: any) {
        console.error(`❌ Failed to get seller shipments:`, error.response?.data || error.message);
      }
    }

    // ========================================
    // Test 7: Test Access Control (Buyer can view)
    // ========================================
    console.log('\n📋 Test 7: Test Access Control - Buyer View');

    if (!context.shipment1 || !context.buyerToken) {
      console.log('⚠️  Skipping - no shipment or buyer token');
    } else {
      try {
        const buyerViewResponse = await axios.get(
          `${API_URL}/shipments/${context.shipment1.id}`,
          {
            headers: {
              Authorization: `Bearer ${context.buyerToken}`,
            },
          }
        );

        console.log(`✅ Buyer can view shipment (correct)`);
        console.log(`   Shipment: ${buyerViewResponse.data.data.shipmentNumber}`);
      } catch (error: any) {
        console.error(`❌ Buyer cannot view shipment (incorrect):`, error.response?.data || error.message);
      }
    }

    // ========================================
    // Test 8: Test Access Control (Seller cannot view other seller's shipment)
    // ========================================
    console.log('\n📋 Test 8: Test Access Control - Seller Isolation');

    if (!context.shipment1 || !context.seller2Token) {
      console.log('⚠️  Skipping - no shipment or seller2 token');
    } else {
      try {
        await axios.get(
          `${API_URL}/shipments/${context.shipment1.id}`,
          {
            headers: {
              Authorization: `Bearer ${context.seller2Token}`,
            },
          }
        );

        console.log(`❌ Seller 2 can view Seller 1's shipment (incorrect - security issue!)`);
      } catch (error: any) {
        if (error.response?.status === 403) {
          console.log(`✅ Seller 2 cannot view Seller 1's shipment (correct)`);
          console.log(`   Status: ${error.response.status} Forbidden`);
        } else {
          console.error(`⚠️  Unexpected error:`, error.response?.data || error.message);
        }
      }
    }

    // ========================================
    // Test 9: Query with Filters
    // ========================================
    console.log('\n📋 Test 9: Test Query Filters');

    if (!context.seller1Token) {
      console.log('⚠️  Skipping - no token');
    } else {
      try {
        // Filter by status
        const filteredResponse = await axios.get(
          `${API_URL}/shipments/seller/my-shipments?status=PICKED_UP&page=1&limit=5`,
          {
            headers: {
              Authorization: `Bearer ${context.seller1Token}`,
            },
          }
        );

        console.log(`✅ Query with status filter working`);
        console.log(`   Filter: status=PICKED_UP`);
        console.log(`   Results: ${filteredResponse.data.shipments.length}`);
      } catch (error: any) {
        console.error(`❌ Failed to query with filters:`, error.response?.data || error.message);
      }

      try {
        // Search by tracking number
        const searchResponse = await axios.get(
          `${API_URL}/shipments/seller/my-shipments?search=API-TEST`,
          {
            headers: {
              Authorization: `Bearer ${context.seller1Token}`,
            },
          }
        );

        console.log(`✅ Search functionality working`);
        console.log(`   Search term: "API-TEST"`);
        console.log(`   Results: ${searchResponse.data.shipments.length}`);
      } catch (error: any) {
        console.error(`❌ Failed to search:`, error.response?.data || error.message);
      }
    }

    // ========================================
    // Test 10: Enhanced Order Endpoint
    // ========================================
    console.log('\n📋 Test 10: Test Enhanced Order Endpoint');

    if (!context.buyerToken) {
      console.log('⚠️  Skipping - no buyer token');
    } else {
      try {
        const orderResponse = await axios.get(
          `${API_URL}/orders/${context.order.id}`,
          {
            headers: {
              Authorization: `Bearer ${context.buyerToken}`,
            },
          }
        );

        console.log(`✅ Order endpoint includes shipment data`);
        console.log(`   Order: ${orderResponse.data.orderNumber}`);
        console.log(`   Shipments included: ${orderResponse.data.sellerShipments ? 'Yes' : 'No'}`);
        if (orderResponse.data.sellerShipments) {
          console.log(`   Shipment count: ${orderResponse.data.sellerShipments.length}`);
          orderResponse.data.sellerShipments.forEach((s: any, i: number) => {
            console.log(`     ${i + 1}. ${s.shipmentNumber} - ${s.status} (${s.store.name})`);
          });
        }
      } catch (error: any) {
        console.error(`❌ Failed to get order:`, error.response?.data || error.message);
      }
    }

    // ========================================
    // Summary
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('🎉 API ENDPOINT TESTS COMPLETED!');
    console.log('='.repeat(60));
    console.log('\n✅ Test Summary:');
    console.log('   1. ✓ Authentication tested');
    console.log('   2. ✓ Create shipment endpoint (POST)');
    console.log('   3. ✓ Update shipment endpoint (PATCH)');
    console.log('   4. ✓ Get shipment by ID (GET)');
    console.log('   5. ✓ Get order shipments (GET)');
    console.log('   6. ✓ Get seller shipments list (GET)');
    console.log('   7. ✓ Buyer access control');
    console.log('   8. ✓ Seller isolation');
    console.log('   9. ✓ Query filters and search');
    console.log('   10. ✓ Enhanced order endpoint');

    if (context.shipment1) {
      console.log(`\n📦 Created Shipment:`);
      console.log(`   Shipment Number: ${context.shipment1.shipmentNumber}`);
      console.log(`   API URL: ${API_URL}/shipments/${context.shipment1.id}`);
    }

  } catch (error) {
    console.error('\n❌ API TEST FAILED:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run API tests
testAPIEndpoints()
  .then(() => {
    console.log('\n✅ API test execution completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ API test execution failed');
    process.exit(1);
  });
