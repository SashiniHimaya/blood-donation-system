# 📧 Email Notification System Documentation

## Overview

The Blood Donation System includes a comprehensive email notification system that keeps users informed about matches, donations, and urgent requests. The system uses **Nodemailer** with Gmail SMTP for reliable email delivery.

---

## ✨ Notification Types

### 1. **Welcome Email**
**Trigger:** New user registration  
**Recipients:** Newly registered users  
**Content:**
- Welcome message
- User profile summary
- Available features based on role (donor/recipient)
- Quick action links

**Template:** HTML with branding and personalized greeting

---

### 2. **Urgent Request Broadcast**
**Trigger:** Critical or high-urgency blood request created  
**Recipients:** All compatible donors with matching blood types  
**Content:**
- Urgent alert header
- Blood type and units needed
- Hospital location and contact
- "I Can Donate Now" action button
- Countdown to needed-by date

**Template:** High-priority styling with red color scheme

---

### 3. **Donation Interest Notification**
**Trigger:** Donor expresses interest in a blood request  
**Recipients:** Request creator (recipient)  
**Content:**
- Donor information (name, blood type, phone, location)
- Request details
- Next steps for coordination
- Link to view all donation offers

**Template:** Success-themed with green color scheme

---

### 4. **Donation Confirmation**
**Trigger:** Recipient confirms a donation offer  
**Recipients:** Donor whose offer was confirmed  
**Content:**
- Confirmation message
- Hospital details and address
- Contact information
- Pre-donation preparation checklist
- Appointment details

**Template:** Encouraging message with preparation tips

---

### 5. **Donation Cancellation**
**Trigger:** Donation status changed to "cancelled"  
**Recipients:** Affected donor  
**Content:**
- Cancellation notification
- Possible reasons (fulfilled by another donor, etc.)
- Link to view other active requests
- Encouragement to continue helping

**Template:** Neutral tone with alternative action links

---

### 6. **Match Found Notification**
**Trigger:** Compatible donor found for a blood request  
**Recipients:** Donors matching the blood type requirements  
**Content:**
- Match details
- Request urgency and hospital info
- Distance from donor's location
- Express interest button

**Template:** Informative with call-to-action

---

## 🔧 Setup Instructions

### Step 1: Gmail App Password Setup

1. Go to your Google Account: https://myaccount.google.com
2. Navigate to **Security** → **2-Step Verification** (enable if not already)
3. Scroll to **App passwords**
4. Generate new app password:
   - App: **Mail**
   - Device: **Other (Custom name)** → "Blood Donation System"
5. Copy the 16-character password

### Step 2: Configure Environment Variables

Edit your `.env` file:

```env
# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password

# Application URL (for email links)
APP_URL=http://localhost:5000
```

**Production Example:**
```env
EMAIL_SERVICE=gmail
EMAIL_USER=blooddonation@yourorg.com
EMAIL_PASSWORD=abcd efgh ijkl mnop
APP_URL=https://blooddonation.yourorg.com
```

### Step 3: Run Database Migration

Add notification preferences to the database:

```bash
psql -U postgres -d blood_donation -f database/add_notification_preferences.sql
```

Or manually execute:
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notify_matches BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notify_urgent BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notify_status_updates BOOLEAN DEFAULT true;
```

### Step 4: Restart the Server

```bash
npm run dev
```

You should see: `Email server is ready to send messages` in the console.

---

## 🧪 Testing the Notification System

### Automated Test Suite

Run the comprehensive test suite:

```bash
node test-notifications.js
```

**Before running tests:**
1. Update test email addresses in `test-notifications.js`:
   ```javascript
   const testConfig = {
     donor: {
       user_email: "your-email@gmail.com", // Your actual email
       // ... other fields
     },
     recipient: {
       user_email: "your-email@gmail.com", // Your actual email
       // ... other fields
     },
   };
   ```

2. Ensure server is running (`npm run dev`)
3. Check your email inbox/spam folder

**Test Coverage:**
- ✅ Welcome email on registration
- ✅ Urgent request broadcast
- ✅ Donation interest notification
- ✅ Donation confirmation email
- ✅ Donation cancellation email

### Manual Testing

#### Test Welcome Email:
```bash
POST http://localhost:5000/api/users/register
Content-Type: application/json

