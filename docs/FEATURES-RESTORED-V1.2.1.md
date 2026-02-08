# LPV Website Features Restored (from post–V1.2.0)

**LPV only.** All restored content is for **Local Password Vault** (localpasswordvault.com / api.localpasswordvault.com). No LLV (Local Legacy Vault) content or APIs are used on this page.

**Context:** The site is built from GitHub (e.g. V1.2.0). Some features that were added after V1.2.0 (e.g. in V1.2.1 / commit cda4594) have been **restored into the local LPV folder** so they are present when you build or deploy.

## Restored in `LPV/trial-success-lpv.html`

- **API base URL**  
  - `API_BASE_URL` set to `https://api.localpasswordvault.com` for production (localpasswordvault.com / www).

- **Trial key from URL or backend**  
  - If the page is opened with `?key=TRIAL-XXXX-XXXX-XXXX`, that key is shown.
  - If opened with `?email=...`, the page calls `GET /api/trial/status/{email}` and shows “Check your email for your trial key” (or “Trial not found” if no active trial).
  - If neither is present, it shows “Check your email for your trial key.”

- **Removed**  
  - The previous **client-side fake key generator** (`generateTrialKey()`) was removed so the page no longer shows a random placeholder key; it now relies on URL or backend.

## Download links

- **Unchanged.**  
  - Windows/macOS/Linux download links still point to **Vault** repo **V1.2.0** assets (.exe, .dmg, .AppImage) as locked in the file comments.

## Building / deploying

- Run your usual “from GitHub” flow (e.g. `DOWNLOAD-LPV-V1.2.0-FROM-GITHUB.bat` or the scripts it uses).  
- To include these restored features in the zip, the **local** `LPV` folder (with the changes above) must be what gets zipped—so either:
  - Your build script zips from **local** `C:\dev\LocalPasswordVault\LPV`, or  
  - You copy the updated `trial-success-lpv.html` into the extracted GitHub content before zipping.

If your script only zips the **downloaded** GitHub tree (no local files), copy `LPV/trial-success-lpv.html` from this repo into that tree before zipping so the restored behavior is in the deployable zip.
