# Upload release file to GitHub
$file = "release\Local.Password.Vault.Setup.1.2.0.zip"
$repo = "kwilhelm1967/Vault"
$tag = "V1.2.0"
$filename = "Local.Password.Vault.Setup.1.2.0.zip"

Write-Host "Uploading $file to GitHub Release $tag..."

# Get release ID
$releaseUrl = "https://api.github.com/repos/$repo/releases/tags/$tag"
$release = Invoke-RestMethod -Uri $releaseUrl -Method Get
$releaseId = $release.id

Write-Host "Release ID: $releaseId"

# Upload file
$uploadUrl = "https://uploads.github.com/repos/$repo/releases/$releaseId/assets?name=$filename"
$headers = @{
    "Authorization" = "token $env:GITHUB_TOKEN"
    "Content-Type" = "application/zip"
}

$fileBytes = [System.IO.File]::ReadAllBytes((Resolve-Path $file))
$result = Invoke-RestMethod -Uri $uploadUrl -Method Post -Headers $headers -Body $fileBytes

Write-Host "Upload complete! File URL: $($result.browser_download_url)"
