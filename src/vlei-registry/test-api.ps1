# Test script for VLEI Registry API (Applications and Certifiers)

# Test 1: Get application list
Write-Host "=== Testing Application List ===" -ForegroundColor Green
$response1 = Invoke-RestMethod -Uri "http://localhost:5137/api/Applications/list" -Method GET
$response1 | ConvertTo-Json -Depth 3

Write-Host "`n=== Testing Application Details ===" -ForegroundColor Green
# Test 2: Get application details for first app
if ($response1 -and $response1.Count -gt 0) {
    $appId = $response1[0].applicationId
    $response2 = Invoke-RestMethod -Uri "http://localhost:5137/api/Applications/$appId/details" -Method GET
    $response2 | ConvertTo-Json -Depth 3
}

Write-Host "`n=== Testing Create Application ===" -ForegroundColor Green
# Test 3: Create new application
$newApp = @{
    ApplicationId = "test-app-001"
    Description = "Test Application for API verification"
    CredentialSchema = "TestSchema-1.0.0"
    McpName = "Test MCP"
    ApiUrl = "https://test.api.example.com"
    PortalUrl = "https://test.portal.example.com"
}

$response3 = Invoke-RestMethod -Uri "http://localhost:5137/api/Applications" -Method POST -Body ($newApp | ConvertTo-Json) -ContentType "application/json"
$response3 | ConvertTo-Json -Depth 3

Write-Host "`n=== Verifying Created Application ===" -ForegroundColor Green
# Test 4: Verify the created application
$response4 = Invoke-RestMethod -Uri "http://localhost:5137/api/Applications/test-app-001/details" -Method GET
$response4 | ConvertTo-Json -Depth 3

Write-Host "`n=== Testing Certifier List ===" -ForegroundColor Green
# Test 5: Get certifier list
$response5 = Invoke-RestMethod -Uri "http://localhost:5137/api/Certifiers/list" -Method GET
$response5 | ConvertTo-Json -Depth 3

Write-Host "`n=== Testing Certifier Details ===" -ForegroundColor Green
# Test 6: Get certifier details for first certifier
if ($response5 -and $response5.Count -gt 0) {
    $certifierId = $response5[0].id
    $response6 = Invoke-RestMethod -Uri "http://localhost:5137/api/Certifiers/$certifierId/details" -Method GET
    $response6 | ConvertTo-Json -Depth 3
}

Write-Host "`n=== Testing Create Certifier ===" -ForegroundColor Green
# Test 7: Create new certifier
$newCertifier = @{
    Id = "test-certifier-001"
    BadgeTypes = @("TestCredential-1.0.0", "AnotherCredential-2.0.0")
    ContactUri = "https://test.contact.example.com"
    Name = "Test Certifier"
    Description = "Test Certifier for API verification"
}

$response7 = Invoke-RestMethod -Uri "http://localhost:5137/api/Certifiers" -Method POST -Body ($newCertifier | ConvertTo-Json) -ContentType "application/json"
$response7 | ConvertTo-Json -Depth 3