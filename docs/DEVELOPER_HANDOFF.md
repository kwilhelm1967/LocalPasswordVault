# Developer Handoff: License Activation & Offline Validation

## Overview

This document outlines what needs to be done to ensure all license activation scenarios work correctly with 100% offline operation after initial activation.

**Key Architecture:** The system uses **signed license files** (HMAC-SHA256) for offline validation. When a license is activated or transferred, the backend returns a signed license file that is stored locally and validated offline without any network calls. This ensures complete privacy and 100% offline operation after initial activation.

---

## ✅ What's Already Implemented

### Backend (Complete)
- License key generation (all product types)
- Stripe integration (single and bundle purchases)
- Database setup (Supabase)
- API endpoints (activation, transfer, status)
- Signed license file generation (HMAC-SHA256)

### Frontend (Complete)
- Device fingerprint generation
- License service (activation, transfer, validation)
- UI components (activation screen, transfer dialog, error handling)
- Device management screen
- Bundle purchase handling
- License status dashboard

**Key Files:**
- `backend/routes/lpv-licenses.js` - Activation endpoints
- `backend/services/licenseSigner.js` - HMAC-SHA256 signing
- `src/utils/licenseService.ts` - License logic
- `src/utils/licenseValidator.ts` - Offline validation
- `src/components/LicenseScreen.tsx` - Activation UI

---

## 🎯 Tasks to Complete

**Summary:** This handoff includes both **implementation tasks** (code changes) and **testing tasks** (verification). Complete the implementation tasks first, then verify everything works with testing.

**⚠️ IMPORTANT: For getting the first user, see `docs/ACTIVATION_AND_FIRST_USER.md`** - This document focuses on deployment, configuration, and testing needed to activate the system and accept the first paying customer.

**Implementation Tasks (Code Changes Required - Optional):**
- Task 4.1: Add concurrent activation prevention guard
- Task 4.2: Add retry button for network errors in UI
- Task 4.3: Add device mismatch check on app startup
- Task 4.4: Improve loading state management
- Task 4.5: Add license file storage error handling

**Note:** These implementation tasks are **optional enhancements**. The system works without them, but they improve user experience. Focus on deployment and testing first (see `ACTIVATION_AND_FIRST_USER.md`).

**Testing Tasks (Verification Required):**
- Task 1: Comprehensive testing of all activation scenarios
- Task 2: Edge case handling verification
- Task 3: Error message review (✅ Already complete)

---

### Task 1: Comprehensive Testing

**Objective:** Verify all activation and offline scenarios work correctly.

**Test Scenarios:**

#### Activation Testing
1. **First Activation (Personal License)**
   - Enter valid personal license key (`PERS-` prefix)
   - Verify device binding occurs
   - Verify local license file is created
   - Disconnect internet
   - Verify app works offline
   - Verify no network requests are made

2. **First Activation (Family License)**
   - Enter valid family license key (`FMLY-` prefix)
   - Verify device binding occurs
   - Verify local license file is created
   - Test that family plan generates 5 separate keys (each for 1 device)
   - Verify device limit enforcement

3. **Same Device Reactivation**
   - Activate license on Device A
   - Close and reopen app
   - Enter same license key again
   - Should work without requiring transfer
   - Should not show transfer dialog

4. **Different Device (Transfer Required)**
   - Activate license on Device A
   - Enter same key on Device B
   - Should detect different device ID
   - Should show transfer dialog
   - Complete transfer process
   - Verify Device B works after transfer
   - Verify Device A no longer works (device binding changed)

5. **Transfer Limit Enforcement**
   - Activate license
   - Perform 3 transfers (simulate or use test keys)
   - Attempt 4th transfer
   - Should show clear message: "Transfer limit reached (3 transfers per year)"
   - Should provide support contact information

6. **Invalid Key Scenarios**
   - Enter invalid format (no prefix, wrong format)
   - Enter non-existent key
   - Enter revoked key (set status to 'revoked' in database)
   - Each should show appropriate error message with troubleshooting tips

