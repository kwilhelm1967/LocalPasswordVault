/**
 * Download Service for Local Password Vault
 * Handles installer downloads for all supported platforms.
 * 
 * NOTE: This service provides download URLs for compiled installers only.
 * Source code is NOT distributed to end users.
 */

class DownloadService {
  private static instance: DownloadService;

  static getInstance(): DownloadService {
    if (!DownloadService.instance) {
      DownloadService.instance = new DownloadService();
    }
    return DownloadService.instance;
  }

  // Platform download URLs
  private readonly platformUrls = {
    windows: "https://localpasswordvault.com/download/windows",
    macos: "https://localpasswordvault.com/download/macos",
    linux: "https://localpasswordvault.com/download/linux",
  };

  // Platform file info
  private readonly platformInfo = {
    windows: {
      filename: "LocalPasswordVault-Setup.exe",
      size: "~85 MB",
      requirements: "Windows 10 or later (64-bit)",
    },
    macos: {
      filename: "LocalPasswordVault.dmg",
      size: "~95 MB",
      requirements: "macOS 10.15 (Catalina) or later",
    },
    linux: {
      filename: "LocalPasswordVault.AppImage",
      size: "~90 MB",
      requirements: "Ubuntu 18.04+ or equivalent",
    },
  };

  /**
   * Get download URL for a specific platform
   */
  getDownloadUrl(platform: "windows" | "macos" | "linux"): string {
    return this.platformUrls[platform];
  }

  /**
   * Get platform info (filename, size, requirements)
   */
  getPlatformInfo(platform: "windows" | "macos" | "linux") {
    return this.platformInfo[platform];
  }

  /**
   * Initiate download for a specific platform
   */
  downloadForPlatform(platform: "windows" | "macos" | "linux"): void {
    const url = this.getDownloadUrl(platform);
    window.open(url, "_blank");
  }

  /**
   * Detect user's operating system
   */
  detectPlatform(): "windows" | "macos" | "linux" | "unknown" {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes("win")) return "windows";
    if (userAgent.includes("mac")) return "macos";
    if (userAgent.includes("linux")) return "linux";
    return "unknown";
  }

  /**
   * Get all available platforms
   */
  getAllPlatforms(): Array<"windows" | "macos" | "linux"> {
    return ["windows", "macos", "linux"];
  }
}

export const downloadService = DownloadService.getInstance();
