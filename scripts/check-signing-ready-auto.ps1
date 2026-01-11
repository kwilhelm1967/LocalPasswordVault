# Quick check if code signing is ready
# This checks if certificate is in place and .env is configured

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Code Signing Readiness Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ready = $true

# Check 1: Certificate file exists
Write-Host "Checking for certificate file..." -ForegroundColor Yellow
$certFiles = Get-ChildItem "certs" -Filter "*.pfx","*.p12" -ErrorAction SilentlyContinue
if ($certFiles) {
    Write-Host "✓ Certificate found: $($certFiles[0].Name)" -ForegroundColor Green
    $certPath = $certFiles[0].FullName
} else {
    Write-Host "❌ No .pfx or .p12 certificate found in certs/ folder" -ForegroundColor Red
    Write-Host "   Please copy your certificate to: certs/" -ForegroundColor Yellow
    $ready = $false
}

# Check 2: .env file exists
Write-Host ""
Write-Host "Checking .env file..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "✓ .env file exists" -ForegroundColor Green
    
    # Check 3: CSC_LINK configured
    $envContent = Get-Content ".env" -ErrorAction SilentlyContinue
    $cscLink = ($envContent | Select-String "^CSC_LINK=") -replace "CSC_LINK=", ""
    $cscLink = $cscLink.Trim()
    
    if ($cscLink) {
        Write-Host "✓ CSC_LINK configured: $cscLink" -ForegroundColor Green
        
        # Check if path exists
        if (Test-Path $cscLink) {
            Write-Host "✓ Certificate file at CSC_LINK path exists" -ForegroundColor Green
        } else {
            Write-Host "❌ Certificate file not found at: $cscLink" -ForegroundColor Red
            $ready = $false
        }
    } else {
        Write-Host "❌ CSC_LINK not found in .env" -ForegroundColor Red
        Write-Host "   Run: .\scripts\setup-code-signing.ps1" -ForegroundColor Yellow
        $ready = $false
    }
    
    # Check 4: CSC_KEY_PASSWORD configured
    $cscPassword = ($envContent | Select-String "^CSC_KEY_PASSWORD=") -replace "CSC_KEY_PASSWORD=", ""
    $cscPassword = $cscPassword.Trim()
    
    if ($cscPassword) {
        Write-Host "✓ CSC_KEY_PASSWORD is set" -ForegroundColor Green
    } else {
        Write-Host "❌ CSC_KEY_PASSWORD not found in .env" -ForegroundColor Red
        Write-Host "   Run: .\scripts\setup-code-signing.ps1" -ForegroundColor Yellow
        $ready = $false
    }
} else {
    Write-Host "❌ .env file not found" -ForegroundColor Red
    Write-Host "   Run: .\scripts\setup-code-signing.ps1" -ForegroundColor Yellow
    $ready = $false
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
if ($ready) {
    Write-Host "✓ READY TO BUILD SIGNED INSTALLER!" -ForegroundColor Green
    Write-Host ""
    Write-Host "I can now rebuild the signed installer." -ForegroundColor Yellow
    Write-Host "Run: npm run dist:llv:win" -ForegroundColor White
} else {
    Write-Host "❌ NOT READY - Fix issues above" -ForegroundColor Red
    Write-Host ""
    Write-Host "To fix:" -ForegroundColor Yellow
    Write-Host "1. Copy your .pfx certificate to certs/ folder" -ForegroundColor White
    Write-Host "2. Run: .\scripts\setup-code-signing.ps1" -ForegroundColor White
}
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

exit $(if ($ready) { 0 } else { 1 })
