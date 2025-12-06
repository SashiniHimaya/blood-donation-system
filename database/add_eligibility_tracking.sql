-- Add health and eligibility tracking fields to users table

-- Add date of birth for age eligibility
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Add weight for eligibility check (minimum 50kg required)
ALTER TABLE users ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(5,2);

-- Add health conditions as JSON array
ALTER TABLE users ADD COLUMN IF NOT EXISTS health_conditions TEXT[];

-- Add comments
COMMENT ON COLUMN users.date_of_birth IS 'Date of birth for age eligibility (min 18 years)';
COMMENT ON COLUMN users.weight_kg IS 'Weight in kilograms for eligibility (min 50kg)';
COMMENT ON COLUMN users.health_conditions IS 'Array of health conditions that may affect donation eligibility';

-- Update last_donation_date to be automatically set when donation is completed
-- Create a trigger function
CREATE OR REPLACE FUNCTION update_last_donation_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE users
        SET last_donation_date = COALESCE(NEW.donation_date, CURRENT_DATE)
        WHERE user_id = NEW.donor_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trigger_update_last_donation_date ON donations;

-- Create trigger on donations table
CREATE TRIGGER trigger_update_last_donation_date
AFTER UPDATE ON donations
FOR EACH ROW
EXECUTE FUNCTION update_last_donation_date();

COMMENT ON FUNCTION update_last_donation_date IS 'Automatically update last_donation_date when donation is completed';

-- Create view for donor eligibility status
CREATE OR REPLACE VIEW donor_eligibility_status AS
SELECT 
    u.user_id,
    u.name AS user_name,
    u.email AS user_email,
    u.blood_type,
    u.last_donation_date,
    u.date_of_birth,
    u.weight_kg,
    u.health_conditions,
    u.is_available,
    CASE 
        WHEN u.last_donation_date IS NULL THEN TRUE
        WHEN (CURRENT_DATE - u.last_donation_date) >= 56 THEN TRUE
        ELSE FALSE
    END AS date_eligible,
    CASE 
        WHEN u.last_donation_date IS NULL THEN 0
        ELSE GREATEST(0, 56 - (CURRENT_DATE - u.last_donation_date))
    END AS days_until_eligible,
    CASE 
        WHEN u.last_donation_date IS NULL THEN NULL
        ELSE u.last_donation_date + INTERVAL '56 days'
    END AS next_eligible_date,
    CASE 
        WHEN u.date_of_birth IS NULL THEN NULL
        ELSE EXTRACT(YEAR FROM AGE(CURRENT_DATE, u.date_of_birth))::INTEGER
    END AS age,
    CASE 
        WHEN u.date_of_birth IS NULL THEN TRUE
        WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, u.date_of_birth)) >= 18 THEN TRUE
        ELSE FALSE
    END AS age_eligible,
    CASE 
        WHEN u.weight_kg IS NULL THEN TRUE
        WHEN u.weight_kg >= 50 THEN TRUE
        ELSE FALSE
    END AS weight_eligible,
    (SELECT COUNT(*) FROM donations WHERE donor_id = u.user_id) AS total_donations,
    (SELECT COUNT(*) FROM donations WHERE donor_id = u.user_id AND status = 'completed') AS completed_donations
FROM users u
WHERE u.role IN ('donor', 'both');

COMMENT ON VIEW donor_eligibility_status IS 'Real-time view of donor eligibility based on 56-day rule and health criteria';

-- Example query to find eligible donors
-- SELECT * FROM donor_eligibility_status 
-- WHERE date_eligible = TRUE AND age_eligible = TRUE AND weight_eligible = TRUE AND is_available = TRUE;
