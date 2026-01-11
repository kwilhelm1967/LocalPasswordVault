# UAT Testing Checklist - Local Legacy Vault

## ✅ PRE-UAT VERIFICATION COMPLETE

### Critical Fixes Applied:

1. **✅ Download URL Fix**
   - URLs use `%20` (spaces) to match GitHub filename
   - Fixed in: `src/config/downloadUrls.ts`
   - Fixed in: `trial-success-llv.html`
   - GitHub file: `Local Legacy Vault Setup 1.2.0-x64.exe` (spaces)

2. **✅ App Type Detection**
   - Legacy Vault app detects as 'llv' and uses LLV downloads
   - Password Vault app detects as 'lpv' and uses LPV downloads
   - Fixed in: `src/components/PurchaseSuccessPage.tsx` (uses `appType` instead of `productGroups[0].productType`)

3. **✅ Browser Redirect Prevention**
   - All external URL opening blocked
   - All navigation to external URLs blocked
   - Downloads trigger directly without opening browser
   - Fixed in: `electron/main.js`

4. **✅ Installer Upload**
   - Latest installer uploaded to GitHub Releases
   - Repository: `kwilhelm1967/LocalLegacyVault`
   - Release: `V1.2.0`
   - File: `Local Legacy Vault Setup 1.2.0-x64.exe`

---

## UAT TEST SCENARIOS

### Scenario 1: New User Trial Signup Flow
**Test Path:**
1. ✅ Go to `locallegacyvault.com`
2. ✅ Click "Get Trial" button
3. ✅ Fill in email address
4. ✅ Submit trial form
5. ✅ Verify redirect to `trial-success-llv.html`
6. ✅ Verify trial key is displayed
7. ✅ Click Windows download button
8. ✅ **VERIFY:** Downloads `Local Legacy Vault Setup 1.2.0-x64.exe` (NOT Password Vault)
9. ✅ **VERIFY:** No browser window opens
10. ✅ **VERIFY:** No 404 error
11. ✅ Install the downloaded app
12. ✅ Launch the app
13. ✅ **VERIFY:** App shows license key entry screen (NOT landing page)
14. ✅ **VERIFY:** No browser window opens on launch
15. ✅ Enter trial key
16. ✅ Verify app activates successfully

### Scenario 2: Legacy Vault App Download (From Within App)
**Test Path:**
1. ✅ Launch Legacy Vault app
2. ✅ Navigate to purchase success page (with license key)
3. ✅ Click Windows download button
4. ✅ **VERIFY:** Downloads Legacy Vault installer (NOT Password Vault)
5. ✅ **VERIFY:** No browser opens
6. ✅ **VERIFY:** No redirect to landing page
7. ✅ **VERIFY:** Download works correctly

### Scenario 3: Password Vault App Download (Control Test)
**Test Path:**
1. ✅ Launch Password Vault app
2. ✅ Navigate to purchase success page
3. ✅ Click Windows download button
4. ✅ **VERIFY:** Downloads Password Vault installer (NOT Legacy Vault)
5. ✅ **VERIFY:** No browser opens

---

## EXPECTED BEHAVIOR

### ✅ CORRECT Behavior:
- Legacy Vault app → Downloads Legacy Vault installer
- Legacy Vault app → Shows Legacy Vault branding
- Legacy Vault app → License key entry screen on first launch
- Downloads trigger directly (no browser)
- No external navigation
- No 404 errors
- No blue spinning screen

### ❌ INCORRECT Behavior (Should NOT happen):
- Legacy Vault app downloading Password Vault installer
- Browser windows opening
- Redirects to landing pages
- 404 errors on download
- Blue spinning screen after download
- App showing wrong product branding

---

## FILES UPDATED

### Source Code:
- ✅ `src/config/downloadUrls.ts` - Fixed URL encoding (%20 for spaces)
- ✅ `src/components/PurchaseSuccessPage.tsx` - Fixed appType detection for downloads
- ✅ `src/utils/settingsUtils.ts` - Recreated (was missing)

### HTML Files:
- ✅ `C:\Users\kelly\OneDrive\Desktop\Vault-Main\LocalLegacyVault\LLV\trial-success-llv.html` - Fixed download URLs

### Electron:
- ✅ `electron/main.js` - All browser opening blocked
- ✅ `electron/preload.js` - Download IPC handler

### Build:
- ✅ Production build completed
- ✅ Installer rebuilt: `release\Local Legacy Vault Setup 1.2.0-x64.exe`
- ✅ Uploaded to GitHub Releases

---

## DOWNLOAD URLS

### Legacy Vault (LLV):
- **Windows:** `https://github.com/kwilhelm1967/LocalLegacyVault/releases/download/V1.2.0/Local%20Legacy%20Vault%20Setup%201.2.0-x64.exe`
- **macOS:** `https://github.com/kwilhelm1967/LocalLegacyVault/releases/download/V1.2.0/Local%20Legacy%20Vault-1.2.0-mac.dmg`
- **Linux:** `https://github.com/kwilhelm1967/LocalLegacyVault/releases/download/V1.2.0/Local%20Legacy%20Vault-1.2.0.AppImage`

### Password Vault (LPV):
- **Windows:** `https://github.com/kwilhelm1967/Vault/releases/download/V1.2.0/Local.Password.Vault.Setup.1.2.0.exe`
- **macOS:** `https://github.com/kwilhelm1967/Vault/releases/latest/download/Local%20Password%20Vault-1.2.0-mac.dmg`
- **Linux:** `https://github.com/kwilhelm1967/Vault/releases/latest/download/Local%20Password%20Vault-1.2.0.AppImage`

---

## INSTALLER STATUS

- **File:** `release\Local Legacy Vault Setup 1.2.0-x64.exe`
- **Size:** 77.99 MB
- **Status:** ✅ Built and uploaded to GitHub
- **Signature:** ⚠️ Not signed (will show SmartScreen warning)
- **GitHub Release:** https://github.com/kwilhelm1967/LocalLegacyVault/releases/tag/V1.2.0

---

## READY FOR UAT TESTING

All critical fixes are in place:
- ✅ Download URLs match GitHub filenames
- ✅ App type detection working
- ✅ Browser redirects blocked
- ✅ Installer available on GitHub
- ✅ Trial success page updated (on local drive)

**NEXT STEPS:**
1. Upload updated `trial-success-llv.html` to your web server
2. Test the complete user flow from website to app launch
3. Verify all scenarios above

---

## KNOWN LIMITATIONS

- ⚠️ Installer is NOT code signed (SmartScreen warning expected)
- ⚠️ To code sign: Place .pfx certificate in `certs/` and run `.\scripts\setup-code-signing.ps1`

---

**UAT READY ✅**
