#!/usr/bin/env node
/**
 * Fix: Create missing escrow_enabled setting in lowercase 'payment' category
 */
const http = require('http');

function makeRequest(method, path, data, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: `/api/v1${path}`,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function main() {
  console.log('🔧 Fixing missing escrow_enabled setting...\n');

  // Login
  const loginRes = await makeRequest('POST', '/auth/login', {
    email: 'admin@nextpik.com',
    password: 'Password123!'
  });

  if (!loginRes.data.access_token) {
    console.error('❌ Login failed');
    process.exit(1);
  }

  const token = loginRes.data.access_token;
  console.log('✅ Logged in as admin\n');

  // Check if escrow_enabled exists in lowercase payment category
  console.log('Checking for escrow_enabled in payment category...');
  const checkRes = await makeRequest('GET', '/settings/category/payment', null, token);

  const hasEscrowEnabled = checkRes.data.data?.some(s => s.key === 'escrow_enabled');

  if (hasEscrowEnabled) {
    console.log('✅ Setting already exists!\n');

    // Update it to true
    console.log('Enabling escrow system...');
    const updateRes = await makeRequest('PATCH', '/settings/escrow_enabled', {
      value: true,
      reason: 'Enabling escrow for secure payments'
    }, token);

    if (updateRes.data.success) {
      console.log('✅ Escrow system enabled!\n');
    } else {
      console.error('❌ Failed to enable:', updateRes.data.message);
    }
  } else {
    console.log('⚠️  Setting does not exist, creating it...\n');

    // Create the setting
    const createRes = await makeRequest('POST', '/settings', {
      key: 'escrow_enabled',
      category: 'payment',
      value: true,
      valueType: 'BOOLEAN',
      label: 'Enable Escrow (Default Payment Model)',
      description: 'When enabled, all payments go through escrow and funds are held until delivery confirmation.',
      isPublic: false,
      isEditable: true,
      requiresRestart: false,
      defaultValue: true
    }, token);

    if (createRes.data.success) {
      console.log('✅ Setting created successfully!\n');
    } else {
      console.error('❌ Failed to create:', createRes.data.message);
      console.error('Response:', JSON.stringify(createRes.data, null, 2));
    }
  }

  // Also update the uppercase PAYMENT category to true
  console.log('\nUpdating uppercase PAYMENT category escrow_enabled...');
  const updateUpperRes = await makeRequest('GET', '/settings', null, token);

  const upperCaseSetting = updateUpperRes.data.data?.find(s =>
    s.key === 'escrow_enabled' && s.category === 'PAYMENT'
  );

  if (upperCaseSetting) {
    const enableRes = await makeRequest('PATCH', '/settings/escrow_enabled', {
      value: true,
      reason: 'Enabling escrow system'
    }, token);
    console.log('✅ Uppercase PAYMENT escrow_enabled updated\n');
  }

  console.log('🎉 Done! Escrow system is now enabled.');
  console.log('\nYou can now:');
  console.log('1. Refresh the admin settings page');
  console.log('2. The "Critical Settings Missing" warning should be gone');
  console.log('3. The "SAVE CHANGES" button should work');
}

main().catch(console.error);
