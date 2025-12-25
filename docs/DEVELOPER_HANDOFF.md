# Developer Handoff: License Activation & Offline Validation

## Overview

This document outlines what's **already implemented** and what **remains** for a developer to ensure all license activation scenarios work correctly with 100% offline operation after initial activation.

---

## ✅ What's Already Implemented

### Backend (100% Complete)

1. **License Key Generation** ✅
   - All product types: Personal, Family, LLV Personal, LLV Family, Trial
   - Proper prefixes: `PERS-`, `FMLY-`, `LLVP-`, `LLVF-`, `TRIA-`
   - Location: `backend/services/licenseGenerator.js`

2. **Stripe Integration** ✅
   - Single product checkout
   - Bundle checkout with 13.94% discount
   - Webhook handling for payment completion
   - License creation on successful payment
   - Email delivery with license keys
   - Location: `backend/services/stripe.js`, `backend/routes/webhooks.js`

3. **Database (Supabase)** ✅
   - All tables created and working
   - License storage with device binding
   - Device activation tracking (for family plans)
   - Trial management
   - Webhook event logging
   - Location: `backend/database/db.js`, `backend/database/schema.sql`

4. **API Endpoints** ✅
   - `POST /api/lpv/license/activate` - LPV activation (device binding)
   - `POST /api/lpv/license/transfer` - License transfer to new device
   - `POST /api/licenses/validate` - Legacy validation (returns JWT)
   - `GET /api/checkout/session/:sessionId` - Retrieve license after purchase
   - `POST /api/trial/signup` - Trial signup
   - Location: `backend/routes/`

### Frontend (Partially Complete)

1. **Device Fingerprint Generation** ✅
   - Stable hardware-based device ID
   - SHA-256 hash of system characteristics
   - Location: `src/utils/deviceFingerprint.ts`

2. **License Service** ✅
   - License activation flow
   - Device binding validation
   - Local license file storage
   - Transfer handling
   - Location: `src/utils/licenseService.ts`

3. **UI Components** ✅
   - License activation screen
   - Transfer dialog
   - Error handling
   - Location: `src/components/LicenseScreen.tsx`, `src/components/LicenseTransferDialog.tsx`

---

## ⚠️ What Needs Developer Attention

### Critical Issues

#### 1. **JWT Token Usage Mismatch** 🔴 HIGH PRIORITY

**Problem:**
- Backend endpoint `/api/licenses/validate` generates JWT tokens for offline validation
- Frontend uses `/api/lpv/license/activate` which does NOT return JWT tokens
- Frontend relies on local license files for offline validation (not JWT)

**Current State:**
- `backend/routes/lpv-licenses.js` - Returns `{ status, mode, plan_type }` (NO JWT)
- `backend/routes/licenses.js` - Returns `{ success, data: { token, ... } }` (HAS JWT)

**Decision Needed:**
- **Option A:** Update `/api/lpv/license/activate` to return JWT token (recommended)
- **Option B:** Keep local license file approach (current implementation)
- **Option C:** Use JWT for offline validation instead of local files

**Files to Modify:**
- `backend/routes/lpv-licenses.js` - Add JWT generation
- `src/utils/licenseService.ts` - Store and validate JWT tokens
- `src/utils/licenseService.ts` - Add JWT validation for offline checks

**Recommended Fix:**
```javascript
// In backend/routes/lpv-licenses.js - after successful activation
const token = jwt.sign(
  {
    licenseKey: normalizedKey,
    planType: license.plan_type,
    hardwareHash: device_id,
    maxDevices: license.max_devices,
    activatedAt: new Date().toISOString(),
  },
  process.env.JWT_SECRET,
  { expiresIn: '365d' }
);

return res.json({
  status: 'activated',
  mode: 'first_activation',
  plan_type: license.plan_type,
  token, // ADD THIS
});
```

#### 2. **Offline JWT Validation** 🔴 HIGH PRIORITY

**Problem:**
- JWT tokens are generated but not validated offline
- Frontend needs to verify JWT signature locally (without API call)
- JWT secret must be shared between backend and frontend (or use public key)

