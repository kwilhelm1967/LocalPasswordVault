# Build LPV website zip FROM YOUR LOCAL LPV FOLDER (no GitHub)
# Use this if the GitHub zip has wrong content. Uses C:\dev\LocalPasswordVault\LPV
# Run from LocalPasswordVault root: .\scripts\build-lpv-website-from-LOCAL.ps1
# Output: lpv-website-from-LOCAL.zip on your Desktop

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$Desktop = [Environment]::GetFolderPath("Desktop")
$LocalLpv = Join-Path $ProjectRoot "LPV"
$outZip = Join-Path $Desktop "lpv-website-from-LOCAL.zip"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  LPV site from YOUR LOCAL FOLDER" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Source: $LocalLpv" -ForegroundColor Gray
Write-Host ""

if (-not (Test-Path $LocalLpv)) {
    Write-Host "ERROR: LPV folder not found at $LocalLpv" -ForegroundColor Red
    exit 1
}

$buildDir = Join-Path $env:TEMP "lpv_build_local"
if (Test-Path $buildDir) { Remove-Item $buildDir -Recurse -Force }
New-Item -ItemType Directory -Path $buildDir -Force | Out-Null

Write-Host "[1/2] Copying LPV files (no subfolder - for public_html root)..." -ForegroundColor Yellow
Copy-Item -Path (Join-Path $LocalLpv "*") -Destination $buildDir -Recurse -Force
$htaccess = @"
# localpasswordvault.com - Local Password Vault
DirectoryIndex index.html
"@
Set-Content -Path (Join-Path $buildDir ".htaccess") -Value $htaccess -Encoding ASCII

Write-Host "[2/2] Saving zip to Desktop..." -ForegroundColor Yellow
if (Test-Path $outZip) { Remove-Item $outZip -Force }
Compress-Archive -Path (Join-Path $buildDir "*") -DestinationPath $outZip
Remove-Item $buildDir -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Done. Zip on Desktop: lpv-website-from-LOCAL.zip" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  This zip is from YOUR PC (LocalPasswordVault\LPV folder)." -ForegroundColor Gray
Write-Host "  Upload to Host Armada -> public_html -> Extract. Overwrite all." -ForegroundColor Gray
Write-Host "  Test: https://localpasswordvault.com" -ForegroundColor Gray
Write-Host ""
