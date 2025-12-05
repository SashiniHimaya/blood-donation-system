const jwt = require("jsonwebtoken");
const pool = require("../db");

/**
 * Middleware to verify admin role
 * Must be used after authMiddleware
 */
const adminMiddleware = async (req, res, next) => {
  try {
    // Check if user is authenticated (should be set by authMiddleware)
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Get user from database to check role
    const query = "SELECT role FROM users WHERE user_id = $1";
    const result = await pool.query(query, [req.user.userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = result.rows[0];

    // Check if user has admin role
    if (user.role !== 'admin') {
      return res.status(403).json({ 
        error: "Access denied. Admin privileges required.",
        required_role: "admin",
        your_role: user.role
      });
    }

    // User is admin, proceed
    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = adminMiddleware;