7. **Network Failure Handling**
   - Disable network connection
   - Attempt license activation
   - Should show clear network error message
   - Should allow retry when network is restored
   - Re-enable network and verify retry works

#### Offline Operation Testing
1. **After Initial Activation**
   - Activate license successfully
   - Disconnect internet completely
   - Use app for extended period (30+ minutes)
   - Verify zero network requests are made
   - Verify all app features work (vault access, password management, etc.)
   - Verify license validation works offline

2. **App Restart While Offline**
   - Activate license
   - Disconnect internet
   - Close application completely
   - Reopen application
   - Should load and work without any network calls
   - Should validate license from local signed file

3. **Trial Expiration Detection (Offline)**
   - Start trial (7-day trial)
   - Simulate expiration (modify system date or wait)
   - Disconnect internet
   - Open application
   - Should detect expiration locally from signed trial file
   - Should show upgrade prompt
   - Should not make network calls

#### Bundle Purchase Testing
1. **Bundle Purchase Flow**
   - Purchase bundle via Stripe checkout
   - Verify email contains multiple license keys (2 keys for bundle)
   - Activate first key
   - Verify activation works
   - Activate second key (different device or same device)
   - Verify both keys work independently

2. **Bundle Email Verification**
   - Verify email contains all keys clearly labeled
   - Verify download links work
   - Verify keys are properly formatted with correct prefixes

**Files to Test:**
- `src/utils/licenseService.ts` - Main license activation logic
- `src/utils/licenseValidator.ts` - Offline validation
- `src/components/LicenseScreen.tsx` - Activation UI and error handling
- `src/components/LicenseTransferDialog.tsx` - Transfer flow
- `backend/routes/lpv-licenses.js` - Backend activation endpoint

---

### Task 2: Edge Case Handling

**Objective:** Ensure graceful handling of edge cases and error scenarios.

**Scenarios to Verify:**

1. **Device ID Changes**
   - **Scenario:** OS update or hardware change modifies device fingerprint
   - **Expected Behavior:** 
     - Should detect device ID mismatch
     - Should prompt for transfer if within limit
     - Should show clear message if transfer limit reached
   - **Files to Review:**
     - `src/utils/deviceFingerprint.ts` - Device ID generation
     - `src/utils/licenseService.ts` - Device binding validation

2. **License Revocation**
   - **Scenario:** Backend revokes license (status = 'revoked')
   - **Expected Behavior:**
     - On next activation attempt, should detect revocation
     - Should show clear revocation message
     - Should provide support contact
   - **Files to Review:**
     - `src/utils/licenseService.ts` - Activation error handling
     - `src/components/LicenseScreen.tsx` - Error message display

3. **Corrupted License File**
   - **Scenario:** Local license file becomes corrupted or invalid
   - **Expected Behavior:**
     - Should detect invalid signature
     - Should show error message
     - Should allow re-activation
   - **Files to Review:**
     - `src/utils/licenseValidator.ts` - Signature verification

4. **Concurrent Activation Attempts**
   - **Scenario:** Multiple activation attempts simultaneously
   - **Expected Behavior:**
     - Should handle gracefully
     - Should prevent duplicate activations
   - **Files to Review:**
     - `src/utils/licenseService.ts` - Activation flow

5. **Trial Expiration Edge Cases**
   - **Scenario:** Trial expires while app is running
   - **Expected Behavior:**
     - Should detect expiration on next validation check
     - Should show upgrade prompt
     - Should gracefully lock features if needed
   - **Files to Review:**
     - `src/utils/trialService.ts` - Trial validation

**Implementation Notes:**
- All error messages should be user-friendly
- All errors should provide actionable next steps
- Network errors should allow retry
- Validation errors should explain what went wrong

---

### Task 3: Error Message Review ✅ COMPLETE

**Status:** All error messages have been improved to be clear, actionable, and user-friendly.

**Completed:**
- All network errors include retry guidance
- All validation errors explain format requirements
- All system errors provide support contact
- Error messages are user-friendly (no technical jargon)

