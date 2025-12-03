-- Run this script to set up your database
-- psql -U your_username -d blood_donation_db -f database/schema.sql

\c blood_donation_db;

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS donations CASCADE;
DROP TABLE IF EXISTS blood_requests CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop existing functions and triggers
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Now run the schema
\i schema.sql

-- Insert some sample data for testing
INSERT INTO users (name, email, password, phone, blood_type, role, location, latitude, longitude, is_available) VALUES
('John Donor', 'john@donor.com', '$2b$10$hashedpassword1', '1234567890', 'O+', 'donor', 'New York', 40.7128, -74.0060, true),
('Jane Recipient', 'jane@recipient.com', '$2b$10$hashedpassword2', '0987654321', 'A+', 'recipient', 'New York', 40.7580, -73.9855, true),
('Bob Universal', 'bob@both.com', '$2b$10$hashedpassword3', '5555555555', 'AB+', 'both', 'Boston', 42.3601, -71.0589, true);

-- Insert sample blood requests
INSERT INTO blood_requests (
  requester_id, blood_type, units_needed, urgency,
  hospital_name, hospital_address, city,
  latitude, longitude,
  contact_name, contact_phone, needed_by,
  description
) VALUES
(2, 'A+', 2, 'high', 'City Hospital', '123 Main St', 'New York', 40.7128, -74.0060, 'Dr. Smith', '5551234567', CURRENT_DATE + INTERVAL '7 days', 'Urgent surgery requirement'),
(2, 'O-', 1, 'critical', 'Emergency Medical Center', '456 Park Ave', 'New York', 40.7580, -73.9855, 'Dr. Johnson', '5559876543', CURRENT_DATE + INTERVAL '2 days', 'Critical emergency case');

\echo 'Database setup completed successfully!'
\echo 'Sample users and requests have been created.'
