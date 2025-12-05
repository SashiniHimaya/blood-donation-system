const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const {
  getSystemStats,
  getAllUsers,
  getUserDetails,
  updateUserStatus,
  getAllRequestsAdmin,
  getAllDonations,
  getDonationAnalytics,
  deleteRequest,
} = require("../controllers/adminController");

// All admin routes require authentication + admin role
router.use(authMiddleware);
router.use(adminMiddleware);

/**
 * Dashboard & Statistics Routes
 */

// GET /api/admin/stats - Get comprehensive system statistics
router.get("/stats", getSystemStats);

// GET /api/admin/analytics/donations - Get donation analytics
router.get("/analytics/donations", getDonationAnalytics);

/**
 * User Management Routes
 */

// GET /api/admin/users - Get all users with filtering and pagination
router.get("/users", getAllUsers);

// GET /api/admin/users/:userId - Get specific user details with activity
router.get("/users/:userId", getUserDetails);

// PUT /api/admin/users/:userId/status - Update user status (suspend/activate)
router.put("/users/:userId/status", updateUserStatus);

/**
 * Request Management Routes
 */

// GET /api/admin/requests - Get all blood requests with advanced filtering
router.get("/requests", getAllRequestsAdmin);

// DELETE /api/admin/requests/:requestId - Cancel a request (admin override)
router.delete("/requests/:requestId", deleteRequest);

/**
 * Donation Management Routes
 */

// GET /api/admin/donations - Get all donations with filtering
router.get("/donations", getAllDonations);

module.exports = router;