{
  "user_name": "John Doe",
  "user_email": "john@example.com",
  "password": "secure123",
  "blood_type": "O+",
  "location": "Colombo",
  "role": "donor"
}
```

#### Test Urgent Request:
```bash
POST http://localhost:5000/api/requests
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "blood_type": "A+",
  "units_needed": 2,
  "urgency": "critical",
  "hospital_name": "National Hospital",
  "hospital_address": "Colombo 10",
  "city": "Colombo",
  "latitude": 6.9271,
  "longitude": 79.8612,
  "contact_name": "Dr. Silva",
  "contact_phone": "0771234567",
  "needed_by": "2025-12-10T10:00:00Z"
}
```

---

## 📊 Email Templates

### Template Structure

All emails follow a consistent structure:

```
┌─────────────────────────────────┐
│  Header (Icon + Title)          │
├─────────────────────────────────┤
│  Greeting                       │
│  Main Message                   │
│                                 │
│  ┌───────────────────────────┐ │
│  │  Highlighted Info Box     │ │
│  │  (Blood type, urgency,    │ │
│  │   hospital, etc.)         │ │
│  └───────────────────────────┘ │
│                                 │
│  Additional Details             │
│                                 │
│  [ Call-to-Action Button ]      │
│                                 │
│  Footer Text                    │
├─────────────────────────────────┤
│  Disclaimer / Unsubscribe       │
└─────────────────────────────────┘
```

### Template Features

- **Responsive Design:** Works on mobile and desktop
- **HTML + Plain Text:** Fallback for email clients
- **Branded Colors:**
  - Red (#dc2626) for urgent/blood-related
  - Green (#16a34a) for success/confirmation
  - Yellow (#f59e0b) for warnings/tips
- **Clear CTAs:** Prominent action buttons
- **Accessibility:** Proper contrast and font sizes

---

## 🔒 Security & Privacy

### Email Security

1. **App Passwords:** Never use your main Gmail password
2. **Environment Variables:** Never commit `.env` to version control
3. **TLS/SSL:** Nodemailer uses secure connections by default

### User Privacy

1. **Opt-Out Options:** Users can disable notifications in preferences
2. **Minimal Data Sharing:** Emails only include necessary information
3. **No Email Harvesting:** Emails only sent to registered users

### Notification Preferences

Users can control notifications via database fields:

| Field | Description | Default |
|-------|-------------|---------|
| `email_notifications` | Master toggle for all emails | `true` |
| `notify_matches` | Notifications about blood type matches | `true` |
| `notify_urgent` | Urgent/critical request broadcasts | `true` |
| `notify_status_updates` | Donation status changes | `true` |

**Future Enhancement:** Add API endpoints for users to manage preferences.

---

## 🚀 Production Deployment

### Using Custom SMTP Server

For production, consider using dedicated email services:

#### SendGrid:
```env
EMAIL_SERVICE=SendGrid
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
```

#### AWS SES:
```env
EMAIL_SERVICE=SES
EMAIL_USER=your-aws-access-key
EMAIL_PASSWORD=your-aws-secret-key
```

#### Mailgun:
```env
EMAIL_SERVICE=Mailgun
EMAIL_USER=your-mailgun-username
EMAIL_PASSWORD=your-mailgun-password
```

### Email Delivery Best Practices

1. **SPF/DKIM Records:** Configure for your domain
2. **Rate Limiting:** Avoid sending too many emails too quickly
3. **Bounce Handling:** Monitor and handle bounced emails
4. **Unsubscribe Links:** Include in all promotional emails
5. **Email Verification:** Verify email addresses on registration

### Monitoring

Add logging for email delivery:

```javascript
// In notificationService.js
const info = await transporter.sendMail(mailOptions);
console.log(`✅ Email sent: ${info.messageId} to ${to}`);

// Log failures
catch (error) {
  console.error(`❌ Email failed: ${to} - ${error.message}`);
  // Store in database for retry logic
}
```

---

## 📈 Performance Optimization

### Async Email Sending

Emails are sent asynchronously and don't block API responses:

```javascript
// Email sending wrapped in try-catch
try {
  await sendEmail(...);
} catch (emailError) {
  console.error("Email error:", emailError);
  // Request continues even if email fails
}
```

### Batch Processing

For urgent broadcasts to many donors:

```javascript
// Send emails in parallel
const emailPromises = donors.map(donor => sendEmail(...));
await Promise.allSettled(emailPromises);
```

### Queue System (Future Enhancement)

For high-volume systems, consider using a queue:

- **Bull** or **BullMQ** with Redis
- **AWS SQS** for cloud deployments
- Retry failed emails automatically
- Rate limiting and throttling

---

## 🐛 Troubleshooting

### Email Not Sending

**Check 1:** Verify credentials
```bash
# Test in Node.js console
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password'
  }
});

