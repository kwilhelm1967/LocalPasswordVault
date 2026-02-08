# Security Policy

## Our Commitment

Local Password Vault is built with security as the #1 priority. Your passwords never leave your device.

---

## Security Architecture

### Encryption
- **Algorithm:** AES-256-GCM (military-grade)
- **Key Derivation:** PBKDF2 with 100,000 iterations
- **Implementation:** Web Crypto API (browser native, no third-party libraries)

### Data Storage
- All vault data is encrypted before storage
- Master password is never stored (only a salted hash for verification)
- Encryption keys are cleared from memory on vault lock

### Network Security
- **100% Offline Operation** - Your passwords never touch the internet
- **One-time License Validation** - Only network call is during initial activation
- **No Telemetry** - Zero analytics, tracking, or data collection

---

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.2.x   | ✅ Yes             |
| 1.1.x   | ✅ Yes             |
| 1.0.x   | ⚠️ Security fixes only |
| < 1.0   | ❌ No              |

---

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please report it responsibly.

### How to Report

1. **Email:** security@localpasswordvault.com
2. **Subject:** `[SECURITY] Brief description`
3. **Include:**
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Your suggested fix (if any)

### What to Expect

| Timeline | Action |
|----------|--------|
| 24 hours | Acknowledgment of your report |
| 72 hours | Initial assessment |
| 7 days | Status update |
| 30 days | Resolution (for valid reports) |

### Rewards

We offer recognition for valid security reports:
- Credit in our Hall of Fame (with permission)
- Early access to security fixes
- Potential bug bounty (case by case)

---

## Security Best Practices

### For Users

1. **Use a strong master password** (16+ characters, mixed case, numbers, symbols)
2. **Never share your master password**
3. **Set up a recovery phrase** during initial setup
4. **Enable auto-lock** (Settings → Security → Auto-lock timeout)
5. **Keep the app updated** for latest security patches
6. **Verify installer hash** before installation

### Installer Verification

Always verify the SHA-256 hash of downloaded installers:

**Windows (PowerShell):**
```powershell
Get-FileHash "Local Password Vault Setup.exe" -Algorithm SHA256
```

**Mac/Linux:**
```bash
shasum -a 256 "Local Password Vault.dmg"
```

Compare with hashes published on our official website.

---

## Security Features

| Feature | Description |
|---------|-------------|
| AES-256-GCM | Military-grade encryption |
| PBKDF2 | 100,000 iteration key derivation |
| Auto-Lock | Locks vault after inactivity |
| Memory Clearing | Sensitive data cleared on lock |
| No Cloud Sync | Data stays on your device |
| Local Storage | Encrypted localStorage with backup |
| Password Strength | Visual meter for password quality |
| Password Age | Alerts for passwords >90 days old |
| 2FA/TOTP | Built-in authenticator codes |

---

## Threat Model

### What We Protect Against

✅ Remote attackers (no network exposure)
✅ Data breaches (no cloud storage)
✅ Weak encryption (AES-256-GCM)
✅ Brute force attacks (PBKDF2 rate limiting)
✅ Memory scraping (cleared on lock)

### What Requires User Vigilance

⚠️ Physical device access (use device encryption)
⚠️ Keyloggers/malware on device (use antivirus)
⚠️ Weak master password (use 16+ characters)
⚠️ Shoulder surfing (use in private)

---

## Third-Party Dependencies

We minimize external dependencies. Core encryption uses only:
- **Web Crypto API** (built into browsers/Electron)
- **No external cryptography libraries**

All dependencies are regularly audited with `npm audit`.

---

## Compliance

- GDPR compliant (no data collection)
- CCPA compliant (no data sale)
- SOC 2 principles (security by design)

---

## Contact

- **Security Issues:** security@localpasswordvault.com
- **General Support:** support@localpasswordvault.com
- **Website:** https://localpasswordvault.com

---

*Last updated: December 2026*

