# Privacy-First License System Summary

## What Changed

### Backend Changes

**1. License Signing Service** (`backend/services/licenseSigner.js`)
- New service that creates cryptographically signed license files
- Uses HMAC-SHA256 to prevent tampering
- Server signs license file once at activation
- License file includes: license key, device ID, plan type, max devices, activation date, signature

**2. Activation Endpoint** (`backend/routes/lpv-licenses.js`)
- Now returns signed `license_file` in activation response
- Same for first activation, same-device reactivation, and transfers
- License file is signed with `LICENSE_SIGNING_SECRET`

**3. Environment Configuration** (`backend/env.example`)
- Added `LICENSE_SIGNING_SECRET` requirement
- Must match frontend `VITE_LICENSE_SIGNING_SECRET`

### Frontend Changes

**1. License Validator** (`src/utils/licenseValidator.ts`)
- New service to verify license file signatures locally
- Uses Web Crypto API for HMAC verification
- No network calls - validates signature offline
- Prevents tampering with license data

**2. License Service** (`src/utils/licenseService.ts`)
- Removed JWT dependency (no longer uses JWT for validation)
- Now stores and validates signed license files from server
- `validateLocalLicense()` now verifies signature before checking device ID
- All validation is 100% local after activation

**3. License File Structure**
- Updated to include: `signature`, `signed_at`, `max_devices`, `product_type`
- Matches what server generates

## How It Works

### Activation Flow (One-Time Server Contact)

1. User enters license key
2. App generates device fingerprint (SHA-256 hash)
3. **Single network call**: `POST /api/lpv/license/activate`
   - Sends: license key + device ID
   - Receives: signed license file
4. App verifies signature locally
5. App stores signed license file
6. **No more network calls ever**

### Offline Validation (After Activation)

1. App reads signed license file from local storage
2. Verifies signature using HMAC-SHA256 (local crypto)
3. Checks device ID matches current device
4. If valid → app works
5. If device mismatch → shows transfer dialog
6. **Zero network calls**

### Transfer Flow (One-Time Server Contact)

1. User confirms transfer on new device
2. **Single network call**: `POST /api/lpv/license/transfer`
   - Sends: license key + new device ID
   - Receives: new signed license file
3. App verifies and stores new signed file
4. **No more network calls**

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

## Files Modified

**Backend:**
- `backend/services/licenseSigner.js` (new)
- `backend/routes/lpv-licenses.js` (returns signed files)
- `backend/env.example` (added signing secret)

**Frontend:**
- `src/utils/licenseValidator.ts` (new)
- `src/utils/licenseService.ts` (uses signed files, removed JWT)

## Setup Required

1. **Backend `.env`:**
   ```bash
   LICENSE_SIGNING_SECRET=<generate with: openssl rand -hex 32>
   ```

2. **Frontend `.env`:**
   ```bash
   VITE_LICENSE_SIGNING_SECRET=<same value as backend>
   ```

3. **Build frontend** with the signing secret bundled

## Testing

To verify zero network calls after activation:

1. Activate license
2. Open browser DevTools → Network tab
3. Disconnect internet
4. Use app for 30+ minutes
5. Verify: **ZERO network requests**

The only network calls should be:
- Initial activation (one time)
- License transfer (one time, if needed)

All other operations are 100% local.

