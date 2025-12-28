# Developer Guide: Download Links Setup

## What Was Fixed

The broken download links in `LPV/trial-success.html` have been updated to point to GitHub releases. The placeholder links:
- `https://downloads.localpasswordvault.com/REPLACE_WINDOWS_LINK`
- `https://downloads.localpasswordvault.com/REPLACE_MACOS_LINK`
- `https://downloads.localpasswordvault.com/REPLACE_LINUX_LINK`

Have been replaced with GitHub release URLs.

## What the Developer Needs to Do

### 1. Verify Filenames Match Electron-Builder Output

When you create a GitHub release, electron-builder will upload files with these exact names (based on `electron-builder.json`):

**Windows:**
- `Local Password Vault-Setup-1.2.0.exe` (NSIS installer)
- `Local Password Vault-1.2.0-win-x64.exe` (Portable, if built)

**macOS:**
- `Local Password Vault-1.2.0-mac.dmg` (DMG installer)
- `Local Password Vault-1.2.0-mac.zip` (ZIP archive, if built)

**Linux:**
- `Local Password Vault-1.2.0.AppImage` (AppImage)
- `Local Password Vault-1.2.0-linux-x64.deb` (Debian package, if built)

### 2. Create a GitHub Release

When you're ready to publish:

```bash
# Build the production version
npm run build:prod

# Create a release (this will automatically upload to GitHub)
npm run release
```

Or manually:
1. Go to: https://github.com/kwilhelm1967/Vault/releases
2. Click "Draft a new release"
3. Tag version: `v1.2.0` (or your version)
4. Upload the built files from `release/` directory
5. Publish the release

### 3. Verify the Links Work

After creating the release, test the download links:
- Windows: https://github.com/kwilhelm1967/Vault/releases/latest/download/Local%20Password%20Vault-Setup-1.2.0.exe
- macOS: https://github.com/kwilhelm1967/Vault/releases/latest/download/Local%20Password%20Vault-1.2.0-mac.dmg
- Linux: https://github.com/kwilhelm1967/Vault/releases/latest/download/Local%20Password%20Vault-1.2.0.AppImage

**Important:** If the actual filenames in GitHub differ from what's in the links, you'll need to update `LPV/trial-success.html` to match.

### 4. Update Version Number (When Version Changes)

When you release a new version (e.g., 1.3.0), update the version in:
1. `package.json` (version field)
2. `LPV/trial-success.html` (in the download URLs - replace `1.2.0` with new version)

### 5. Alternative: Use Custom Downloads Domain

If you want to use `downloads.localpasswordvault.com` instead of GitHub:

**Option A: Redirect Setup**
1. Set up DNS for `downloads.localpasswordvault.com`
2. Configure redirects:
   - `downloads.localpasswordvault.com/windows` → GitHub Windows release
   - `downloads.localpasswordvault.com/macos` → GitHub macOS release
   - `downloads.localpasswordvault.com/linux` → GitHub Linux release

**Option B: Host Files Directly**
1. Set up web hosting for `downloads.localpasswordvault.com`
2. Upload the built installer files
3. Update links in `LPV/trial-success.html` to point to your domain

## Current Link Format

The links use GitHub's `/latest/download/` pattern which automatically points to the latest release:

```
https://github.com/kwilhelm1967/Vault/releases/latest/download/[FILENAME]
```

This means:
- ✅ Always points to the latest release (no manual updates needed)
- ⚠️ Requires exact filename match with uploaded assets
- ⚠️ If you change the artifact naming in electron-builder.json, update the links

## Quick Checklist

- [ ] Build the app: `npm run build:prod`
- [ ] Create GitHub release with built installers
- [ ] Verify filenames match the links in `trial-success.html`
- [ ] Test all three download links
- [ ] Update version number in links when releasing new version

## Troubleshooting

**If downloads fail:**
1. Check that the release exists: https://github.com/kwilhelm1967/Vault/releases
2. Verify the exact filenames of uploaded assets
3. Ensure filenames match (including spaces - they're URL-encoded as `%20`)
4. Check that the release is published (not draft)

**If filenames don't match:**
- Check `electron-builder.json` for `artifactName` patterns
- Compare with actual uploaded filenames in GitHub
- Update `LPV/trial-success.html` with correct filenames

