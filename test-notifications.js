/**
 * Test Email Notification System
 * 
 * Prerequisites:
 * 1. Update .env with your email credentials:
 *    EMAIL_USER=your-email@gmail.com
 *    EMAIL_PASSWORD=your-app-password (create at https://myaccount.google.com/apppasswords)
 * 
 * 2. Run database migration:
 *    psql -U postgres -d blood_donation -f database/add_notification_preferences.sql
 * 
 * 3. Start the server:
 *    npm run dev
 * 
 * 4. Run this test:
 *    node test-notifications.js
 */

const axios = require("axios");

const BASE_URL = "http://localhost:5000/api";

// Test configuration
const testConfig = {
  donor: {
    user_name: "Test Donor",
    user_email: "donor@test.com", // Change to your email to receive test emails
    password: "Test123!",
    blood_type: "O-",
    location: "Colombo",
    role: "donor",
  },
  recipient: {
    user_name: "Test Recipient",
    user_email: "recipient@test.com", // Change to your email to receive test emails
    password: "Test123!",
    blood_type: "A+",
    location: "Kandy",
    role: "recipient",
  },
};

let donorToken = "";
let recipientToken = "";
let requestId = "";

// Helper function to display test results
const logTest = (testName, success, details = "") => {
  const icon = success ? "✅" : "❌";
  console.log(`${icon} ${testName}`);
  if (details) console.log(`   ${details}`);
  console.log();
};

// Test 1: Welcome Email on Registration
async function testWelcomeEmail() {
  console.log("=== Test 1: Welcome Email on Registration ===\n");
  
  try {
    // Register donor
    const donorResponse = await axios.post(`${BASE_URL}/users/register`, testConfig.donor);
    logTest(
      "Donor Registration & Welcome Email",
      donorResponse.status === 201,
      `Check ${testConfig.donor.user_email} for welcome email`
    );

    // Login donor to get token
    const donorLogin = await axios.post(`${BASE_URL}/users/login`, {
      user_email: testConfig.donor.user_email,
      password: testConfig.donor.password,
    });
    donorToken = donorLogin.data.token;

    // Register recipient
    const recipientResponse = await axios.post(`${BASE_URL}/users/register`, testConfig.recipient);
    logTest(
      "Recipient Registration & Welcome Email",
      recipientResponse.status === 201,
      `Check ${testConfig.recipient.user_email} for welcome email`
    );

    // Login recipient to get token
    const recipientLogin = await axios.post(`${BASE_URL}/users/login`, {
      user_email: testConfig.recipient.user_email,
      password: testConfig.recipient.password,
    });
    recipientToken = recipientLogin.data.token;

    return true;
  } catch (error) {
    if (error.response?.data?.error === "Email already registered") {
      // Users already exist, try logging in
      try {
        const donorLogin = await axios.post(`${BASE_URL}/users/login`, {
          user_email: testConfig.donor.user_email,
          password: testConfig.donor.password,
        });
        donorToken = donorLogin.data.token;

        const recipientLogin = await axios.post(`${BASE_URL}/users/login`, {
          user_email: testConfig.recipient.user_email,
          password: testConfig.recipient.password,
        });
        recipientToken = recipientLogin.data.token;

        logTest("Using Existing Test Accounts", true, "Logged in successfully");
        return true;
      } catch (loginError) {
        logTest("Login Error", false, loginError.message);
        return false;
      }
    }
    logTest("Welcome Email Test", false, error.message);
    return false;
  }
}

// Test 2: Urgent Request Broadcast Email
async function testUrgentRequestEmail() {
  console.log("=== Test 2: Urgent Request Broadcast Email ===\n");
  
  try {
    const requestData = {
      blood_type: "A+",
      units_needed: 2,
      urgency: "critical",
      hospital_name: "National Hospital",
      hospital_address: "Colombo 10",
      city: "Colombo",
      latitude: 6.9271,
      longitude: 79.8612,
      contact_name: "Dr. Silva",
      contact_phone: "0771234567",
      needed_by: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
      description: "Emergency case - immediate blood needed",
    };

    const response = await axios.post(`${BASE_URL}/requests`, requestData, {
      headers: { Authorization: `Bearer ${recipientToken}` },
    });

    requestId = response.data.request.request_id;

    logTest(
      "Critical Request Created & Broadcast Email Sent",
      response.status === 201,
      `Request ID: ${requestId}\nCheck ${testConfig.donor.user_email} for urgent notification`
    );

    return true;
  } catch (error) {
    logTest("Urgent Request Email Test", false, error.response?.data?.error || error.message);
    return false;
  }
}

