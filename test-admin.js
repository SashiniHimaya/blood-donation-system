/**
 * Admin Dashboard Test Suite
 * 
 * Prerequisites:
 * 1. Run database migration:
 *    psql -U postgres -d blood_donation -f database/add_admin_role.sql
 * 
 * 2. Create an admin user:
 *    - Register a normal user first
 *    - Run in psql: SELECT promote_to_admin('admin@test.com');
 * 
 * 3. Start the server:
 *    npm run dev
 * 
 * 4. Run this test:
 *    node test-admin.js
 */

const axios = require("axios");

const BASE_URL = "http://localhost:5000/api";

// Test users
const testConfig = {
  admin: {
    user_name: "Admin User",
    user_email: "admin@test.com",
    password: "Admin123!",
    blood_type: "O+",
    location: "Colombo",
    role: "admin", // Will be set via SQL after registration
  },
  regularUser: {
    user_name: "Regular User",
    user_email: "regular@test.com",
    password: "User123!",
    blood_type: "A+",
    location: "Kandy",
    role: "donor",
  },
};

let adminToken = "";
let regularToken = "";

// Helper function to display test results
const logTest = (testName, success, details = "") => {
  const icon = success ? "✅" : "❌";
  console.log(`${icon} ${testName}`);
  if (details) console.log(`   ${details}`);
  console.log();
};

// Setup: Create admin and regular users
async function setupUsers() {
  console.log("=== Setup: Creating Test Users ===\n");
  
  try {
    // Try to login first (in case users already exist)
    try {
      const adminLogin = await axios.post(`${BASE_URL}/users/login`, {
        user_email: testConfig.admin.user_email,
        password: testConfig.admin.password,
      });
      adminToken = adminLogin.data.token;
      logTest("Admin Login", true, "Using existing admin account");
    } catch {
      // Register admin
      await axios.post(`${BASE_URL}/users/register`, testConfig.admin);
      const adminLogin = await axios.post(`${BASE_URL}/users/login`, {
        user_email: testConfig.admin.user_email,
        password: testConfig.admin.password,
      });
      adminToken = adminLogin.data.token;
      logTest("Admin Registration", true, "⚠️  IMPORTANT: Run this SQL to promote to admin:");
      console.log(`   psql -U postgres -d blood_donation -c "SELECT promote_to_admin('${testConfig.admin.user_email}');"\n`);
    }

    // Try to login regular user
    try {
      const regularLogin = await axios.post(`${BASE_URL}/users/login`, {
        user_email: testConfig.regularUser.user_email,
        password: testConfig.regularUser.password,
      });
      regularToken = regularLogin.data.token;
      logTest("Regular User Login", true, "Using existing user account");
    } catch {
      // Register regular user
      await axios.post(`${BASE_URL}/users/register`, testConfig.regularUser);
      const regularLogin = await axios.post(`${BASE_URL}/users/login`, {
        user_email: testConfig.regularUser.user_email,
        password: testConfig.regularUser.password,
      });
      regularToken = regularLogin.data.token;
      logTest("Regular User Registration", true);
    }

    return true;
  } catch (error) {
    logTest("User Setup", false, error.message);
    return false;
  }
}

// Test 1: Access Control - Regular user cannot access admin endpoints
async function testAccessControl() {
  console.log("=== Test 1: Access Control ===\n");
  
  try {
    await axios.get(`${BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${regularToken}` },
    });
    logTest("Access Denied for Regular User", false, "Regular user was able to access admin endpoint!");
  } catch (error) {
    if (error.response?.status === 403) {
      logTest("Access Denied for Regular User", true, "403 Forbidden - Access correctly denied");
    } else {
      logTest("Access Denied for Regular User", false, `Unexpected error: ${error.response?.status}`);
    }
  }
}

