const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authMiddleware");
const {
  createRequest,
  getAllRequests,
  getRequestById,
  getMyRequests,
  updateRequest,
  deleteRequest,
} = require("../controllers/requestController");

// Public routes (can view all requests)
router.get("/", getAllRequests);
router.get("/:id", getRequestById);

// Protected routes (require authentication)
router.post("/", authenticateToken, createRequest);
router.get("/my/requests", authenticateToken, getMyRequests);
router.put("/:id", authenticateToken, updateRequest);
router.delete("/:id", authenticateToken, deleteRequest);

module.exports = router;
