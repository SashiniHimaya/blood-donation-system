const pool = require("../db");
const {
  notifyDonorAboutMatch,
  notifyRequesterAboutDonation,
  notifyDonorAboutConfirmation,
} = require("../services/notificationService");
const {
  isEligibleByDate,
  getEligibilityStatus,
  daysUntilEligible,
} = require("../utils/eligibilityUtils");

// Blood type compatibility matrix
const bloodCompatibility = {
  "A+": ["A+", "A-", "O+", "O-"],
  "A-": ["A-", "O-"],
  "B+": ["B+", "B-", "O+", "O-"],
  "B-": ["B-", "O-"],
  "AB+": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"], // Universal recipient
  "AB-": ["A-", "B-", "AB-", "O-"],
  "O+": ["O+", "O-"],
  "O-": ["O-"], // Universal donor (can only receive O-)
};

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

// Find compatible donors for a specific blood request
const findMatchingDonors = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { maxDistance = 50, limit = 20 } = req.query; // Default 50km radius, max 20 donors

    // Get the blood request details
    const requestQuery = `
      SELECT * FROM blood_requests
      WHERE request_id = $1 AND status = 'open'
    `;
    const requestResult = await pool.query(requestQuery, [requestId]);

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ error: "Blood request not found or not open" });
    }

    const request = requestResult.rows[0];
    const compatibleTypes = bloodCompatibility[request.blood_type];

    if (!compatibleTypes) {
      return res.status(400).json({ error: "Invalid blood type in request" });
    }

    // Find compatible donors
    let donorQuery = `
      SELECT 
        user_id,
        name,
        email,
        phone,
        blood_type,
        location,
        latitude,
        longitude,
        last_donation_date,
        is_available
      FROM users
      WHERE 
        role IN ('donor', 'both')
        AND blood_type = ANY($1)
        AND is_available = true
    `;

    const queryParams = [compatibleTypes];

    // Add distance filter if coordinates are available
    if (request.latitude && request.longitude) {
      donorQuery += ` AND latitude IS NOT NULL AND longitude IS NOT NULL`;
    }

    donorQuery += ` ORDER BY last_donation_date ASC NULLS FIRST`;
    
    if (limit) {
      donorQuery += ` LIMIT $2`;
      queryParams.push(limit);
    }

    const donorsResult = await pool.query(donorQuery, queryParams);
    let donors = donorsResult.rows;

    // Calculate distances if coordinates available
    if (request.latitude && request.longitude) {
      donors = donors
        .map((donor) => {
          if (donor.latitude && donor.longitude) {
            const distance = calculateDistance(
              request.latitude,
              request.longitude,
              donor.latitude,
              donor.longitude
            );
            return { ...donor, distance: Math.round(distance * 10) / 10 }; // Round to 1 decimal
          }
          return { ...donor, distance: null };
        })
        .filter((donor) => donor.distance === null || donor.distance <= maxDistance)
        .sort((a, b) => {
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
        });
    }

    res.status(200).json({
      request: {
        request_id: request.request_id,
        blood_type: request.blood_type,
        units_needed: request.units_needed,
        urgency: request.urgency,
        hospital_name: request.hospital_name,
        city: request.city,
      },
      compatible_blood_types: compatibleTypes,
      total_matches: donors.length,
      donors: donors.map((d) => ({
        user_id: d.user_id,
        name: d.name,
        email: d.email,
        phone: d.phone,
        blood_type: d.blood_type,
        location: d.location,
        distance_km: d.distance,
        last_donation_date: d.last_donation_date,
      })),
    });
  } catch (error) {
    console.error("Error finding matching donors:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Find blood requests that a donor can fulfill
const findRequestsForDonor = async (req, res) => {
  try {
    const donorId = req.user.userId;
    const { maxDistance = 50, urgency, limit = 20 } = req.query;

    // Get donor details
    const donorQuery = `
      SELECT blood_type, latitude, longitude, role
      FROM users
      WHERE user_id = $1 AND role IN ('donor', 'both')
    `;
    const donorResult = await pool.query(donorQuery, [donorId]);

    if (donorResult.rows.length === 0) {
      return res.status(403).json({ error: "User is not registered as a donor" });
    }

    const donor = donorResult.rows[0];

    // Find which blood types can receive from this donor
    const canDonateTo = Object.entries(bloodCompatibility)
      .filter(([_, compatible]) => compatible.includes(donor.blood_type))
      .map(([type]) => type);

    let requestQuery = `
      SELECT 
        br.*,
        u.name as requester_name,
        u.email as requester_email,
        u.phone as requester_phone
      FROM blood_requests br
      JOIN users u ON br.requester_id = u.user_id
      WHERE 
        br.status = 'open'
        AND br.blood_type = ANY($1)
        AND br.needed_by >= CURRENT_DATE
    `;

    const queryParams = [canDonateTo];
    let paramCount = 2;

    if (urgency) {
      requestQuery += ` AND br.urgency = $${paramCount}`;
      queryParams.push(urgency);
      paramCount++;
    }

    requestQuery += ` 
      ORDER BY 
        CASE br.urgency 
          WHEN 'critical' THEN 1 
          WHEN 'high' THEN 2 
          WHEN 'medium' THEN 3 
          WHEN 'low' THEN 4 
        END,
        br.needed_by ASC
    `;

    if (limit) {
      requestQuery += ` LIMIT $${paramCount}`;
      queryParams.push(limit);
    }

    const requestsResult = await pool.query(requestQuery, queryParams);
    let requests = requestsResult.rows;

    // Calculate distances if coordinates available
    if (donor.latitude && donor.longitude) {
      requests = requests
        .map((request) => {
          if (request.latitude && request.longitude) {
            const distance = calculateDistance(
              donor.latitude,
              donor.longitude,
              request.latitude,
              request.longitude
            );
            return { ...request, distance: Math.round(distance * 10) / 10 };
          }
          return { ...request, distance: null };
        })
        .filter((request) => request.distance === null || request.distance <= maxDistance)
        .sort((a, b) => {
          // Sort by urgency first, then distance
          const urgencyOrder = { critical: 1, high: 2, medium: 3, low: 4 };
          const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
          if (urgencyDiff !== 0) return urgencyDiff;
          
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
        });
    }

    res.status(200).json({
      donor_blood_type: donor.blood_type,
      can_donate_to: canDonateTo,
      total_matches: requests.length,
      requests: requests.map((r) => ({
        request_id: r.request_id,
        blood_type: r.blood_type,
        units_needed: r.units_needed,
        urgency: r.urgency,
        hospital_name: r.hospital_name,
        hospital_address: r.hospital_address,
        city: r.city,
        distance_km: r.distance,
        contact_name: r.contact_name,
        contact_phone: r.contact_phone,
        needed_by: r.needed_by,
        description: r.description,
        requester_name: r.requester_name,
        created_at: r.created_at,
      })),
    });
  } catch (error) {
    console.error("Error finding requests for donor:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Express interest in donating to a specific request
const expressDonationInterest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const donorId = req.user.userId;
    const { units = 1, notes } = req.body;

    // Verify donor eligibility
    const donorQuery = `
      SELECT blood_type, role, is_available, last_donation_date, date_of_birth, weight_kg, health_conditions
      FROM users
      WHERE user_id = $1
    `;
    const donorResult = await pool.query(donorQuery, [donorId]);

    if (donorResult.rows.length === 0 || !['donor', 'both'].includes(donorResult.rows[0].role)) {
      return res.status(403).json({ error: "User is not registered as a donor" });
    }

    if (!donorResult.rows[0].is_available) {
      return res.status(400).json({ error: "Donor is currently not available" });
    }

    const donor = donorResult.rows[0];

    // Check donation eligibility (56-day rule)
    const eligibilityStatus = getEligibilityStatus(donor);
    if (!eligibilityStatus.eligible) {
      return res.status(400).json({ 
        error: "You are not currently eligible to donate",
        eligibility: eligibilityStatus,
        days_until_eligible: eligibilityStatus.date_eligibility.days_until_eligible,
        next_eligible_date: eligibilityStatus.date_eligibility.next_eligible_date,
      });
    }

    // Get request details
    const requestQuery = `
      SELECT * FROM blood_requests
      WHERE request_id = $1 AND status IN ('open', 'partially_fulfilled')
    `;
    const requestResult = await pool.query(requestQuery, [requestId]);

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ error: "Blood request not found or already fulfilled" });
    }

    const request = requestResult.rows[0];

    // Check blood type compatibility
    const compatibleTypes = bloodCompatibility[request.blood_type];
    if (!compatibleTypes.includes(donor.blood_type)) {
      return res.status(400).json({ 
        error: `Blood type ${donor.blood_type} is not compatible with ${request.blood_type}` 
      });
    }

    // Check if already expressed interest
    const checkQuery = `
      SELECT * FROM donations
      WHERE request_id = $1 AND donor_id = $2
    `;
    const checkResult = await pool.query(checkQuery, [requestId, donorId]);

    if (checkResult.rows.length > 0) {
      return res.status(400).json({ error: "You have already expressed interest in this request" });
    }

    // Create donation record
    const insertQuery = `
      INSERT INTO donations (request_id, donor_id, units, notes, status)
      VALUES ($1, $2, $3, $4, 'pending')
      RETURNING *
    `;
    const insertResult = await pool.query(insertQuery, [requestId, donorId, units, notes || null]);

    const donation = insertResult.rows[0];

    // Send email notification to requester
    try {
      const donorDetailsQuery = `SELECT * FROM users WHERE user_id = $1`;
      const donorDetailsResult = await pool.query(donorDetailsQuery, [donorId]);
      const donorDetails = donorDetailsResult.rows[0];

      const requesterQuery = `SELECT * FROM users WHERE user_id = $1`;
      const requesterResult = await pool.query(requesterQuery, [request.requester_id]);
      const requester = requesterResult.rows[0];

      if (requester && requester.email) {
        await notifyRequesterAboutDonation(requester, donorDetails, request);
      }
    } catch (emailError) {
      console.error("Error sending email notification:", emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      message: "Donation interest recorded successfully",
      donation: donation,
    });
  } catch (error) {
    console.error("Error expressing donation interest:", error);
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ error: "You have already expressed interest in this request" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get all donation records for a request (for request owner)
const getDonationsForRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.userId;

    // Verify request ownership
    const requestQuery = `
      SELECT requester_id FROM blood_requests
      WHERE request_id = $1
    `;
    const requestResult = await pool.query(requestQuery, [requestId]);

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ error: "Blood request not found" });
    }

    if (requestResult.rows[0].requester_id !== userId) {
      return res.status(403).json({ error: "You don't have permission to view these donations" });
    }

    // Get all donations for this request
    const donationsQuery = `
      SELECT 
        d.*,
        u.name as donor_name,
        u.email as donor_email,
        u.phone as donor_phone,
        u.blood_type as donor_blood_type
      FROM donations d
      JOIN users u ON d.donor_id = u.user_id
      WHERE d.request_id = $1
      ORDER BY 
        CASE d.status
          WHEN 'confirmed' THEN 1
          WHEN 'pending' THEN 2
          WHEN 'completed' THEN 3
          WHEN 'cancelled' THEN 4
        END,
        d.created_at DESC
    `;
    const donationsResult = await pool.query(donationsQuery, [requestId]);

    res.status(200).json({
      request_id: requestId,
      total_donations: donationsResult.rows.length,
      donations: donationsResult.rows,
    });
  } catch (error) {
    console.error("Error getting donations for request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update donation status (confirm, complete, or cancel)
const updateDonationStatus = async (req, res) => {
  try {
    const { donationId } = req.params;
    const { status, donation_date, notes } = req.body;
    const userId = req.user.userId;

    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    // Get donation and request details
    const query = `
      SELECT d.*, br.requester_id
      FROM donations d
      JOIN blood_requests br ON d.request_id = br.request_id
      WHERE d.donation_id = $1
    `;
    const result = await pool.query(query, [donationId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Donation not found" });
    }

    const donation = result.rows[0];

    // Only requester or donor can update
    if (donation.requester_id !== userId && donation.donor_id !== userId) {
      return res.status(403).json({ error: "You don't have permission to update this donation" });
    }

    // Update donation
    const updateQuery = `
      UPDATE donations
      SET status = $1, 
          donation_date = COALESCE($2, donation_date),
          notes = COALESCE($3, notes)
      WHERE donation_id = $4
      RETURNING *
    `;
    const updateResult = await pool.query(updateQuery, [
      status,
      donation_date || null,
      notes || null,
      donationId,
    ]);

    const updatedDonation = updateResult.rows[0];

    // Send email notification to donor if status changed to confirmed or cancelled
    if (status === 'confirmed' || status === 'cancelled') {
      try {
        const donorQuery = `SELECT * FROM users WHERE user_id = $1`;
        const donorResult = await pool.query(donorQuery, [donation.donor_id]);
        const donor = donorResult.rows[0];

        const requestQuery = `SELECT * FROM blood_requests WHERE request_id = $1`;
        const requestResult = await pool.query(requestQuery, [donation.request_id]);
        const request = requestResult.rows[0];

        if (donor && donor.email) {
          await notifyDonorAboutConfirmation(donor, request, status);
        }
      } catch (emailError) {
        console.error("Error sending email notification:", emailError);
        // Don't fail the request if email fails
      }
    }

    res.status(200).json({
      message: "Donation status updated successfully",
      donation: updatedDonation,
    });
  } catch (error) {
    console.error("Error updating donation status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get donor's donation history
const getMyDonations = async (req, res) => {
  try {
    const donorId = req.user.userId;
    const { status } = req.query;

    let query = `
      SELECT 
        d.*,
        br.blood_type,
        br.hospital_name,
        br.city,
        br.urgency,
        u.name as requester_name
      FROM donations d
      JOIN blood_requests br ON d.request_id = br.request_id
      JOIN users u ON br.requester_id = u.user_id
      WHERE d.donor_id = $1
    `;

    const params = [donorId];

    if (status) {
      query += ` AND d.status = $2`;
      params.push(status);
    }

    query += ` ORDER BY d.created_at DESC`;

    const result = await pool.query(query, params);

    res.status(200).json({
      total: result.rows.length,
      donations: result.rows,
    });
  } catch (error) {
    console.error("Error getting donor's donations:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Check donor eligibility
const checkDonorEligibility = async (req, res) => {
  try {
    const donorId = req.user.userId;

    // Get donor information
    const query = `
      SELECT 
        user_id,
        user_name as name,
        blood_type,
        last_donation_date,
        date_of_birth,
        weight_kg,
        health_conditions,
        is_available
      FROM users
      WHERE user_id = $1
    `;
    const result = await pool.query(query, [donorId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const donor = result.rows[0];

    // Get eligibility status
    const eligibility = getEligibilityStatus(donor);

    // Get donation history count
    const historyQuery = `
      SELECT COUNT(*) as total_donations,
             COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_donations,
             MAX(donation_date) as last_completed_donation
      FROM donations
      WHERE donor_id = $1
    `;
    const history = await pool.query(historyQuery, [donorId]);

    res.json({
      donor: {
        id: donor.user_id,
        name: donor.name,
        blood_type: donor.blood_type,
        is_available: donor.is_available,
      },
      eligibility,
      donation_history: history.rows[0],
      message: eligibility.eligible 
        ? '✅ You are eligible to donate blood!'
        : `❌ Not currently eligible. ${eligibility.reasons.join('. ')}`,
    });
  } catch (error) {
    console.error("Error checking donor eligibility:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update health information
const updateHealthInfo = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { date_of_birth, weight_kg, health_conditions } = req.body;

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (date_of_birth) {
      updates.push(`date_of_birth = $${paramCount}`);
      values.push(date_of_birth);
      paramCount++;
    }

    if (weight_kg !== undefined) {
      updates.push(`weight_kg = $${paramCount}`);
      values.push(weight_kg);
      paramCount++;
    }

    if (health_conditions !== undefined) {
      updates.push(`health_conditions = $${paramCount}`);
      values.push(health_conditions);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    values.push(userId);
    const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE user_id = $${paramCount}
      RETURNING user_id, user_name as name, date_of_birth, weight_kg, health_conditions
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get updated eligibility
    const eligibility = getEligibilityStatus(result.rows[0]);

    res.json({
      message: "Health information updated successfully",
      user: result.rows[0],
      eligibility,
    });
  } catch (error) {
    console.error("Error updating health info:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  findMatchingDonors,
  findRequestsForDonor,
  expressDonationInterest,
  getDonationsForRequest,
  updateDonationStatus,
  getMyDonations,
  checkDonorEligibility,
  updateHealthInfo,
};
  expressDonationInterest,
  getDonationsForRequest,
  updateDonationStatus,
  getMyDonations,
};
