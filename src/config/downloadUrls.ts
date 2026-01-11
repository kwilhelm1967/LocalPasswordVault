/**
 * Download URLs Configuration
 * 
 * Centralized download URLs for different platforms and products.
 * 
 * LOCKED IN: Repository mapping - NEVER CHANGE
 * - kwilhelm1967/Vault = Local Password Vault (LPV) ONLY
 * - kwilhelm1967/LocalLegacyVault = Local Legacy Vault (LLV) ONLY
 * 
 * IMPORTANT: This repository (LocalPasswordVault) is for Password Vault ONLY.
 * Legacy Vault MUST be built from the kwilhelm1967/LocalLegacyVault repository.
 * Download URLs correctly point to the LocalLegacyVault repository for LLV installers.
 */

// LOCKED: Local Password Vault repository - NEVER CHANGE TO LocalLegacyVault
const LPV_GITHUB_REPO = "kwilhelm1967/Vault";
// LOCKED: Local Legacy Vault repository - NEVER CHANGE TO Vault
const LLV_GITHUB_REPO = "kwilhelm1967/LocalLegacyVault";
const VERSION = "1.2.0";

export interface DownloadUrls {
  windows: string;
  macos: string;
  linux: string;
}

// LOCKED: Local Password Vault downloads - ALWAYS uses kwilhelm1967/Vault repository
const LPV_DOWNLOAD_URLS: DownloadUrls = {
  windows: `https://github.com/${LPV_GITHUB_REPO}/releases/download/V${VERSION}/Local.Password.Vault.Setup.${VERSION}.exe`,
  macos: `https://github.com/${LPV_GITHUB_REPO}/releases/latest/download/Local%20Password%20Vault-${VERSION}-mac.dmg`,
  linux: `https://github.com/${LPV_GITHUB_REPO}/releases/latest/download/Local%20Password%20Vault-${VERSION}.AppImage`,
};

// LOCKED: Local Legacy Vault downloads - ALWAYS uses kwilhelm1967/LocalLegacyVault repository
// NOTE: GitHub filename uses DOTS: "Local.Legacy.Vault.Setup.1.2.0-x64.exe" (dots, -x64 suffix)
// URL must use dots (.) to match GitHub filename: Local.Legacy.Vault.Setup.1.2.0-x64.exe
const LLV_DOWNLOAD_URLS: DownloadUrls = {
  windows: `https://github.com/${LLV_GITHUB_REPO}/releases/download/V${VERSION}/Local.Legacy.Vault.Setup.${VERSION}-x64.exe`,
  macos: `https://github.com/${LLV_GITHUB_REPO}/releases/latest/download/Local.Legacy.Vault-${VERSION}-mac.dmg`,
  linux: `https://github.com/${LLV_GITHUB_REPO}/releases/latest/download/Local.Legacy.Vault-${VERSION}.AppImage`,
};

export const getDownloadUrl = (
  platform: 'windows' | 'macos' | 'linux',
  productType: 'lpv' | 'llv' = 'lpv'
): string => {
  if (productType === 'llv') {
    return LLV_DOWNLOAD_URLS[platform];
  }
  return LPV_DOWNLOAD_URLS[platform];
};

export { LPV_DOWNLOAD_URLS, LLV_DOWNLOAD_URLS };
