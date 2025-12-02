# Installer Verification Script
# Verifies the safety and integrity of Local Password Vault installers
# Usage: .\verify-installer.ps1 [-InstallerPath "path\to\installer.exe"]

param(
    [string]$InstallerPath = ""
)

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Local Password Vault - Installer Verify  " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Find installer if not specified
if (-not $InstallerPath) {
    $releaseDir = Join-Path $PSScriptRoot "..\release"
    if (Test-Path $releaseDir) {
        $installers = Get-ChildItem $releaseDir -Filter "*.exe" | Sort-Object LastWriteTime -Descending
        if ($installers.Count -gt 0) {
            $InstallerPath = $installers[0].FullName
            Write-Host "Found installer: $($installers[0].Name)" -ForegroundColor Green
        }
    }
}

if (-not $InstallerPath -or -not (Test-Path $InstallerPath)) {
    Write-Host "ERROR: No installer found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please either:" -ForegroundColor Yellow
    Write-Host "  1. Build the installer first: npm run dist:win" -ForegroundColor Yellow
    Write-Host "  2. Specify path: .\verify-installer.ps1 -InstallerPath 'path\to\installer.exe'" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

$results = @{
    Passed = 0
    Failed = 0
    Warnings = 0
}

function Write-Result {
    param([string]$Test, [string]$Status, [string]$Details = "")
    
    switch ($Status) {
        "PASS" { 
            Write-Host "  [PASS] " -ForegroundColor Green -NoNewline
            $script:results.Passed++
        }
        "FAIL" { 
            Write-Host "  [FAIL] " -ForegroundColor Red -NoNewline
            $script:results.Failed++
        }
        "WARN" { 
            Write-Host "  [WARN] " -ForegroundColor Yellow -NoNewline
            $script:results.Warnings++
        }
        "INFO" { 
            Write-Host "  [INFO] " -ForegroundColor Cyan -NoNewline
        }
    }
    Write-Host "$Test" -NoNewline
    if ($Details) {
        Write-Host " - $Details" -ForegroundColor Gray
    } else {
        Write-Host ""
    }
}

# ===========================================
# 1. FILE INFORMATION
# ===========================================
Write-Host "1. FILE INFORMATION" -ForegroundColor Yellow
Write-Host "   ----------------" -ForegroundColor Gray

$file = Get-Item $InstallerPath
Write-Result "File Name" "INFO" $file.Name
Write-Result "File Size" "INFO" "$([math]::Round($file.Length / 1MB, 2)) MB"
Write-Result "Created" "INFO" $file.CreationTime.ToString("yyyy-MM-dd HH:mm:ss")
Write-Result "Modified" "INFO" $file.LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss")

# ===========================================
# 2. SHA-256 HASH
# ===========================================
Write-Host ""
Write-Host "2. SHA-256 HASH (publish this on your website)" -ForegroundColor Yellow
Write-Host "   -------------------------------------------" -ForegroundColor Gray

$hash = Get-FileHash $InstallerPath -Algorithm SHA256
Write-Result "SHA-256" "INFO" $hash.Hash
Write-Host ""
Write-Host "   Copy for website:" -ForegroundColor Gray
Write-Host "   $($hash.Hash)" -ForegroundColor White

# ===========================================
# 3. DIGITAL SIGNATURE
# ===========================================
Write-Host ""
Write-Host "3. DIGITAL SIGNATURE" -ForegroundColor Yellow
Write-Host "   ------------------" -ForegroundColor Gray

$sig = Get-AuthenticodeSignature $InstallerPath
switch ($sig.Status) {
    "Valid" {
        Write-Result "Signature Status" "PASS" "Valid"
        Write-Result "Signer" "INFO" $sig.SignerCertificate.Subject
        Write-Result "Issuer" "INFO" $sig.SignerCertificate.Issuer
        Write-Result "Expires" "INFO" $sig.SignerCertificate.NotAfter.ToString("yyyy-MM-dd")
    }
    "NotSigned" {
        Write-Result "Signature Status" "WARN" "Not signed (will show SmartScreen warning)"
        Write-Host "   TIP: Purchase a code signing certificate to remove warnings" -ForegroundColor Gray
    }
    default {
        Write-Result "Signature Status" "FAIL" $sig.Status
    }
}

# ===========================================
# 4. QUICK MALWARE INDICATORS
# ===========================================
Write-Host ""
Write-Host "4. QUICK MALWARE INDICATORS" -ForegroundColor Yellow
Write-Host "   -------------------------" -ForegroundColor Gray

# Check file size (Electron apps are typically 50-150MB)
$sizeMB = $file.Length / 1MB
if ($sizeMB -lt 30) {
    Write-Result "File Size Check" "WARN" "Unusually small for Electron app ($([math]::Round($sizeMB, 1)) MB)"
} elseif ($sizeMB -gt 300) {
    Write-Result "File Size Check" "WARN" "Unusually large ($([math]::Round($sizeMB, 1)) MB)"
} else {
    Write-Result "File Size Check" "PASS" "Normal size for Electron app"
}

# Check file extension
if ($file.Extension -eq ".exe") {
    Write-Result "File Extension" "PASS" "Expected .exe extension"
} else {
    Write-Result "File Extension" "WARN" "Unexpected extension: $($file.Extension)"
}

# ===========================================
# 5. NPM AUDIT (if in project directory)
# ===========================================
Write-Host ""
Write-Host "5. DEPENDENCY AUDIT" -ForegroundColor Yellow
Write-Host "   -----------------" -ForegroundColor Gray

$projectRoot = Join-Path $PSScriptRoot ".."
$packageJson = Join-Path $projectRoot "package.json"

if (Test-Path $packageJson) {
    Write-Host "   Running npm audit..." -ForegroundColor Gray
    Push-Location $projectRoot
    $auditOutput = npm audit --json 2>$null | ConvertFrom-Json
    Pop-Location
    
    if ($auditOutput.metadata) {
        $vulns = $auditOutput.metadata.vulnerabilities
        $critical = $vulns.critical
        $high = $vulns.high
        $moderate = $vulns.moderate
        
        if ($critical -gt 0) {
            Write-Result "Critical Vulnerabilities" "FAIL" "$critical found"
        } else {
            Write-Result "Critical Vulnerabilities" "PASS" "None"
        }
        
        if ($high -gt 0) {
            Write-Result "High Vulnerabilities" "WARN" "$high found"
        } else {
            Write-Result "High Vulnerabilities" "PASS" "None"
        }
        
        Write-Result "Moderate Vulnerabilities" "INFO" "$moderate"
    } else {
        Write-Result "npm audit" "INFO" "Unable to parse audit results"
    }
} else {
    Write-Result "npm audit" "INFO" "Skipped (not in project directory)"
}

# ===========================================
# 6. VIRUSTOTAL RECOMMENDATION
# ===========================================
Write-Host ""
Write-Host "6. VIRUSTOTAL SCAN" -ForegroundColor Yellow
Write-Host "   ----------------" -ForegroundColor Gray

Write-Host "   Upload your installer to VirusTotal for comprehensive scanning:" -ForegroundColor Gray
Write-Host "   https://www.virustotal.com/gui/home/upload" -ForegroundColor Cyan
Write-Host ""

$openVT = Read-Host "   Open VirusTotal in browser? (y/n)"
if ($openVT -eq "y" -or $openVT -eq "Y") {
    Start-Process "https://www.virustotal.com/gui/home/upload"
}

# ===========================================
# SUMMARY
# ===========================================
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "                 SUMMARY                    " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Passed:   $($results.Passed)" -ForegroundColor Green
Write-Host "  Warnings: $($results.Warnings)" -ForegroundColor Yellow
Write-Host "  Failed:   $($results.Failed)" -ForegroundColor Red
Write-Host ""

if ($results.Failed -eq 0 -and $results.Warnings -eq 0) {
    Write-Host "  STATUS: ALL CHECKS PASSED" -ForegroundColor Green
} elseif ($results.Failed -eq 0) {
    Write-Host "  STATUS: PASSED WITH WARNINGS" -ForegroundColor Yellow
} else {
    Write-Host "  STATUS: ISSUES DETECTED" -ForegroundColor Red
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Output hash for easy copying
Write-Host "INSTALLER HASH (for website):" -ForegroundColor White
Write-Host $hash.Hash -ForegroundColor Cyan
Write-Host ""

