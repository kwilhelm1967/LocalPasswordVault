# Where to Work — Local Password Vault (LPV)

**Single source of truth for the website:**

## Edit only this folder

**`C:\dev\LocalPasswordVault\LPV`**

- All website HTML, CSS, images, and assets for localpasswordvault.com live here.
- **Edit only files inside LPV.** This is what gets zipped and deployed to Host Armada.

## Do not edit

- **`lpv-website-from-GitHub-V1.2.0`** — Snapshot extracted from GitHub. Used only as a reference or to refresh from a release. Do not edit; changes there are not used for deploy.
- Any other project (Local Legacy Vault, AfterPassing Guide) — do not touch.

## Deploy to Host Armada (HA)

1. Build the zip from your **LPV** folder:
   - Run: **`.\scripts\build-lpv-website-from-LOCAL.ps1`** (from `C:\dev\LocalPasswordVault`).
   - Zip is created (script puts it on Desktop unless you changed it).
2. Upload that zip to HA → **public_html** → extract (overwrite).
3. Confirm **index.html** is directly in public_html.

## Refreshing LPV from a GitHub release (optional)

If you want to reset LPV to a GitHub release, run the “from GitHub” script (e.g. `GET-LPV-FROM-GITHUB-ONLY.bat` with a tag). That updates the downloaded snapshot. Then **copy** the contents of `lpv-website-from-GitHub-V1.2.0` into **LPV** so LPV stays the folder you edit. Or replace LPV’s contents with the snapshot and then continue editing only in LPV.

---

**Summary:** Work only in **LPV**. Build zip from **LPV**. Deploy that zip to HA.
