const axios = require('axios');

async function testUpdate() {
  try {
    // First, login to get a token (you'll need to adjust this based on your auth setup)
    const loginResponse = await axios.post('http://localhost:4000/api/v1/auth/login', {
      email: 'admin@test.com', // Replace with actual admin credentials
      password: 'your-password'
    });
    
    const token = loginResponse.data.access_token;
    
    // Try to update a shipping setting
    const updateResponse = await axios.patch(
      'http://localhost:4000/api/v1/settings/shipping_standard_rate',
      {
        value: 12.99,
        reason: 'Testing update'
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    console.log('Update successful:', updateResponse.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testUpdate();
