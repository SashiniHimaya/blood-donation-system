-- Add email notification preferences to users table

ALTER TABLE users ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notify_matches BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notify_urgent BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notify_status_updates BOOLEAN DEFAULT true;

COMMENT ON COLUMN users.email_notifications IS 'Master toggle for all email notifications';
COMMENT ON COLUMN users.notify_matches IS 'Notify when matched with blood requests';
COMMENT ON COLUMN users.notify_urgent IS 'Notify about urgent/critical blood requests';
COMMENT ON COLUMN users.notify_status_updates IS 'Notify about donation status updates';