---

### Task 4: Implementation Tasks

**Objective:** Implement missing functionality to ensure robust license activation and error handling.

#### 4.1: Concurrent Activation Prevention

**Problem:** Multiple simultaneous activation attempts can cause race conditions or duplicate activations.

**Solution:** Add a guard in `licenseService.activateLicense()` to prevent concurrent calls.

**Implementation Steps:**

1. **Add activation lock to LicenseService class:**
   - Add private property: `private isActivating: boolean = false;`
   - Check lock at start of `activateLicense()` method
   - Set lock to `true` at start, `false` in finally block
   - Return early error if already activating

2. **File to Modify:**
   - `src/utils/licenseService.ts` - Add concurrent activation guard

3. **Code Pattern:**
   ```typescript
   async activateLicense(licenseKey: string): Promise<...> {
     // Prevent concurrent activations
     if (this.isActivating) {
       return {
         success: false,
         error: "Activation already in progress. Please wait for the current activation to complete."
       };
     }
     
     this.isActivating = true;
     try {
       // ... existing activation logic ...
     } finally {
       this.isActivating = false;
     }
   }
   ```

4. **Also Apply to Transfer:**
   - Add similar guard to `transferLicense()` method
   - Prevent concurrent transfers

**Files to Modify:**
- `src/utils/licenseService.ts` - Add `isActivating` and `isTransferring` flags

---

#### 4.2: Retry Button for Network Errors

**Problem:** When network errors occur, users must manually retry by clicking the activate button again.

**Solution:** Add a dedicated "Retry" button that appears for network errors.

**Implementation Steps:**

1. **Update LicenseScreen Component:**
   - Detect network error type (check if error includes "connect" or "network")
   - Show "Retry" button next to error message for network errors
   - Button should call `handleActivateLicense()` again
   - Hide retry button on successful activation

2. **File to Modify:**
   - `src/components/LicenseScreen.tsx` - Add retry button UI

3. **UI Location:**
   - Add retry button in the error display section (around line 691-728)
   - Show only when `errorType === 'network'`
   - Style consistently with existing buttons

4. **Also Add to Transfer Dialog:**
   - Add retry button to `LicenseTransferDialog.tsx` for network errors
   - Allow retry without closing dialog

**Files to Modify:**
- `src/components/LicenseScreen.tsx` - Add retry button for network errors
- `src/components/LicenseTransferDialog.tsx` - Add retry button for transfer network errors

---

#### 4.3: Device Mismatch Check on App Startup

**Problem:** If device ID changes (OS update, hardware change), user should be notified on app startup, not just when trying to activate.

**Solution:** Check for device mismatch when app starts and show appropriate message.

**Implementation Steps:**

1. **Add Startup Check in App.tsx:**
   - In `useAppStatus` hook, after getting app status
   - Call `licenseService.checkDeviceMismatch()` if license exists
   - If mismatch detected, show transfer dialog or warning
   - Store mismatch state to prevent repeated checks

2. **File to Modify:**
   - `src/App.tsx` - Add device mismatch check in `useAppStatus` hook

3. **Implementation Pattern:**
   ```typescript
   useEffect(() => {
     const checkMismatch = async () => {
       if (appStatus?.isLicensed) {
         const mismatch = await licenseService.checkDeviceMismatch();
         if (mismatch.hasMismatch && mismatch.licenseKey) {
           // Show transfer dialog or warning
           setShowTransferDialog(true);
           setPendingTransferKey(mismatch.licenseKey);
         }
       }
     };
     checkMismatch();
   }, [appStatus?.isLicensed]);
   ```

4. **Handle Gracefully:**
   - Don't block app startup if mismatch detected
   - Show non-blocking notification or dialog
   - Allow user to continue using app (if within transfer limit)
   - Prompt for transfer when user tries to use licensed features

**Files to Modify:**
- `src/App.tsx` - Add device mismatch check in `useAppStatus` hook
- `src/components/LicenseScreen.tsx` - Handle startup mismatch state

