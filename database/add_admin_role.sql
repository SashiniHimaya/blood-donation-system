-- Add admin role support and update existing role column

-- First, check if 'admin' is already in the CHECK constraint
DO $$ 
BEGIN
    -- Drop existing constraint if it exists
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
    
    -- Add new constraint with admin role
    ALTER TABLE users ADD CONSTRAINT users_role_check 
        CHECK (role IN ('donor', 'recipient', 'both', 'admin'));
END $$;

-- Add comment
COMMENT ON COLUMN users.role IS 'User role: donor, recipient, both, or admin';

-- Create a function to promote a user to admin (for safety, requires direct SQL execution)
-- Usage: SELECT promote_to_admin('user_email@example.com');
CREATE OR REPLACE FUNCTION promote_to_admin(user_email_param VARCHAR)
RETURNS TABLE(user_id INTEGER, user_name VARCHAR, user_email VARCHAR, role VARCHAR) AS $$
BEGIN
    RETURN QUERY
    UPDATE users
    SET role = 'admin'
    WHERE user_email = user_email_param
    RETURNING users.user_id, users.user_name, users.user_email, users.role;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION promote_to_admin IS 'Promote a user to admin role by email address';

-- Example: To create an admin user, first register normally, then run:
-- SELECT promote_to_admin('admin@example.com');
