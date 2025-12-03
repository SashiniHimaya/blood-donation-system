# Blood Donation System - Setup Guide

## Prerequisites
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Create a `.env` file in the root directory:

```env
# Database Configuration
DB_USER=your_postgres_username
DB_HOST=localhost
DB_NAME=blood_donation_db
DB_PASS=your_postgres_password
DB_PORT=5432

# JWT Secret (use a strong random string)
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production

# Server Configuration
PORT=5000
```

### 3. Create Database
Open PostgreSQL and run:
```sql
CREATE DATABASE blood_donation_db;
```

### 4. Set Up Database Schema

**Option 1: Using psql command line**
```bash
psql -U your_username -d blood_donation_db -f database/schema.sql
```

**Option 2: Using PostgreSQL GUI (pgAdmin)**
1. Open pgAdmin
2. Connect to your database
3. Open Query Tool
4. Load and execute `database/schema.sql`

**Option 3: Using the setup script (includes sample data)**
```bash
psql -U your_username -d blood_donation_db -f database/setup.sql
```

### 5. Start the Server
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

The server should start on `http://localhost:5000`

## Testing the API

### 1. Register a User
```bash
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "phone": "1234567890",
    "blood_type": "O+",
    "role": "donor",
    "location": "New York"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Save the token from the response!

### 3. Create a Blood Request
```bash
curl -X POST http://localhost:5000/api/requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "blood_type": "A+",
    "units_needed": 2,
    "urgency": "high",
    "hospital_name": "City Hospital",
    "hospital_address": "123 Main St",
    "city": "New York",
    "contact_name": "Dr. Smith",
    "contact_phone": "5551234567",
    "needed_by": "2025-12-10",
    "description": "Urgent blood needed"
  }'
```

### 4. View All Requests
```bash
curl http://localhost:5000/api/requests
```

### 5. Filter Requests
```bash
curl "http://localhost:5000/api/requests?blood_type=A+&urgency=high"
```

## Project Structure
```
blood-donation-system/
├── database/
│   ├── schema.sql          # Database schema
│   └── setup.sql           # Setup with sample data
├── src/
│   ├── controllers/
│   │   ├── userController.js
│   │   ├── requestController.js
│   │   └── matchController.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── routes/
│   │   ├── userRoutes.js
│   │   ├── requestRoutes.js
│   │   └── matchRoutes.js
│   ├── app.js              # Express app setup
│   └── db.js               # Database connection
├── .env                    # Environment variables
├── .gitignore             # Git ignore rules
├── package.json
└── API_DOCUMENTATION.md
```

## Next Steps

1. ✅ User authentication (completed)
2. ✅ Blood request management (completed)
3. ⏳ Donor-recipient matching system
4. ⏳ Notification system
5. ⏳ Distance-based search
6. ⏳ Admin dashboard

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check your `.env` credentials
- Verify the database exists

### Port Already in Use
- Change the PORT in `.env`
- Or kill the process using port 5000

### Authentication Errors
- Ensure JWT_SECRET is set in `.env`
- Check token expiration (default 24h)

## API Documentation
See `API_DOCUMENTATION.md` for detailed API endpoint documentation.