---

#### 4.4: Improve Loading State Management

**Problem:** Loading states may not properly prevent user actions during activation/transfer.

**Solution:** Ensure loading states properly disable all relevant UI elements.

**Implementation Steps:**

1. **Verify Loading States:**
   - Ensure `isActivating` disables activate button
   - Ensure `isTransferring` disables transfer button
   - Ensure input fields are disabled during activation
   - Ensure cancel buttons work during loading

2. **Add Visual Feedback:**
   - Show loading spinner in button during activation
   - Show progress indicator if activation takes > 2 seconds
   - Disable form inputs during activation

3. **Files to Review:**
   - `src/components/LicenseScreen.tsx` - Verify all buttons/inputs disabled when `isActivating`
   - `src/components/LicenseTransferDialog.tsx` - Verify all buttons disabled when `isTransferring`

4. **Add Timeout Handling:**
   - If activation takes > 30 seconds, show timeout message
   - Allow user to cancel and retry
   - Log timeout for debugging

**Files to Modify:**
- `src/components/LicenseScreen.tsx` - Improve loading state handling
- `src/components/LicenseTransferDialog.tsx` - Improve loading state handling
- `src/utils/licenseService.ts` - Add timeout handling (optional)

---

#### 4.5: License File Storage Error Handling

**Problem:** If localStorage fails (quota exceeded, disabled, etc.), activation will fail silently or with unclear error.

**Solution:** Add proper error handling for storage operations.

**Implementation Steps:**

1. **Add Storage Error Detection:**
   - Wrap `localStorage.setItem()` calls in try-catch
   - Detect quota exceeded errors
   - Detect disabled storage errors
   - Provide clear error messages

2. **File to Modify:**
   - `src/utils/licenseService.ts` - Add error handling in `saveLocalLicenseFile()`

3. **Error Messages:**
   - Quota exceeded: "Storage quota exceeded. Please free up space and try again."
   - Storage disabled: "Local storage is disabled. Please enable it in your browser settings."
   - Generic: "Failed to save license file. Please try again or contact support."

4. **Fallback Options:**
   - For Electron: Use file system storage as fallback
   - For Web: Show clear error with instructions

**Files to Modify:**
- `src/utils/licenseService.ts` - Add storage error handling in `saveLocalLicenseFile()`
- `src/utils/trialService.ts` - Add storage error handling in `saveTrialFile()`

---

## 🔧 Quick Start

### 1. Review Current Implementation

**Backend Files:**
- `backend/routes/lpv-licenses.js` - License activation endpoints
- `backend/routes/webhooks.js` - Stripe payment handling
- `backend/services/licenseSigner.js` - HMAC-SHA256 license file signing
- `backend/services/licenseGenerator.js` - License key generation

**Frontend Files:**
- `src/utils/licenseService.ts` - Main license activation logic
- `src/utils/licenseValidator.ts` - Offline license file validation
- `src/utils/deviceFingerprint.ts` - Device ID generation
- `src/utils/trialService.ts` - Trial activation and validation
- `src/components/LicenseScreen.tsx` - Activation UI
- `src/components/LicenseTransferDialog.tsx` - Transfer UI
- `src/components/DeviceManagementScreen.tsx` - Device management UI

### 2. Set Up Testing Environment

1. Start backend: `cd backend && npm start`
2. Start frontend: `npm run dev`
3. Ensure environment variables are configured (see `backend/env.example`)
4. Ensure database is set up (see `backend/database/schema.sql`)

### 3. Implement Missing Functionality

Complete the implementation tasks in **Task 4** above:
1. Add concurrent activation prevention
2. Add retry button for network errors
3. Add device mismatch check on app startup
4. Improve loading state management
5. Add license file storage error handling

### 4. Execute Testing Tasks

Follow the testing scenarios in **Task 1** above. Document any issues found and fix them.

### 5. Verify Edge Cases

Follow the edge case scenarios in **Task 2** above. Ensure all are handled gracefully.

---

## 📝 Architecture Notes

