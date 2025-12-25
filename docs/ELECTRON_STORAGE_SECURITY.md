# Electron File Storage Security Architecture

## Overview

The app uses **100% local, encrypted file storage** in Electron builds. All user data is encrypted in the renderer process and stored securely on disk with OS-level file permissions.

---

## Security Model

### ✅ **Zero Data Exposure**

1. **Master Password**: NEVER leaves the renderer process
   - Encryption/decryption happens entirely in the renderer
   - Main process never sees the master password
   - Owner cannot access user data (it's encrypted)

2. **Encrypted Data Only**: Main process only handles encrypted blobs
   - Renderer encrypts data before sending to main process
   - Main process stores encrypted blob to file
   - Renderer decrypts data after receiving from main process

3. **OS-Level File Permissions**: Files are protected by the operating system
   - Unix/Linux/Mac: `0600` (rw-------) - owner read/write only
   - Windows: User-specific directory with ACL protection
   - Files stored in `app.getPath("userData")` (user-specific location)

---

## Storage Architecture

### File Storage (Electron - Primary)

**Location**: `{userDataPath}/vault.dat` and `{userDataPath}/vault.backup.dat`

**What's Stored**:
- ✅ Encrypted vault data (password entries)
- ✅ Encrypted categories
- ✅ Backup of encrypted vault data

**Security**:
- Data is encrypted in renderer process (AES-256-GCM)
- Only encrypted blob is sent to main process
- OS-level file permissions restrict access
- Owner cannot decrypt without master password

### localStorage (Metadata Only - Not Sensitive)

**What's Stored**:
- `vault_salt_v2`: Encryption salt (public, not sensitive)
- `vault_password_hash`: One-way password hash (not reversible)
- `vault_password_hint_v2`: Password hint (user-provided)
- `vault_lockout`: Rate limiting lockout timestamp
- `vault_test_v2`: Test encrypted data for verification

**Why localStorage is OK**:
- Salt is public (doesn't need to be secret)
- Password hash is one-way (cannot recover password)
- Hint is user-provided (not sensitive)
- Lockout is just a timestamp
- Test data is encrypted

**Note**: In Electron, the main encrypted vault data uses file storage. localStorage is only used for metadata and as a backup/migration path.

---

## Data Flow

### Saving Data

```
1. User enters password → Renderer Process
2. Renderer encrypts data with master password (AES-256-GCM)
3. Renderer sends encrypted blob to Main Process (via IPC)
4. Main Process writes encrypted blob to file (OS-level permissions)
5. Main Process returns success (no data returned)
```

**Key Point**: Master password never leaves renderer process.

### Loading Data

```
1. User enters password → Renderer Process
2. Renderer requests encrypted data from Main Process (via IPC)
3. Main Process reads encrypted blob from file
4. Main Process returns encrypted blob to Renderer
5. Renderer decrypts data with master password
6. Renderer displays decrypted data
```

**Key Point**: Decryption happens in renderer, main process never sees plaintext.

---

## Network Calls

### ✅ **Zero Network Calls for Storage**

- No cloud storage
- No sync services
- No analytics
- No telemetry
- No data pushed anywhere

**Verification**:
- All storage operations use local file system
- IPC communication is local (renderer ↔ main process)
- No `fetch()`, `XMLHttpRequest()`, or network APIs in storage code

---

## File Permissions

### Unix/Linux/Mac

```javascript
fs.chmodSync(vaultFilePath, 0o600); // rw------- (owner read/write only)
```

**Permissions**: `0600` = Owner can read/write, no one else can access

### Windows

Files are stored in user-specific directory:
- `%APPDATA%\Local Password Vault\` (Windows)
- Protected by Windows ACL (Access Control List)
- Only the user who created the files can access them

---

## Migration Path

### From localStorage to File Storage

1. **Existing Users**: Data is automatically migrated
   - On first save, Electron file storage is used
   - localStorage backup is kept for safety
   - Old localStorage data is removed after successful migration

2. **Web Users**: Continue using localStorage
   - Web version uses localStorage (no file system access)
   - Same encryption (AES-256-GCM)
   - Same security model (encryption in renderer)

---

## Security Guarantees

### ✅ **What We Guarantee**

1. **Owner Cannot Access User Data**
   - Data is encrypted with user's master password
   - Owner doesn't have master password
   - Cannot decrypt files even with file access

2. **No Network Exposure**
   - Zero network calls for storage
   - All data stays on user's device
   - No cloud sync or backup

3. **OS-Level Protection**
   - Files protected by operating system permissions
   - Only user who created files can access them
   - Even if someone gains file system access, data is encrypted

4. **Memory Security**
   - Master password cleared from memory after use
   - Sensitive data tracked and cleared
   - No plaintext passwords in memory longer than necessary

---

## Threat Model

### ✅ **Protected Against**

- Owner accessing user data (encrypted)
- Network interception (no network calls)
- File system access (OS permissions + encryption)
- Memory dumps (passwords cleared from memory)
- Browser storage limits (unlimited file storage)

### ⚠️ **User Responsibility**

- User must protect their master password
- User must secure their device
- User should backup encrypted vault file

---

## Code Locations

### Electron Main Process
- `electron/secure-storage.js`: File storage implementation
- `electron/main.js`: IPC handlers for storage operations

### Renderer Process
- `src/utils/storage.ts`: Storage service (encryption + file storage)
- `src/utils/memorySecurity.ts`: Memory security utilities

### IPC Bridge
- `electron/preload.js`: Secure API bridge (no master password exposure)

---

## Verification Checklist

- [x] Master password never sent to main process
- [x] Encryption happens in renderer process
- [x] Main process only handles encrypted blobs
- [x] OS-level file permissions set (0600 on Unix)
- [x] No network calls in storage code
- [x] Memory cleared after use
- [x] Backup files created automatically
- [x] Migration path from localStorage to file storage

---

## Summary

**The app provides maximum security for user data:**

1. ✅ **Encryption**: AES-256-GCM with PBKDF2 (100,000 iterations)
2. ✅ **Zero Exposure**: Owner cannot access user data
3. ✅ **No Network**: Zero network calls for storage
4. ✅ **OS Protection**: File permissions restrict access
5. ✅ **Memory Security**: Passwords cleared from memory

**User data is encrypted, local, and protected.**

