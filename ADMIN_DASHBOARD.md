# 👨‍💼 Admin Dashboard Documentation

## Overview

The Admin Dashboard provides comprehensive system monitoring, user management, and analytics capabilities for Blood Donation System administrators. Admins have full visibility into system operations and can manage users, requests, and donations.

---

## 🔒 Access Control

### Admin Role

Only users with `role = 'admin'` can access admin endpoints. All admin routes require:
1. Valid JWT authentication token
2. Admin role verification

### Creating an Admin User

**Step 1:** Register a normal user
```bash
POST /api/users/register
{
  "user_name": "Admin Name",
  "user_email": "admin@example.com",
  "password": "SecurePassword123",
  "blood_type": "O+",
  "location": "Colombo",
  "role": "donor"
}
```

**Step 2:** Promote to admin via SQL
```bash
psql -U postgres -d blood_donation -c "SELECT promote_to_admin('admin@example.com');"
```

Or directly in psql:
```sql
SELECT promote_to_admin('admin@example.com');
```

**Step 3:** Login to get admin token
```bash
POST /api/users/login
{
  "user_email": "admin@example.com",
  "password": "SecurePassword123"
}
```

---

## 📊 Dashboard & Statistics

### Get System Statistics

Get comprehensive overview of system health and activity.

**Endpoint:** `GET /api/admin/stats`

**Authentication:** Required (Admin only)

**Response:**
```json
{
  "users": {
    "total_users": 150,
    "total_donors": 85,
    "total_recipients": 45,
    "total_both": 15,
    "total_admins": 5,
    "available_donors": 62
  },
  "requests": {
    "total_requests": 75,
    "open_requests": 25,
    "fulfilled_requests": 40,
    "cancelled_requests": 10,
    "critical_requests": 8,
    "high_urgency_requests": 15
  },
  "donations": {
    "total_donations": 120,
    "pending_donations": 15,
    "confirmed_donations": 20,
    "completed_donations": 75,
    "cancelled_donations": 10,
    "total_units_donated": 95
  },
  "blood_type_distribution": [
    {
      "blood_type": "O+",
      "count": 45,
      "available_count": 32
    },
    {
      "blood_type": "A+",
      "count": 38,
      "available_count": 25
    }
    // ... more blood types
  ],
  "recent_activity": {
    "new_users_7d": 12,
    "new_users_30d": 48
  },
  "top_cities": [
    {
      "city": "Colombo",
      "request_count": 35
    },
    {
      "city": "Kandy",
      "request_count": 20
    }
    // ... up to 10 cities
  ],
  "timestamp": "2025-12-05T10:30:00.000Z"
}
```

**Use Cases:**
- Dashboard overview widget
- System health monitoring
- Capacity planning

---

## 👥 User Management

### Get All Users

List all users with filtering and pagination.

**Endpoint:** `GET /api/admin/users`

**Authentication:** Required (Admin only)

**Query Parameters:**
- `role` - Filter by role (`donor`, `recipient`, `both`, `admin`)
- `blood_type` - Filter by blood type (`A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`)
- `is_available` - Filter by availability (`true`, `false`)
- `search` - Search by name, email, or phone
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 20, max: 100)

**Examples:**
```bash
# Get all donors
GET /api/admin/users?role=donor

# Get available O+ donors
GET /api/admin/users?blood_type=O+&is_available=true

# Search users
GET /api/admin/users?search=john

# Pagination
GET /api/admin/users?page=2&limit=50
```

**Response:**
```json
{
  "users": [
    {
      "user_id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "0771234567",
      "blood_type": "O+",
      "role": "donor",
      "location": "Colombo",
      "latitude": 6.9271,
      "longitude": 79.8612,
      "is_available": true,
      "last_donation_date": "2025-10-15",
      "created_at": "2025-01-10T08:00:00.000Z"
    }
    // ... more users
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 8,
    "total_users": 150,
    "per_page": 20
  }
}
```

---

### Get User Details

Get detailed information about a specific user including their activity.

