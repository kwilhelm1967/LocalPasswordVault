# Build LPV website zip FROM GITHUB (Local Password Vault site only - NOT LLV)
# Run from LocalPasswordVault root: .\scripts\build-lpv-website-from-github-release.ps1
# Older version: .\scripts\build-lpv-website-from-github-release.ps1 -Tag v1.2.0
# Output: zip in project folder ready to upload to localpasswordvault.com public_html

param([switch]$UseVaultRepo, [string]$Tag = "")

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$Repo = if ($UseVaultRepo) { "kwilhelm1967/Vault" } else { "kwilhelm1967/LocalPasswordVault" }

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  LPV site from GitHub (Local Password Vault only)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Repo: $Repo" -ForegroundColor Gray
Write-Host ""

if ($Tag) {
    $ZipballUrl = "https://github.com/$Repo/zipball/$Tag"
    $outZip = Join-Path $ProjectRoot "lpv-website-from-GitHub-$Tag.zip"
    Write-Host "[0/6] Using GitHub tag: $Tag" -ForegroundColor Yellow
} else {
    $ZipballUrl = "https://github.com/$Repo/zipball/main"
    $outZip = Join-Path $ProjectRoot "lpv-website-from-GitHub-LATEST.zip"
    Write-Host "[0/6] Using GitHub main branch..." -ForegroundColor Yellow
}
Write-Host ""

$tempDir = Join-Path $env:TEMP "lpv_github_latest"
$sourceZip = Join-Path $env:TEMP "lpv_source_latest.zip"

if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
if (Test-Path $sourceZip) { Remove-Item $sourceZip -Force }

Write-Host "[1/6] Downloading source from GitHub..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri $ZipballUrl -OutFile $sourceZip -UseBasicParsing
} catch {
    Write-Host "ERROR: Download failed. Check internet and repo $Repo." -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host "[2/6] Extracting..." -ForegroundColor Yellow
Expand-Archive -Path $sourceZip -DestinationPath $tempDir -Force

# GitHub zipball has one root folder like kwilhelm1967-LocalPasswordVault-abc1234
$rootFolder = Get-ChildItem -Path $tempDir -Directory | Select-Object -First 1
if (-not $rootFolder) {
    Write-Host "ERROR: Unexpected zip structure." -ForegroundColor Red
    exit 1
}

$LpvInZip = Join-Path $rootFolder.FullName "LPV"
if (-not (Test-Path $LpvInZip)) {
    Write-Host "ERROR: LPV folder not found in release." -ForegroundColor Red
    exit 1
}

Write-Host "[3/6] Building zip with files at TOP LEVEL (extract straight into public_html)..." -ForegroundColor Yellow
$buildDir = Join-Path $env:TEMP "lpv_build_latest"
if (Test-Path $buildDir) { Remove-Item $buildDir -Recurse -Force }
New-Item -ItemType Directory -Path $buildDir -Force | Out-Null
Copy-Item -Path (Join-Path $LpvInZip "*") -Destination $buildDir -Recurse -Force
$htaccess = @"
# localpasswordvault.com - Local Password Vault
DirectoryIndex index.html
"@
Set-Content -Path (Join-Path $buildDir ".htaccess") -Value $htaccess -Encoding ASCII

Write-Host "[4/6] Saving zip to project folder (including .htaccess)..." -ForegroundColor Yellow
if (Test-Path $outZip) { Remove-Item $outZip -Force }
# Include ALL files (e.g. .htaccess) - Get-ChildItem -Force so hidden files are in the zip
$buildItems = Get-ChildItem -Path $buildDir -Force
Compress-Archive -Path $buildItems.FullName -DestinationPath $outZip

# Verify: show title from built index.html so you can confirm it's Local Password Vault
$idxPath = Join-Path $buildDir "index.html"
if (Test-Path $idxPath) {
    $titleLine = Get-Content $idxPath -Raw | Select-String -Pattern "<title>([^<]+)</title>" -AllMatches | ForEach-Object { $_.Matches.Groups[1].Value }
    Write-Host "[5/6] Verify: built page title = $titleLine" -ForegroundColor Green
}

Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item $buildDir -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item $sourceZip -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Done. LPV-only site zip in project folder." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  File: $(Split-Path $outZip -Leaf)" -ForegroundColor Cyan
Write-Host "  Path: $outZip" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Source: GitHub $Repo $(if ($Tag) { "tag $Tag" } else { "main branch" }), LPV folder only." -ForegroundColor Gray
Write-Host ""
Write-Host "  UPLOAD TO HOST ARMADA:" -ForegroundColor White
Write-Host "  1. File Manager -> OPEN public_html (click into it)." -ForegroundColor Gray
Write-Host "  2. Upload this zip INTO public_html. Then EXTRACT here. Overwrite all." -ForegroundColor Gray
Write-Host "  3. Zip has NO folder - just index.html, pricing.html, .htaccess, etc. at top." -ForegroundColor Gray
Write-Host "  4. After extract you should see index.html and LPV files directly in public_html." -ForegroundColor Gray
Write-Host "  5. Test: https://localpasswordvault.com" -ForegroundColor Gray
Write-Host ""
Write-Host "  If you see a FOLDER (e.g. lpv-website...) instead of index.html at top:" -ForegroundColor Yellow
Write-Host "  Open that folder -> select ALL -> Move to public_html (parent). Delete empty folder." -ForegroundColor Yellow
Write-Host ""
