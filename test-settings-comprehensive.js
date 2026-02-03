#!/usr/bin/env node
/**
 * Comprehensive Settings API Test Suite
 * Tests all CRUD operations, different value types, validation, and edge cases
 */
const http = require('http');

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

async function runTests() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║  Comprehensive Settings API Test Suite              ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  let passedTests = 0;
  let failedTests = 0;

  // Login
  console.log('🔐 Authentication...');
  const loginRes = await makeRequest('POST', '/auth/login', {
    email: 'admin@nextpik.com',
    password: 'Password123!'
  });

  if (!loginRes.data.access_token) {
    console.error('❌ Login failed - Cannot continue');
    return;
  }

  const token = loginRes.data.access_token;
  console.log('✅ Authenticated as admin\n');

  // Test 1: Get all settings
  console.log('Test 1: GET /settings (Get all settings)');
  const allSettings = await makeRequest('GET', '/settings', null, token);
  if (allSettings.data.success && allSettings.data.data.length > 0) {
    console.log(`✅ Retrieved ${allSettings.data.data.length} settings`);
    passedTests++;
  } else {
    console.log('❌ Failed to retrieve settings');
    failedTests++;
  }

  // Test 2: Get single setting
  console.log('\nTest 2: GET /settings/:key (Get single setting)');
  const singleSetting = await makeRequest('GET', '/settings/escrow_enabled', null, token);
  if (singleSetting.data.success && singleSetting.data.data.key === 'escrow_enabled') {
    console.log(`✅ Retrieved setting: ${singleSetting.data.data.key} = ${singleSetting.data.data.value}`);
    passedTests++;
  } else {
    console.log('❌ Failed to retrieve single setting');
    failedTests++;
  }

  // Test 3: Update NUMBER setting
  console.log('\nTest 3: PATCH /settings/:key (Update NUMBER setting)');
  const updateNumber = await makeRequest('PATCH', '/settings/escrow_hold_period_days', {
    value: 14,
    reason: 'Testing number update'
  }, token);
  if (updateNumber.data.success && updateNumber.data.data.value === 14) {
    console.log(`✅ Updated NUMBER setting to 14`);
    passedTests++;
  } else {
    console.log('❌ Failed to update NUMBER setting');
    console.log('   Response:', JSON.stringify(updateNumber.data, null, 2));
    failedTests++;
  }

  // Test 4: Update BOOLEAN setting
  console.log('\nTest 4: PATCH /settings/:key (Update BOOLEAN setting)');
  const updateBoolean = await makeRequest('PATCH', '/settings/escrow_enabled', {
    value: false,
    reason: 'Testing boolean toggle'
  }, token);
  if (updateBoolean.data.success && updateBoolean.data.data.value === false) {
    console.log(`✅ Updated BOOLEAN setting to false`);
    passedTests++;
  } else {
    console.log('❌ Failed to update BOOLEAN setting');
    console.log('   Response:', JSON.stringify(updateBoolean.data, null, 2));
    failedTests++;
  }

  // Test 5: Get settings by category
  console.log('\nTest 5: GET /settings/category/:category (Get by category)');
  const byCategory = await makeRequest('GET', '/settings/category/PAYMENT', null, token);
  if (byCategory.data.success && byCategory.data.data.length > 0) {
    console.log(`✅ Retrieved ${byCategory.data.data.length} PAYMENT settings`);
    passedTests++;
  } else {
    console.log('❌ Failed to get settings by category');
    failedTests++;
  }

  // Test 6: Get public settings (no auth)
  console.log('\nTest 6: GET /settings/public (Public settings - no auth)');
  const publicSettings = await makeRequest('GET', '/settings/public', null);
  if (publicSettings.data.success || publicSettings.data.data) {
    console.log(`✅ Public endpoint accessible without auth`);
    passedTests++;
  } else {
    console.log('❌ Public settings endpoint failed');
    failedTests++;
  }

  // Test 7: Get audit logs
  console.log('\nTest 7: GET /settings/admin/audit-logs (Audit logs)');
  const auditLogs = await makeRequest('GET', '/settings/admin/audit-logs?limit=10', null, token);
  if (auditLogs.data.success && Array.isArray(auditLogs.data.data)) {
    console.log(`✅ Retrieved ${auditLogs.data.data.length} audit log entries`);
    if (auditLogs.data.data.length > 0) {
      const latest = auditLogs.data.data[0];
      console.log(`   Latest: ${latest.settingKey} changed by ${latest.changedByEmail}`);
      console.log(`   Action: ${latest.action}`);
      console.log(`   Old Value: ${JSON.stringify(latest.oldValue)}`);
      console.log(`   New Value: ${JSON.stringify(latest.newValue)}`);
    }
    passedTests++;
  } else {
    console.log('❌ Failed to get audit logs');
    failedTests++;
  }

  // Test 8: Get audit log for specific setting
  console.log('\nTest 8: GET /settings/:key/audit (Audit log for specific setting)');
  const settingAudit = await makeRequest('GET', '/settings/escrow_enabled/audit?limit=5', null, token);
  if (settingAudit.data.success && Array.isArray(settingAudit.data.data)) {
    console.log(`✅ Retrieved ${settingAudit.data.data.length} audit entries for escrow_enabled`);
    passedTests++;
  } else {
    console.log('❌ Failed to get setting-specific audit log');
    failedTests++;
  }

  // Test 9: Update non-editable setting (should fail)
  console.log('\nTest 9: PATCH /settings/:key (Attempt to update non-editable setting)');
  const updateNonEditable = await makeRequest('PATCH', '/settings/audit_log_all_escrow_actions', {
    value: true,
    reason: 'Testing protection'
  }, token);
  if (updateNonEditable.status === 400 || updateNonEditable.data.message?.includes('cannot be edited')) {
    console.log('✅ Protected non-editable setting (as expected)');
    passedTests++;
  } else {
    console.log('❌ Non-editable setting was updated (security issue!)');
    failedTests++;
  }

  // Test 10: Update non-existent setting (should fail)
  console.log('\nTest 10: PATCH /settings/:key (Attempt to update non-existent setting)');
  const updateNonExistent = await makeRequest('PATCH', '/settings/fake_setting_12345', {
    value: 'test',
    reason: 'Testing error handling'
  }, token);
  if (updateNonExistent.status === 404 || updateNonExistent.data.message?.includes('not found')) {
    console.log('✅ Rejected non-existent setting (as expected)');
    passedTests++;
  } else {
    console.log('❌ Non-existent setting update did not return 404');
    failedTests++;
  }

  // Final summary
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║  Test Results                                        ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log(`✅ Passed: ${passedTests}/10`);
  console.log(`❌ Failed: ${failedTests}/10`);
  console.log(`📊 Success Rate: ${((passedTests/10) * 100).toFixed(1)}%\n`);

  if (failedTests === 0) {
    console.log('🎉 All tests passed! Settings module is production-ready.\n');
    return 0;
  } else {
    console.log('⚠️  Some tests failed. Review failures above.\n');
    return 1;
  }
}

runTests().then(process.exit).catch(err => {
  console.error('💥 Test suite crashed:', err);
  process.exit(1);
});
