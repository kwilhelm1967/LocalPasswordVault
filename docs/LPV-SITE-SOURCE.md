# Where the Local Password Vault Website Code Lives

**Product:** Local Password Vault (LPV) — the **password manager** site at **localpasswordvault.com**.  
**Not:** Local Legacy Vault (LLV) or AfterPassing Guide (APG).

## Single source of truth — edit only LPV

**`C:\dev\LocalPasswordVault\LPV`** is the folder to edit. Build the deploy zip from here so you and HA use the same documents. Do not edit **lpv-website-from-GitHub-V1.2.0** for deploy (that is a GitHub snapshot only). See **docs/WORK-HERE.md** for the full workflow.

1. **This repo (local):** `C:\dev\LocalPasswordVault\LPV`  
   - All HTML/CSS/assets for the marketing site (index, pricing, FAQ, etc.). **Edit only here.**

2. **GitHub:** **kwilhelm1967/LocalPasswordVault** → **main** branch → **LPV** folder  
   - Same content as above.  
   - Raw check: https://github.com/kwilhelm1967/LocalPasswordVault/tree/main/LPV  
   - `LPV/index.html` title: **"Local Password Vault - Offline Password Security"**.

The app (Electron/React) and releases point to **kwilhelm1967/Vault** (issues, downloads). The **website** used for localpasswordvault.com is the **LPV** folder in **LocalPasswordVault** (or the same in Vault if that repo has it).

## Deploying to localpasswordvault.com (Host Armada)

- **Document root** for localpasswordvault.com = **public_html**.
- **Preferred:** Build zip from your local **LPV** folder: run `.\scripts\build-lpv-website-from-LOCAL.ps1` from project root. Upload that zip to public_html and extract.
- Or build from GitHub: run `GET-LPV-FROM-GITHUB-ONLY.bat` (e.g. V1.2.0). Upload the zip **into public_html** and **extract there** so that **index.html** is **directly inside public_html** (no extra folder).
- Optional: try `-UseVaultRepo` if you want to pull from **kwilhelm1967/Vault** instead.

## If the live site shows the wrong product

- Confirm you’re opening **https://localpasswordvault.com** (not another domain or subfolder).
- Confirm the host is using **public_html** as the document root for this domain.
- After extracting the zip, confirm **index.html** is in **public_html** (not inside a subfolder). If you see a single folder after extract, move its contents up into public_html and delete the empty folder.
- The built zip shows a verification line: **built page title = Local Password Vault - Offline Password Security**. If you see that, the zip content is correct; the issue is where it was uploaded or how the server is serving it.
