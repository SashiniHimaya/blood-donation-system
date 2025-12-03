# Blood Donation System - API Documentation

## Base URL
```
http://localhost:5000/api
```

---

## Authentication
Most endpoints require a JWT token. Include it in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 🔐 User Endpoints

### 1. Register a New User
**POST** `/users/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "phone": "1234567890",
  "blood_type": "O+",
  "role": "donor",
  "location": "New York",
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

**Response:** `201 Created`
```json
{
  "message": "User registered successfully",
  "user": {
    "user_id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "blood_type": "O+",
    "role": "donor"
  }
}
```

---

### 2. Login
**POST** `/users/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:** `200 OK`
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "user_id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "blood_type": "O+",
    "role": "donor"
  }
}
```

---

### 3. Get User Profile
**GET** `/users/profile`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "user": {
    "user_id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "blood_type": "O+",
    "role": "donor",
    "location": "New York",
    "is_available": true
  }
}
```

---

### 4. Update User Profile
**PUT** `/users/profile`

**Headers:** `Authorization: Bearer <token>`

**Request Body:** (all fields optional)
```json
{
  "name": "John Updated",
  "phone": "9876543210",
  "location": "Boston",
  "is_available": false
}
```

**Response:** `200 OK`

---

## 🩸 Blood Request Endpoints

### 1. Create Blood Request
**POST** `/requests`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "blood_type": "A+",
  "units_needed": 2,
  "urgency": "high",
  "hospital_name": "City Hospital",
  "hospital_address": "123 Main St",
  "city": "New York",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "contact_name": "Dr. Smith",
  "contact_phone": "5551234567",
  "needed_by": "2025-12-10",
  "description": "Patient requires urgent blood transfusion"
}
```

**Response:** `201 Created`
```json
{
  "message": "Blood request created successfully",
  "request": {
    "request_id": 1,
    "requester_id": 1,
    "blood_type": "A+",
    "units_needed": 2,
    "urgency": "high",
    "hospital_name": "City Hospital",
    "status": "open",
    "created_at": "2025-12-03T10:00:00.000Z"
  }
}
```

---

### 2. Get All Blood Requests
**GET** `/requests`

**Query Parameters (all optional):**
- `blood_type`: Filter by blood type (e.g., `A+`)
- `urgency`: Filter by urgency (`low`, `medium`, `high`, `critical`)
- `status`: Filter by status (`open`, `fulfilled`, `cancelled`)
- `city`: Filter by city name

**Example:** `/requests?blood_type=A+&urgency=high&city=New York`

**Response:** `200 OK`
```json
{
  "count": 10,
  "requests": [
    {
      "request_id": 1,
      "blood_type": "A+",
      "units_needed": 2,
      "urgency": "high",
      "hospital_name": "City Hospital",
      "city": "New York",
      "status": "open",
      "requester_name": "John Doe",
      "requester_email": "john@example.com",
      "created_at": "2025-12-03T10:00:00.000Z"
    }
  ]
}
```

---

### 3. Get Single Blood Request
**GET** `/requests/:id`

**Response:** `200 OK`
```json
{
  "request": {
    "request_id": 1,
    "blood_type": "A+",
    "units_needed": 2,
    "urgency": "high",
    "hospital_name": "City Hospital",
    "hospital_address": "123 Main St",
    "city": "New York",
    "contact_name": "Dr. Smith",
    "contact_phone": "5551234567",
    "needed_by": "2025-12-10",
    "description": "Patient requires urgent blood transfusion",
    "status": "open",
    "requester_name": "John Doe",
    "created_at": "2025-12-03T10:00:00.000Z"
  }
}
```

---

### 4. Get My Requests
**GET** `/requests/my/requests`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "count": 3,
  "requests": [...]
}
```

---

### 5. Update Blood Request
**PUT** `/requests/:id`

**Headers:** `Authorization: Bearer <token>`

**Request Body:** (all fields optional)
```json
{
  "units_needed": 3,
  "urgency": "critical",
  "status": "partially_fulfilled",
  "description": "Updated description"
}
```

**Response:** `200 OK`

---

### 6. Cancel Blood Request
**DELETE** `/requests/:id`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "message": "Blood request cancelled successfully",
  "request": {...}
}
```

---

## Valid Values

### Blood Types
- `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`

### User Roles
- `donor` - Can donate blood
- `recipient` - Can request blood
- `both` - Can both donate and request

### Urgency Levels
- `low` - Not urgent
- `medium` - Moderately urgent
- `high` - Very urgent
- `critical` - Life-threatening

### Request Status
- `open` - Active request
- `partially_fulfilled` - Some units received
- `fulfilled` - Request completed
- `cancelled` - Request cancelled
- `expired` - Past needed_by date

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Missing required fields"
}
```

### 401 Unauthorized
```json
{
  "error": "Access denied. No token provided."
}
```

### 404 Not Found
```json
{
  "error": "Blood request not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```
