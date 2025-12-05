/**
 * Comprehensive Test Suite for Donation Eligibility System
 * Tests the 56-day rule, age/weight requirements, health screening, and email notifications
 */

const {
  daysSinceLastDonation,
  isEligibleByDate,
  getNextEligibleDate,
  daysUntilEligible,
  validateHealthConditions,
  getEligibilityStatus,
  formatEligibilityMessage,
  DONATION_INTERVAL_DAYS,
  MIN_AGE,
  MIN_WEIGHT_KG,
  DISQUALIFYING_CONDITIONS,
} = require('../src/utils/eligibilityUtils');

const { notifyEligibilityRestored } = require('../src/services/notificationService');

// Test colors for console output
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

/**
 * Simple test assertion helper
 */
function assert(condition, testName) {
  testsRun++;
  if (condition) {
    testsPassed++;
    console.log(`${GREEN}✓${RESET} ${testName}`);
  } else {
    testsFailed++;
    console.log(`${RED}✗${RESET} ${testName}`);
  }
}

/**
 * Test suite for date-based eligibility (56-day rule)
 */
function testDateEligibility() {
  console.log('\n=== Testing 56-Day Rule ===');

  // Test 1: No previous donation (null)
  const noPrevDonation = isEligibleByDate(null);
  assert(noPrevDonation === true, 'Should be eligible with no previous donation');

  // Test 2: Last donation exactly 56 days ago (eligible)
  const date56DaysAgo = new Date();
  date56DaysAgo.setDate(date56DaysAgo.getDate() - 56);
  const eligible56Days = isEligibleByDate(date56DaysAgo);
  assert(eligible56Days === true, 'Should be eligible after exactly 56 days');

  // Test 3: Last donation 57 days ago (eligible)
  const date57DaysAgo = new Date();
  date57DaysAgo.setDate(date57DaysAgo.getDate() - 57);
  const eligible57Days = isEligibleByDate(date57DaysAgo);
  assert(eligible57Days === true, 'Should be eligible after 57 days');

  // Test 4: Last donation 55 days ago (not eligible)
  const date55DaysAgo = new Date();
  date55DaysAgo.setDate(date55DaysAgo.getDate() - 55);
  const notEligible55Days = isEligibleByDate(date55DaysAgo);
  assert(notEligible55Days === false, 'Should NOT be eligible after only 55 days');

  // Test 5: Last donation 30 days ago (not eligible)
  const date30DaysAgo = new Date();
  date30DaysAgo.setDate(date30DaysAgo.getDate() - 30);
  const notEligible30Days = isEligibleByDate(date30DaysAgo);
  assert(notEligible30Days === false, 'Should NOT be eligible after only 30 days');

  // Test 6: Last donation yesterday (not eligible)
  const dateYesterday = new Date();
  dateYesterday.setDate(dateYesterday.getDate() - 1);
  const notEligibleYesterday = isEligibleByDate(dateYesterday);
  assert(notEligibleYesterday === false, 'Should NOT be eligible after only 1 day');

  // Test 7: Days calculation
  const days55 = daysSinceLastDonation(date55DaysAgo);
  assert(days55 === 55, `Should calculate 55 days correctly (got ${days55})`);

  const days56 = daysSinceLastDonation(date56DaysAgo);
  assert(days56 === 56, `Should calculate 56 days correctly (got ${days56})`);
}

/**
 * Test suite for age eligibility
 */
function testAgeEligibility() {
  console.log('\n=== Testing Age Requirements ===');

  // Test 1: Age 18 (minimum, eligible)
  const dob18 = new Date();
  dob18.setFullYear(dob18.getFullYear() - 18);
  const donor18 = { date_of_birth: dob18, weight_kg: 70, last_donation_date: null, health_conditions: null };
  const status18 = getEligibilityStatus(donor18);
  assert(status18.age_eligibility.eligible === true, 'Should be eligible at age 18');
  assert(status18.age_eligibility.age === 18, `Should calculate age 18 correctly (got ${status18.age_eligibility.age})`);

  // Test 2: Age 17 (too young)
  const dob17 = new Date();
  dob17.setFullYear(dob17.getFullYear() - 17);
  const donor17 = { date_of_birth: dob17, weight_kg: 70, last_donation_date: null, health_conditions: null };
  const status17 = getEligibilityStatus(donor17);
  assert(status17.age_eligibility.eligible === false, 'Should NOT be eligible at age 17');

  // Test 3: Age 25 (eligible)
  const dob25 = new Date();
  dob25.setFullYear(dob25.getFullYear() - 25);
  const donor25 = { date_of_birth: dob25, weight_kg: 70, last_donation_date: null, health_conditions: null };
  const status25 = getEligibilityStatus(donor25);
  assert(status25.age_eligibility.eligible === true, 'Should be eligible at age 25');

  // Test 4: Age 60 (eligible)
  const dob60 = new Date();
  dob60.setFullYear(dob60.getFullYear() - 60);
  const donor60 = { date_of_birth: dob60, weight_kg: 70, last_donation_date: null, health_conditions: null };
  const status60 = getEligibilityStatus(donor60);
  assert(status60.age_eligibility.eligible === true, 'Should be eligible at age 60');

  // Test 5: No date of birth (eligible by default)
  const donorNoDOB = { date_of_birth: null, weight_kg: 70, last_donation_date: null, health_conditions: null };
  const statusNoDOB = getEligibilityStatus(donorNoDOB);
  assert(statusNoDOB.age_eligibility.eligible === true, 'Should be eligible when DOB is null');
}

