# Remaining Tasks & Fixes

## 🔴 CRITICAL BUGS (Must Fix)

### 1. Family Plan max_devices Bug in Webhooks
**Location:** `backend/routes/webhooks.js:151`

**Problem:**
- Family plans are being created with `max_devices: 1` instead of `5`
- This prevents family plans from activating on multiple devices
- The `product.maxDevices` value is available but not being used

**Current Code:**
```javascript
await db.licenses.create({
  license_key: licenseKey,
  plan_type: planType,
  // ... other fields
  max_devices: 1,  // ❌ BUG: Hardcoded to 1
});
```

**Fix:**
```javascript
await db.licenses.create({
  license_key: licenseKey,
  plan_type: planType,
  // ... other fields
  max_devices: product.maxDevices,  // ✅ Use product.maxDevices (1 or 5)
});
```

**Impact:** Family plan customers cannot activate on multiple devices.

---

## 🟡 IMPORTANT FIXES (Should Fix)

### 2. Update DEVELOPER_HANDOFF.md
**Location:** `docs/DEVELOPER_HANDOFF.md`

**Problem:**
- Document still mentions JWT token issues that have been resolved
- We now use signed license files instead of JWT for offline validation
- Document needs to reflect current implementation

**Action:**
- Remove outdated JWT sections
- Update to reflect signed license file approach
- Mark completed items (device management UI, bundle handling, error handling)

---

### 3. Device Management Screen - Backend Integration (Optional)
**Location:** `src/components/DeviceManagementScreen.tsx`

**Current State:**
- Shows only local device (privacy-first approach)
- Comment says "in real implementation, this would come from backend"

**Options:**
- **Option A:** Keep privacy-first (current) - only show local device
- **Option B:** Add backend endpoint to list devices (requires one-time network call)
  - Endpoint: `GET /api/licenses/:key/devices`
  - Would show all activated devices for family plans
  - Breaks privacy-first model (one network call after activation)

**Recommendation:** Keep Option A (privacy-first) unless user explicitly wants device listing.

---

## 🟢 NICE TO HAVE (Optional Enhancements)

### 4. Comprehensive Testing
**Missing:**
- Unit tests for license activation flows
- Integration tests for Stripe webhook handling
- E2E tests for trial signup → purchase flow
- Offline validation tests

**Files to Create:**
- `backend/__tests__/webhooks.test.js`
- `backend/__tests__/trial.test.js`
- `src/utils/__tests__/licenseService.test.ts`
- `src/utils/__tests__/licenseValidator.test.ts`

---

### 5. Error Logging & Monitoring
**Missing:**
- Structured error logging
- Error tracking service integration (optional)
- Webhook failure alerts

**Current:** Basic console.error logging

**Enhancement:** Add structured logging with error codes and context

---

### 6. License Revocation Handling
**Current State:**
- Backend can revoke licenses (`status = 'revoked'`)
- Frontend checks revocation on activation
- No proactive revocation check after activation

**Enhancement (Optional):**
- Periodic revocation check (breaks privacy-first model)
- Or: Keep current approach (check on next activation/transfer)

**Recommendation:** Keep current approach (privacy-first).

---

### 7. Transfer History
**Missing:**
- UI to show transfer history
- Transfer count display in status dashboard

**Current:** Transfer count stored in database but not displayed

**Enhancement:** Add transfer history section to License Status Dashboard

---

## ✅ COMPLETED (No Action Needed)

1. ✅ Privacy-first license system with signed license files
2. ✅ Zero network calls after activation
3. ✅ Family plan device management UI
4. ✅ Bundle purchase handling
5. ✅ Enhanced error handling
6. ✅ License Status Dashboard
7. ✅ Instant trial key generation
8. ✅ Instant purchase key delivery
9. ✅ Email templates with OS-specific download buttons
10. ✅ All pricing links point to correct page

---

## 📋 Priority Summary

### Must Fix (Before Production):
1. **Family plan max_devices bug** - Prevents family plans from working correctly

### Should Fix (Soon):
2. **Update DEVELOPER_HANDOFF.md** - Keep documentation accurate

### Optional (Nice to Have):
3. Device management backend integration (if desired)
4. Comprehensive testing suite
5. Enhanced error logging
6. Transfer history UI

---

## 🚀 Quick Fixes

### Fix #1: Family Plan max_devices
```javascript
// backend/routes/webhooks.js:151
// Change from:
max_devices: 1,

// To:
max_devices: product.maxDevices,
```

### Fix #2: Update Documentation
- Remove JWT sections from DEVELOPER_HANDOFF.md
- Add signed license file approach
- Mark completed features