// Test 2: Get System Statistics
async function testSystemStats() {
  console.log("=== Test 2: System Statistics ===\n");
  
  try {
    const response = await axios.get(`${BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    const stats = response.data;
    const hasRequiredData = stats.users && stats.requests && stats.donations && stats.blood_type_distribution;

    logTest(
      "Get System Statistics",
      hasRequiredData,
      `Users: ${stats.users?.total_users || 0}, Requests: ${stats.requests?.total_requests || 0}, Donations: ${stats.donations?.total_donations || 0}`
    );

    if (stats.blood_type_distribution?.length > 0) {
      console.log("   Blood Type Distribution:");
      stats.blood_type_distribution.forEach(bt => {
        console.log(`     ${bt.blood_type}: ${bt.count} users (${bt.available_count} available)`);
      });
      console.log();
    }

    return true;
  } catch (error) {
    logTest("Get System Statistics", false, error.response?.data?.error || error.message);
    return false;
  }
}

// Test 3: Get All Users with Filtering
async function testGetAllUsers() {
  console.log("=== Test 3: User Management ===\n");
  
  try {
    // Get all users
    const allUsers = await axios.get(`${BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    logTest(
      "Get All Users",
      allUsers.data.users.length > 0,
      `Found ${allUsers.data.users.length} users`
    );

    // Filter by role
    const donors = await axios.get(`${BASE_URL}/admin/users?role=donor`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    logTest(
      "Filter Users by Role",
      donors.status === 200,
      `Found ${donors.data.users.length} donors`
    );

    // Search users
    const search = await axios.get(`${BASE_URL}/admin/users?search=test`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    logTest(
      "Search Users",
      search.status === 200,
      `Found ${search.data.users.length} users matching 'test'`
    );

    return true;
  } catch (error) {
    logTest("User Management", false, error.response?.data?.error || error.message);
    return false;
  }
}

// Test 4: Get User Details
async function testGetUserDetails() {
  console.log("=== Test 4: User Details ===\n");
  
  try {
    // Get list of users first
    const users = await axios.get(`${BASE_URL}/admin/users?limit=1`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    if (users.data.users.length === 0) {
      logTest("Get User Details", false, "No users found to test");
      return false;
    }

    const userId = users.data.users[0].user_id;

    // Get user details
    const userDetails = await axios.get(`${BASE_URL}/admin/users/${userId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    const hasDetails = userDetails.data.user && 
                       userDetails.data.requests !== undefined && 
                       userDetails.data.donations !== undefined;

    logTest(
      "Get User Details",
      hasDetails,
      `User: ${userDetails.data.user?.name}, Requests: ${userDetails.data.requests?.length || 0}, Donations: ${userDetails.data.donations?.length || 0}`
    );

    return true;
  } catch (error) {
    logTest("Get User Details", false, error.response?.data?.error || error.message);
    return false;
  }
}

// Test 5: Update User Status
async function testUpdateUserStatus() {
  console.log("=== Test 5: Update User Status ===\n");
  
  try {
    // Get a user
    const users = await axios.get(`${BASE_URL}/admin/users?limit=1`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    if (users.data.users.length === 0) {
      logTest("Update User Status", false, "No users found to test");
      return false;
    }

    const userId = users.data.users[0].user_id;
    const currentStatus = users.data.users[0].is_available;

    // Toggle user status
    const response = await axios.put(
      `${BASE_URL}/admin/users/${userId}/status`,
      { is_available: !currentStatus },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    logTest(
      "Update User Status",
      response.data.user.is_available === !currentStatus,
      `Changed availability from ${currentStatus} to ${!currentStatus}`
    );

    // Restore original status
    await axios.put(
      `${BASE_URL}/admin/users/${userId}/status`,
      { is_available: currentStatus },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    return true;
  } catch (error) {
    logTest("Update User Status", false, error.response?.data?.error || error.message);
    return false;
  }
}

// Test 6: Get All Requests (Admin View)
async function testGetAllRequests() {
  console.log("=== Test 6: Request Management ===\n");
  
  try {
    const response = await axios.get(`${BASE_URL}/admin/requests`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    logTest(
      "Get All Requests",
      response.status === 200,
      `Found ${response.data.requests.length} requests (Total: ${response.data.pagination.total_requests})`
    );

    // Test filtering by urgency
    const criticalRequests = await axios.get(`${BASE_URL}/admin/requests?urgency=critical`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    logTest(
      "Filter by Urgency",
      criticalRequests.status === 200,
      `Found ${criticalRequests.data.requests.length} critical requests`
    );

    return true;
  } catch (error) {
    logTest("Request Management", false, error.response?.data?.error || error.message);
    return false;
  }
}

// Test 7: Get All Donations
async function testGetAllDonations() {
  console.log("=== Test 7: Donation Management ===\n");
  
  try {
    const response = await axios.get(`${BASE_URL}/admin/donations`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    logTest(
      "Get All Donations",
      response.status === 200,
      `Found ${response.data.donations.length} donations (Total: ${response.data.pagination.total_donations})`
    );

    // Test filtering by status
    const completedDonations = await axios.get(`${BASE_URL}/admin/donations?status=completed`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    logTest(
      "Filter by Status",
      completedDonations.status === 200,
      `Found ${completedDonations.data.donations.length} completed donations`
    );

    return true;
  } catch (error) {
    logTest("Donation Management", false, error.response?.data?.error || error.message);
    return false;
  }
}

// Test 8: Get Donation Analytics
async function testDonationAnalytics() {
  console.log("=== Test 8: Donation Analytics ===\n");
  
  try {
    const response = await axios.get(`${BASE_URL}/admin/analytics/donations?period=30`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    const analytics = response.data;
    const hasAnalytics = analytics.blood_type_stats && 
                         analytics.timeline && 
                         analytics.city_stats && 
                         analytics.top_donors;

    logTest(
      "Get Donation Analytics",
      hasAnalytics,
      `Period: ${analytics.period_days} days`
    );

    if (analytics.blood_type_stats?.length > 0) {
      console.log("   Donations by Blood Type:");
      analytics.blood_type_stats.slice(0, 3).forEach(bt => {
        console.log(`     ${bt.blood_type}: ${bt.total_donations} donations (${bt.completed} completed)`);
      });
      console.log();
    }

    if (analytics.top_donors?.length > 0) {
      console.log("   Top Donors:");
      analytics.top_donors.slice(0, 3).forEach((donor, idx) => {
        console.log(`     ${idx + 1}. ${donor.name} - ${donor.completed_donations} donations (${donor.total_units_donated} units)`);
      });
      console.log();
    }

    return true;
  } catch (error) {
    logTest("Donation Analytics", false, error.response?.data?.error || error.message);
    return false;
  }
}

// Test 9: Pagination
async function testPagination() {
  console.log("=== Test 9: Pagination ===\n");
  
  try {
    // Get first page
    const page1 = await axios.get(`${BASE_URL}/admin/users?page=1&limit=2`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    // Get second page
    const page2 = await axios.get(`${BASE_URL}/admin/users?page=2&limit=2`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    const hasValidPagination = page1.data.pagination && 
                               page1.data.pagination.current_page === 1 &&
                               page2.data.pagination.current_page === 2;

    logTest(
      "Pagination Working",
      hasValidPagination,
      `Page 1: ${page1.data.users.length} users, Page 2: ${page2.data.users.length} users`
    );

    return true;
  } catch (error) {
    logTest("Pagination", false, error.response?.data?.error || error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log("\n👨‍💼 ADMIN DASHBOARD - COMPREHENSIVE TEST SUITE 👨‍💼\n");
  console.log("=" .repeat(60) + "\n");

  const setupSuccess = await setupUsers();
  if (!setupSuccess) {
    console.log("⚠️  Stopping tests - User setup failed\n");
    return;
  }

  await new Promise(resolve => setTimeout(resolve, 1000));

  await testAccessControl();
  await new Promise(resolve => setTimeout(resolve, 1000));

  await testSystemStats();
  await new Promise(resolve => setTimeout(resolve, 1000));

  await testGetAllUsers();
  await new Promise(resolve => setTimeout(resolve, 1000));

  await testGetUserDetails();
  await new Promise(resolve => setTimeout(resolve, 1000));

  await testUpdateUserStatus();
  await new Promise(resolve => setTimeout(resolve, 1000));

  await testGetAllRequests();
  await new Promise(resolve => setTimeout(resolve, 1000));

  await testGetAllDonations();
  await new Promise(resolve => setTimeout(resolve, 1000));

  await testDonationAnalytics();
  await new Promise(resolve => setTimeout(resolve, 1000));

  await testPagination();

  console.log("=" .repeat(60));
  console.log("\n✨ Admin Dashboard Test Suite Completed!\n");
  console.log("📊 Admin Features Tested:");
  console.log("   ✅ Access control & permissions");
  console.log("   ✅ System statistics dashboard");
  console.log("   ✅ User management & filtering");
  console.log("   ✅ User details & activity tracking");
  console.log("   ✅ User status updates");
  console.log("   ✅ Request management & monitoring");
  console.log("   ✅ Donation tracking");
  console.log("   ✅ Analytics & reporting");
  console.log("   ✅ Pagination\n");
}

// Run tests
runAllTests().catch(error => {
  console.error("Test suite error:", error);
});
