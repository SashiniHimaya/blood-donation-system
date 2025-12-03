const pool = require("../db");

// Create a new blood request
const createRequest = async (req, res) => {
  try {
    const {
      blood_type,
      units_needed,
      urgency,
      hospital_name,
      hospital_address,
      city,
      latitude,
      longitude,
      contact_name,
      contact_phone,
      needed_by,
      description,
    } = req.body;

    const requester_id = req.user.userId; // from JWT token

    // Validate required fields
    if (
      !blood_type ||
      !units_needed ||
      !urgency ||
      !hospital_name ||
      !hospital_address ||
      !city ||
      !contact_name ||
      !contact_phone ||
      !needed_by
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Validate blood type
    const validBloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
    if (!validBloodTypes.includes(blood_type)) {
      return res.status(400).json({ error: "Invalid blood type" });
    }

    // Validate urgency
    const validUrgency = ["low", "medium", "high", "critical"];
    if (!validUrgency.includes(urgency)) {
      return res.status(400).json({ error: "Invalid urgency level" });
    }

    const query = `
      INSERT INTO blood_requests (
        requester_id, blood_type, units_needed, urgency,
        hospital_name, hospital_address, city, latitude, longitude,
        contact_name, contact_phone, needed_by, description
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const values = [
      requester_id,
      blood_type,
      units_needed,
      urgency,
      hospital_name,
      hospital_address,
      city,
      latitude || null,
      longitude || null,
      contact_name,
      contact_phone,
      needed_by,
      description || null,
    ];

    const result = await pool.query(query, values);

    res.status(201).json({
      message: "Blood request created successfully",
      request: result.rows[0],
    });
  } catch (error) {
    console.error("Error creating blood request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get all blood requests (with optional filters)
const getAllRequests = async (req, res) => {
  try {
    const { blood_type, urgency, status, city } = req.query;

    let query = `
      SELECT 
        br.*,
        u.name as requester_name,
        u.email as requester_email,
        u.phone as requester_phone
      FROM blood_requests br
      JOIN users u ON br.requester_id = u.user_id
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 1;

    if (blood_type) {
      query += ` AND br.blood_type = $${paramCount}`;
      values.push(blood_type);
      paramCount++;
    }

    if (urgency) {
      query += ` AND br.urgency = $${paramCount}`;
      values.push(urgency);
      paramCount++;
    }

    if (status) {
      query += ` AND br.status = $${paramCount}`;
      values.push(status);
      paramCount++;
    }

    if (city) {
      query += ` AND br.city ILIKE $${paramCount}`;
      values.push(`%${city}%`);
      paramCount++;
    }

    query += ` ORDER BY 
      CASE urgency 
        WHEN 'critical' THEN 1 
        WHEN 'high' THEN 2 
        WHEN 'medium' THEN 3 
        WHEN 'low' THEN 4 
      END,
      br.created_at DESC
    `;

    const result = await pool.query(query, values);

    res.status(200).json({
      count: result.rows.length,
      requests: result.rows,
    });
  } catch (error) {
    console.error("Error fetching blood requests:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get a single blood request by ID
const getRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        br.*,
        u.name as requester_name,
        u.email as requester_email,
        u.phone as requester_phone
      FROM blood_requests br
      JOIN users u ON br.requester_id = u.user_id
      WHERE br.request_id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Blood request not found" });
    }

    res.status(200).json({ request: result.rows[0] });
  } catch (error) {
    console.error("Error fetching blood request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get requests created by the logged-in user
const getMyRequests = async (req, res) => {
  try {
    const requester_id = req.user.userId;

    const query = `
      SELECT * FROM blood_requests
      WHERE requester_id = $1
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query, [requester_id]);

    res.status(200).json({
      count: result.rows.length,
      requests: result.rows,
    });
  } catch (error) {
    console.error("Error fetching user's requests:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update a blood request
const updateRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const requester_id = req.user.userId;

    const {
      blood_type,
      units_needed,
      urgency,
      hospital_name,
      hospital_address,
      city,
      latitude,
      longitude,
      contact_name,
      contact_phone,
      needed_by,
      description,
      status,
    } = req.body;

    // Check if request exists and belongs to user
    const checkQuery = `
      SELECT * FROM blood_requests 
      WHERE request_id = $1 AND requester_id = $2
    `;
    const checkResult = await pool.query(checkQuery, [id, requester_id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ 
        error: "Blood request not found or you don't have permission to update it" 
      });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (blood_type) {
      updates.push(`blood_type = $${paramCount}`);
      values.push(blood_type);
      paramCount++;
    }
    if (units_needed) {
      updates.push(`units_needed = $${paramCount}`);
      values.push(units_needed);
      paramCount++;
    }
    if (urgency) {
      updates.push(`urgency = $${paramCount}`);
      values.push(urgency);
      paramCount++;
    }
    if (hospital_name) {
      updates.push(`hospital_name = $${paramCount}`);
      values.push(hospital_name);
      paramCount++;
    }
    if (hospital_address) {
      updates.push(`hospital_address = $${paramCount}`);
      values.push(hospital_address);
      paramCount++;
    }
    if (city) {
      updates.push(`city = $${paramCount}`);
      values.push(city);
      paramCount++;
    }
    if (latitude !== undefined) {
      updates.push(`latitude = $${paramCount}`);
      values.push(latitude);
      paramCount++;
    }
    if (longitude !== undefined) {
      updates.push(`longitude = $${paramCount}`);
      values.push(longitude);
      paramCount++;
    }
    if (contact_name) {
      updates.push(`contact_name = $${paramCount}`);
      values.push(contact_name);
      paramCount++;
    }
    if (contact_phone) {
      updates.push(`contact_phone = $${paramCount}`);
      values.push(contact_phone);
      paramCount++;
    }
    if (needed_by) {
      updates.push(`needed_by = $${paramCount}`);
      values.push(needed_by);
      paramCount++;
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount}`);
      values.push(description);
      paramCount++;
    }
    if (status) {
      updates.push(`status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    values.push(id);
    const query = `
      UPDATE blood_requests
      SET ${updates.join(", ")}
      WHERE request_id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    res.status(200).json({
      message: "Blood request updated successfully",
      request: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating blood request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete/Cancel a blood request
const deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const requester_id = req.user.userId;

    // Check if request exists and belongs to user
    const checkQuery = `
      SELECT * FROM blood_requests 
      WHERE request_id = $1 AND requester_id = $2
    `;
    const checkResult = await pool.query(checkQuery, [id, requester_id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ 
        error: "Blood request not found or you don't have permission to delete it" 
      });
    }

    // Soft delete by updating status to cancelled
    const query = `
      UPDATE blood_requests
      SET status = 'cancelled'
      WHERE request_id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [id]);

    res.status(200).json({
      message: "Blood request cancelled successfully",
      request: result.rows[0],
    });
  } catch (error) {
    console.error("Error deleting blood request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  createRequest,
  getAllRequests,
  getRequestById,
  getMyRequests,
  updateRequest,
  deleteRequest,
};