**Endpoint:** `GET /api/admin/users/:userId`

**Authentication:** Required (Admin only)

**Response:**
```json
{
  "user": {
    "user_id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "0771234567",
    "blood_type": "O+",
    "role": "donor",
    "location": "Colombo",
    "latitude": 6.9271,
    "longitude": 79.8612,
    "is_available": true,
    "last_donation_date": "2025-10-15",
    "created_at": "2025-01-10T08:00:00.000Z"
  },
  "requests": [
    // Array of blood requests created by this user (if recipient)
  ],
  "donations": [
    {
      "donation_id": 5,
      "request_id": 3,
      "donor_id": 1,
      "units": 1,
      "status": "completed",
      "donation_date": "2025-10-15",
      "blood_type": "A+",
      "hospital_name": "National Hospital",
      "city": "Colombo",
      "created_at": "2025-10-10T10:00:00.000Z"
    }
    // ... more donations
  ],
  "stats": {
    "total_requests": 0,
    "total_donations": 3,
    "completed_donations": 2
  }
}
```

**Use Cases:**
- User profile investigation
- Activity tracking
- User verification

---

### Update User Status

Suspend or activate a user account.

**Endpoint:** `PUT /api/admin/users/:userId/status`

**Authentication:** Required (Admin only)

**Request Body:**
```json
{
  "is_available": false,
  "notes": "Reason for status change"
}
```

**Response:**
```json
{
  "message": "User status updated successfully",
  "user": {
    "user_id": 1,
    "name": "John Doe",
    "is_available": false
    // ... other user fields
  }
}
```

**Use Cases:**
- Suspend problematic users
- Temporarily disable accounts
- Reactivate suspended users

---

## 🩸 Request Management

### Get All Requests (Admin View)

View all blood requests with advanced filtering.

**Endpoint:** `GET /api/admin/requests`

**Authentication:** Required (Admin only)

**Query Parameters:**
- `blood_type` - Filter by blood type
- `urgency` - Filter by urgency (`low`, `medium`, `high`, `critical`)
- `status` - Filter by status (`open`, `fulfilled`, `cancelled`)
- `city` - Filter by city (partial match)
- `from_date` - Filter requests created after this date
- `to_date` - Filter requests created before this date
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 20)

**Examples:**
```bash
# Get all critical requests
GET /api/admin/requests?urgency=critical

# Get requests in Colombo
GET /api/admin/requests?city=Colombo

# Get requests from last 7 days
GET /api/admin/requests?from_date=2025-11-28

# Combined filters
GET /api/admin/requests?blood_type=O+&urgency=high&status=open
```

**Response:**
```json
{
  "requests": [
    {
      "request_id": 1,
      "requester_id": 5,
      "blood_type": "A+",
      "units_needed": 2,
      "urgency": "critical",
      "hospital_name": "National Hospital",
      "hospital_address": "Colombo 10",
      "city": "Colombo",
      "contact_name": "Dr. Silva",
      "contact_phone": "0771234567",
      "needed_by": "2025-12-10T10:00:00.000Z",
      "status": "open",
      "requester_name": "Jane Smith",
      "requester_email": "jane@example.com",
      "requester_phone": "0779876543",
      "donation_count": 3,
      "completed_donations": 1,
      "created_at": "2025-12-01T08:00:00.000Z"
    }
    // ... more requests
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 4,
    "total_requests": 75,
    "per_page": 20
  }
}
```

---

### Cancel/Delete Request

Admin override to cancel any blood request.

**Endpoint:** `DELETE /api/admin/requests/:requestId`

**Authentication:** Required (Admin only)

**Request Body:**
```json
{
  "reason": "Duplicate request / Invalid information / etc."
}
```

**Response:**
```json
{
  "message": "Request cancelled successfully",
  "request": {
    "request_id": 1,
    "status": "cancelled",
    "description": "Original description [Admin cancelled: Duplicate request]"
    // ... other fields
  }
}
```

**Side Effects:**
- Request status changed to `cancelled`
- All pending donations for this request are cancelled
- Reason appended to request description

