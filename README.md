# 🩸 Blood Donation Management System

A RESTful API system that connects blood donors with recipients in need, built with Node.js, Express, and PostgreSQL.

## ✨ Features

### Current Implementation
- ✅ **User Authentication**: Secure JWT-based registration and login
- ✅ **User Management**: Profile creation and updates for donors and recipients
- ✅ **Blood Request System**: Complete CRUD operations for blood requests
- ✅ **Advanced Filtering**: Search requests by blood type, urgency, location, and status
- ✅ **Role-Based Access**: Support for donors, recipients, and both
- ✅ **Request Prioritization**: Automatic sorting by urgency (critical → high → medium → low)

### Coming Soon
- ⏳ Donor-Recipient Matching Algorithm
- ⏳ Distance-Based Search (find nearby donors)
- ⏳ Real-time Notifications
- ⏳ Donation History Tracking
- ⏳ Admin Dashboard

## 🚀 Quick Start

### Prerequisites
- Node.js 14+
- PostgreSQL 12+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SashiniHimaya/blood-donation-system.git
   cd blood-donation-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file:
   ```env
   DB_USER=your_username
   DB_HOST=localhost
   DB_NAME=blood_donation_db
   DB_PASS=your_password
   DB_PORT=5432
   JWT_SECRET=your_secret_key_here
   PORT=5000
   ```

4. **Set up the database**
   ```bash
   # Create database
   createdb blood_donation_db
   
   # Run schema
   psql -U your_username -d blood_donation_db -f database/schema.sql
   ```

5. **Start the server**
   ```bash
   # Production
   npm start
   
   # Development (with auto-reload)
   npm run dev
   ```

6. **Test the API**
   ```bash
   node test-requests.js
   ```

## 📚 API Documentation

Full API documentation is available in [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

### Quick Examples

**Register a User**
```bash
POST /api/users/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword",
  "blood_type": "O+",
  "role": "donor"
}
```

**Create a Blood Request**
```bash
POST /api/requests
Authorization: Bearer <token>
{
  "blood_type": "A+",
  "units_needed": 2,
  "urgency": "high",
  "hospital_name": "City Hospital",
  "city": "New York",
  "needed_by": "2025-12-10"
}
```

**Find Blood Requests**
```bash
GET /api/requests?blood_type=A+&urgency=high&city=New York
```

## 🗂️ Project Structure

```
blood-donation-system/
├── database/
│   ├── schema.sql              # Database schema
│   └── setup.sql              # Setup with sample data
├── src/
│   ├── controllers/
│   │   ├── userController.js   # User operations
│   │   ├── requestController.js # Blood request operations
│   │   └── matchController.js   # Matching logic (coming soon)
│   ├── middleware/
│   │   └── authMiddleware.js   # JWT authentication
│   ├── routes/
│   │   ├── userRoutes.js
│   │   ├── requestRoutes.js
│   │   └── matchRoutes.js
│   ├── app.js                  # Express app
│   └── db.js                   # Database connection
├── test-requests.js            # API test script
├── .env                        # Environment variables
├── API_DOCUMENTATION.md        # Full API docs
└── SETUP.md                    # Detailed setup guide
```

## 🧪 Testing

Run the automated test suite:
```bash
node test-requests.js
```

This will test:
- User registration and login
- Authentication flow
- Blood request CRUD operations
- Filtering and search
- Request updates and cancellation

## 📊 Database Schema

### Users Table
- User information (donors/recipients)
- Blood type and availability
- Location data for matching

### Blood Requests Table
- Request details and urgency
- Hospital information
- Contact details
- Status tracking

### Donations Table (Coming Soon)
- Match donors with requests
- Track donation status
- Record donation history

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcrypt for password hashing
- **Validation**: express-validator

## 🔒 Security Features

- Encrypted password storage with bcrypt
- JWT-based authentication
- Protected routes with token verification
- SQL injection prevention with parameterized queries
- Environment variable protection

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

ISC

## 👨‍💻 Author

Sashini Himaya

## 🙏 Acknowledgments

Built to help connect blood donors with those in need and save lives.

---

**Status**: Active Development  
**Version**: 1.0.0  
**Last Updated**: December 3, 2025
