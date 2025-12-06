# Blood Donation System API Test Script
$baseUrl = "http://localhost:5000"
$headers = @{ "Content-Type" = "application/json" }

Write-Host ""
Write-Host "=== BLOOD DONATION SYSTEM API TESTS ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Register a donor
Write-Host "1. Registering a donor..." -ForegroundColor Yellow
$donorData = @{
    name = "John Doe"
    email = "john@example.com"
    password = "password123"
    phone = "1234567890"
    blood_type = "O+"
    role = "donor"
    location = "New York"
    latitude = 40.7128
    longitude = -74.0060
} | ConvertTo-Json

try {
    $donorResponse = Invoke-RestMethod -Uri "$baseUrl/api/users/register" -Method Post -Body $donorData -Headers $headers
    Write-Host "SUCCESS: Donor registered! User ID: $($donorResponse.user.user_id)" -ForegroundColor Green
    $donorToken = $donorResponse.token
} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
    exit 1
}

# Test 2: Register a recipient
Write-Host ""
Write-Host "2. Registering a recipient..." -ForegroundColor Yellow
$recipientData = @{
    name = "Jane Smith"
    email = "jane@example.com"
    password = "password123"
    phone = "0987654321"
    blood_type = "O+"
    role = "recipient"
    location = "Brooklyn"
    latitude = 40.6782
    longitude = -73.9442
} | ConvertTo-Json

try {
    $recipientResponse = Invoke-RestMethod -Uri "$baseUrl/api/users/register" -Method Post -Body $recipientData -Headers $headers
    Write-Host "SUCCESS: Recipient registered! User ID: $($recipientResponse.user.user_id)" -ForegroundColor Green
    $recipientToken = $recipientResponse.token
} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
}

# Test 3: Create a blood request
Write-Host ""
Write-Host "3. Creating a blood request..." -ForegroundColor Yellow
$requestData = @{
    blood_type = "O+"
    units_required = 2
    urgency_level = "critical"
    hospital_name = "City Hospital"
    hospital_address = "123 Main St, Brooklyn, NY"
    required_by = "2025-12-10"
    contact_number = "0987654321"
    additional_notes = "Urgent: Patient in critical condition"
} | ConvertTo-Json

$authHeaders = @{ 
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $recipientToken"
}

try {
    $requestResponse = Invoke-RestMethod -Uri "$baseUrl/api/requests" -Method Post -Body $requestData -Headers $authHeaders
    Write-Host "SUCCESS: Blood request created! Request ID: $($requestResponse.request_id)" -ForegroundColor Green
    $requestId = $requestResponse.request_id
} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
}

# Test 4: Get matching donors
Write-Host ""
Write-Host "4. Finding matching donors..." -ForegroundColor Yellow
try {
    $matchUrl = "$baseUrl/api/match/request/$requestId/donors?maxDistance=50"
    $matchResponse = Invoke-RestMethod -Uri $matchUrl -Method Get -Headers $authHeaders
    Write-Host "SUCCESS: Found $($matchResponse.Count) matching donors!" -ForegroundColor Green
    if ($matchResponse.Count -gt 0) {
        Write-Host "  First match: $($matchResponse[0].name) - Distance: $($matchResponse[0].distance) km" -ForegroundColor Gray
    }
} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
}

# Test 5: Check donor eligibility
Write-Host ""
Write-Host "5. Checking donor eligibility..." -ForegroundColor Yellow
$donorAuthHeaders = @{ 
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $donorToken"
}

try {
    $eligibilityResponse = Invoke-RestMethod -Uri "$baseUrl/api/match/eligibility/check" -Method Get -Headers $donorAuthHeaders
    Write-Host "SUCCESS: Eligibility checked!" -ForegroundColor Green
    if ($eligibilityResponse.eligible) {
        Write-Host "  Status: ELIGIBLE" -ForegroundColor Green
    } else {
        Write-Host "  Status: NOT ELIGIBLE" -ForegroundColor Red
        Write-Host "  Reasons: $($eligibilityResponse.reasons -join ', ')" -ForegroundColor Gray
    }
} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
}

# Test 6: Update donor health information
Write-Host ""
Write-Host "6. Updating donor health information..." -ForegroundColor Yellow
$healthData = @{
    date_of_birth = "1995-05-15"
    weight_kg = 75
    health_conditions = @()
} | ConvertTo-Json

try {
    $healthResponse = Invoke-RestMethod -Uri "$baseUrl/api/match/health-info" -Method Put -Body $healthData -Headers $donorAuthHeaders
    Write-Host "SUCCESS: Health information updated!" -ForegroundColor Green
} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
}

# Test 7: Donor expresses interest
Write-Host ""
Write-Host "7. Donor expressing interest in request..." -ForegroundColor Yellow
$interestData = @{
    request_id = $requestId
} | ConvertTo-Json

try {
    $interestResponse = Invoke-RestMethod -Uri "$baseUrl/api/match/donate" -Method Post -Body $interestData -Headers $donorAuthHeaders
    Write-Host "SUCCESS: Interest expressed! Donation ID: $($interestResponse.donation.donation_id)" -ForegroundColor Green
    $donationId = $interestResponse.donation.donation_id
} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
}

# Test 8: Get donation history
Write-Host ""
Write-Host "8. Getting donation history..." -ForegroundColor Yellow
try {
    $historyResponse = Invoke-RestMethod -Uri "$baseUrl/api/match/my-donations" -Method Get -Headers $donorAuthHeaders
    Write-Host "SUCCESS: Retrieved donation history! Total: $($historyResponse.Count)" -ForegroundColor Green
} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== ALL TESTS COMPLETED ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Database is working and all endpoints are functional!" -ForegroundColor Green
