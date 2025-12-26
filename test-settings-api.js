#!/usr/bin/env node
const http = require('http');

// Function to make HTTP requests
function makeRequest(method, path, data, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: `/api/v1${path}`,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
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
  console.log('=== Testing Settings API ===\n');

  // Step 1: Login as admin
  console.log('1. Logging in as admin...');
  const loginRes = await makeRequest('POST', '/auth/login', {
    email: 'admin@nextpik.com',
    password: 'Password123!'
  });

  if (!loginRes.data.access_token) {
    console.error('❌ Login failed:', loginRes.data.message || 'No access token returned');
    console.error('   Full response:', JSON.stringify(loginRes.data, null, 2));
    process.exit(1);
  }

  const token = loginRes.data.access_token;
  console.log('✅ Login successful');
  console.log(`   Token: ${token.substring(0, 30)}...`);

  // Step 2: Get all settings
  console.log('\n2. Fetching all settings...');
  const settingsRes = await makeRequest('GET', '/settings', null, token);

  if (settingsRes.data.success) {
    console.log(`✅ Retrieved ${settingsRes.data.data.length} settings`);
    console.log('   Sample settings:');
    settingsRes.data.data.slice(0, 3).forEach(s => {
      console.log(`     - ${s.key}: ${JSON.stringify(s.value)}`);
    });
  } else {
    console.error('❌ Failed to get settings:', settingsRes.data.message);
  }

  // Step 3: Update a setting
  console.log('\n3. Testing setting update...');
  const updateRes = await makeRequest('PATCH', '/settings/escrow_hold_period_days', {
    value: 7,
    reason: 'Testing settings update functionality'
  }, token);

  if (updateRes.data.success) {
    console.log('✅ Setting updated successfully');
    console.log(`   New value: ${updateRes.data.data.value}`);
  } else {
    console.error('❌ Failed to update setting:', updateRes.data.message);
    console.error('   Full response:', JSON.stringify(updateRes.data, null, 2));
  }

  // Step 4: Get audit logs
  console.log('\n4. Fetching audit logs...');
  const auditRes = await makeRequest('GET', '/settings/admin/audit-logs?limit=5', null, token);

  if (auditRes.data.success) {
    console.log(`✅ Retrieved ${auditRes.data.data.length} audit log entries`);
    if (auditRes.data.data.length > 0) {
      const latest = auditRes.data.data[0];
      console.log(`   Latest change: ${latest.settingKey} by ${latest.changedByEmail}`);
    }
  } else {
    console.error('❌ Failed to get audit logs:', auditRes.data.message);
  }

  console.log('\n=== Test Complete ===');
}

main().catch(console.error);