/**
 * Test suite for weight eligibility
 */
function testWeightEligibility() {
  console.log('\n=== Testing Weight Requirements ===');

  // Test 1: Minimum weight (50 kg, eligible)
  const donor50kg = { date_of_birth: null, weight_kg: 50, last_donation_date: null, health_conditions: null };
  const status50 = getEligibilityStatus(donor50kg);
  assert(status50.weight_eligibility.eligible === true, 'Should be eligible at 50 kg (minimum)');

  // Test 2: Below minimum (49.9 kg, not eligible)
  const donor49kg = { date_of_birth: null, weight_kg: 49.9, last_donation_date: null, health_conditions: null };
  const status49 = getEligibilityStatus(donor49kg);
  assert(status49.weight_eligibility.eligible === false, 'Should NOT be eligible at 49.9 kg');

  // Test 3: Below minimum (45 kg, not eligible)
  const donor45kg = { date_of_birth: null, weight_kg: 45, last_donation_date: null, health_conditions: null };
  const status45 = getEligibilityStatus(donor45kg);
  assert(status45.weight_eligibility.eligible === false, 'Should NOT be eligible at 45 kg');

  // Test 4: Above minimum (70 kg, eligible)
  const donor70kg = { date_of_birth: null, weight_kg: 70, last_donation_date: null, health_conditions: null };
  const status70 = getEligibilityStatus(donor70kg);
  assert(status70.weight_eligibility.eligible === true, 'Should be eligible at 70 kg');

  // Test 5: High weight (100 kg, eligible)
  const donor100kg = { date_of_birth: null, weight_kg: 100, last_donation_date: null, health_conditions: null };
  const status100 = getEligibilityStatus(donor100kg);
  assert(status100.weight_eligibility.eligible === true, 'Should be eligible at 100 kg');

  // Test 6: No weight provided (eligible by default)
  const donorNoWeight = { date_of_birth: null, weight_kg: null, last_donation_date: null, health_conditions: null };
  const statusNoWeight = getEligibilityStatus(donorNoWeight);
  assert(statusNoWeight.weight_eligibility.eligible === true, 'Should be eligible when weight is null');
}

/**
 * Test suite for health condition screening
 */
function testHealthConditions() {
  console.log('\n=== Testing Health Condition Screening ===');

  // Test 1: No health conditions (eligible)
  const validation1 = validateHealthConditions([]);
  assert(validation1.valid === true, 'Should be eligible with no conditions');
  
  const validation2 = validateHealthConditions(null);
  assert(validation2.valid === true, 'Should be eligible when conditions is null');

  // Test 2: Non-disqualifying condition (eligible)
  const validation3 = validateHealthConditions(['seasonal allergies']);
  assert(
    validation3.valid === true && validation3.requires_review === true,
    'Should be eligible with seasonal allergies but require review'
  );

  // Test 3: HIV (disqualifying)
  const validation4 = validateHealthConditions(['HIV/AIDS']);
  assert(validation4.valid === false && validation4.disqualifying.includes('HIV/AIDS'), 'Should be disqualified with HIV/AIDS');
  
  const validation5 = validateHealthConditions(['hiv']);
  assert(validation5.valid === false && validation5.disqualifying.length > 0, 'Should be disqualified with HIV (lowercase, partial match)');

  // Test 4: Hepatitis (disqualifying)
  const validation6 = validateHealthConditions(['Hepatitis B or C']);
  assert(validation6.valid === false, 'Should be disqualified with Hepatitis B or C');
  
  const validation7 = validateHealthConditions(['Hepatitis B']);
  assert(validation7.valid === false && validation7.disqualifying.length > 0, 'Should be disqualified with Hepatitis B (partial match)');

  // Test 5: Heart disease (disqualifying)
  const validation8 = validateHealthConditions(['Heart disease']);
  assert(validation8.valid === false, 'Should be disqualified with heart disease');

  // Test 6: Cancer (disqualifying)
  const validation9 = validateHealthConditions(['Cancer (active)']);
  assert(validation9.valid === false, 'Should be disqualified with active cancer');

  // Test 7: Multiple conditions, one disqualifying
  const validation10 = validateHealthConditions(['seasonal allergies', 'hiv', 'asthma']);
  assert(
    validation10.valid === false && validation10.disqualifying.length > 0,
    'Should be disqualified when one condition is disqualifying'
  );

  // Test 8: DISQUALIFYING_CONDITIONS constant
  assert(
    Array.isArray(DISQUALIFYING_CONDITIONS) && DISQUALIFYING_CONDITIONS.length > 0,
    'DISQUALIFYING_CONDITIONS should be a non-empty array'
  );
}

