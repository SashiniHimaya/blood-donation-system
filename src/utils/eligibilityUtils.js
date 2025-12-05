/**
 * Donation Eligibility Utilities
 * 
 * Medical standards for blood donation eligibility:
 * - Minimum 56 days (8 weeks) between whole blood donations
 * - Minimum age: 18 years
 * - Minimum weight: 50 kg
 * - Good health condition
 */

const DONATION_INTERVAL_DAYS = 56; // WHO standard for whole blood donation
const MIN_AGE = 18;
const MIN_WEIGHT_KG = 50;

/**
 * Calculate days since last donation
 * @param {Date|string} lastDonationDate - Last donation date
 * @returns {number} Days since last donation
 */
const daysSinceLastDonation = (lastDonationDate) => {
  if (!lastDonationDate) return Infinity;
  
  const lastDate = new Date(lastDonationDate);
  const today = new Date();
  const diffTime = today - lastDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

/**
 * Check if donor is eligible based on last donation date
 * @param {Date|string} lastDonationDate - Last donation date
 * @returns {boolean} True if eligible
 */
const isEligibleByDate = (lastDonationDate) => {
  if (!lastDonationDate) return true; // First-time donor
  
  const daysSince = daysSinceLastDonation(lastDonationDate);
  return daysSince >= DONATION_INTERVAL_DAYS;
};

/**
 * Calculate next eligible donation date
 * @param {Date|string} lastDonationDate - Last donation date
 * @returns {Date|null} Next eligible date or null if already eligible
 */
const getNextEligibleDate = (lastDonationDate) => {
  if (!lastDonationDate) return null; // Already eligible
  
  const daysSince = daysSinceLastDonation(lastDonationDate);
  
  if (daysSince >= DONATION_INTERVAL_DAYS) {
    return null; // Already eligible
  }
  
  const lastDate = new Date(lastDonationDate);
  const nextDate = new Date(lastDate);
  nextDate.setDate(lastDate.getDate() + DONATION_INTERVAL_DAYS);
  
  return nextDate;
};

/**
 * Calculate days remaining until eligible
 * @param {Date|string} lastDonationDate - Last donation date
 * @returns {number} Days remaining (0 if already eligible)
 */
const daysUntilEligible = (lastDonationDate) => {
  if (!lastDonationDate) return 0;
  
  const daysSince = daysSinceLastDonation(lastDonationDate);
  const remaining = DONATION_INTERVAL_DAYS - daysSince;
  
  return remaining > 0 ? remaining : 0;
};

/**
 * Get comprehensive eligibility status
 * @param {Object} donor - Donor object with health info
 * @returns {Object} Detailed eligibility status
 */
const getEligibilityStatus = (donor) => {
  const { last_donation_date, date_of_birth, weight_kg, health_conditions } = donor;
  
  // Date eligibility
  const dateEligible = isEligibleByDate(last_donation_date);
  const daysSince = last_donation_date ? daysSinceLastDonation(last_donation_date) : null;
  const daysRemaining = daysUntilEligible(last_donation_date);
  const nextEligibleDate = getNextEligibleDate(last_donation_date);
  
  // Age eligibility
  let ageEligible = true;
  let age = null;
  if (date_of_birth) {
    const birthDate = new Date(date_of_birth);
    const today = new Date();
    age = Math.floor((today - birthDate) / (1000 * 60 * 60 * 24 * 365.25));
    ageEligible = age >= MIN_AGE;
  }
  
  // Weight eligibility
  let weightEligible = true;
  if (weight_kg) {
    weightEligible = weight_kg >= MIN_WEIGHT_KG;
  }
  
  // Health conditions check
  const hasHealthIssues = health_conditions && health_conditions.length > 0;
  
  // Overall eligibility
  const eligible = dateEligible && ageEligible && weightEligible && !hasHealthIssues;
  
  // Determine eligibility reasons
  const reasons = [];
  if (!dateEligible) {
    reasons.push(`Must wait ${daysRemaining} more days (56-day minimum interval)`);
  }
  if (!ageEligible) {
    reasons.push(`Must be at least ${MIN_AGE} years old`);
  }
  if (!weightEligible) {
    reasons.push(`Must weigh at least ${MIN_WEIGHT_KG} kg`);
  }
  if (hasHealthIssues) {
    reasons.push('Health conditions may affect eligibility');
  }
  
  return {
    eligible,
    reasons,
    date_eligibility: {
      eligible: dateEligible,
      days_since_last_donation: daysSince,
      days_until_eligible: daysRemaining,
      next_eligible_date: nextEligibleDate,
      last_donation_date: last_donation_date,
    },
    age_eligibility: {
      eligible: ageEligible,
      age: age,
      minimum_age: MIN_AGE,
    },
    weight_eligibility: {
      eligible: weightEligible,
      weight_kg: weight_kg,
      minimum_weight: MIN_WEIGHT_KG,
    },
    health_status: {
      has_conditions: hasHealthIssues,
      conditions: health_conditions || [],
    },
  };
};

/**
 * Format eligibility message for user
 * @param {Object} eligibilityStatus - Status from getEligibilityStatus
 * @returns {string} User-friendly message
 */
const formatEligibilityMessage = (eligibilityStatus) => {
  if (eligibilityStatus.eligible) {
    return '✅ You are eligible to donate blood!';
  }
  
  const messages = ['❌ You are currently not eligible to donate:'];
  eligibilityStatus.reasons.forEach(reason => {
    messages.push(`  • ${reason}`);
  });
  
  if (eligibilityStatus.date_eligibility.next_eligible_date) {
    const nextDate = new Date(eligibilityStatus.date_eligibility.next_eligible_date);
    messages.push(`\n📅 You will be eligible on: ${nextDate.toLocaleDateString()}`);
  }
  
  return messages.join('\n');
};

/**
 * Health questionnaire validation
 * Common disqualifying conditions
 */
const DISQUALIFYING_CONDITIONS = [
  'HIV/AIDS',
  'Hepatitis B or C',
  'Heart disease',
  'Cancer (active)',
  'Severe anemia',
  'Tuberculosis (active)',
  'Malaria (recent)',
  'Recent surgery (within 6 months)',
  'Pregnancy',
  'Recent tattoo or piercing (within 6 months)',
];

/**
 * Check if health conditions disqualify donor
 * @param {Array} conditions - List of health conditions
 * @returns {Object} Validation result
 */
const validateHealthConditions = (conditions) => {
  if (!conditions || conditions.length === 0) {
    return { valid: true, disqualifying: [] };
  }
  
  const disqualifying = conditions.filter(condition => 
    DISQUALIFYING_CONDITIONS.some(disq => {
      const condLower = condition.toLowerCase();
      const disqLower = disq.toLowerCase();
      // Check both ways: user condition contains disqualifying term OR disqualifying term contains user condition
      return condLower.includes(disqLower) || disqLower.includes(condLower);
    })
  );
  
  return {
    valid: disqualifying.length === 0,
    disqualifying,
    requires_review: conditions.length > 0 && disqualifying.length === 0,
  };
};

module.exports = {
  DONATION_INTERVAL_DAYS,
  MIN_AGE,
  MIN_WEIGHT_KG,
  daysSinceLastDonation,
  isEligibleByDate,
  getNextEligibleDate,
  daysUntilEligible,
  getEligibilityStatus,
  formatEligibilityMessage,
  DISQUALIFYING_CONDITIONS,
  validateHealthConditions,
};
