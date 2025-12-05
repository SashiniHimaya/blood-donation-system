const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authMiddleware");
const {
  findMatchingDonors,
  findRequestsForDonor,
  expressDonationInterest,
  getDonationsForRequest,
  updateDonationStatus,
  getMyDonations,
  checkDonorEligibility,
  updateHealthInfo,
} = require("../controllers/matchController");

// Public route - find matching donors for a request
router.get("/request/:requestId/donors", findMatchingDonors);

// Protected routes - require authentication
router.get("/donor/requests", authenticateToken, findRequestsForDonor);
router.post("/donate/:requestId", authenticateToken, expressDonationInterest);
router.get("/request/:requestId/donations", authenticateToken, getDonationsForRequest);
router.put("/donation/:donationId", authenticateToken, updateDonationStatus);
router.get("/my-donations", authenticateToken, getMyDonations);

// Eligibility routes
router.get("/eligibility/check", authenticateToken, checkDonorEligibility);
router.put("/health-info", authenticateToken, updateHealthInfo);

module.exports = router;
