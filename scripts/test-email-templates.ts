import { orderConfirmationTemplate } from '../apps/api/src/email/templates/order-confirmation.template';
import { sellerOrderNotificationTemplate } from '../apps/api/src/email/templates/seller-order-notification.template';
import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  testName: string;
  passed: boolean;
  message: string;
  details?: string;
}

const results: TestResult[] = [];

function logTest(testName: string, passed: boolean, message: string, details?: string) {
  results.push({ testName, passed, message, details });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${testName}: ${message}`);
  if (details) {
    console.log(`   ${details}`);
  }
}

// Test data fixtures
const mockOrderData = {
  orderNumber: 'ORD-2026-001',
  customerName: 'John Doe',
  items: [
    {
      name: 'Luxury Watch',
      quantity: 1,
      price: 299.99,
      image: 'https://example.com/watch.jpg',
    },
    {
      name: 'Designer Sunglasses',
      quantity: 2,
      price: 149.99,
      image: 'https://example.com/sunglasses.jpg',
    },
  ],
  subtotal: 599.97,
  tax: 48.00,
  shipping: 15.00,
  total: 662.97,
  currency: 'USD',
  shippingAddress: {
    street: '123 Main St, Apt 4B',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'United States',
  },
  orderUrl: 'http://localhost:3000/orders/test-order-id',
  orderId: 'test-order-id',
};

const mockSellerNotification = {
  sellerName: 'Jane Smith',
  storeName: 'Luxury Goods Store',
  orderNumber: 'ORD-2026-001',
  customerName: 'John Doe',
  items: [
    {
      name: 'Luxury Watch',
      quantity: 1,
      price: 299.99,
      image: 'https://example.com/watch.jpg',
      sku: 'LW-001',
    },
  ],
  subtotal: 299.99,
  commission: 29.99,
  commissionRate: 10,
  netPayout: 270.00,
  currency: 'USD',
  shippingAddress: {
    street: '123 Main St, Apt 4B',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'United States',
  },
  orderUrl: 'http://localhost:3000/seller/orders/test-order-id',
  dashboardUrl: 'http://localhost:3000/seller/dashboard',
  orderId: 'test-order-id',
  sellerId: 'test-seller-id',
};

console.log('🧪 Starting Email Template Tests\n');

// TEST 1: Order Confirmation Template - Valid Data
console.log('\n📧 TEST 1: Order Confirmation Template - Valid Data');
try {
  const html = orderConfirmationTemplate(mockOrderData);

  // Check HTML is generated
  if (!html || html.length === 0) {
    logTest('Order Confirmation Generation', false, 'Template returned empty string');
  } else {
    logTest('Order Confirmation Generation', true, `Generated ${html.length} characters of HTML`);
  }

  // Check required elements
  const checks = [
    { name: 'Order Number', pattern: mockOrderData.orderNumber, label: 'order number' },
    { name: 'Customer Name', pattern: mockOrderData.customerName, label: 'customer name' },
    { name: 'Total Amount', pattern: '662.97', label: 'total amount' },
    { name: 'First Item', pattern: 'Luxury Watch', label: 'first item name' },
    { name: 'Shipping Address', pattern: '123 Main St', label: 'shipping address' },
    { name: 'Order URL', pattern: mockOrderData.orderUrl, label: 'order link' },
  ];

  checks.forEach(check => {
    if (html.includes(check.pattern)) {
      logTest(`Order Confirmation Contains ${check.name}`, true, `Found ${check.label}`);
    } else {
      logTest(`Order Confirmation Contains ${check.name}`, false, `Missing ${check.label}`);
    }
  });

} catch (error: any) {
  logTest('Order Confirmation Generation', false, 'Template threw error', error.message);
}

// TEST 2: Order Confirmation Template - Missing Images
console.log('\n📧 TEST 2: Order Confirmation Template - Missing Images');
try {
  const dataWithoutImages = {
    ...mockOrderData,
    items: mockOrderData.items.map(item => ({ ...item, image: undefined })),
  };

  const html = orderConfirmationTemplate(dataWithoutImages);

  if (html && html.length > 0) {
    logTest('Order Confirmation Without Images', true, 'Template handles missing images gracefully');
  } else {
    logTest('Order Confirmation Without Images', false, 'Template failed without images');
  }

} catch (error: any) {
  logTest('Order Confirmation Without Images', false, 'Template threw error', error.message);
}

// TEST 3: Order Confirmation Template - Different Currencies
console.log('\n📧 TEST 3: Order Confirmation Template - Different Currencies');
const currencies = ['USD', 'EUR', 'GBP', 'RWF'];
currencies.forEach(currency => {
  try {
    const html = orderConfirmationTemplate({ ...mockOrderData, currency });

    if (html.includes(currency)) {
      logTest(`Order Confirmation Currency ${currency}`, true, `Displays ${currency} correctly`);
    } else {
      logTest(`Order Confirmation Currency ${currency}`, false, `Missing ${currency}`);
    }
  } catch (error: any) {
    logTest(`Order Confirmation Currency ${currency}`, false, 'Template threw error', error.message);
  }
});

// TEST 4: Seller Notification Template - Valid Data
console.log('\n📧 TEST 4: Seller Notification Template - Valid Data');
try {
  const html = sellerOrderNotificationTemplate(mockSellerNotification);

  if (!html || html.length === 0) {
    logTest('Seller Notification Generation', false, 'Template returned empty string');
  } else {
    logTest('Seller Notification Generation', true, `Generated ${html.length} characters of HTML`);
  }

  // Check required elements
  const checks = [
    { name: 'Seller Name', pattern: mockSellerNotification.sellerName, label: 'seller name' },
    { name: 'Store Name', pattern: mockSellerNotification.storeName, label: 'store name' },
    { name: 'Order Number', pattern: mockSellerNotification.orderNumber, label: 'order number' },
    { name: 'Net Payout', pattern: '270.00', label: 'net payout amount' },
    { name: 'Commission', pattern: '29.99', label: 'commission amount' },
    { name: 'Commission Rate', pattern: '10', label: 'commission rate' },
    { name: 'Customer Name', pattern: mockSellerNotification.customerName, label: 'customer name' },
  ];

  checks.forEach(check => {
    if (html.includes(check.pattern)) {
      logTest(`Seller Notification Contains ${check.name}`, true, `Found ${check.label}`);
    } else {
      logTest(`Seller Notification Contains ${check.name}`, false, `Missing ${check.label}`);
    }
  });

} catch (error: any) {
  logTest('Seller Notification Generation', false, 'Template threw error', error.message);
}

// TEST 5: Seller Notification Template - Multiple Items
console.log('\n📧 TEST 5: Seller Notification Template - Multiple Items');
try {
  const dataWithMultipleItems = {
    ...mockSellerNotification,
    items: [
      ...mockSellerNotification.items,
      {
        name: 'Designer Wallet',
        quantity: 1,
        price: 89.99,
        image: 'https://example.com/wallet.jpg',
        sku: 'DW-001',
      },
    ],
    subtotal: 389.98,
    commission: 38.99,
    netPayout: 350.99,
  };

  const html = sellerOrderNotificationTemplate(dataWithMultipleItems);

  if (html.includes('Designer Wallet') && html.includes('Luxury Watch')) {
    logTest('Seller Notification Multiple Items', true, 'Template handles multiple items');
  } else {
    logTest('Seller Notification Multiple Items', false, 'Not all items displayed');
  }

} catch (error: any) {
  logTest('Seller Notification Multiple Items', false, 'Template threw error', error.message);
}

// TEST 6: Seller Notification Template - Missing Optional Fields
console.log('\n📧 TEST 6: Seller Notification Template - Missing Optional Fields');
try {
  const dataWithoutOptionals = {
    ...mockSellerNotification,
    items: mockSellerNotification.items.map(item => ({
      ...item,
      image: undefined,
      sku: undefined,
    })),
  };

  const html = sellerOrderNotificationTemplate(dataWithoutOptionals);

  if (html && html.length > 0) {
    logTest('Seller Notification Without Optionals', true, 'Template handles missing optional fields');
  } else {
    logTest('Seller Notification Without Optionals', false, 'Template failed without optional fields');
  }

} catch (error: any) {
  logTest('Seller Notification Without Optionals', false, 'Template threw error', error.message);
}

// TEST 7: HTML Validity - Basic Checks
console.log('\n📧 TEST 7: HTML Validity Checks');
try {
  const orderHtml = orderConfirmationTemplate(mockOrderData);
  const sellerHtml = sellerOrderNotificationTemplate(mockSellerNotification);

  // Check DOCTYPE
  if (orderHtml.includes('<!DOCTYPE html>')) {
    logTest('Order Template Has DOCTYPE', true, 'Valid HTML5 DOCTYPE');
  } else {
    logTest('Order Template Has DOCTYPE', false, 'Missing DOCTYPE');
  }

  if (sellerHtml.includes('<!DOCTYPE html>')) {
    logTest('Seller Template Has DOCTYPE', true, 'Valid HTML5 DOCTYPE');
  } else {
    logTest('Seller Template Has DOCTYPE', false, 'Missing DOCTYPE');
  }

  // Check basic HTML structure
  const hasHtmlTag = (html: string) => html.includes('<html') && html.includes('</html>');
  const hasBodyTag = (html: string) => html.includes('<body') && html.includes('</body>');
  const hasHeadTag = (html: string) => html.includes('<head>') && html.includes('</head>');

  logTest('Order Template Structure',
    hasHtmlTag(orderHtml) && hasBodyTag(orderHtml) && hasHeadTag(orderHtml),
    'Valid HTML structure'
  );

  logTest('Seller Template Structure',
    hasHtmlTag(sellerHtml) && hasBodyTag(sellerHtml) && hasHeadTag(sellerHtml),
    'Valid HTML structure'
  );

} catch (error: any) {
  logTest('HTML Validity Checks', false, 'Error checking HTML validity', error.message);
}

// TEST 8: Export templates for manual review
console.log('\n📧 TEST 8: Exporting Templates for Manual Review');
try {
  const outputDir = path.join(__dirname, '..', 'test-output');

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Export order confirmation template
  const orderHtml = orderConfirmationTemplate(mockOrderData);
  fs.writeFileSync(path.join(outputDir, 'order-confirmation-test.html'), orderHtml);
  logTest('Export Order Confirmation', true, 'Saved to test-output/order-confirmation-test.html');

  // Export seller notification template
  const sellerHtml = sellerOrderNotificationTemplate(mockSellerNotification);
  fs.writeFileSync(path.join(outputDir, 'seller-notification-test.html'), sellerHtml);
  logTest('Export Seller Notification', true, 'Saved to test-output/seller-notification-test.html');

} catch (error: any) {
  logTest('Export Templates', false, 'Error exporting templates', error.message);
}

// Summary
console.log('\n' + '='.repeat(80));
console.log('📊 TEST SUMMARY');
console.log('='.repeat(80));

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
const total = results.length;
const passRate = ((passed / total) * 100).toFixed(1);

console.log(`\nTotal Tests: ${total}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`Pass Rate: ${passRate}%`);

if (failed > 0) {
  console.log('\n❌ Failed Tests:');
  results.filter(r => !r.passed).forEach(r => {
    console.log(`   - ${r.testName}: ${r.message}`);
    if (r.details) {
      console.log(`     ${r.details}`);
    }
  });
}

console.log('\n' + '='.repeat(80));

// Exit with appropriate code
process.exit(failed > 0 ? 1 : 0);
