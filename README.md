# 🩸 Blood Donation Management System

A RESTful API system that connects blood donors with recipients in need, built with Node.js, Express, and PostgreSQL.

## ✨ Features

### Current Implementation
- ✅ **User Authentication**: Secure JWT-based registration and login
- ✅ **User Management**: Profile creation and updates for donors and recipients
- ✅ **Blood Request System**: Complete CRUD operations for blood requests
- ✅ **Advanced Filtering**: Search requests by blood type, urgency, location, and status
- ✅ **Role-Based Access**: Support for donors, recipients, admins, and both
- ✅ **Request Prioritization**: Automatic sorting by urgency (critical → high → medium → low)
- ✅ **Donor-Recipient Matching**: Intelligent blood type compatibility matching
- ✅ **Distance-Based Search**: Find nearby donors using Haversine formula
- ✅ **Donation Management**: Express interest, confirm, and track donations
- ✅ **Donation History**: Complete donation tracking for donors
- ✅ **Email Notifications**: Real-time alerts for matches, confirmations, and urgent requests
- ✅ **Admin Dashboard**: Comprehensive system monitoring and management
- ✅ **Donation Eligibility Checker**: Medical safety compliance with 56-day rule, age/weight requirements, health screening

### Coming Soon
- ⏳ SMS Notifications
- ⏳ Mobile App Integration

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
   
   # Email Configuration (optional for notifications)
4. **Set up the database**
   ```bash
   # Create database
   createdb blood_donation_db
   
   # Run schema
   psql -U your_username -d blood_donation_db -f database/schema.sql
   
   # Add notification preferences (optional)
   psql -U your_username -d blood_donation_db -f database/add_notification_preferences.sql
   
   # Add admin role support
   psql -U your_username -d blood_donation_db -f database/add_admin_role.sql
   
   # Add eligibility tracking (optional, recommended for donor safety)
   psql -U your_username -d blood_donation_db -f database/add_eligibility_tracking.sql
   ```

5. **Start the server**
   ```bash
   # Production
   npm start
   
   # Development (with auto-reload)
6. **Test the API**
   ```bash
   # Test user and request system
   node test-requests.js
   
   # Test matching system
   node test-matching.js
   
   # Test email notifications
   node test-notifications.js
   
   # Test admin dashboard
   node test-admin.js
   ```
## 📚 API Documentation

Full API documentation is available in:
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - User & Request APIs
- [MATCHING_SYSTEM.md](./MATCHING_SYSTEM.md) - Matching & Donation APIs
- [NOTIFICATION_SYSTEM.md](./NOTIFICATION_SYSTEM.md) - Email Notification System
- [ADMIN_DASHBOARD.md](./ADMIN_DASHBOARD.md) - Admin Dashboard & Analytics
- [MATCHING_SYSTEM.md](./MATCHING_SYSTEM.md) - Matching & Donation APIs
- [NOTIFICATION_SYSTEM.md](./NOTIFICATION_SYSTEM.md) - Email Notification System
   node test-matching.js
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
**Find Blood Requests**
```bash
GET /api/requests?blood_type=A+&urgency=high&city=New York
```

**Find Matching Donors**
```bash
GET /api/match/request/1/donors?maxDistance=30
```

## 📁 Project Structure

```
blood-donation-system/
├── src/
│   ├── controllers/
│   │   ├── userController.js    # User operations
│   │   ├── requestController.js # Blood request operations
│   │   └── matchController.js   # Matching & donation logic
│   ├── services/
│   │   └── notificationService.js # Email notifications
│   ├── middleware/
│   │   └── authMiddleware.js    # JWT authentication
│   ├── routes/
│   │   ├── userRoutes.js
│   │   ├── requestRoutes.js
│   │   └── matchRoutes.js
│   ├── app.js                   # Express app
│   └── db.js                    # Database connection
├── database/
│   ├── schema.sql               # Main database schema
│   └── add_notification_preferences.sql
├── test-requests.js             # Request system tests
├── test-matching.js             # Matching system tests
├── test-notifications.js        # Email notification tests
├── .env                         # Environment variables
├── API_DOCUMENTATION.md         # User/Request API docs
├── MATCHING_SYSTEM.md           # Matching API docs
├── NOTIFICATION_SYSTEM.md       # Email system docs
├── IMPLEMENTATION_SUMMARY.md    # Complete feature overview
└── SETUP.md                     # Detailed setup guide
``` ├── app.js                  # Express app
│   └── db.js                   # Database connection
├── test-requests.js            # API test script
├── .env                        # Environment variables
├── API_DOCUMENTATION.md        # Full API docs
└── SETUP.md                    # Detailed setup guide
```

Run the automated test suites:

**Test Request System:**
```bash
node test-requests.js
```

This will test:
- User registration and login
- Authentication flow
- Blood request CRUD operations
- Filtering and search
- Request updates and cancellation

**Test Matching System:**
```bash
node test-matching.js
```

This will test:
- Blood type compatibility matching
- Finding donors for requests
- Finding requests for donors
- Distance-based filtering
- Donation interest workflow
- Donation confirmation and tracking
- Donation history

**Test Email Notifications:**
```bash
node test-notifications.js
```

This will test:
- Welcome emails on registration
- Urgent request broadcasts
- Donation interest notifications
- Donation confirmation emails
- Donation cancellation emails

## 📊 Database Schema

### Users Table
- User information (donors/recipients)
- Blood type and availability
- Location data for matching
### Donations Table
- Match donors with requests
- Track donation status
- Record donation history

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Email Service**: Nodemailer (Gmail SMTP)
- **Security**: bcrypt for password hashing
- **Validation**: express-validator

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

## 📚 Documentation

- **[Eligibility System Guide](./ELIGIBILITY_SYSTEM.md)** - Comprehensive documentation on donor eligibility checking, medical standards, and 56-day rule implementation

---

**Status**: Active Development  
**Version**: 1.2.0  
**Last Updated**: December 5, 2025
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
