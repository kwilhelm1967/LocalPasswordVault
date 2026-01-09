# Setup eSigner Cloud Key Adapter for Code Signing
# SSL.com no longer provides .pfx files - we use eSigner CKA instead

$ErrorActionPreference = "Stop"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Setup eSigner Cloud Key Adapter" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "SSL.com no longer provides .pfx files (since June 2023)" -ForegroundColor Yellow
Write-Host "We'll use eSigner Cloud Key Adapter (CKA) instead`n" -ForegroundColor Cyan

Write-Host "STEP 1: Download eSigner CKA" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Yellow
Write-Host "1. Go to: https://www.ssl.com/how-to/install-esigner-cloud-key-adapter/" -ForegroundColor White
Write-Host "2. Download the Windows installer" -ForegroundColor White
Write-Host "3. Or download directly from:" -ForegroundColor White
Write-Host "   https://www.ssl.com/download/esigner-cloud-key-adapter/" -ForegroundColor Cyan
Write-Host ""
$continue = Read-Host "Press Enter when you have downloaded the installer"

Write-Host ""
Write-Host "STEP 2: Install eSigner CKA" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Yellow
Write-Host "Please provide the path to the downloaded installer:" -ForegroundColor White
$installerPath = Read-Host "Installer path (or drag and drop file here)"

# Clean up path
$installerPath = $installerPath.Trim('"')

if (-not (Test-Path $installerPath)) {
    Write-Host "❌ Installer not found: $installerPath" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Installing eSigner CKA..." -ForegroundColor Green
Write-Host "Follow the installation wizard:" -ForegroundColor Yellow
Write-Host "  - Choose 'Automated Mode' for CI/CD (no OTP needed)" -ForegroundColor White
Write-Host "  - OR 'Manual Mode' if you want OTP verification each time" -ForegroundColor White
Write-Host ""

# Run installer
Start-Process -FilePath $installerPath -Wait

Write-Host ""
Write-Host "STEP 3: Configure Certificate Subject Name" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Yellow
Write-Host "After installation, we need to find your certificate subject name." -ForegroundColor White
Write-Host ""
Write-Host "Your certificate reference: co-a01kb3guod5" -ForegroundColor Cyan
Write-Host "Certificate name: Local Password Vault" -ForegroundColor Cyan
Write-Host ""
Write-Host "The subject name should be something like:" -ForegroundColor White
Write-Host "  'CN=Local Password Vault, O=Your Company, ...'" -ForegroundColor Gray
Write-Host ""
$subjectName = Read-Host "Enter the certificate subject name (or press Enter to use 'Local Password Vault')"

if ([string]::IsNullOrWhiteSpace($subjectName)) {
    $subjectName = "Local Password Vault"
    Write-Host "Using: $subjectName" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "STEP 4: Update electron-builder.json" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Yellow

# Read electron-builder.json
$builderJson = Get-Content "electron-builder.json" -Raw | ConvertFrom-Json

# Update win section
if (-not $builderJson.win) {
    $builderJson | Add-Member -MemberType NoteProperty -Name "win" -Value @{}
}

# Set certificate subject name
$builderJson.win.certificateSubjectName = $subjectName

# Keep existing sign configuration (will use CKA)
if (-not $builderJson.win.sign) {
    $builderJson.win.sign = "${CSC_LINK}"
}

# Save updated config
$builderJson | ConvertTo-Json -Depth 10 | Set-Content "electron-builder.json"

Write-Host "✅ Updated electron-builder.json" -ForegroundColor Green
Write-Host "   certificateSubjectName: $subjectName" -ForegroundColor Cyan

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Verify eSigner CKA is running (check system tray)" -ForegroundColor White
Write-Host "2. Test signing: npm run dist:llv:win" -ForegroundColor White
Write-Host "3. Verify signature: .\scripts\verify-llv-signing.ps1" -ForegroundColor White
Write-Host ""
Write-Host "Note: If using Manual Mode, you'll need to approve each signing" -ForegroundColor Gray
Write-Host "      with OTP from your authenticator app." -ForegroundColor Gray
Write-Host ""