**Current State:**
- JWT tokens are generated with `JWT_SECRET` (symmetric key)
- Frontend cannot verify signature without the secret
- Local license file validation is used instead

**Solution Options:**

**Option A: Symmetric Key (Simpler, Less Secure)**
- Share `JWT_SECRET` in frontend build (not recommended for production)
- Use environment variable that gets bundled

**Option B: Asymmetric Key (More Secure)**
- Backend signs with private key
- Frontend verifies with public key
- Public key can be safely bundled

**Option C: Keep Local File Approach (Current)**
- Continue using local license files
- Remove JWT generation from backend
- Simplify to device_id matching only

**Files to Modify:**
- `src/utils/licenseService.ts` - Add JWT verification
- `src/utils/safeUtils.ts` - Add JWT signature verification
- `backend/routes/lpv-licenses.js` - Return JWT token

#### 3. **Family Plan Device Management** 🟡 MEDIUM PRIORITY

**Problem:**
- Family plans support 5 devices
- Backend tracks devices in `device_activations` table
- Frontend needs UI to:
  - View active devices
  - Deactivate devices
  - See device count

**Current State:**
- Backend: ✅ Tracks devices correctly
- Frontend: ❌ No UI for device management

**Files to Create/Modify:**
- `src/components/DeviceManagementScreen.tsx` - New component
- `src/utils/licenseService.ts` - Add device list/management methods
- `backend/routes/licenses.js` - Add device deactivation endpoint (if needed)

#### 4. **Bundle Purchase Flow** 🟡 MEDIUM PRIORITY

**Problem:**
- Backend creates multiple licenses for bundles
- Frontend needs to handle multiple license keys
- Email sends all keys, but frontend activation flow may not handle multiple keys

**Current State:**
- Backend: ✅ Creates all licenses correctly
- Email: ✅ Sends all keys in bundle email
- Frontend: ⚠️ May need updates for multiple key activation

**Files to Verify:**
- `src/components/LicenseScreen.tsx` - Ensure it can handle multiple keys
- `src/utils/licenseService.ts` - Verify activation flow for bundles

#### 5. **Error Handling & Edge Cases** 🟡 MEDIUM PRIORITY

**Scenarios to Test:**

1. **Network Failure During Activation**
   - User enters key, network fails
   - Should show clear error message
   - Should allow retry

2. **Device ID Changes**
   - OS update changes fingerprint
   - Hardware change
   - Should handle gracefully (may require transfer)

3. **License Revoked**
   - Backend revokes license
   - Frontend should detect on next activation attempt
   - Should show appropriate message

4. **Transfer Limit Reached**
   - User exceeds 3 transfers/year
   - Should show clear message
   - Should provide support contact

5. **Expired Trial**
   - Trial expires while app is offline
   - Should detect on next app launch
   - Should show upgrade prompt

**Files to Review:**
- `src/utils/licenseService.ts` - Error handling
- `src/components/LicenseScreen.tsx` - Error messages
- `src/components/LicenseTransferDialog.tsx` - Transfer flow

---

## 🧪 Testing Checklist

### Activation Scenarios

- [ ] **First Activation (Personal)**
  - Enter valid personal license key
  - Verify device binding
  - Verify offline operation works
  - Verify local license file created

- [ ] **First Activation (Family)**
  - Enter valid family license key
  - Verify device binding
  - Verify can activate on 5 devices
  - Verify device limit enforcement

- [ ] **Same Device Reactivation**
  - Activate license
  - Close app
  - Reopen app
  - Enter same key
  - Should work without transfer

- [ ] **Different Device (Transfer)**
  - Activate on Device A
  - Enter key on Device B
  - Should show transfer dialog
  - Complete transfer
  - Verify Device B works
  - Verify Device A no longer works

- [ ] **Transfer Limit**
  - Perform 3 transfers
  - Attempt 4th transfer
  - Should show limit reached message

- [ ] **Invalid Key**
  - Enter invalid format
  - Enter non-existent key
  - Enter revoked key
  - Should show appropriate errors

