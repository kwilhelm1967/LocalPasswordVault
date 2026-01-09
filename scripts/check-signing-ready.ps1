# Check if Code Signing is Ready for LLV Builds
# Verifies all prerequisites for signing Local Legacy Vault installers

$ErrorActionPreference = "Stop"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Code Signing Readiness Check" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$allReady = $true

# Check 1: .env file exists
Write-Host "1. Checking .env file..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "   ✅ .env file exists" -ForegroundColor Green
    $envContent = Get-Content ".env" -Raw
    
    # Check 2: CSC_LINK is configured
    Write-Host "`n2. Checking CSC_LINK..." -ForegroundColor Yellow
    if ($envContent -match "CSC_LINK=(.+)") {
        $cscLink = $matches[1].Trim()
        Write-Host "   ✅ CSC_LINK found: $cscLink" -ForegroundColor Green
        
        # Check 3: Certificate file exists
        Write-Host "`n3. Checking certificate file..." -ForegroundColor Yellow
        if (Test-Path $cscLink) {
            $certFile = Get-Item $cscLink
            Write-Host "   ✅ Certificate file exists" -ForegroundColor Green
            Write-Host "   📄 File: $($certFile.Name)" -ForegroundColor Cyan
            Write-Host "   📁 Location: $($certFile.DirectoryName)" -ForegroundColor Cyan
            Write-Host "   📦 Size: $([math]::Round($certFile.Length / 1KB, 2)) KB" -ForegroundColor Cyan
        } else {
            Write-Host "   ❌ Certificate file NOT found at: $cscLink" -ForegroundColor Red
            $allReady = $false
        }
    } else {
        Write-Host "   ❌ CSC_LINK not found in .env" -ForegroundColor Red
        $allReady = $false
    }
    
    # Check 4: CSC_KEY_PASSWORD is configured
    Write-Host "`n4. Checking CSC_KEY_PASSWORD..." -ForegroundColor Yellow
    if ($envContent -match "CSC_KEY_PASSWORD=(.+)") {
        $password = $matches[1].Trim()
        if ($password.Length -gt 0) {
            Write-Host "   ✅ CSC_KEY_PASSWORD is set" -ForegroundColor Green
        } else {
            Write-Host "   ❌ CSC_KEY_PASSWORD is empty" -ForegroundColor Red
            $allReady = $false
        }
    } else {
        Write-Host "   ❌ CSC_KEY_PASSWORD not found in .env" -ForegroundColor Red
        $allReady = $false
    }
} else {
    Write-Host "   ❌ .env file NOT found" -ForegroundColor Red
    $allReady = $false
}

# Check 5: electron-builder.json has signing enabled
Write-Host "`n5. Checking electron-builder.json..." -ForegroundColor Yellow
if (Test-Path "electron-builder.json") {
    $builderConfig = Get-Content "electron-builder.json" -Raw
    if ($builderConfig -match '"sign"\s*:\s*"\$\{CSC_LINK\}"') {
        Write-Host "   ✅ Code signing is enabled in electron-builder.json" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Code signing NOT enabled in electron-builder.json" -ForegroundColor Red
        $allReady = $false
    }
} else {
    Write-Host "   ❌ electron-builder.json NOT found" -ForegroundColor Red
    $allReady = $false
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
if ($allReady) {
    Write-Host "✅ READY TO BUILD SIGNED INSTALLER!" -ForegroundColor Green
    Write-Host "`nNext step:" -ForegroundColor Yellow
    Write-Host "  npm run dist:llv:win" -ForegroundColor White
    Write-Host "`nAfter build, verify signature:" -ForegroundColor Yellow
    Write-Host "  .\scripts\verify-llv-signing.ps1" -ForegroundColor White
} else {
    Write-Host "❌ NOT READY - Setup Required" -ForegroundColor Red
    Write-Host "`nTo fix:" -ForegroundColor Yellow
    Write-Host "  .\scripts\setup-code-signing.ps1" -ForegroundColor White
    Write-Host "`nThis will guide you through:" -ForegroundColor Yellow
    Write-Host "  1. Locating your .pfx certificate file" -ForegroundColor White
    Write-Host "  2. Setting up .env with CSC_LINK and password" -ForegroundColor White
}
Write-Host "========================================`n" -ForegroundColor Cyan
