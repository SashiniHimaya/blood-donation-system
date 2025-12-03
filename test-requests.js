// Quick test script to verify the blood request system
// Run with: node test-requests.js

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';
let userId = '';
let requestId = '';

// Test user data
const testUser = {
  name: 'Test Donor',
  email: `test${Date.now()}@example.com`,
  password: 'testPassword123',
  phone: '1234567890',
  blood_type: 'O+',
  role: 'both',
  location: 'New York',
  latitude: 40.7128,
  longitude: -74.0060
};

// Test blood request data
const testRequest = {
  blood_type: 'A+',
  units_needed: 2,
  urgency: 'high',
  hospital_name: 'Test Hospital',
  hospital_address: '123 Test St',
  city: 'New York',
  latitude: 40.7128,
  longitude: -74.0060,
  contact_name: 'Dr. Test',
  contact_phone: '5551234567',
  needed_by: '2025-12-10',
  description: 'Test blood request'
};

async function runTests() {
  console.log('🧪 Starting Blood Donation System Tests...\n');

  try {
    // Test 1: Register User
    console.log('1️⃣  Testing user registration...');
    const registerRes = await axios.post(`${BASE_URL}/users/register`, testUser);
    console.log('✅ Registration successful:', registerRes.data.message);
    userId = registerRes.data.user.user_id;
    console.log(`   User ID: ${userId}\n`);

    // Test 2: Login
    console.log('2️⃣  Testing user login...');
    const loginRes = await axios.post(`${BASE_URL}/users/login`, {
      email: testUser.email,
      password: testUser.password
    });
    console.log('✅ Login successful');
    authToken = loginRes.data.token;
    console.log(`   Token received: ${authToken.substring(0, 20)}...\n`);

    // Test 3: Get User Profile
    console.log('3️⃣  Testing get user profile...');
    const profileRes = await axios.get(`${BASE_URL}/users/profile`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Profile retrieved:', profileRes.data.user.name);
    console.log(`   Blood Type: ${profileRes.data.user.blood_type}\n`);

    // Test 4: Create Blood Request
    console.log('4️⃣  Testing create blood request...');
    const createReqRes = await axios.post(`${BASE_URL}/requests`, testRequest, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Blood request created');
    requestId = createReqRes.data.request.request_id;
    console.log(`   Request ID: ${requestId}`);
    console.log(`   Blood Type Needed: ${createReqRes.data.request.blood_type}`);
    console.log(`   Urgency: ${createReqRes.data.request.urgency}\n`);

    // Test 5: Get All Requests
    console.log('5️⃣  Testing get all requests...');
    const allReqRes = await axios.get(`${BASE_URL}/requests`);
    console.log(`✅ Retrieved ${allReqRes.data.count} blood requests\n`);

    // Test 6: Get Single Request
    console.log('6️⃣  Testing get single request...');
    const singleReqRes = await axios.get(`${BASE_URL}/requests/${requestId}`);
    console.log('✅ Single request retrieved');
    console.log(`   Hospital: ${singleReqRes.data.request.hospital_name}\n`);

    // Test 7: Get My Requests
    console.log('7️⃣  Testing get my requests...');
    const myReqRes = await axios.get(`${BASE_URL}/requests/my/requests`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log(`✅ Retrieved ${myReqRes.data.count} of my requests\n`);

    // Test 8: Update Request
    console.log('8️⃣  Testing update request...');
    const updateReqRes = await axios.put(
      `${BASE_URL}/requests/${requestId}`,
      { urgency: 'critical', units_needed: 3 },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    console.log('✅ Request updated');
    console.log(`   New Urgency: ${updateReqRes.data.request.urgency}`);
    console.log(`   New Units: ${updateReqRes.data.request.units_needed}\n`);

    // Test 9: Filter Requests
    console.log('9️⃣  Testing filter requests by blood type...');
    const filterRes = await axios.get(`${BASE_URL}/requests?blood_type=A%2B&urgency=critical`);
    console.log(`✅ Found ${filterRes.data.count} matching requests\n`);

    // Test 10: Cancel Request
    console.log('🔟 Testing cancel request...');
    const deleteReqRes = await axios.delete(`${BASE_URL}/requests/${requestId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Request cancelled');
    console.log(`   Status: ${deleteReqRes.data.request.status}\n`);

    console.log('✨ All tests passed successfully! ✨\n');
    console.log('📊 Test Summary:');
    console.log('   ✅ User Registration');
    console.log('   ✅ User Login & Authentication');
    console.log('   ✅ User Profile Retrieval');
    console.log('   ✅ Create Blood Request');
    console.log('   ✅ Get All Requests');
    console.log('   ✅ Get Single Request');
    console.log('   ✅ Get My Requests');
    console.log('   ✅ Update Request');
    console.log('   ✅ Filter Requests');
    console.log('   ✅ Cancel Request\n');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error(`   Status: ${error.response.status}`);
    }
  }
}

// Run the tests
console.log('⚠️  Make sure the server is running on http://localhost:5000\n');
runTests();
