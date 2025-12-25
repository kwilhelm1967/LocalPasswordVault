# Edge Case Handling Guide

This document describes how the app handles edge cases for storage quota and corrupted files.

---

## Storage Quota Handling

### Automatic Quota Checking

The app automatically checks storage quota before saving data:

1. **Pre-save Check**: Estimates data size and checks available quota
2. **Warning Threshold**: Warns when storage is 90% full
3. **Error Handling**: Provides clear error messages if quota exceeded

### Quota Exceeded Error Handling

When storage quota is exceeded:

1. **Automatic Cleanup**: Attempts to free space by:
   - Clearing old backups (keeps only 3 most recent)
   - Clearing session storage
   - Removing temporary data

2. **User Notification**: Shows clear error message:
   - "Storage quota exceeded. Your device's storage is full."
   - Suggestion: "Please free up space or export old entries to reduce storage usage."

3. **Recovery Options**:
   - Export entries to reduce storage
   - Delete unused entries
   - Clear app data (last resort)

### Storage Statistics

Users can check storage usage:

```typescript
import { getStorageStats } from './utils/storageQuotaHandler';

const stats = await getStorageStats();
console.log(`Used: ${stats.percentage.toFixed(1)}%`);
console.log(`Available: ${formatBytes(stats.available)}`);
```

---

## Corrupted File Handling

### License File Corruption

**Detection:**
- Checks JSON validity
- Validates required fields
- Verifies field types
- Checks signature format

**Recovery:**
- Attempts to reconstruct missing fields
- Validates recoverable corruption
- Provides clear error messages

**User Actions:**
- If recoverable: License file is automatically repaired
- If critical: User must reactivate license

### Vault Data Corruption

**Detection:**
- Validates JSON structure
- Checks entry format
- Identifies invalid entries

**Recovery:**
- Filters out invalid entries
- Attempts to restore from backup
- Preserves valid data

**User Actions:**
- If recoverable: Data is automatically repaired
- If critical: User must restore from backup

### Backup System

**Automatic Backups:**
- Created before every save operation
- Keeps 3 most recent backups
- Stored in localStorage

**Manual Backup:**
- Users can export encrypted backups
- Recommended: Export regularly
- Store backups in multiple locations

---

## Error Messages

### Storage Quota Errors

**Quota Exceeded:**
```
Storage quota exceeded. Your device's storage is full.
Please free up space or export old entries to reduce storage usage.
```

**Insufficient Space:**
```
Not enough storage space available.
Need X MB, but only Y MB available. Please free up space.
```

### Corruption Errors

**License File Corrupted:**
```
License file is corrupted and cannot be recovered.
Please reactivate your license.
```

**Vault Data Corrupted:**
```
Vault data is corrupted. Please restore from backup.
```

**Recovery Success:**
```
Vault data recovered. X valid entries restored.
Some entries may have been lost. Please verify your data.
```

---

## Implementation Details

### Storage Quota Handler

**File:** `src/utils/storageQuotaHandler.ts`

**Features:**
- Quota checking before saves
- Automatic cleanup
- Storage statistics
- User-friendly error messages

### Corruption Handler

**File:** `src/utils/corruptionHandler.ts`

**Features:**
- Corruption detection
- Automatic recovery
- Backup management
- Data validation

### Integration

Both handlers are integrated into:
- `src/utils/storage.ts` - Vault data operations
- `src/utils/licenseService.ts` - License file operations

---

## Best Practices

### For Users

1. **Regular Backups**: Export encrypted backups regularly
2. **Monitor Storage**: Check storage usage periodically
3. **Clean Up**: Delete unused entries
4. **Multiple Backups**: Store backups in multiple locations

### For Developers

1. **Always Check Quota**: Before saving large data
2. **Create Backups**: Before operations that might corrupt data
3. **Validate Data**: Before and after operations
4. **Handle Errors**: Provide clear, actionable error messages

---

## Testing

### Test Storage Quota

1. Fill up storage to 100%
2. Attempt to save new entry
3. Verify error message appears
4. Verify cleanup attempts
5. Free space and retry

### Test Corruption

1. Manually corrupt license file
2. Restart app
3. Verify corruption detected
4. Verify recovery attempt
5. Verify user notification

---

## Support

If users encounter storage or corruption issues:

1. **Check Storage**: Verify available space
2. **Restore Backup**: Use latest encrypted backup
3. **Contact Support**: If issues persist

**Email**: support@localpasswordvault.com

---

**The app handles edge cases gracefully to ensure data safety and user experience.**

