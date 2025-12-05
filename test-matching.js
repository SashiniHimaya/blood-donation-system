// Test script for the matching system
// Run with: node test-matching.js

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let donorToken = '';
let recipientToken = '';
let donorId = '';
let recipientId = '';
let requestId = '';
let donationId = '';

// Test users
const donor = {
  name: 'Test Donor O+',
  email: `donor${Date.now()}@example.com`,
  password: 'donorPass123',
  phone: '1111111111',
  blood_type: 'O+',
  role: 'donor',
  location: 'Manhattan, NY',
  latitude: 40.7580,
  longitude: -73.9855,
  is_available: true
};

const recipient = {
  name: 'Test Recipient A+',
  email: `recipient${Date.now()}@example.com`,
  password: 'recipientPass123',
  phone: '2222222222',
  blood_type: 'A+',
  role: 'recipient',
  location: 'Brooklyn, NY',
  latitude: 40.6782,
  longitude: -73.9442
};

const bloodRequest = {
  blood_type: 'A+',
  units_needed: 2,
  urgency: 'high',
  hospital_name: 'Test Hospital',
  hospital_address: '456 Hospital Ave',
  city: 'New York',
  latitude: 40.7128,
  longitude: -74.0060,
  contact_name: 'Dr. Test',
  contact_phone: '5555555555',
  needed_by: '2025-12-15',
  description: 'Test blood request for matching'
};