### Current Implementation

**Backend:**
- Supabase (PostgreSQL) for data storage
- Stripe for payments
- Brevo for emails
- HMAC-SHA256 signed license files for offline validation
- License activation endpoints return signed license files (not JWT tokens)

**Frontend:**
- Electron app
- Local signed license file storage and validation
- Device fingerprint for binding
- Offline-first design (zero network calls after activation)
- All validation happens locally using Web Crypto API

### Key Design Principles

1. **Offline-First:** App must work 100% offline after activation
2. **Device Binding:** License tied to device fingerprint (SHA-256 hash)
3. **Transfer Support:** 3 transfers per year allowed
4. **Privacy-First:** No user data transmitted, only license key + device hash at activation
5. **Signed Files:** All validation uses HMAC-SHA256 signed license files (not JWT)

### Security Model

- Device fingerprint is SHA-256 hash (one-way, cannot be reversed)
- License files signed with HMAC-SHA256 using backend secret
- License files verified locally using Web Crypto API (no server calls)
- License keys validated against database only at initial activation
- Zero network traffic after activation (100% offline operation)
- No JWT tokens - all validation uses signed license files

### Family Plan Model

- Family plan purchase generates 5 separate license keys
- Each key can be activated on 1 device only
- Keys cannot be shared or reused on multiple devices
- Each key behaves like a personal license (single device binding)
- This is the intended design (not 1 key for 5 devices)

---

## 🎯 Success Criteria

After completing these tasks, verify:

1. ✅ All purchase scenarios work (single, bundle, all product types)
2. ✅ All activation scenarios work (first, same device, transfer)
3. ✅ 100% offline operation after activation (zero network calls)
4. ✅ Device binding enforced correctly
5. ✅ Transfer limits enforced (3 per year)
6. ✅ Error messages are clear, helpful, and actionable
7. ✅ Edge cases handled gracefully
8. ✅ Family plan device management works
9. ✅ Bundle purchases handled correctly
10. ✅ Trial expiration detected offline

---

## 📞 Reference Documents

- **`docs/ACTIVATION_AND_FIRST_USER.md`** - ⭐ **START HERE** - Complete guide to activate system and get first user
- `docs/PRODUCTION_LAUNCH_GUIDE.md` - Production setup details
- `docs/PRODUCTION_CHECKLIST.md` - Detailed production checklist
- `backend/README.md` - API documentation
- `backend/database/schema.sql` - Database structure
- `docs/FAMILY_PLAN_MODEL.md` - Family plan model documentation
- `docs/TESTING_FAMILY_PLAN.md` - Family plan testing guide

---

## 📋 Implementation & Testing Checklist

Use this checklist to track progress:

### Implementation Tasks
- [ ] Task 4.1: Concurrent Activation Prevention
- [ ] Task 4.2: Retry Button for Network Errors
- [ ] Task 4.3: Device Mismatch Check on App Startup
- [ ] Task 4.4: Improve Loading State Management
- [ ] Task 4.5: License File Storage Error Handling

### Testing Tasks
- [ ] Task 1: Comprehensive Testing (all scenarios)
- [ ] Task 2: Edge Case Handling (all scenarios)

### Activation Scenarios
- [ ] First Activation (Personal)
- [ ] First Activation (Family)
- [ ] Same Device Reactivation
- [ ] Different Device (Transfer)
- [ ] Transfer Limit Reached
- [ ] Invalid Key (various formats)
- [ ] Network Failure

### Offline Operation
- [ ] After Activation (extended use)
- [ ] App Restart Offline
- [ ] Trial Expiration Offline

### Bundle Purchases
- [ ] Bundle Purchase Flow
- [ ] Bundle Email Verification

### Edge Cases
- [ ] Device ID Changes
- [ ] License Revocation
- [ ] Corrupted License File
- [ ] Concurrent Activation Attempts
- [ ] Trial Expiration Edge Cases

### Error Messages
- [ ] Network Errors (with retry button)
- [ ] Validation Errors
- [ ] System Errors
