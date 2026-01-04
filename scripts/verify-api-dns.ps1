# Verify API DNS Record Configuration
# This script verifies that api.localpasswordvault.com is correctly configured

Write-Host "==================================================================================" -ForegroundColor Cyan
Write-Host "DNS RECORD VERIFICATION FOR api.localpasswordvault.com" -ForegroundColor Cyan
Write-Host "==================================================================================" -ForegroundColor Cyan
Write-Host ""

# Expected values
$expectedIP = "45.79.40.42"
$domain = "api.localpasswordvault.com"

# Test 1: DNS Resolution
Write-Host "TEST 1: DNS Resolution" -ForegroundColor Yellow
Write-Host "----------------------" -ForegroundColor Yellow
Write-Host ""

try {
    $dnsResult = Resolve-DnsName -Name $domain -ErrorAction Stop
    $resolvedIP = $dnsResult[0].IPAddress
    
    Write-Host "[OK] DNS Resolution SUCCESS" -ForegroundColor Green
    Write-Host "  $domain -> $resolvedIP" -ForegroundColor Green
    
    if ($resolvedIP -eq $expectedIP) {
        Write-Host "  [OK] IP address matches expected ($expectedIP)" -ForegroundColor Green
        $dnsOK = $true
    } else {
        Write-Host "  [FAIL] IP address mismatch!" -ForegroundColor Red
        Write-Host "    Expected: $expectedIP" -ForegroundColor Red
        Write-Host "    Got:      $resolvedIP" -ForegroundColor Red
        $dnsOK = $false
    }
} catch {
    Write-Host "[FAIL] DNS Resolution FAILED" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    $dnsOK = $false
}

Write-Host ""

# Test 2: HTTPS Connection
Write-Host "TEST 2: HTTPS Connection" -ForegroundColor Yellow
Write-Host "-----------------------" -ForegroundColor Yellow
Write-Host ""

try {
    $healthUrl = "https://$domain/health"
    $response = Invoke-WebRequest -Uri $healthUrl -Method GET -TimeoutSec 10 -ErrorAction Stop
    
    Write-Host "[OK] HTTPS Connection SUCCESS" -ForegroundColor Green
    Write-Host "  Status Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "  Response: $($response.Content)" -ForegroundColor Green
    
    if ($response.Content -match '"status"\s*:\s*"ok"') {
        Write-Host "  [OK] Health check passed" -ForegroundColor Green
        $httpsOK = $true
    } else {
        Write-Host "  [WARN] Health check response unexpected" -ForegroundColor Yellow
        $httpsOK = $false
    }
} catch {
    Write-Host "[FAIL] HTTPS Connection FAILED" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    $httpsOK = $false
}

Write-Host ""

# Summary
Write-Host "==================================================================================" -ForegroundColor Cyan
Write-Host "VERIFICATION SUMMARY" -ForegroundColor Cyan
Write-Host "==================================================================================" -ForegroundColor Cyan
Write-Host ""

if ($dnsOK -and $httpsOK) {
    Write-Host "[SUCCESS] ALL TESTS PASSED" -ForegroundColor Green
    Write-Host ""
    Write-Host "The DNS record for api.localpasswordvault.com is correctly configured." -ForegroundColor Green
    Write-Host "The API endpoint is accessible and responding correctly." -ForegroundColor Green
    exit 0
} elseif ($dnsOK -and -not $httpsOK) {
    Write-Host "[WARN] PARTIAL SUCCESS" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "DNS resolution works, but HTTPS connection failed." -ForegroundColor Yellow
    Write-Host "This may indicate:" -ForegroundColor Yellow
    Write-Host "  - SSL certificate issue" -ForegroundColor Yellow
    Write-Host "  - Backend server not running" -ForegroundColor Yellow
    Write-Host "  - Firewall blocking connection" -ForegroundColor Yellow
    exit 1
} elseif (-not $dnsOK) {
    Write-Host "[FAIL] DNS CONFIGURATION FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "The DNS record for api.localpasswordvault.com is missing or incorrect." -ForegroundColor Red
    Write-Host ""
    Write-Host "Required DNS Record:" -ForegroundColor Yellow
    Write-Host "  Type: A" -ForegroundColor Yellow
    Write-Host "  Host: api" -ForegroundColor Yellow
    Write-Host "  Value: $expectedIP" -ForegroundColor Yellow
    Write-Host "  TTL: 3600" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please add this record in your DNS provider (Namecheap) and wait 5-10 minutes for propagation." -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "[FAIL] VERIFICATION FAILED" -ForegroundColor Red
    exit 1
}
