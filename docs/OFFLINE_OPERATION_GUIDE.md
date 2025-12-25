# 100% Offline Operation Guide

This document explains how the app achieves 100% offline operation after initial activation.

---

## Overview

**Local Password Vault is designed to work 100% offline after license activation.** This means:

- ✅ **Zero network calls** after activation
- ✅ **No phone-home** functionality
- ✅ **No analytics or tracking**
- ✅ **No re-validation** with server
- ✅ **All validation is local**

---

## How It Works

### 1. Initial Activation (One-Time Network Call)

When a user activates their license:

1. User enters license key
2. App generates device fingerprint (SHA-256 hash)
3. **Single network call**: `POST /api/lpv/license/activate`
   - Sends: `license_key` + `device_id`
   - Receives: **Signed license file**
4. App verifies signature locally
5. App stores signed license file in localStorage
6. **No more network calls ever**

### 2. Offline Validation (After Activation)

Every time the app starts:

1. App reads signed license file from localStorage
2. Verifies signature using HMAC-SHA256 (local crypto)
3. Checks device ID matches current device
4. If valid → App unlocks
5. If device mismatch → Shows transfer dialog
6. **Zero network calls**

### 3. License Transfer (One-Time Network Call)

If user needs to move license to new device:

1. User confirms transfer on new device
2. **Single network call**: `POST /api/lpv/license/transfer`
   - Sends: `license_key` + `new_device_id`
   - Receives: **New signed license file**
3. App verifies and stores new signed file
4. **No more network calls**

---

## Network Call Verification

### How to Verify Zero Network Calls

1. **Activate license** (requires internet)
2. **Open browser DevTools** → Network tab
3. **Filter by "Fetch/XHR"** or "WS" (WebSocket)
4. **Disconnect internet completely**
5. **Use app for 30+ minutes:**
   - Open/close app multiple times
   - Add/edit/delete entries
   - Generate passwords
   - Check trial status
   - Export/import data
   - Use all features

6. **Verify Network Tab:**
   - Should show **ZERO network requests**
   - No failed requests
   - No pending requests

### Expected Behavior

- ✅ App works normally offline
- ✅ All features functional
- ✅ No network errors
- ✅ No "connection failed" messages
- ✅ Trial expiration checks work (local JWT parsing)
- ✅ License validation works (local license file)

---

## Files That Should Have Network Calls

**Only these files should make network calls:**

- ✅ `src/utils/licenseService.ts`
  - `activateLicense()` - Line 297 (activation only)
  - `transferLicense()` - Line 414 (transfer only)

**All other files should be 100% local.**

---

## Files That Should NOT Have Network Calls

These files should **never** make network calls:

- ❌ `src/utils/trialService.ts` - All local (JWT parsing, localStorage)
- ❌ `src/utils/analyticsService.ts` - All NO-OP (empty functions)
- ❌ `src/utils/storage.ts` - All local (localStorage, IndexedDB)
- ❌ `src/App.tsx` - Periodic checks are local only
- ❌ All component files - No network calls

---

## Periodic Checks (Local Only)

The app has periodic checks every 30 seconds for trial expiration, but these are:

- ✅ **100% LOCAL** - Uses JWT token parsing
- ✅ **NO network calls** - Checks localStorage and date calculations
- ✅ **Offline compatible** - Works without internet

---

## Device Fingerprint Stability

The device fingerprint is designed to be stable across:

- ✅ App restarts
- ✅ Browser restarts
- ✅ Minor OS updates
- ✅ Screen resolution changes
- ✅ Timezone changes

**Components used:**
- OS platform and version
- Hardware concurrency (CPU cores)
- Screen resolution and color depth
- Timezone
- WebGL renderer (GPU info)
- System language

**Final device_id:** SHA-256 hash of all components

---

## License File Structure

The signed license file contains:

```json
{
  "license_key": "PERS-XXXX-XXXX-XXXX",
  "device_id": "a1b2c3d4e5f6...",
  "plan_type": "personal",
  "max_devices": 1,
  "activated_at": "2025-01-15T10:30:00.000Z",
  "product_type": "lpv",
  "transfer_count": 0,
  "last_transfer_at": null,
  "signature": "abc123...",
  "signed_at": "2025-01-15T10:30:00.000Z"
}
```

**Security:**
- Signature prevents tampering
- Device ID enforces binding
- All validation is local

---

## Troubleshooting

### Issue: App Makes Network Calls After Activation

**Solution:**
1. Check DevTools Network tab
2. Identify which file is making the call
3. Verify it's only `licenseService.ts` for activation/transfer
4. Remove any other network calls

### Issue: License Validation Fails Offline

**Solution:**
1. Verify license file exists in localStorage
2. Check signature verification
3. Verify device ID matches
4. Check for tampering

### Issue: Device Fingerprint Changes

**Solution:**
1. Verify fingerprint components are stable
2. Test across different scenarios
3. Handle fingerprint changes gracefully
4. Allow re-activation if needed

---

## Privacy Guarantees

✅ **After activation, app never contacts server**
- No analytics
- No tracking
- No re-validation
- No silent calls
- No background traffic
- No usage data transmitted

✅ **All validation is local**
- Signature verification (prevents tampering)
- Device ID matching (enforces binding)
- License status checks (reads local file only)

✅ **Server contact only happens:**
- During initial activation (one time)
- During license transfer (one time, if needed)

---

## Summary

**Local Password Vault is 100% offline after activation:**

1. ✅ **Initial activation** - One network call
2. ✅ **License transfer** - One network call (if needed)
3. ✅ **All other operations** - 100% local, zero network calls
4. ✅ **Privacy-first** - No data collection, no tracking
5. ✅ **Secure** - Signed license files, device binding
6. ✅ **Professional** - Robust error handling, user-friendly

**Your passwords stay on YOUR device. Always.**

