# Family Plan Testing Guide

## Model: 1 Key = 1 Device (No Sharing)

**Family Plan = 5 Separate Keys, Each for 1 Device**

## Test Scenarios

### ✅ Scenario 1: Family Plan Purchase
**Steps:**
1. Purchase family plan via Stripe checkout
2. Complete payment
3. Check email for 5 license keys

**Expected Results:**
- ✅ Email contains 5 distinct keys (FMLY-XXXX-XXXX-XXXX format)
- ✅ Each key is clearly labeled (Key 1, Key 2, etc.)
- ✅ Database has 5 license records
- ✅ Each license has `max_devices: 1`
- ✅ Each license has `plan_type: 'family'`

**Verification Query:**
```sql
SELECT license_key, plan_type, max_devices, email 
FROM licenses 
WHERE stripe_checkout_session_id = 'cs_xxx'
ORDER BY created_at;
```

---

### ✅ Scenario 2: Key 1 Activation on Device A
**Steps:**
1. Open app on Device A
2. Enter Key 1 from family plan email
3. Complete activation

**Expected Results:**
- ✅ Activation succeeds
- ✅ Device A is bound to Key 1
- ✅ Signed license file created locally
- ✅ App works offline

**Verification:**
- Check database: `hardware_hash` matches Device A's fingerprint
- Check local storage: License file exists with Device A's device_id

---

### ✅ Scenario 3: Key 1 Attempt on Device B (Should Fail)
**Steps:**
1. Open app on Device B (different device)
2. Enter Key 1 (already activated on Device A)
3. Attempt activation

**Expected Results:**
- ✅ Activation fails with `device_mismatch` status
- ✅ Transfer dialog appears
- ✅ User can choose to transfer or cancel

**Verification:**
- API returns: `{ status: 'device_mismatch', requires_transfer: true }`
- Frontend shows transfer dialog

---

### ✅ Scenario 4: All 5 Keys on 5 Different Devices
**Steps:**
1. Activate Key 1 on Device A → ✅ Success
2. Activate Key 2 on Device B → ✅ Success
3. Activate Key 3 on Device C → ✅ Success
4. Activate Key 4 on Device D → ✅ Success
5. Activate Key 5 on Device E → ✅ Success

**Expected Results:**
- ✅ All 5 activations succeed
- ✅ Each device is bound to its respective key
- ✅ All devices work independently
- ✅ No conflicts or errors

**Verification:**
```sql
SELECT license_key, hardware_hash, is_activated 
FROM licenses 
WHERE email = 'customer@example.com' 
AND plan_type = 'family';
```

---

### ✅ Scenario 5: Same Device Reactivation
**Steps:**
1. Activate Key 1 on Device A
2. Close app
3. Reopen app on Device A
4. Enter Key 1 again (or app auto-detects)

**Expected Results:**
- ✅ Reactivation succeeds (same device)
- ✅ No transfer required
- ✅ License file updated

**Verification:**
- API returns: `{ status: 'activated', mode: 'same_device' }`
- No transfer dialog appears

---

### ✅ Scenario 6: Key Transfer
**Steps:**
1. Activate Key 1 on Device A
2. Open app on Device B
3. Enter Key 1
4. Confirm transfer in dialog
5. Complete transfer

**Expected Results:**
- ✅ Transfer succeeds
- ✅ Device B now has Key 1
- ✅ Device A no longer works with Key 1
- ✅ Signed license file updated on Device B

**Verification:**
- Database: `hardware_hash` updated to Device B's fingerprint
- Device B: License file contains Device B's device_id
- Device A: License validation fails (device mismatch)

---

### ✅ Scenario 7: Transfer Limit
**Steps:**
1. Activate Key 1 on Device A
2. Transfer to Device B (transfer 1)
3. Transfer to Device C (transfer 2)
4. Transfer to Device D (transfer 3)
5. Attempt transfer to Device E (transfer 4)

**Expected Results:**
- ✅ First 3 transfers succeed
- ✅ 4th transfer fails with `transfer_limit_reached`
- ✅ Error message: "Transfer limit reached. Contact support."

**Verification:**
```sql
SELECT transfer_count, last_transfer_at 
FROM licenses 
WHERE license_key = 'FMLY-XXXX-XXXX-XXXX';
```

---

## Database Verification

### Check Family Plan Purchase
```sql
-- Find all keys for a family plan purchase
SELECT 
  license_key,
  plan_type,
  max_devices,
  is_activated,
  hardware_hash,
  email,
  created_at
FROM licenses
WHERE email = 'customer@example.com'
  AND plan_type = 'family'
  AND stripe_checkout_session_id = 'cs_xxx'
ORDER BY created_at;
```

**Expected:**
- 5 rows
- All have `max_devices: 1`
- All have `plan_type: 'family'`
- Unique `license_key` values

### Check Device Bindings
```sql
-- Check which devices are bound to which keys
SELECT 
  l.license_key,
  l.hardware_hash,
  l.is_activated,
  l.activated_at
FROM licenses l
WHERE l.email = 'customer@example.com'
  AND l.plan_type = 'family'
  AND l.is_activated = true;
```

**Expected:**
- Each activated key has unique `hardware_hash`
- No duplicate `hardware_hash` values (each device = 1 key)

---

## Frontend Testing

### Test Activation Flow
1. **Purchase family plan** → Receive email with 5 keys
2. **Device A:** Enter Key 1 → ✅ Activates
3. **Device B:** Enter Key 1 → ❌ Shows transfer dialog
4. **Device B:** Enter Key 2 → ✅ Activates
5. **Device C:** Enter Key 3 → ✅ Activates
6. **Device D:** Enter Key 4 → ✅ Activates
7. **Device E:** Enter Key 5 → ✅ Activates

### Test Offline Operation
1. Activate Key 1 on Device A
2. **Disconnect internet completely**
3. Close and reopen app
4. ✅ App works without network
5. ✅ License validation works locally
6. ✅ No network requests made

### Test Transfer Flow
1. Activate Key 1 on Device A
2. Open app on Device B
3. Enter Key 1
4. ✅ Transfer dialog appears
5. Confirm transfer
6. ✅ Device B now has Key 1
7. ✅ Device A shows device mismatch

---

## Common Issues to Watch For

### ❌ Issue 1: Key Can Be Used on Multiple Devices
**Symptom:** Same key activates on Device A and Device B without transfer

**Fix:** Verify activation endpoint checks `hardware_hash` match

### ❌ Issue 2: Family Plan Keys Have max_devices: 5
**Symptom:** Database shows `max_devices: 5` for family plan keys

**Fix:** Verify webhook sets `max_devices: 1` for all keys

### ❌ Issue 3: Transfer Not Working
**Symptom:** Transfer dialog appears but transfer fails

**Fix:** Check transfer endpoint updates `hardware_hash` correctly

### ❌ Issue 4: Same Device Reactivation Fails
**Symptom:** Re-entering key on same device shows transfer dialog

**Fix:** Verify same-device check: `hardware_hash === device_id`

---

## Success Criteria

✅ **Family plan purchase generates 5 keys**
✅ **Each key activates on 1 device only**
✅ **Same key on different device requires transfer**
✅ **All 5 keys can be used on 5 different devices**
✅ **Transfer works correctly (3 transfers/year limit)**
✅ **Offline operation works after activation**
✅ **No network calls after activation**

