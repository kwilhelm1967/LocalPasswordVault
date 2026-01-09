# Complete Trial Form Flow Test
# Tests the entire process from form submission to API response

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TRIAL FORM FLOW TEST" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Direct API Test (bypasses CORS)
Write-Host "TEST 1: Direct API Call (bypasses CORS)" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Yellow
$testEmail = "flow-test-$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
$body = @{email=$testEmail} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "https://api.localpasswordvault.com/api/trial/signup" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing -ErrorAction Stop
    Write-Host "  ✅ API Status: $($response.StatusCode)" -ForegroundColor Green
    $json = $response.Content | ConvertFrom-Json
    Write-Host "  ✅ Success: $($json.success)" -ForegroundColor Green
    Write-Host "  ✅ Trial Key: $($json.trialKey)" -ForegroundColor Green
    Write-Host "  ✅ Expires: $($json.expiresAt)" -ForegroundColor Green
    $apiWorking = $true
} catch {
    Write-Host "  ❌ API Error: $($_.Exception.Message)" -ForegroundColor Red
    $apiWorking = $false
}

Write-Host ""

# Test 2: CORS Preflight Test
Write-Host "TEST 2: CORS Preflight (from localhost:8080)" -ForegroundColor Yellow
Write-Host "--------------------------------------------" -ForegroundColor Yellow
try {
    $headers = @{
        "Origin" = "http://localhost:8080"
        "Access-Control-Request-Method" = "POST"
        "Access-Control-Request-Headers" = "Content-Type"
    }
    $response = Invoke-WebRequest -Uri "https://api.localpasswordvault.com/api/trial/signup" -Method OPTIONS -Headers $headers -UseBasicParsing -ErrorAction Stop
    Write-Host "  ✅ CORS Preflight: $($response.StatusCode)" -ForegroundColor Green
    if ($response.Headers["Access-Control-Allow-Origin"]) {
        Write-Host "  ✅ Allowed Origin: $($response.Headers['Access-Control-Allow-Origin'])" -ForegroundColor Green
        $corsWorking = $true
    } else {
        Write-Host "  ⚠ No Access-Control-Allow-Origin header" -ForegroundColor Yellow
        $corsWorking = $false
    }
} catch {
    Write-Host "  ❌ CORS Blocked: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  → This means localhost:8080 is NOT allowed" -ForegroundColor Red
    $corsWorking = $false
}

Write-Host ""

# Test 3: Full Flow Simulation
Write-Host "TEST 3: Full Flow Simulation" -ForegroundColor Yellow
Write-Host "----------------------------" -ForegroundColor Yellow
if ($apiWorking) {
    Write-Host "  ✅ API endpoint is working" -ForegroundColor Green
} else {
    Write-Host "  ❌ API endpoint failed" -ForegroundColor Red
}

if ($corsWorking) {
    Write-Host "  ✅ CORS allows localhost:8080" -ForegroundColor Green
    Write-Host "  ✅ Browser form will work" -ForegroundColor Green
} else {
    Write-Host "  ❌ CORS blocks localhost:8080" -ForegroundColor Red
    Write-Host "  ❌ Browser form will show 'Failed to fetch'" -ForegroundColor Red
    Write-Host ""
    Write-Host "  SOLUTION:" -ForegroundColor Yellow
    Write-Host "  The server needs to allow localhost:8080." -ForegroundColor White
    Write-Host "  Current code only allows localhost:5173 and localhost:3000" -ForegroundColor White
    Write-Host "  in development mode." -ForegroundColor White
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
if ($apiWorking -and $corsWorking) {
    Write-Host "✅ COMPLETE FLOW WORKS" -ForegroundColor Green
    Write-Host "   The trial form will process successfully" -ForegroundColor Green
} elseif ($apiWorking -and -not $corsWorking) {
    Write-Host "⚠️  PARTIAL: API works but CORS blocks browser" -ForegroundColor Yellow
    Write-Host "   Direct API calls work, but browser form fails" -ForegroundColor Yellow
} else {
    Write-Host "❌ FLOW BROKEN" -ForegroundColor Red
    Write-Host "   Both API and CORS have issues" -ForegroundColor Red
}
Write-Host ""