// Test 3: Donation Interest Email
async function testDonationInterestEmail() {
  console.log("=== Test 3: Donation Interest Email ===\n");
  
  try {
    const response = await axios.post(
      `${BASE_URL}/match/donate/${requestId}`,
      {
        units: 1,
        notes: "I'm available tomorrow morning",
      },
      {
        headers: { Authorization: `Bearer ${donorToken}` },
      }
    );

    logTest(
      "Donation Interest Expressed & Email Sent",
      response.status === 201,
      `Check ${testConfig.recipient.user_email} for donation offer notification`
    );

    return true;
  } catch (error) {
    logTest("Donation Interest Email Test", false, error.response?.data?.error || error.message);
    return false;
  }
}

// Test 4: Donation Confirmation Email
async function testDonationConfirmationEmail() {
  console.log("=== Test 4: Donation Confirmation Email ===\n");
  
  try {
    // Get donation ID
    const donationsResponse = await axios.get(`${BASE_URL}/match/request/${requestId}/donations`, {
      headers: { Authorization: `Bearer ${recipientToken}` },
    });

    const donationId = donationsResponse.data.donations[0].donation_id;

    // Confirm donation
    const response = await axios.put(
      `${BASE_URL}/match/donation/${donationId}`,
      {
        status: "confirmed",
        notes: "Donation confirmed. Please come tomorrow at 9 AM",
      },
      {
        headers: { Authorization: `Bearer ${recipientToken}` },
      }
    );

    logTest(
      "Donation Confirmed & Email Sent to Donor",
      response.status === 200,
      `Check ${testConfig.donor.user_email} for confirmation email`
    );

    return true;
  } catch (error) {
    logTest("Donation Confirmation Email Test", false, error.response?.data?.error || error.message);
    return false;
  }
}

// Test 5: Donation Cancellation Email
async function testDonationCancellationEmail() {
  console.log("=== Test 5: Donation Cancellation Email ===\n");
  
  try {
    // Create another donation to cancel
    const requestData = {
      blood_type: "O-",
      units_needed: 1,
      urgency: "high",
      hospital_name: "Teaching Hospital",
      hospital_address: "Kandy",
      city: "Kandy",
      latitude: 7.2906,
      longitude: 80.6337,
      contact_name: "Dr. Fernando",
      contact_phone: "0817654321",
      needed_by: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      description: "Blood needed for surgery",
    };

    const requestResponse = await axios.post(`${BASE_URL}/requests`, requestData, {
      headers: { Authorization: `Bearer ${recipientToken}` },
    });

    const newRequestId = requestResponse.data.request.request_id;

    // Express interest
    await axios.post(
      `${BASE_URL}/match/donate/${newRequestId}`,
      { units: 1 },
      { headers: { Authorization: `Bearer ${donorToken}` } }
    );

    // Get donation ID
    const donationsResponse = await axios.get(`${BASE_URL}/match/request/${newRequestId}/donations`, {
      headers: { Authorization: `Bearer ${recipientToken}` },
    });

    const donationId = donationsResponse.data.donations[0].donation_id;

    // Cancel donation
    const response = await axios.put(
      `${BASE_URL}/match/donation/${donationId}`,
      {
        status: "cancelled",
        notes: "Blood need fulfilled by another donor",
      },
      {
        headers: { Authorization: `Bearer ${recipientToken}` },
      }
    );

    logTest(
      "Donation Cancelled & Email Sent to Donor",
      response.status === 200,
      `Check ${testConfig.donor.user_email} for cancellation email`
    );

    return true;
  } catch (error) {
    logTest("Donation Cancellation Email Test", false, error.response?.data?.error || error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log("\n🩸 BLOOD DONATION SYSTEM - EMAIL NOTIFICATION TESTS 🩸\n");
  console.log("=" .repeat(60) + "\n");

  const test1 = await testWelcomeEmail();
  if (!test1) {
    console.log("⚠️  Stopping tests - Registration/Login failed\n");
    return;
  }

  await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s between tests

  const test2 = await testUrgentRequestEmail();
  if (!test2) {
    console.log("⚠️  Skipping remaining tests - Request creation failed\n");
    return;
  }

  await new Promise(resolve => setTimeout(resolve, 2000));
  await testDonationInterestEmail();

  await new Promise(resolve => setTimeout(resolve, 2000));
  await testDonationConfirmationEmail();

  await new Promise(resolve => setTimeout(resolve, 2000));
  await testDonationCancellationEmail();

  console.log("=" .repeat(60));
  console.log("\n📧 Check your email inbox for all notification emails!");
  console.log("\nIf emails are not received, verify:");
  console.log("1. EMAIL_USER and EMAIL_PASSWORD are set in .env");
  console.log("2. Gmail App Password is correct (not regular password)");
  console.log("3. Email addresses in test config are valid");
  console.log("4. Check spam/junk folder");
  console.log("\n✨ Test suite completed!\n");
}

// Run tests
runAllTests().catch(error => {
  console.error("Test suite error:", error);
});
