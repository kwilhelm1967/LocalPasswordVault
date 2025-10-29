# GitHub Actions - Electron Build Workflow

This directory contains the GitHub Actions workflow for building the LocalPasswordVault Electron application across all platforms.

## 🚀 Workflow Features

- **Multi-platform builds**: Windows, macOS, and Linux
- **Separate build and release jobs**: Build-only for development, Release for tagged versions
- **Artifact storage**: Build artifacts stored for 30 days
- **Release integration**: Automatic publishing when pushing tags (v*)
- **Code signing support**: For release builds with proper certificates

## 📋 Workflow Triggers

The workflow runs on:
- Push to `main` branch (build only)
- Push with tags starting with `v` (release build)
- Pull requests to `main` branch (build only)

## 🔧 Required GitHub Secrets

For release builds and code signing (optional but recommended):
- `GITHUB_TOKEN`: Automatically provided by GitHub Actions
- `CSC_LINK`: Base64-encoded .p12 certificate (macOS)
- `CSC_KEY_PASSWORD`: Password for the certificate (macOS)

**Note**: Code signing secrets are only used in release jobs (when pushing tags).

## 📦 Build Outputs

### Windows
- `Local Password Vault Setup.exe` (installer)
- `LocalPasswordVault-1.2.0-Portable.exe` (portable version)

### macOS
- `Local Password Vault-1.2.0.dmg` (disk image)

### Linux
- `LocalPasswordVault-1.2.0.AppImage` (universal binary)

## 🔄 Workflow Jobs

### Build Job (Development/Testing)
- **Trigger**: Push to `main`, Pull requests
- **Build command**: `npm run dist`
- **Output**: Unsigned builds for testing
- **Artifacts**: Stored for 30 days

### Release Job (Production)
- **Trigger**: Tags starting with `v` (e.g., `v1.2.0`)
- **Build commands**:
  - `npm run build-only`
  - `npm exec electron-builder -- --publish always`
- **Features**: Code signing, automatic GitHub release
- **Artifacts**: Published to GitHub releases

## 🛠️ Local Development

To test builds locally before pushing:

```bash
# Install dependencies
npm install

# Build Electron app for development (no publishing)
npm run dist

# Build for production (similar to release job)
npm run build-only
npm run electron-pack
```

## 📁 Workflow Structure

```
.github/workflows/
├── electron-build.yml    # Main build and release workflow
└── README.md            # This file
```

## 🔄 CI/CD Process

### Development Build
1. **Push to main** → Build job triggers
2. **Setup** → Node.js environment and dependencies
3. **Build** → `npm run dist` (unsigned builds)
4. **Upload** → Artifacts stored for 30 days

### Release Build
1. **Push tag (v*)** → Release job triggers
2. **Setup** → Node.js environment and dependencies
3. **Build** → `npm run build-only` + electron-builder with publishing
4. **Sign** → Code signing with certificates (if configured)
5. **Publish** → Automatic GitHub release creation
6. **Upload** → Release artifacts attached to GitHub release

## 🏷️ Creating Releases

To create a new release:

1. **Tag your commit**:
   ```bash
   git tag v1.2.0
   git push origin v1.2.0
   ```

2. **Automatic release creation**:
   - GitHub Actions will automatically create a release
   - Built artifacts will be attached to the release
   - Code signing will be applied if certificates are configured

## 🐛 Troubleshooting

### Build Failures
- Check `npm run dist` works locally first
- Verify `package.json` scripts are correct
- Ensure `electron-builder.json` is properly configured

### Release Job Failures
- Verify you're pushing a tag that starts with `v`
- Check `GITHUB_TOKEN` permissions for releases
- Ensure code signing certificates are valid (if used)

### macOS Code Signing
- Certificate must be in .p12 format
- Use `base64 -i certificate.p12 | pbcopy` to encode (macOS)
- Add `CSC_LINK` and `CSC_KEY_PASSWORD` to repository secrets

### Permission Issues
- Ensure GitHub Actions has permissions to create releases
- Check repository settings for Actions permissions
- Verify secrets are properly configured

### Artifacts Not Uploading
- Check that `release/**` path matches actual output
- Verify electron-builder is outputting to the correct directory
- Check build logs for any errors during packaging

## 📚 Additional Resources

- [Electron Builder Documentation](https://electron.build/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Releases Documentation](https://docs.github.com/en/repositories/releasing-projects-on-github)
- [SemVer Versioning](https://semver.org/)