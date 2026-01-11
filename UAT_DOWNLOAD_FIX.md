# UAT Download Fix - Critical Instructions

## THE PROBLEM
Legacy Vault app was downloading Password Vault installer instead of Legacy Vault installer.

## THE FIX
Applied aggressive fix to ALWAYS use detected appType for downloads, completely ignoring any stored URLs.

## WHAT CHANGED
1. **handleDownload function**: Now ALWAYS regenerates URL using current appType
2. **App type detection**: Enhanced logging and case-insensitive checking
3. **Download blocking**: Prevents downloads until appType is detected

## FOR UAT TESTING - DO THIS:

### Step 1: Open Legacy Vault App
1. Install the latest Legacy Vault installer (v1.2.0)
2. Launch the app

### Step 2: Open Developer Console
1. Press `Ctrl+Shift+I` (Windows) to open DevTools
2. Go to the "Console" tab
3. Look for these log messages:
   - `[Main Process] app.getName() returned: Local Legacy Vault`
   - `[PurchaseSuccessPage] App name from Electron: Local Legacy Vault`
   - `[PurchaseSuccessPage] DETECTED LLV from app name: Local Legacy Vault`
   - `[PurchaseSuccessPage] Detected app type: llv`

### Step 3: Test Download
1. Navigate to Purchase Success Page (with license key in URL or session)
2. Click Windows download button
3. Check console for:
   - `[PurchaseSuccessPage] Download requested:`
   - Look for `appType: 'llv'`
   - Look for `FORCED_URL:` - should show Legacy Vault URL:
     - `https://github.com/kwilhelm1967/LocalLegacyVault/releases/download/V1.2.0/Local.Legacy.Vault.Setup.1.2.0-x64.exe`

### Step 4: Verify Downloaded File
1. Check your Downloads folder
2. File should be: `Local Legacy Vault Setup 1.2.0-x64.exe`
3. Should NOT be: `Local Password Vault Setup 1.2.0.exe`

## IF IT STILL DOESN'T WORK:

### Check Console Logs:
1. Copy ALL console output
2. Look for any error messages
3. Check what `app.getName()` returned
4. Check what `appType` was detected

### Possible Issues:
1. **App name not detected correctly**: Console will show what app.getName() returned
2. **AppType not set**: Console will show `appTypeDetected: false`
3. **Wrong URL**: Console will show the `FORCED_URL` being used

## EXPECTED BEHAVIOR:
- ✅ Legacy Vault app → Downloads Legacy Vault installer
- ✅ Console shows `appType: 'llv'`
- ✅ Console shows Legacy Vault download URL
- ✅ Download file is `Local Legacy Vault Setup 1.2.0-x64.exe`

## DO NOT EXPECT:
- ❌ Password Vault installer
- ❌ Browser window opening
- ❌ 404 errors
- ❌ Wrong repository URL (kwilhelm1967/Vault instead of kwilhelm1967/LocalLegacyVault)
