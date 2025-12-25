# Family Plan Model: 1 Key = 1 Device (No Sharing)

## Model Overview

**Family Plan = 5 Separate Keys, Each for 1 Device**

- Family plan purchase generates **5 distinct license keys**
- Each key can be activated on **1 device only**
- Keys cannot be shared or reused on multiple devices
- Each key behaves like a personal license (single device binding)

## Implementation

### Key Generation (Webhook)
- Family plan purchase → Generates 5 keys
- Each key has:
  - `plan_type: 'family'` (for tracking/identification)
  - `max_devices: 1` (each key = 1 device)
  - Unique license key (FMLY-XXXX-XXXX-XXXX format)

### Activation Logic
- Each key activates on 1 device only
- Same device reactivation allowed (reinstall, etc.)
- Different device = requires transfer (like personal plans)
- No multi-device activation per key

### Email Delivery
- Customer receives email with all 5 keys
- Each key clearly labeled (Key 1, Key 2, etc.)
- Instructions: "Activate one key per device"

## Testing Checklist

### ✅ Test Scenario 1: Family Plan Purchase
- [ ] Purchase family plan via Stripe
- [ ] Verify 5 keys generated in database
- [ ] Verify each key has `max_devices: 1`
- [ ] Verify email contains all 5 keys

### ✅ Test Scenario 2: Key 1 Activation
- [ ] Activate Key 1 on Device A
- [ ] Verify activation succeeds
- [ ] Verify device binding works
- [ ] Attempt to activate Key 1 on Device B
- [ ] Verify transfer dialog appears (device mismatch)

### ✅ Test Scenario 3: All 5 Keys
- [ ] Activate Key 1 on Device A → ✅ Success
- [ ] Activate Key 2 on Device B → ✅ Success
- [ ] Activate Key 3 on Device C → ✅ Success
- [ ] Activate Key 4 on Device D → ✅ Success
- [ ] Activate Key 5 on Device E → ✅ Success
- [ ] All 5 devices work independently

### ✅ Test Scenario 4: Same Device Reactivation
- [ ] Activate Key 1 on Device A
- [ ] Close app, reopen
- [ ] Enter Key 1 again on Device A
- [ ] Verify reactivation succeeds (same device)

### ✅ Test Scenario 5: Device Transfer
- [ ] Activate Key 1 on Device A
- [ ] Attempt activation on Device B
- [ ] Verify transfer dialog appears
- [ ] Complete transfer
- [ ] Verify Device B works
- [ ] Verify Device A no longer works

## Database Schema

Each license record:
```sql
license_key: FMLY-XXXX-XXXX-XXXX (unique)
plan_type: 'family'
max_devices: 1  -- Each key = 1 device
email: customer@example.com
stripe_checkout_session_id: cs_xxx (same for all 5 keys)
```

## Key Differences from Multi-Device Model

| Aspect | Multi-Device Model (Old) | 1-Key-1-Device Model (Current) |
|--------|-------------------------|-------------------------------|
| Keys Generated | 1 key | 5 keys |
| Max Devices per Key | 5 devices | 1 device |
| Device Sharing | Same key on 5 devices | Each key on 1 device |
| Activation Logic | Track device count | Single device binding |
| Transfer | Not needed | Required for new device |

## Benefits

1. **Privacy:** Each family member has their own key
2. **Security:** Keys cannot be shared or leaked
3. **Simplicity:** Same activation logic as personal plans
4. **Flexibility:** Family can distribute keys independently

