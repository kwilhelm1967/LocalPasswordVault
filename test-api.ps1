$body = @{
    planType = 'personal'
    email = $null
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri 'https://api.localpasswordvault.com/api/checkout/session' -Method POST -ContentType 'application/json' -Body $body -ErrorAction Stop
    
    if ($response.success -and $response.url) {
        Write-Host ''
        Write-Host 'SUCCESS! Buy buttons are FIXED!' -ForegroundColor Green
        Write-Host 'Stripe checkout URL received!' -ForegroundColor Green
        Write-Host "Session ID: $($response.sessionId)" -ForegroundColor Cyan
        Write-Host "URL: $($response.url)" -ForegroundColor Cyan
        exit 0
    } else {
        Write-Host 'Still broken - API responded with issues' -ForegroundColor Red
        Write-Host ($response | ConvertTo-Json)
        exit 1
    }
} catch {
    if ($_.Exception.Message -like '*500*') {
        Write-Host ''
        Write-Host 'Still broken - 500 Internal Server Error' -ForegroundColor Red
        Write-Host 'The Stripe key may not be set correctly on the server.' -ForegroundColor Yellow
        exit 1
    } else {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}