---

## 💉 Donation Management

### Get All Donations

View all donation records with filtering.

**Endpoint:** `GET /api/admin/donations`

**Authentication:** Required (Admin only)

**Query Parameters:**
- `status` - Filter by status (`pending`, `confirmed`, `completed`, `cancelled`)
- `from_date` - Filter donations created after this date
- `to_date` - Filter donations created before this date
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 20)

**Examples:**
```bash
# Get all completed donations
GET /api/admin/donations?status=completed

# Get donations from last month
GET /api/admin/donations?from_date=2025-11-01&to_date=2025-11-30

# Pagination
GET /api/admin/donations?page=2&limit=50
```

**Response:**
```json
{
  "donations": [
    {
      "donation_id": 1,
      "request_id": 5,
      "donor_id": 3,
      "units": 1,
      "status": "completed",
      "donation_date": "2025-11-20",
      "notes": "Donation successful",
      "donor_name": "John Doe",
      "donor_email": "john@example.com",
      "donor_blood_type": "O+",
      "requested_blood_type": "A+",
      "hospital_name": "National Hospital",
      "city": "Colombo",
      "requester_name": "Jane Smith",
      "created_at": "2025-11-15T10:00:00.000Z",
      "updated_at": "2025-11-20T14:30:00.000Z"
    }
    // ... more donations
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 6,
    "total_donations": 120,
    "per_page": 20
  }
}
```

---

## 📈 Analytics & Reporting

### Get Donation Analytics

Comprehensive analytics on donation patterns and success rates.

**Endpoint:** `GET /api/admin/analytics/donations`

**Authentication:** Required (Admin only)

**Query Parameters:**
- `period` - Analysis period in days (default: 30)

**Examples:**
```bash
# Last 30 days (default)
GET /api/admin/analytics/donations

# Last 7 days
GET /api/admin/analytics/donations?period=7

# Last 90 days
GET /api/admin/analytics/donations?period=90
```

**Response:**
```json
{
  "period_days": 30,
  "blood_type_stats": [
    {
      "blood_type": "O+",
      "total_donations": 35,
      "completed": 28,
      "pending": 5,
      "total_units": 30
    },
    {
      "blood_type": "A+",
      "total_donations": 25,
      "completed": 20,
      "pending": 3,
      "total_units": 22
    }
    // ... more blood types
  ],
  "timeline": [
    {
      "date": "2025-12-05",
      "total": 5,
      "completed": 3,
      "pending": 2,
      "cancelled": 0
    },
    {
      "date": "2025-12-04",
      "total": 8,
      "completed": 6,
      "pending": 1,
      "cancelled": 1
    }
    // ... daily breakdown
  ],
  "city_stats": [
    {
      "city": "Colombo",
      "total_requests": 45,
      "fulfilled_requests": 38,
      "fulfillment_rate": 84.44
    },
    {
      "city": "Kandy",
      "total_requests": 30,
      "fulfilled_requests": 22,
      "fulfillment_rate": 73.33
    }
    // ... up to 10 cities
  ],
  "top_donors": [
    {
      "user_id": 3,
      "name": "John Doe",
      "blood_type": "O+",
      "location": "Colombo",
      "total_donations": 8,
      "completed_donations": 7,
      "total_units_donated": 7
    }
    // ... up to 10 donors
  ]
}
```

**Use Cases:**
- Monthly/quarterly reports
- Identify high-demand blood types
- Recognize top donors
- Monitor fulfillment rates by city
- Trend analysis

---

## 🔍 Common Admin Workflows

### Dashboard Overview
```javascript
// 1. Get system stats for dashboard
GET /api/admin/stats

// 2. Get recent donations
GET /api/admin/donations?limit=10

// 3. Get critical requests
GET /api/admin/requests?urgency=critical&status=open
```

### User Investigation
```javascript
// 1. Search for user
GET /api/admin/users?search=john

// 2. Get user details
GET /api/admin/users/123

// 3. Review activity (requests + donations in response)
```

