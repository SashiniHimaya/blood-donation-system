const pool = require("../db");

/**
 * Get comprehensive system statistics
 */
const getSystemStats = async (req, res) => {
  try {
    // Total users by role
    const usersStatsQuery = `
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'donor' THEN 1 END) as total_donors,
        COUNT(CASE WHEN role = 'recipient' THEN 1 END) as total_recipients,
        COUNT(CASE WHEN role = 'both' THEN 1 END) as total_both,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as total_admins,
        COUNT(CASE WHEN is_available = true AND role IN ('donor', 'both') THEN 1 END) as available_donors
      FROM users
    `;
    const usersStats = await pool.query(usersStatsQuery);

    // Blood requests statistics
    const requestsStatsQuery = `
      SELECT 
        COUNT(*) as total_requests,
        COUNT(CASE WHEN status = 'open' THEN 1 END) as open_requests,
        COUNT(CASE WHEN status = 'fulfilled' THEN 1 END) as fulfilled_requests,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_requests,
        COUNT(CASE WHEN urgency = 'critical' THEN 1 END) as critical_requests,
        COUNT(CASE WHEN urgency = 'high' THEN 1 END) as high_urgency_requests
      FROM blood_requests
    `;
    const requestsStats = await pool.query(requestsStatsQuery);

    // Donation statistics
    const donationsStatsQuery = `
      SELECT 
        COUNT(*) as total_donations,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_donations,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_donations,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_donations,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_donations,
        SUM(CASE WHEN status = 'completed' THEN units ELSE 0 END) as total_units_donated
      FROM donations
    `;
    const donationsStats = await pool.query(donationsStatsQuery);

    // Blood type distribution
    const bloodTypeDistQuery = `
      SELECT 
        blood_type,
        COUNT(*) as count,
        COUNT(CASE WHEN is_available = true AND role IN ('donor', 'both') THEN 1 END) as available_count
      FROM users
      WHERE blood_type IS NOT NULL
      GROUP BY blood_type
      ORDER BY blood_type
    `;
    const bloodTypeDist = await pool.query(bloodTypeDistQuery);

    // Recent activity (last 7 days)
    const recentActivityQuery = `
      SELECT 
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as new_users_7d,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_users_30d
      FROM users
    `;
    const recentActivity = await pool.query(recentActivityQuery);

    // Top cities by requests
    const topCitiesQuery = `
      SELECT 
        city,
        COUNT(*) as request_count
      FROM blood_requests
      WHERE city IS NOT NULL
      GROUP BY city
      ORDER BY request_count DESC
      LIMIT 10
    `;
    const topCities = await pool.query(topCitiesQuery);

    res.json({
      users: usersStats.rows[0],
      requests: requestsStats.rows[0],
      donations: donationsStats.rows[0],
      blood_type_distribution: bloodTypeDist.rows,
      recent_activity: recentActivity.rows[0],
      top_cities: topCities.rows,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Error fetching system stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get all users with filtering and pagination
 */
const getAllUsers = async (req, res) => {
  try {
    const { role, blood_type, is_available, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        user_id,
        user_name as name,
        user_email as email,
        phone,
        blood_type,
        role,
        location,
        latitude,
        longitude,
        is_available,
        last_donation_date,
        created_at
      FROM users
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 1;

    if (role) {
      query += ` AND role = $${paramCount}`;
      values.push(role);
      paramCount++;
    }

    if (blood_type) {
      query += ` AND blood_type = $${paramCount}`;
      values.push(blood_type);
      paramCount++;
    }

    if (is_available !== undefined) {
      query += ` AND is_available = $${paramCount}`;
      values.push(is_available === 'true');
      paramCount++;
    }

    if (search) {
      query += ` AND (user_name ILIKE $${paramCount} OR user_email ILIKE $${paramCount} OR phone ILIKE $${paramCount})`;
      values.push(`%${search}%`);
      paramCount++;
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM (${query}) AS filtered_users`;
    const countResult = await pool.query(countQuery, values);
    const totalUsers = parseInt(countResult.rows[0].count);

    // Add pagination
    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    res.json({
      users: result.rows,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(totalUsers / limit),
        total_users: totalUsers,
        per_page: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get user details with their activity
 */
const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user info
    const userQuery = `SELECT * FROM users WHERE user_id = $1`;
    const userResult = await pool.query(userQuery, [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userResult.rows[0];

    // Get user's requests if they're a recipient
    const requestsQuery = `
      SELECT * FROM blood_requests
      WHERE requester_id = $1
      ORDER BY created_at DESC
    `;
    const requests = await pool.query(requestsQuery, [userId]);

    // Get user's donations if they're a donor
    const donationsQuery = `
      SELECT 
        d.*,
        br.blood_type,
        br.hospital_name,
        br.city
      FROM donations d
      JOIN blood_requests br ON d.request_id = br.request_id
      WHERE d.donor_id = $1
      ORDER BY d.created_at DESC
    `;
    const donations = await pool.query(donationsQuery, [userId]);

    res.json({
      user: user,
      requests: requests.rows,
      donations: donations.rows,
      stats: {
        total_requests: requests.rows.length,
        total_donations: donations.rows.length,
        completed_donations: donations.rows.filter(d => d.status === 'completed').length,
      },
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Update user status (suspend/activate)
 */
const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { is_available, notes } = req.body;

    const query = `
      UPDATE users
      SET is_available = $1
      WHERE user_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [is_available, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: "User status updated successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating user status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get all blood requests with advanced filtering
 */
const getAllRequestsAdmin = async (req, res) => {
  try {
    const { 
      blood_type, 
      urgency, 
      status, 
      city, 
      from_date, 
      to_date,
      page = 1, 
      limit = 20 
    } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        br.*,
        u.user_name as requester_name,
        u.user_email as requester_email,
        u.phone as requester_phone,
        (SELECT COUNT(*) FROM donations WHERE request_id = br.request_id) as donation_count,
        (SELECT COUNT(*) FROM donations WHERE request_id = br.request_id AND status = 'completed') as completed_donations
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

    if (from_date) {
      query += ` AND br.created_at >= $${paramCount}`;
      values.push(from_date);
      paramCount++;
    }

    if (to_date) {
      query += ` AND br.created_at <= $${paramCount}`;
      values.push(to_date);
      paramCount++;
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM (${query}) AS filtered_requests`;
    const countResult = await pool.query(countQuery, values);
    const totalRequests = parseInt(countResult.rows[0].count);

    // Add pagination
    query += ` ORDER BY br.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    res.json({
      requests: result.rows,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(totalRequests / limit),
        total_requests: totalRequests,
        per_page: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching requests:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get all donations with filtering
 */
const getAllDonations = async (req, res) => {
  try {
    const { status, from_date, to_date, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        d.*,
        u.user_name as donor_name,
        u.user_email as donor_email,
        u.blood_type as donor_blood_type,
        br.blood_type as requested_blood_type,
        br.hospital_name,
        br.city,
        req_user.user_name as requester_name
      FROM donations d
      JOIN users u ON d.donor_id = u.user_id
      JOIN blood_requests br ON d.request_id = br.request_id
      JOIN users req_user ON br.requester_id = req_user.user_id
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 1;

    if (status) {
      query += ` AND d.status = $${paramCount}`;
      values.push(status);
      paramCount++;
    }

    if (from_date) {
      query += ` AND d.created_at >= $${paramCount}`;
      values.push(from_date);
      paramCount++;
    }

    if (to_date) {
      query += ` AND d.created_at <= $${paramCount}`;
      values.push(to_date);
      paramCount++;
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM (${query}) AS filtered_donations`;
    const countResult = await pool.query(countQuery, values);
    const totalDonations = parseInt(countResult.rows[0].count);

    // Add pagination
    query += ` ORDER BY d.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    res.json({
      donations: result.rows,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(totalDonations / limit),
        total_donations: totalDonations,
        per_page: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching donations:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get donation analytics
 */
const getDonationAnalytics = async (req, res) => {
  try {
    const { period = '30' } = req.query; // days

    // Donations by blood type
    const bloodTypeQuery = `
      SELECT 
        br.blood_type,
        COUNT(*) as total_donations,
        COUNT(CASE WHEN d.status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN d.status = 'pending' THEN 1 END) as pending,
        SUM(CASE WHEN d.status = 'completed' THEN d.units ELSE 0 END) as total_units
      FROM donations d
      JOIN blood_requests br ON d.request_id = br.request_id
      WHERE d.created_at >= NOW() - INTERVAL '${period} days'
      GROUP BY br.blood_type
      ORDER BY total_donations DESC
    `;
    const bloodTypeStats = await pool.query(bloodTypeQuery);

    // Donations by status over time
    const timelineQuery = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled
      FROM donations
      WHERE created_at >= NOW() - INTERVAL '${period} days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;
    const timeline = await pool.query(timelineQuery);

    // Success rate by city
    const cityStatsQuery = `
      SELECT 
        br.city,
        COUNT(*) as total_requests,
        COUNT(CASE WHEN d.status = 'completed' THEN 1 END) as fulfilled_requests,
        ROUND(
          (COUNT(CASE WHEN d.status = 'completed' THEN 1 END)::NUMERIC / 
          COUNT(DISTINCT d.request_id)::NUMERIC) * 100, 2
        ) as fulfillment_rate
      FROM blood_requests br
      LEFT JOIN donations d ON br.request_id = d.request_id
      WHERE br.created_at >= NOW() - INTERVAL '${period} days'
      GROUP BY br.city
      HAVING COUNT(*) > 0
      ORDER BY fulfillment_rate DESC
      LIMIT 10
    `;
    const cityStats = await pool.query(cityStatsQuery);

    // Top donors
    const topDonorsQuery = `
      SELECT 
        u.user_id,
        u.user_name as name,
        u.blood_type,
        u.location,
        COUNT(*) as total_donations,
        COUNT(CASE WHEN d.status = 'completed' THEN 1 END) as completed_donations,
        SUM(CASE WHEN d.status = 'completed' THEN d.units ELSE 0 END) as total_units_donated
      FROM donations d
      JOIN users u ON d.donor_id = u.user_id
      WHERE d.created_at >= NOW() - INTERVAL '${period} days'
      GROUP BY u.user_id, u.user_name, u.blood_type, u.location
      ORDER BY completed_donations DESC
      LIMIT 10
    `;
    const topDonors = await pool.query(topDonorsQuery);

    res.json({
      period_days: parseInt(period),
      blood_type_stats: bloodTypeStats.rows,
      timeline: timeline.rows,
      city_stats: cityStats.rows,
      top_donors: topDonors.rows,
    });
  } catch (error) {
    console.error("Error fetching donation analytics:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Delete/Cancel a blood request (admin override)
 */
const deleteRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;

    // Update request status to cancelled
    const query = `
      UPDATE blood_requests
      SET status = 'cancelled',
          description = CONCAT(COALESCE(description, ''), ' [Admin cancelled: ', $1, ']')
      WHERE request_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [reason || 'No reason provided', requestId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Request not found" });
    }

    // Cancel all pending donations for this request
    await pool.query(
      `UPDATE donations SET status = 'cancelled' WHERE request_id = $1 AND status = 'pending'`,
      [requestId]
    );

    res.json({
      message: "Request cancelled successfully",
      request: result.rows[0],
    });
  } catch (error) {
    console.error("Error deleting request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getSystemStats,
  getAllUsers,
  getUserDetails,
  updateUserStatus,
  getAllRequestsAdmin,
  getAllDonations,
  getDonationAnalytics,
  deleteRequest,
};
