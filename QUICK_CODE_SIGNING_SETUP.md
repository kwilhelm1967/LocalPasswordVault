# Quick Code Signing Setup for Local Legacy Vault

## ⚡ FAST SETUP (2 Steps)

### Step 1: Place Your Certificate
1. Copy your `.pfx` certificate file
2. Paste it into the `certs/` folder in this project
3. Note the filename (e.g., `code-signing-cert.pfx`)

### Step 2: Run Setup Script
```powershell
.\scripts\setup-code-signing.ps1
```

The script will:
- ✓ Find your certificate in `certs/`
- ✓ Ask for the certificate password
- ✓ Configure `.env` with `CSC_LINK` and `CSC_KEY_PASSWORD`
- ✓ Prepare everything for signed builds

### Step 3: Rebuild Signed Installer
Once the script completes, I can:
- ✓ Rebuild the signed installer
- ✓ Verify the signature
- ✓ Upload the signed version to GitHub Releases

---

## What I Can't Do Automatically

I **CANNOT**:
- ❌ Access your certificate file if it's outside this project
- ❌ Know your certificate password (it's private)
- ❌ Automatically find your certificate if it's in a different location
- ❌ Access files on your computer outside this project folder

**YOU MUST DO**:
1. ✅ Copy the `.pfx` certificate file to `certs/` folder
2. ✅ Run the setup script and enter your certificate password
3. ✅ Tell me when it's done, and I'll rebuild/upload

---

## Alternative: Manual Setup

If the script doesn't work, manually create/edit `.env`:

```env
CSC_LINK=certs/your-certificate-name.pfx
CSC_KEY_PASSWORD=your_certificate_password_here
```

Replace:
- `your-certificate-name.pfx` with your actual certificate filename
- `your_certificate_password_here` with your certificate password

---

## After Setup

Once `.env` has `CSC_LINK` and `CSC_KEY_PASSWORD`, I will:
1. Rebuild the signed installer: `npm run dist:llv:win`
2. Verify it's signed: `.\scripts\verify-installer.ps1`
3. Upload to GitHub Releases: `.\scripts\upload-llv-installer.ps1`

---

## Current Status

- ❌ Certificate: Not found in `certs/`
- ❌ Configuration: No `CSC_LINK` or `CSC_KEY_PASSWORD` in `.env`
- ❌ Installer on GitHub: **UNSIGNED** (will show SmartScreen warnings)

---

## Next Action

**PLEASE DO THIS NOW:**
1. Find your `.pfx` certificate file
2. Copy it to: `C:\Users\kelly\OneDrive\Desktop\Vault-Main\LocalPasswordVault\certs\`
3. Run: `.\scripts\setup-code-signing.ps1`
4. Enter your certificate password when prompted
5. Tell me "done" and I'll rebuild/upload
