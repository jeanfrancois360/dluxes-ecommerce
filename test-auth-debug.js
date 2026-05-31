#!/usr/bin/env node

const axios = require('axios');

const client = axios.create({
  baseURL: 'http://localhost:4000/api/v1',
  headers: { 'Content-Type': 'application/json' },
  validateStatus: () => true, // Don't throw on any status
});

async function testRegistration() {
  console.log('=== Testing Registration ===\n');

  const testData = {
    email: `test_${Date.now()}@test.com`,
    password: 'TestPassword123!@#',
    firstName: 'Test',
    lastName: 'User',
    role: 'BUYER',
  };

  console.log('Request data:', JSON.stringify(testData, null, 2));

  try {
    const response = await client.post('/auth/register', testData);

    console.log('\nResponse status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));

    if (response.status >= 400) {
      console.log('\n❌ Registration failed');
      console.log('Error:', response.data.message);
    } else {
      console.log('\n✅ Registration successful');
    }
  } catch (error) {
    console.error('\n❌ Request error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

async function testLogin() {
  console.log('\n\n=== Testing Login ===\n');

  const loginData = {
    email: 'test@example.com',
    password: 'TestPassword123!@#',
  };

  console.log('Request data:', JSON.stringify(loginData, null, 2));

  try {
    const response = await client.post('/auth/login', loginData);

    console.log('\nResponse status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));

    if (response.status >= 400) {
      console.log('\n❌ Login failed');
      console.log('Error:', response.data.message);
    } else {
      console.log('\n✅ Login successful');
    }
  } catch (error) {
    console.error('\n❌ Request error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

async function main() {
  await testRegistration();
  await testLogin();
}

main();