transporter.verify((error, success) => {
  if (error) console.log(error);
  else console.log('Server is ready');
});
```

**Check 2:** Gmail security settings
- Enable 2-Step Verification
- Create App Password
- Check "Less secure app access" (if using regular password)

**Check 3:** Firewall/Network
- Ensure port 587 (SMTP) is not blocked
- Check corporate firewall settings

### Emails Going to Spam

**Solutions:**
1. Add sender to contacts
2. Configure SPF/DKIM records for your domain
3. Avoid spam trigger words ("urgent", "act now")
4. Include unsubscribe link
5. Use a verified sending domain

### Slow Email Delivery

**Solutions:**
1. Check Gmail sending limits (500/day for free accounts)
2. Implement email queuing
3. Use dedicated email service (SendGrid, AWS SES)
4. Send emails in batches with delays

---

## 📝 Email Content Guidelines

### Subject Lines

- **Keep it short:** 50 characters or less
- **Be specific:** "Blood Needed: O+ in Colombo"
- **Use emojis sparingly:** 🩸 for blood-related only
- **Avoid spam words:** FREE, ACT NOW, LIMITED TIME

### Email Body

- **Personalize:** Use recipient's name
- **Clear purpose:** State why they're receiving the email
- **Actionable:** Include clear next steps
- **Concise:** Get to the point quickly
- **Mobile-friendly:** Most users read on phones

### Call-to-Action Buttons

- **Contrast colors:** Stand out from background
- **Clear text:** "Express Interest" not "Click Here"
- **Single primary CTA:** Don't overwhelm with options
- **Prominent placement:** Above the fold

---

## 🎯 Future Enhancements

### Planned Features

1. **SMS Notifications** (via Twilio)
   - Urgent alerts sent as SMS
   - Opt-in for critical requests only

2. **Push Notifications** (via Firebase)
   - Real-time mobile app notifications
   - Web push for desktop users

3. **Email Templates Editor**
   - Admin panel to customize templates
   - A/B testing for email content

4. **Analytics Dashboard**
   - Email open rates
   - Click-through rates
   - Conversion tracking

5. **Scheduled Reminders**
   - Pre-donation reminders
   - Follow-up after donation
   - Eligibility reminder (after 56 days)

6. **Digest Emails**
   - Weekly summary of matches
   - Monthly donation statistics
   - Community impact reports

---

## 📚 API Reference

### Notification Service Functions

Located in: `src/services/notificationService.js`

#### `sendEmail(to, subject, html, text)`
Low-level email sending function.

**Parameters:**
- `to` (string): Recipient email address
- `subject` (string): Email subject line
- `html` (string): HTML email body
- `text` (string): Plain text fallback

**Returns:** `{ success: boolean, messageId?: string, error?: string }`

---

#### `sendWelcomeEmail(user)`
Send welcome email to new user.

**Parameters:**
- `user` (object):
  - `name` (string): User's full name
  - `email` (string): User's email
  - `blood_type` (string): Blood type
  - `role` (string): 'donor' | 'recipient' | 'both'

---

#### `notifyDonorAboutMatch(donor, request)`
Notify donor about compatible blood request.

**Parameters:**
- `donor` (object): Donor user details
- `request` (object): Blood request details

---

#### `notifyRequesterAboutDonation(requester, donor, request)`
Notify requester about donation interest.

**Parameters:**
- `requester` (object): Request creator details
- `donor` (object): Donor who expressed interest
- `request` (object): Blood request details

---

#### `notifyDonorAboutConfirmation(donor, request, status)`
Notify donor about donation status change.

**Parameters:**
- `donor` (object): Donor user details
- `request` (object): Blood request details
- `status` (string): 'confirmed' | 'cancelled'

---

#### `notifyUrgentRequest(donors, request)`
Broadcast urgent request to all compatible donors.

**Parameters:**
- `donors` (array): List of compatible donor objects
- `request` (object): Urgent blood request details

**Returns:** `Promise<PromiseSettledResult[]>`

---

## 💡 Best Practices

### Development

1. **Use Test Emails:** Don't spam real users during development
2. **Environment Separation:** Different SMTP configs for dev/staging/prod
3. **Error Handling:** Always catch email errors, don't fail requests
4. **Logging:** Log all email attempts for debugging

### Testing

1. **Use MailHog/MailCatcher:** Local SMTP servers for development
2. **Test All Templates:** Verify HTML rendering in multiple clients
3. **Check Responsiveness:** Test on mobile devices
4. **Verify Links:** Ensure all URLs are correct

### Deployment

1. **Use Dedicated Service:** SendGrid, AWS SES, etc. for production
2. **Monitor Deliverability:** Track bounces, opens, clicks
3. **Implement Queues:** Handle high volumes gracefully
4. **Backup SMTP:** Have fallback email service

---

## 📞 Support

For email-related issues:

1. Check server logs for error messages
2. Verify `.env` configuration
3. Test SMTP connection with `transporter.verify()`
4. Review Gmail/SMTP service status pages
5. Check spam folder for test emails

**Common Error Codes:**
- `EAUTH`: Invalid credentials
- `ECONNECTION`: Network/firewall issue
- `ETIMEDOUT`: SMTP server not responding
- `550`: Recipient email rejected

---

## 📄 License & Credits

**Email Templates:** Custom designed for Blood Donation System  
**Nodemailer:** https://nodemailer.com  
**Icons:** Unicode emoji (🩸, ✅, 🚨, etc.)

---

**Last Updated:** December 5, 2025  
**Version:** 1.0.0