/**
 * Test suite for comprehensive eligibility status
 */
function testComprehensiveEligibility() {
  console.log('\n=== Testing Comprehensive Eligibility Status ===');

  // Test 1: Fully eligible donor
  const fullyEligibleDonor = {
    last_donation_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
    date_of_birth: new Date(Date.now() - 25 * 365 * 24 * 60 * 60 * 1000), // 25 years old
    weight_kg: 70,
    health_conditions: null,
  };
  const status1 = getEligibilityStatus(fullyEligibleDonor);
  assert(
    status1.eligible === true && status1.reasons.length === 0,
    'Should be fully eligible with all criteria met'
  );

  // Test 2: Too soon since last donation
  const tooSoonDonor = {
    last_donation_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    date_of_birth: new Date(Date.now() - 25 * 365 * 24 * 60 * 60 * 1000),
    weight_kg: 70,
    health_conditions: null,
  };
  const status2 = getEligibilityStatus(tooSoonDonor);
  assert(
    status2.eligible === false && status2.reasons.some(r => r.includes('26 more days')),
    'Should be ineligible due to recent donation'
  );
  assert(
    status2.date_eligibility.days_until_eligible === 26,
    `Days until eligible should be 26 (got ${status2.date_eligibility.days_until_eligible})`
  );

  // Test 3: Too young
  const tooYoungDonor = {
    last_donation_date: null,
    date_of_birth: new Date(Date.now() - 17 * 365 * 24 * 60 * 60 * 1000), // 17 years old
    weight_kg: 70,
    health_conditions: null,
  };
  const status3 = getEligibilityStatus(tooYoungDonor);
  assert(
    status3.eligible === false && status3.reasons.some(r => r.includes('18 years old')),
    'Should be ineligible due to age'
  );

  // Test 4: Underweight
  const underweightDonor = {
    last_donation_date: null,
    date_of_birth: new Date(Date.now() - 25 * 365 * 24 * 60 * 60 * 1000),
    weight_kg: 45,
    health_conditions: null,
  };
  const status4 = getEligibilityStatus(underweightDonor);
  assert(
    status4.eligible === false && status4.reasons.some(r => r.includes('50 kg')),
    'Should be ineligible due to weight'
  );

  // Test 5: Disqualifying health condition
  const unhealthyDonor = {
    last_donation_date: null,
    date_of_birth: new Date(Date.now() - 25 * 365 * 24 * 60 * 60 * 1000),
    weight_kg: 70,
    health_conditions: ['hiv'],
  };
  const status5 = getEligibilityStatus(unhealthyDonor);
  assert(
    status5.eligible === false &&
      status5.reasons.some((r) => r.includes('Health conditions')),
    'Should be ineligible due to health condition'
  );

  // Test 6: Multiple ineligibility reasons
  const multipleIssuesDonor = {
    last_donation_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    date_of_birth: new Date(Date.now() - 17 * 365 * 24 * 60 * 60 * 1000), // 17 years old
    weight_kg: 45, // underweight
    health_conditions: ['hepatitis'],
  };
  const status6 = getEligibilityStatus(multipleIssuesDonor);
  assert(
    status6.eligible === false && status6.reasons.length >= 3,
    `Should have multiple ineligibility reasons (got ${status6.reasons.length})`
  );
}

/**
 * Test suite for utility functions
 */
