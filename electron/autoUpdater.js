/**
 * Auto-Updater Module - DISABLED
 * 
 * SECURITY POLICY: Auto-updates are DISABLED to prevent any phone-home behavior.
 * 
 * This module is a no-op implementation that does nothing. All update checking
 * and downloading functionality has been removed to ensure:
 * - Zero network calls after license activation
 * - No phone-home behavior
 * - No background sync services
 * - Complete privacy and security
 * 
 * Users can manually download updates from the website if desired.
 */

const log = require('electron-log');

// Update state (always false - no updates)
let updateAvailable = false;
let updateDownloaded = false;
let mainWindow = null;

/**
 * Initialize auto-updater - DISABLED (no-op)
 * @param {BrowserWindow} win - Main window reference (unused)
 */
function initAutoUpdater(win) {
  mainWindow = win;
  // DISABLED: No update checking, no network calls, no phone-home
  log.info('Auto-updater disabled per security policy - zero network calls after activation');
}

/**
 * Check for updates - DISABLED (no-op)
 * @param {boolean} showNoUpdateDialog - Unused (no-op)
 */
async function checkForUpdates(showNoUpdateDialog = false) {
  // DISABLED: No network calls, no phone-home
  log.info('Update checking disabled per security policy');
  void showNoUpdateDialog; // Suppress unused parameter warning
}

/**
 * Download the available update - DISABLED (no-op)
 */
function downloadUpdate() {
  // DISABLED: No downloads, no network calls
  log.info('Update downloading disabled per security policy');
}

/**
 * Install the downloaded update - DISABLED (no-op)
 */
function installUpdate() {
  // DISABLED: No installation, no network calls
  log.info('Update installation disabled per security policy');
}

/**
 * Get current update state
 */
function getUpdateState() {
  return {
    updateAvailable,
    updateDownloaded
  };
}

module.exports = {
  initAutoUpdater,
  checkForUpdates,
  downloadUpdate,
  installUpdate,
  getUpdateState
};