- [ ] **Network Failure**
  - Disable network
  - Attempt activation
  - Should show network error
  - Re-enable network
  - Should allow retry

### Offline Operation

- [ ] **After Activation**
  - Activate license
  - Disconnect internet
  - Use app for 30+ minutes
  - Verify no network requests
  - Verify all features work

- [ ] **App Restart Offline**
  - Activate license
  - Disconnect internet
  - Close app
  - Reopen app
  - Should work without network

- [ ] **Trial Expiration Offline**
  - Start trial
  - Wait for expiration (or modify date)
  - Disconnect internet
  - Open app
  - Should detect expiration locally

### Bundle Purchases

- [ ] **Bundle Purchase Flow**
  - Purchase bundle via Stripe
  - Receive email with multiple keys
  - Activate first key
  - Activate second key
  - Verify both work

- [ ] **Bundle Email Parsing**
  - Verify email contains all keys
  - Verify keys are clearly labeled
  - Verify download links work

---

## 📋 Implementation Priority

### Phase 1: Critical (Must Have)
1. ✅ Backend license generation
2. ✅ Stripe integration
3. ✅ Database setup
4. ⚠️ **JWT token return in activation endpoint**
5. ⚠️ **Offline JWT validation (or confirm local file approach)**

### Phase 2: Important (Should Have)
6. ⚠️ Family plan device management UI
7. ⚠️ Bundle purchase frontend handling
8. ⚠️ Comprehensive error handling
9. ⚠️ Edge case testing

### Phase 3: Nice to Have
10. Device management screen
11. License status dashboard
12. Transfer history

---

## 🔧 Quick Start for Developer

### 1. Review Current Implementation

```bash
# Backend endpoints
backend/routes/lpv-licenses.js    # LPV activation (no JWT currently)
backend/routes/licenses.js         # Legacy validation (has JWT)
backend/routes/webhooks.js         # Stripe payment handling

# Frontend services
src/utils/licenseService.ts        # Main license logic
src/utils/deviceFingerprint.ts     # Device ID generation
src/components/LicenseScreen.tsx   # Activation UI
```

### 2. Test Current Flow

1. Start backend: `cd backend && npm start`
2. Start frontend: `npm run dev`
3. Purchase a license via Stripe
4. Activate license in app
5. Disconnect internet
6. Verify app works offline

### 3. Identify Gaps

- Check if JWT tokens are used for offline validation
- Verify local license file approach works
- Test all activation scenarios
- Test offline operation

### 4. Implement Missing Pieces

Based on gaps identified, implement:
- JWT token handling (if needed)
- Device management (for family plans)
- Error handling improvements
- Edge case handling

---

## 📝 Notes

### Current Architecture

**Backend:**
- Supabase (PostgreSQL) for data storage
- Stripe for payments
- Brevo for emails
- JWT for offline validation tokens

**Frontend:**
- Electron app
- Local license file storage
- Device fingerprint for binding
- Offline-first design

### Key Design Decisions

1. **Offline-First:** App must work 100% offline after activation
2. **Device Binding:** License tied to device fingerprint
3. **Transfer Support:** 3 transfers per year allowed
4. **No Cloud Storage:** All data local, no user data transmitted

### Security Considerations

- Device fingerprint is SHA-256 hash (one-way)
- JWT tokens signed with secret key
- License keys validated against database
- No user data transmitted (only license key + device hash)

---

## 🎯 Success Criteria

A developer should ensure:

1. ✅ All purchase scenarios work (single, bundle, all product types)
2. ✅ All activation scenarios work (first, same device, transfer)
3. ✅ 100% offline operation after activation
4. ✅ Device binding enforced correctly
5. ✅ Transfer limits enforced
6. ✅ Error messages are clear and helpful
7. ✅ Edge cases handled gracefully
8. ✅ Family plan device management works
9. ✅ Bundle purchases handled correctly

---

## 📞 Support

If questions arise during implementation:
- Review `docs/PRODUCTION_LAUNCH_GUIDE.md` for setup details
- Review `backend/README.md` for API documentation
- Check `backend/database/schema.sql` for database structure
- Review existing code comments for implementation details