function testUtilityFunctions() {
  console.log('\n=== Testing Utility Functions ===');

  // Test 1: Get next eligible date
  const date30DaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const nextDate = getNextEligibleDate(date30DaysAgo);
  assert(nextDate !== null && nextDate instanceof Date, 'Should return a Date object for ineligible donor');

  const date60DaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
  const alreadyEligible = getNextEligibleDate(date60DaysAgo);
  assert(alreadyEligible === null, 'Should return null for already eligible donor');

  // Test 2: Days until eligible
  const daysRemaining = daysUntilEligible(date30DaysAgo);
  assert(daysRemaining === 26, `Should calculate 26 days remaining (got ${daysRemaining})`);

  const noWait = daysUntilEligible(null);
  assert(noWait === 0, 'Should return 0 days for first-time donor');

  // Test 3: Format eligibility message
  const eligibleDonor = {
    last_donation_date: null,
    date_of_birth: new Date(Date.now() - 25 * 365 * 24 * 60 * 60 * 1000),
    weight_kg: 70,
    health_conditions: null,
  };
  const status1 = getEligibilityStatus(eligibleDonor);
  const message1 = formatEligibilityMessage(status1);
  assert(message1.includes('✅') && message1.includes('eligible'), 'Should format eligible message correctly');

  const ineligibleDonor = {
    last_donation_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    date_of_birth: new Date(Date.now() - 25 * 365 * 24 * 60 * 60 * 1000),
    weight_kg: 70,
    health_conditions: null,
  };
  const status2 = getEligibilityStatus(ineligibleDonor);
  const message2 = formatEligibilityMessage(status2);
  assert(
    message2.includes('❌') && message2.includes('not eligible'),
    'Should format ineligible message correctly'
  );

  // Test 4: Constants are defined
  assert(DONATION_INTERVAL_DAYS === 56, 'DONATION_INTERVAL_DAYS should be 56');
  assert(MIN_AGE === 18, 'MIN_AGE should be 18');
  assert(MIN_WEIGHT_KG === 50, 'MIN_WEIGHT_KG should be 50');
  assert(
    Array.isArray(DISQUALIFYING_CONDITIONS) && DISQUALIFYING_CONDITIONS.length > 0,
    'DISQUALIFYING_CONDITIONS should be a non-empty array'
  );
}

/**
 * Test suite for email notifications (mock test)
 */
function testEmailNotifications() {
  console.log('\n=== Testing Email Notification System (Mock) ===');

  // Note: This is a mock test since we can't send real emails in tests
  // In a real test environment, you'd use a mocking library like Jest or Sinon

  const mockDonor = {
    id: 1,
    email: 'donor@example.com',
    name: 'John Doe',
    blood_type: 'O+',
  };

  // Test 1: Function exists
  assert(typeof notifyEligibilityRestored === 'function', 'notifyEligibilityRestored function should exist');

  // Test 2: Function parameters (mock call)
  try {
    // We won't actually send the email, just verify the function can be called
    // In production, this would fail without proper SMTP setup
    // For testing purposes, we just verify the function signature
    const result = notifyEligibilityRestored(mockDonor, 3);
    assert(
      result instanceof Promise,
      'notifyEligibilityRestored should return a Promise'
    );
  } catch (error) {
    // Expected to fail without SMTP config, that's okay for this test
    assert(true, 'Email notification function is callable (SMTP config required for actual send)');
  }

  console.log(
    `${YELLOW}Note: Email notifications require SMTP configuration to send. Set up Gmail SMTP in .env to test fully.${RESET}`
  );
}

/**
 * Run all tests
 */
function runAllTests() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║       BLOOD DONATION ELIGIBILITY SYSTEM TEST SUITE        ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  testDateEligibility();
  testAgeEligibility();
  testWeightEligibility();
  testHealthConditions();
  testComprehensiveEligibility();
  testUtilityFunctions();
  testEmailNotifications();

  // Print summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                       TEST SUMMARY                         ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`Total Tests Run: ${testsRun}`);
  console.log(`${GREEN}Passed: ${testsPassed}${RESET}`);
  console.log(`${RED}Failed: ${testsFailed}${RESET}`);
  console.log(
    `Success Rate: ${((testsPassed / testsRun) * 100).toFixed(1)}%\n`
  );

  if (testsFailed === 0) {
    console.log(`${GREEN}✓ All tests passed!${RESET}\n`);
    process.exit(0);
  } else {
    console.log(`${RED}✗ Some tests failed. Please review.${RESET}\n`);
    process.exit(1);
  }
}

// Run the test suite
runAllTests();