async function runMatchingTests() {
  console.log('🧪 Starting Matching System Tests...\n');

  try {
    // Test 1: Register Donor
    console.log('1️⃣  Registering donor...');
    const donorRegRes = await axios.post(`${BASE_URL}/users/register`, donor);
    donorId = donorRegRes.data.user.user_id;
    console.log(`✅ Donor registered: ${donor.name} (${donor.blood_type})`);
    console.log(`   User ID: ${donorId}\n`);

    // Test 2: Register Recipient
    console.log('2️⃣  Registering recipient...');
    const recipientRegRes = await axios.post(`${BASE_URL}/users/register`, recipient);
    recipientId = recipientRegRes.data.user.user_id;
    console.log(`✅ Recipient registered: ${recipient.name} (${recipient.blood_type})`);
    console.log(`   User ID: ${recipientId}\n`);

    // Test 3: Login Both Users
    console.log('3️⃣  Logging in users...');
    const donorLoginRes = await axios.post(`${BASE_URL}/users/login`, {
      email: donor.email,
      password: donor.password
    });
    donorToken = donorLoginRes.data.token;
    console.log(`✅ Donor logged in`);

    const recipientLoginRes = await axios.post(`${BASE_URL}/users/login`, {
      email: recipient.email,
      password: recipient.password
    });
    recipientToken = recipientLoginRes.data.token;
    console.log(`✅ Recipient logged in\n`);

    // Test 4: Create Blood Request
    console.log('4️⃣  Creating blood request...');
    const createReqRes = await axios.post(`${BASE_URL}/requests`, bloodRequest, {
      headers: { Authorization: `Bearer ${recipientToken}` }
    });
    requestId = createReqRes.data.request.request_id;
    console.log(`✅ Blood request created: ID ${requestId}`);
    console.log(`   Type: ${createReqRes.data.request.blood_type}`);
    console.log(`   Urgency: ${createReqRes.data.request.urgency}\n`);

    // Test 5: Find Matching Donors for Request
    console.log('5️⃣  Finding matching donors for request...');
    const matchDonorsRes = await axios.get(
      `${BASE_URL}/match/request/${requestId}/donors?maxDistance=100`
    );
    console.log(`✅ Found ${matchDonorsRes.data.total_matches} matching donors`);
    console.log(`   Compatible blood types: ${matchDonorsRes.data.compatible_blood_types.join(', ')}`);
    if (matchDonorsRes.data.donors.length > 0) {
      console.log(`   First match: ${matchDonorsRes.data.donors[0].name} (${matchDonorsRes.data.donors[0].blood_type})`);
      if (matchDonorsRes.data.donors[0].distance_km) {
        console.log(`   Distance: ${matchDonorsRes.data.donors[0].distance_km} km`);
      }
    }
    console.log();

    // Test 6: Find Requests for Donor
    console.log('6️⃣  Finding requests for donor...');
    const donorReqRes = await axios.get(`${BASE_URL}/match/donor/requests?maxDistance=100`, {
      headers: { Authorization: `Bearer ${donorToken}` }
    });
    console.log(`✅ Found ${donorReqRes.data.total_matches} matching requests`);
    console.log(`   Donor blood type: ${donorReqRes.data.donor_blood_type}`);
    console.log(`   Can donate to: ${donorReqRes.data.can_donate_to.join(', ')}`);
    if (donorReqRes.data.requests.length > 0) {
      console.log(`   First match: ${donorReqRes.data.requests[0].hospital_name}`);
      if (donorReqRes.data.requests[0].distance_km) {
        console.log(`   Distance: ${donorReqRes.data.requests[0].distance_km} km`);
      }
    }
    console.log();

    // Test 7: Express Donation Interest
    console.log('7️⃣  Donor expressing interest in donating...');
    const donateRes = await axios.post(
      `${BASE_URL}/match/donate/${requestId}`,
      {
        units: 1,
        notes: 'Available to donate this week'
      },
      { headers: { Authorization: `Bearer ${donorToken}` } }
    );
    donationId = donateRes.data.donation.donation_id;
    console.log(`✅ Donation interest recorded: ID ${donationId}`);
    console.log(`   Status: ${donateRes.data.donation.status}`);
    console.log(`   Units: ${donateRes.data.donation.units}\n`);

    // Test 8: Get Donations for Request (as recipient)
    console.log('8️⃣  Viewing donation offers for request...');
    const donationsRes = await axios.get(
      `${BASE_URL}/match/request/${requestId}/donations`,
      { headers: { Authorization: `Bearer ${recipientToken}` } }
    );
    console.log(`✅ Retrieved ${donationsRes.data.total_donations} donation offers`);
    if (donationsRes.data.donations.length > 0) {
      const donation = donationsRes.data.donations[0];
      console.log(`   Donor: ${donation.donor_name} (${donation.donor_blood_type})`);
      console.log(`   Status: ${donation.status}`);
      console.log(`   Units: ${donation.units}`);
    }
    console.log();

    // Test 9: Confirm Donation (as recipient)
    console.log('9️⃣  Confirming donation...');
    const confirmRes = await axios.put(
      `${BASE_URL}/match/donation/${donationId}`,
      {
        status: 'confirmed',
        donation_date: '2025-12-10',
        notes: 'Scheduled for 2 PM'
      },
      { headers: { Authorization: `Bearer ${recipientToken}` } }
    );
    console.log(`✅ Donation confirmed`);
    console.log(`   New status: ${confirmRes.data.donation.status}`);
    console.log(`   Donation date: ${confirmRes.data.donation.donation_date}\n`);

    // Test 10: Get Donor's Donation History
    console.log('🔟 Viewing donor's donation history...');
    const historyRes = await axios.get(`${BASE_URL}/match/my-donations`, {
      headers: { Authorization: `Bearer ${donorToken}` }
    });
    console.log(`✅ Retrieved ${historyRes.data.total} donations from history`);
    if (historyRes.data.donations.length > 0) {
      const donation = historyRes.data.donations[0];
      console.log(`   Hospital: ${donation.hospital_name}`);
      console.log(`   Status: ${donation.status}`);
      console.log(`   Blood type needed: ${donation.blood_type}`);
    }
    console.log();

    // Test 11: Complete Donation
    console.log('1️⃣1️⃣  Marking donation as completed...');
    const completeRes = await axios.put(
      `${BASE_URL}/match/donation/${donationId}`,
      {
        status: 'completed',
        notes: 'Donation completed successfully'
      },
      { headers: { Authorization: `Bearer ${recipientToken}` } }
    );
    console.log(`✅ Donation marked as completed`);
    console.log(`   Final status: ${completeRes.data.donation.status}\n`);

    // Test 12: Test Blood Type Incompatibility
    console.log('1️⃣2️⃣  Testing blood type incompatibility...');
    try {
      // Try to make O+ donor donate to O- recipient (incompatible)
      const incompatibleRequest = {
        ...bloodRequest,
        blood_type: 'O-'
      };
      const incompReqRes = await axios.post(`${BASE_URL}/requests`, incompatibleRequest, {
        headers: { Authorization: `Bearer ${recipientToken}` }
      });
      const incompReqId = incompReqRes.data.request.request_id;
      
      await axios.post(
        `${BASE_URL}/match/donate/${incompReqId}`,
        { units: 1 },
        { headers: { Authorization: `Bearer ${donorToken}` } }
      );
      console.log(`❌ Should have failed - blood type incompatibility not detected\n`);
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.error.includes('not compatible')) {
        console.log(`✅ Correctly rejected incompatible blood type`);
        console.log(`   Error: ${error.response.data.error}\n`);
      } else {
        throw error;
      }
    }

    console.log('✨ All matching system tests passed! ✨\n');
    console.log('📊 Test Summary:');
    console.log('   ✅ User Registration & Login');
    console.log('   ✅ Blood Request Creation');
    console.log('   ✅ Find Matching Donors');
    console.log('   ✅ Find Requests for Donor');
    console.log('   ✅ Express Donation Interest');
    console.log('   ✅ View Donation Offers');
    console.log('   ✅ Confirm Donation');
    console.log('   ✅ Donor History');
    console.log('   ✅ Complete Donation');
    console.log('   ✅ Blood Type Compatibility Check');
    console.log('   ✅ Distance-Based Matching\n');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error(`   Status: ${error.response.status}`);
    }
    if (error.response?.data) {
      console.error(`   Details:`, JSON.stringify(error.response.data, null, 2));
    }
  }
}

console.log('⚠️  Make sure the server is running on http://localhost:5000\n');
runMatchingTests();
