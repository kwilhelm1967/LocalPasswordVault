/**
 * Download URLs Configuration
 * 
 * Centralized download URLs for different platforms and products.
 */

const GITHUB_REPO = "kwilhelm1967/Vault";
const VERSION = "1.2.0";

export interface DownloadUrls {
  windows: string;
  macos: string;
  linux: string;
}

const LPV_DOWNLOAD_URLS: DownloadUrls = {
  windows: `https://github.com/${GITHUB_REPO}/releases/download/V${VERSION}/Local.Password.Vault.Setup.${VERSION}.exe`,
  macos: `https://github.com/${GITHUB_REPO}/releases/latest/download/Local%20Password%20Vault-${VERSION}-mac.dmg`,
  linux: `https://github.com/${GITHUB_REPO}/releases/latest/download/Local%20Password%20Vault-${VERSION}.AppImage`,
};

export const getDownloadUrl = (
  platform: 'windows' | 'macos' | 'linux'
): string => {
  return LPV_DOWNLOAD_URLS[platform];
};

export { LPV_DOWNLOAD_URLS };
