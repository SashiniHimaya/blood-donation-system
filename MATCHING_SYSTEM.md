# Matching System API Documentation

## Blood Type Compatibility

The system uses the following compatibility matrix:

| Recipient | Can Receive From |
|-----------|------------------|
| A+ | A+, A-, O+, O- |
| A- | A-, O- |
| B+ | B+, B-, O+, O- |
| B- | B-, O- |
| AB+ | A+, A-, B+, B-, AB+, AB-, O+, O- (Universal Recipient) |
| AB- | A-, B-, AB-, O- |
| O+ | O+, O- |
| O- | O- (Universal Donor to others) |

---

## 🔗 Matching Endpoints

### 1. Find Matching Donors for a Request
**GET** `/api/match/request/:requestId/donors`

Find all compatible donors for a specific blood request.

**Query Parameters:**
- `maxDistance` (optional): Maximum distance in km (default: 50)
- `limit` (optional): Maximum number of donors to return (default: 20)

**Example:**
```bash
GET /api/match/request/1/donors?maxDistance=30&limit=10
```

**Response:** `200 OK`
```json
{
  "request": {
    "request_id": 1,
    "blood_type": "A+",
    "units_needed": 2,
    "urgency": "high",
    "hospital_name": "City Hospital",
    "city": "New York"
  },
  "compatible_blood_types": ["A+", "A-", "O+", "O-"],
  "total_matches": 5,
  "donors": [
    {
      "user_id": 10,
      "name": "John Donor",
      "email": "john@donor.com",
      "phone": "1234567890",
      "blood_type": "O+",
      "location": "Manhattan, NY",
      "distance_km": 3.5,
      "last_donation_date": "2025-09-15"
    }
  ]
}
```

---

### 2. Find Blood Requests for a Donor
**GET** `/api/match/donor/requests`

Find all blood requests that a logged-in donor can fulfill.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `maxDistance` (optional): Maximum distance in km (default: 50)
- `urgency` (optional): Filter by urgency (low, medium, high, critical)
- `limit` (optional): Maximum number of requests (default: 20)

**Example:**
```bash
GET /api/match/donor/requests?maxDistance=25&urgency=high
```

**Response:** `200 OK`
```json
{
  "donor_blood_type": "O-",
  "can_donate_to": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
  "total_matches": 3,
  "requests": [
    {
      "request_id": 1,
      "blood_type": "A+",
      "units_needed": 2,
      "urgency": "high",
      "hospital_name": "City Hospital",
      "hospital_address": "123 Main St",
      "city": "New York",
      "distance_km": 5.2,
      "contact_name": "Dr. Smith",
      "contact_phone": "5551234567",
      "needed_by": "2025-12-10",
      "description": "Urgent surgery",
      "requester_name": "Jane Recipient",
      "created_at": "2025-12-05T10:00:00.000Z"
    }
  ]
}
```

---

### 3. Express Interest in Donating
**POST** `/api/match/donate/:requestId`

Express interest in donating to a specific blood request.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "units": 1,
  "notes": "Available to donate this weekend"
}
```

**Response:** `201 Created`
```json
{
  "message": "Donation interest recorded successfully",
  "donation": {
    "donation_id": 1,
    "request_id": 1,
    "donor_id": 10,
    "units": 1,
    "status": "pending",
    "notes": "Available to donate this weekend",
    "created_at": "2025-12-05T14:30:00.000Z"
  }
}
```

**Error Responses:**
- `400`: Already expressed interest, blood type incompatible, or donor not available
- `403`: User is not registered as a donor
- `404`: Blood request not found or already fulfilled

---

### 4. Get Donations for a Request
**GET** `/api/match/request/:requestId/donations`

Get all donation offers for a specific request (only request owner can view).

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "request_id": 1,
  "total_donations": 3,
  "donations": [
    {
      "donation_id": 1,
      "donor_id": 10,
      "units": 1,
      "status": "confirmed",
      "donation_date": "2025-12-07",
      "notes": "Available this weekend",
      "donor_name": "John Donor",
      "donor_email": "john@donor.com",
      "donor_phone": "1234567890",
      "donor_blood_type": "O+",
      "created_at": "2025-12-05T14:30:00.000Z"
    }
  ]
}
```

---

### 5. Update Donation Status
**PUT** `/api/match/donation/:donationId`

Update the status of a donation (both donor and requester can update).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "status": "confirmed",
  "donation_date": "2025-12-07",
  "notes": "Scheduled for 2 PM"
}
```

**Valid Status Values:**
- `pending` - Initial state
- `confirmed` - Requester confirmed the donation
- `completed` - Donation has been completed
- `cancelled` - Donation was cancelled

**Response:** `200 OK`
```json
{
  "message": "Donation status updated successfully",
  "donation": {
    "donation_id": 1,
    "request_id": 1,
    "donor_id": 10,
    "units": 1,
    "status": "confirmed",
    "donation_date": "2025-12-07",
    "notes": "Scheduled for 2 PM",
    "updated_at": "2025-12-05T15:00:00.000Z"
  }
}
```

---

### 6. Get My Donation History
**GET** `/api/match/my-donations`

Get all donations by the logged-in donor.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `status` (optional): Filter by status (pending, confirmed, completed, cancelled)

**Example:**
```bash
GET /api/match/my-donations?status=completed
```

**Response:** `200 OK`
```json
{
  "total": 5,
  "donations": [
    {
      "donation_id": 1,
      "request_id": 1,
      "units": 1,
      "status": "completed",
      "donation_date": "2025-12-01",
      "blood_type": "A+",
      "hospital_name": "City Hospital",
      "city": "New York",
      "urgency": "high",
      "requester_name": "Jane Recipient",
      "created_at": "2025-11-28T10:00:00.000Z"
    }
  ]
}
```

---

## 🎯 Workflow Examples

### For Donors

1. **Find requests you can help with:**
   ```bash
   GET /api/match/donor/requests?maxDistance=30&urgency=critical
   ```

2. **Express interest in donating:**
   ```bash
   POST /api/match/donate/5
   {
     "units": 1,
     "notes": "Available tomorrow"
   }
   ```

3. **View your donation history:**
   ```bash
   GET /api/match/my-donations
   ```

### For Recipients/Requesters

1. **Create a blood request:**
   ```bash
   POST /api/requests
   { ...request details... }
   ```

2. **Find matching donors:**
   ```bash
   GET /api/match/request/1/donors?maxDistance=50
   ```

3. **View donation offers:**
   ```bash
   GET /api/match/request/1/donations
   ```

4. **Confirm a donation:**
   ```bash
   PUT /api/match/donation/3
   {
     "status": "confirmed",
     "donation_date": "2025-12-08"
   }
   ```

---

## 📏 Distance Calculation

The system uses the **Haversine formula** to calculate distances between donors and requests:
- Distances are in kilometers
- Rounded to 1 decimal place
- Requires latitude and longitude for both donor and request
- Default maximum distance: 50 km

---

## 🔔 Donation Status Flow

```
pending → confirmed → completed
   ↓
cancelled
```

- **pending**: Donor has expressed interest
- **confirmed**: Requester has confirmed the donation appointment
- **completed**: Donation has been successfully completed
- **cancelled**: Either party cancelled the donation
