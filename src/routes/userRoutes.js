const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const { registerUser, getUsers } = require("../controllers/userController");
const validateRequest = require("../middleware/validateRequest");

// Register a new user 
router.post("/", 
    [
    body("user_name").notEmpty().withMessage("Name is required"),
    body("user_email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("blood_type").isIn(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]).withMessage("Invalid blood type"),
    body("location").notEmpty().withMessage("Location is required"),
    body("role").isIn(["DONOR", "RECIPIENT"]).withMessage("Role must be DONOR or RECIPIENT"),
  ],
  validateRequest,
    registerUser);

// Get all users 
router.get("/", getUsers);

module.exports = router;