### Monthly Reporting
```javascript
// 1. Get 30-day analytics
GET /api/admin/analytics/donations?period=30

// 2. Get all completed donations
GET /api/admin/donations?status=completed&from_date=2025-11-01&to_date=2025-11-30

// 3. Export data (process response)
```

### Request Moderation
```javascript
// 1. Get all open requests
GET /api/admin/requests?status=open

// 2. Review suspicious request
GET /api/admin/requests?requestId=45

// 3. Cancel if needed
DELETE /api/admin/requests/45
Body: { "reason": "Duplicate entry" }
```

---

## 🛡️ Security Considerations

### Access Control
- All admin endpoints protected by `authMiddleware` + `adminMiddleware`
- Returns `403 Forbidden` if user is not admin
- Returns `401 Unauthorized` if no valid token

### Audit Logging
**Recommended implementation (future):**
```javascript
// Log all admin actions
{
  admin_id: 1,
  action: "USER_SUSPENDED",
  target_id: 45,
  reason: "Inappropriate behavior",
  timestamp: "2025-12-05T10:30:00Z"
}
```

### Rate Limiting
**Recommended (future):**
- Limit admin API calls to prevent abuse
- Different limits for read vs write operations

---

## 📊 Dashboard UI Examples

### System Health Widget
```javascript
const stats = await getSystemStats();

// Display:
// Total Users: 150
// Available Donors: 62
// Open Requests: 25
// Success Rate: 85%
```

### Recent Activity Feed
```javascript
const donations = await getAllDonations({ limit: 5 });
const requests = await getAllRequests({ limit: 5 });

// Show chronological list of recent activity
```

### Analytics Charts
```javascript
const analytics = await getDonationAnalytics({ period: 30 });

// Blood Type Distribution Bar Chart
// Timeline Line Chart
// City Fulfillment Rate Pie Chart
```

---

## 🧪 Testing

Run the comprehensive admin test suite:

```bash
node test-admin.js
```

**Tests include:**
- ✅ Access control (403 for non-admins)
- ✅ System statistics
- ✅ User listing with filters
- ✅ User details
- ✅ User status updates
- ✅ Request management
- ✅ Donation tracking
- ✅ Analytics
- ✅ Pagination

---

## 📝 Best Practices

### For Dashboard Development

1. **Caching:** Cache system stats for 5-10 minutes
2. **Pagination:** Always use pagination for large datasets
3. **Filters:** Provide intuitive filter UI for admins
4. **Export:** Add CSV/PDF export for reports
5. **Real-time:** Consider WebSocket for live updates

### For Admin Management

1. **Audit Trail:** Log all admin actions
2. **Confirmation:** Require confirmation for destructive actions
3. **Reason:** Always ask for reason when suspending/cancelling
4. **Notifications:** Notify users of admin actions
5. **Reversibility:** Make actions reversible when possible

---

## 🚀 Future Enhancements

1. **Advanced Analytics**
   - Predictive analysis for blood demand
   - Seasonal trends
   - Geographic heat maps

2. **Bulk Operations**
   - Bulk user import/export
   - Batch status updates
   - Mass notifications

3. **Report Generator**
   - Scheduled reports
   - Custom report builder
   - PDF generation

4. **Activity Logs**
   - Complete audit trail
   - Admin action history
   - User activity timeline

5. **Dashboard Customization**
   - Customizable widgets
   - Personal dashboards
   - Saved filters

---

## 📞 API Endpoint Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | System statistics |
| GET | `/api/admin/users` | List all users |
| GET | `/api/admin/users/:userId` | User details |
| PUT | `/api/admin/users/:userId/status` | Update user status |
| GET | `/api/admin/requests` | List all requests |
| DELETE | `/api/admin/requests/:requestId` | Cancel request |
| GET | `/api/admin/donations` | List all donations |
| GET | `/api/admin/analytics/donations` | Donation analytics |

---

**Last Updated:** December 5, 2025  
**Version:** 1.0.0  
**Requires:** Admin role authentication
