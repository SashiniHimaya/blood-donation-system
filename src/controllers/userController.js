const pool = require("../db");
const bcrypt = require("bcrypt");


// Register User
const registerUser = async (req, res) => {
  try {
    const { user_name, user_email, password, blood_type, location, role } = req.body;

    // 1. Check if email already exists
    const existing = await pool.query("SELECT * FROM users WHERE user_email = $1", [user_email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    //3. Insert into database
    const result = await pool.query(
      `INSERT INTO users (user_name, user_email, password, blood_type, location, role)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [user_name, user_email, hashedPassword, blood_type, location, role]
    );

    res.status(201).json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Database error" });
  }

};

// Get Users
const getUsers = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users ORDER BY user_id ASC");
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Database error" });
  }
};

module.exports = { registerUser, getUsers };
