const nodemailer = require("nodemailer");

// Create reusable transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.log("Email transporter error:", error);
  } else {
    console.log("Email server is ready to send messages");
  }
});

/**
 * Send email notification
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - HTML content
 * @param {string} text - Plain text content (fallback)
 */
const sendEmail = async (to, subject, html, text) => {
  try {
    const mailOptions = {
      from: `Blood Donation System <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      text,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Notify donor about matching blood request
 */
const notifyDonorAboutMatch = async (donor, request) => {
  const subject = `🩸 Urgent: Blood Needed - ${request.blood_type}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">🩸 Your Blood Can Save a Life!</h2>
      
      <p>Dear ${donor.name},</p>
      
      <p>A patient needs <strong>${request.blood_type}</strong> blood, and you're a compatible match!</p>
      
      <div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #991b1b;">Request Details:</h3>
        <ul style="margin-bottom: 0;">
          <li><strong>Blood Type:</strong> ${request.blood_type}</li>
          <li><strong>Units Needed:</strong> ${request.units_needed}</li>
          <li><strong>Urgency:</strong> <span style="color: #dc2626; text-transform: uppercase;">${request.urgency}</span></li>
          <li><strong>Hospital:</strong> ${request.hospital_name}</li>
          <li><strong>Location:</strong> ${request.city}</li>
          <li><strong>Needed By:</strong> ${new Date(request.needed_by).toLocaleDateString()}</li>
        </ul>
      </div>
      
      <p><strong>Contact Information:</strong><br>
      ${request.contact_name}<br>
      ${request.contact_phone}</p>
      
      ${request.description ? `<p><strong>Additional Information:</strong><br>${request.description}</p>` : ''}
      
      <div style="margin: 30px 0;">
        <a href="${process.env.APP_URL || 'http://localhost:5000'}/api/match/donate/${request.request_id}" 
           style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Express Interest to Donate
        </a>
      </div>
      
      <p style="color: #666; font-size: 14px;">
        If you're unable to donate, please share this request with friends and family who might be able to help.
      </p>
      
      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
      
      <p style="color: #999; font-size: 12px;">
        You received this email because you're registered as a ${donor.blood_type} donor in our system.
        To update your notification preferences, please visit your profile settings.
      </p>
    </div>
  `;

  const text = `
Blood Donation Request - ${request.blood_type}

Dear ${donor.name},

A patient needs ${request.blood_type} blood, and you're a compatible match!

Request Details:
- Blood Type: ${request.blood_type}
- Units Needed: ${request.units_needed}
- Urgency: ${request.urgency}
- Hospital: ${request.hospital_name}
- Location: ${request.city}
- Needed By: ${new Date(request.needed_by).toLocaleDateString()}

Contact: ${request.contact_name} - ${request.contact_phone}

${request.description ? `Additional Information: ${request.description}` : ''}

To express your interest in donating, please visit: ${process.env.APP_URL || 'http://localhost:5000'}/api/match/donate/${request.request_id}

Thank you for being a life-saver!
  `;

  return await sendEmail(donor.email, subject, html, text);
};

/**
 * Notify requester about donation interest
 */
const notifyRequesterAboutDonation = async (requester, donor, request) => {
  const subject = `✅ Good News! A Donor is Ready to Help`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #16a34a;">✅ A Donor Has Expressed Interest!</h2>
      
      <p>Dear ${requester.name},</p>
      
      <p>Great news! A compatible donor has expressed interest in your blood request.</p>
      
      <div style="background-color: #dcfce7; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #166534;">Donor Information:</h3>
        <ul style="margin-bottom: 0;">
          <li><strong>Name:</strong> ${donor.name}</li>
          <li><strong>Blood Type:</strong> ${donor.blood_type}</li>
          <li><strong>Phone:</strong> ${donor.phone}</li>
          <li><strong>Location:</strong> ${donor.location}</li>
        </ul>
      </div>
      
      <div style="background-color: #f3f4f6; padding: 15px; margin: 20px 0; border-radius: 5px;">
        <h3 style="margin-top: 0;">Your Request:</h3>
        <ul style="margin-bottom: 0;">
          <li><strong>Blood Type:</strong> ${request.blood_type}</li>
          <li><strong>Units Needed:</strong> ${request.units_needed}</li>
          <li><strong>Hospital:</strong> ${request.hospital_name}</li>
        </ul>
      </div>
      
      <div style="margin: 30px 0;">
        <p><strong>Next Steps:</strong></p>
        <ol>
          <li>Contact the donor to coordinate the donation</li>
          <li>Verify donation eligibility with hospital staff</li>
          <li>Confirm the donation in the system once completed</li>
        </ol>
      </div>
      
      <div style="margin: 30px 0;">
        <a href="${process.env.APP_URL || 'http://localhost:5000'}/api/match/request/${request.request_id}/donations" 
           style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
          View All Donation Offers
        </a>
      </div>
      
      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
      
      <p style="color: #999; font-size: 12px;">
        This is an automated notification from the Blood Donation System.
      </p>
    </div>
  `;

  const text = `
A Donor Has Expressed Interest!

Dear ${requester.name},

Great news! A compatible donor has expressed interest in your blood request.

Donor Information:
- Name: ${donor.name}
- Blood Type: ${donor.blood_type}
- Phone: ${donor.phone}
- Location: ${donor.location}

Your Request:
- Blood Type: ${request.blood_type}
- Units Needed: ${request.units_needed}
- Hospital: ${request.hospital_name}

Next Steps:
1. Contact the donor to coordinate the donation
2. Verify donation eligibility with hospital staff
3. Confirm the donation in the system once completed

View all donation offers: ${process.env.APP_URL || 'http://localhost:5000'}/api/match/request/${request.request_id}/donations

Thank you!
  `;

  return await sendEmail(requester.email, subject, html, text);
};

/**
 * Notify donor about donation confirmation
 */
const notifyDonorAboutConfirmation = async (donor, request, donationStatus) => {
  let subject, html, text;

  if (donationStatus === "confirmed") {
    subject = `✅ Your Donation Has Been Confirmed`;
    
    html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">✅ Thank You! Your Donation is Confirmed</h2>
        
        <p>Dear ${donor.name},</p>
        
        <p>Your donation offer has been confirmed! The patient is counting on you.</p>
        
        <div style="background-color: #dcfce7; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #166534;">Donation Details:</h3>
          <ul style="margin-bottom: 0;">
            <li><strong>Blood Type:</strong> ${request.blood_type}</li>
            <li><strong>Hospital:</strong> ${request.hospital_name}</li>
            <li><strong>Address:</strong> ${request.hospital_address}</li>
            <li><strong>Contact:</strong> ${request.contact_name} - ${request.contact_phone}</li>
            <li><strong>Needed By:</strong> ${new Date(request.needed_by).toLocaleDateString()}</li>
          </ul>
        </div>
        
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #92400e;">Before You Donate:</h3>
          <ul style="margin-bottom: 0;">
            <li>Get adequate sleep the night before</li>
            <li>Eat a healthy meal before donation</li>
            <li>Drink plenty of water</li>
            <li>Bring a valid ID</li>
            <li>Inform hospital staff of any medications</li>
          </ul>
        </div>
        
        <p style="font-size: 18px; color: #16a34a; font-weight: bold;">
          You're saving a life! Thank you for your generosity. 🩸
        </p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        
        <p style="color: #999; font-size: 12px;">
          This is an automated notification from the Blood Donation System.
        </p>
      </div>
    `;

    text = `
Your Donation Has Been Confirmed

Dear ${donor.name},

Your donation offer has been confirmed! The patient is counting on you.

Donation Details:
- Blood Type: ${request.blood_type}
- Hospital: ${request.hospital_name}
- Address: ${request.hospital_address}
- Contact: ${request.contact_name} - ${request.contact_phone}
- Needed By: ${new Date(request.needed_by).toLocaleDateString()}

Before You Donate:
- Get adequate sleep the night before
- Eat a healthy meal before donation
- Drink plenty of water
- Bring a valid ID
- Inform hospital staff of any medications

You're saving a life! Thank you for your generosity.
    `;
  } else if (donationStatus === "cancelled") {
    subject = `❌ Donation Request Cancelled`;
    
    html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Donation Request Update</h2>
        
        <p>Dear ${donor.name},</p>
        
        <p>The blood donation request for ${request.blood_type} at ${request.hospital_name} has been cancelled.</p>
        
        <p>This could be because:</p>
        <ul>
          <li>The blood need has been fulfilled by another donor</li>
          <li>The request was withdrawn by the requester</li>
          <li>The situation has changed</li>
        </ul>
        
        <p>Thank you for your willingness to donate. There are many other patients who need your help!</p>
        
        <div style="margin: 30px 0;">
          <a href="${process.env.APP_URL || 'http://localhost:5000'}/api/match/donor/requests" 
             style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Other Requests
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        
        <p style="color: #999; font-size: 12px;">
          This is an automated notification from the Blood Donation System.
        </p>
      </div>
    `;

    text = `
Donation Request Cancelled

Dear ${donor.name},

The blood donation request for ${request.blood_type} at ${request.hospital_name} has been cancelled.

This could be because:
- The blood need has been fulfilled by another donor
- The request was withdrawn by the requester
- The situation has changed

Thank you for your willingness to donate. There are many other patients who need your help!

View other requests: ${process.env.APP_URL || 'http://localhost:5000'}/api/match/donor/requests
    `;
  }

  return await sendEmail(donor.email, subject, html, text);
};

/**
 * Notify about new urgent blood request (broadcast to compatible donors)
 */
const notifyUrgentRequest = async (donors, request) => {
  const subject = `🚨 URGENT: ${request.blood_type} Blood Needed Immediately`;
  
  const emailPromises = donors.map(donor => {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">🚨 URGENT BLOOD NEEDED</h1>
        </div>
        
        <div style="padding: 20px;">
          <p>Dear ${donor.name},</p>
          
          <p style="font-size: 18px; color: #dc2626; font-weight: bold;">
            A patient needs ${request.blood_type} blood URGENTLY!
          </p>
          
          <div style="background-color: #fee2e2; border: 2px solid #dc2626; padding: 15px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #991b1b;">Emergency Request:</h3>
            <ul style="margin-bottom: 0;">
              <li><strong>Blood Type:</strong> ${request.blood_type}</li>
              <li><strong>Units Needed:</strong> ${request.units_needed}</li>
              <li><strong>Hospital:</strong> ${request.hospital_name}</li>
              <li><strong>Location:</strong> ${request.city}</li>
              <li><strong>Needed By:</strong> ${new Date(request.needed_by).toLocaleDateString()}</li>
              <li><strong>Contact:</strong> ${request.contact_phone}</li>
            </ul>
          </div>
          
          <p style="font-size: 16px;">
            <strong>Every minute counts!</strong> If you're available, please respond immediately.
          </p>
          
          <div style="margin: 30px 0; text-align: center;">
            <a href="${process.env.APP_URL || 'http://localhost:5000'}/api/match/donate/${request.request_id}" 
               style="background-color: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 18px; font-weight: bold;">
              I CAN DONATE NOW
            </a>
          </div>
          
          <p style="color: #666;">
            If you cannot donate, please share this with anyone who might be able to help.
          </p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        
        <p style="color: #999; font-size: 12px; padding: 0 20px;">
          This is an urgent automated notification from the Blood Donation System.
        </p>
      </div>
    `;

    const text = `
🚨 URGENT BLOOD NEEDED

Dear ${donor.name},

A patient needs ${request.blood_type} blood URGENTLY!

Emergency Request:
- Blood Type: ${request.blood_type}
- Units Needed: ${request.units_needed}
- Hospital: ${request.hospital_name}
- Location: ${request.city}
- Needed By: ${new Date(request.needed_by).toLocaleDateString()}
- Contact: ${request.contact_phone}

Every minute counts! If you're available, please respond immediately.

To donate: ${process.env.APP_URL || 'http://localhost:5000'}/api/match/donate/${request.request_id}

If you cannot donate, please share this with anyone who might be able to help.
    `;

    return sendEmail(donor.email, subject, html, text);
  });

  return await Promise.allSettled(emailPromises);
};

/**
 * Send welcome email to new user
 */
const sendWelcomeEmail = async (user) => {
  const subject = `Welcome to Blood Donation System! 🩸`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">Welcome to Our Life-Saving Community! 🩸</h2>
      
      <p>Dear ${user.name},</p>
      
      <p>Thank you for joining the Blood Donation System! Your registration is complete.</p>
      
      <div style="background-color: #f3f4f6; padding: 15px; margin: 20px 0; border-radius: 5px;">
        <h3 style="margin-top: 0;">Your Profile:</h3>
        <ul style="margin-bottom: 0;">
          <li><strong>Name:</strong> ${user.name}</li>
          <li><strong>Email:</strong> ${user.email}</li>
          <li><strong>Blood Type:</strong> ${user.blood_type}</li>
          <li><strong>Role:</strong> ${user.role}</li>
        </ul>
      </div>
      
      <h3>What You Can Do:</h3>
      ${user.role === 'donor' || user.role === 'both' ? `
      <p><strong>As a Donor:</strong></p>
      <ul>
        <li>Find blood requests that match your blood type</li>
        <li>Get notified when patients need your blood type</li>
        <li>Track your donation history</li>
        <li>Save lives in your community</li>
      </ul>
      ` : ''}
      
      ${user.role === 'recipient' || user.role === 'both' ? `
      <p><strong>As a Recipient:</strong></p>
      <ul>
        <li>Create urgent blood requests</li>
        <li>Find compatible donors nearby</li>
        <li>Receive donation offers</li>
        <li>Coordinate with willing donors</li>
      </ul>
      ` : ''}
      
      <div style="margin: 30px 0;">
        <p><strong>Get Started:</strong></p>
        <a href="${process.env.APP_URL || 'http://localhost:5000'}/api/users/profile" 
           style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-right: 10px;">
          View My Profile
        </a>
        ${user.role === 'donor' || user.role === 'both' ? `
        <a href="${process.env.APP_URL || 'http://localhost:5000'}/api/match/donor/requests" 
           style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Find Requests
        </a>
        ` : ''}
      </div>
      
      <p style="font-size: 18px; color: #dc2626; font-weight: bold;">
        Together, we save lives! 💪
      </p>
      
      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
      
      <p style="color: #999; font-size: 12px;">
        Need help? Contact our support team or visit our FAQ section.
      </p>
    </div>
  `;

  const text = `
Welcome to Blood Donation System!

Dear ${user.name},

Thank you for joining the Blood Donation System! Your registration is complete.

Your Profile:
- Name: ${user.name}
- Email: ${user.email}
- Blood Type: ${user.blood_type}
- Role: ${user.role}

Together, we save lives!
  `;

  return await sendEmail(user.email, subject, html, text);
};

/**
 * Notify donor when they become eligible again
 */
const notifyEligibilityRestored = async (donor, nextRequestsCount = 0) => {
  const subject = `✅ You're Eligible to Donate Again!`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #16a34a; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">✅ You Can Donate Again!</h1>
      </div>
      
      <div style="padding: 20px;">
        <p>Dear ${donor.name},</p>
        
        <p style="font-size: 18px; color: #16a34a; font-weight: bold;">
          Good news! You are now eligible to donate blood again.
        </p>
        
        <div style="background-color: #dcfce7; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>It's been 56 days since your last donation!</strong></p>
          <p style="margin: 10px 0 0 0;">Thank you for waiting the required period. Your dedication to saving lives is appreciated.</p>
        </div>
        
        ${nextRequestsCount > 0 ? `
        <div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #991b1b;">⚡ ${nextRequestsCount} patient(s) need your blood type right now!</h3>
          <p style="margin-bottom: 0;">Your blood type (${donor.blood_type}) is in demand. People are waiting for donors like you.</p>
        </div>
        ` : ''}
        
        <div style="margin: 30px 0; text-align: center;">
          <a href="${process.env.APP_URL || 'http://localhost:5000'}/api/match/donor/requests" 
             style="background-color: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 18px; font-weight: bold;">
            Find Blood Requests
          </a>
        </div>
        
        <h3>Your Impact:</h3>
        <p>Every donation can save up to <strong>3 lives</strong>. Thank you for being a hero!</p>
        
        <div style="background-color: #f3f4f6; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <h4 style="margin-top: 0;">Before You Donate:</h4>
          <ul style="margin-bottom: 0;">
            <li>Get adequate sleep the night before</li>
            <li>Eat a healthy meal</li>
            <li>Drink plenty of water</li>
            <li>Avoid fatty foods 24 hours before</li>
            <li>Bring a valid ID</li>
          </ul>
        </div>
      </div>
      
      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
      
      <p style="color: #999; font-size: 12px; padding: 0 20px;">
        You received this email because 56 days have passed since your last donation.
      </p>
    </div>
  `;

  const text = `
You're Eligible to Donate Again!

Dear ${donor.name},

Good news! You are now eligible to donate blood again.

It's been 56 days since your last donation! Thank you for waiting the required period. Your dedication to saving lives is appreciated.

${nextRequestsCount > 0 ? `
⚡ ${nextRequestsCount} patient(s) need your blood type right now!
Your blood type (${donor.blood_type}) is in demand. People are waiting for donors like you.
` : ''}

Every donation can save up to 3 lives. Thank you for being a hero!

Before You Donate:
- Get adequate sleep the night before
- Eat a healthy meal
- Drink plenty of water
- Avoid fatty foods 24 hours before
- Bring a valid ID

Find blood requests: ${process.env.APP_URL || 'http://localhost:5000'}/api/match/donor/requests
  `;

  return await sendEmail(donor.email, subject, html, text);
};

module.exports = {
  sendEmail,
  notifyDonorAboutMatch,
  notifyRequesterAboutDonation,
  notifyDonorAboutConfirmation,
  notifyUrgentRequest,
  sendWelcomeEmail,
  notifyEligibilityRestored,
};
