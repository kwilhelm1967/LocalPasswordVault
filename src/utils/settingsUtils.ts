/**
 * Settings Utilities
 * 
 * Shared utilities for vault settings management.
 * Extracted from Settings component to avoid circular dependencies.
 */

import { devError, devWarn } from "./devLog";

export interface VaultSettings {
  autoLockTimeout: number; // minutes
  clipboardClearTimeout: number; // seconds
  showPasswordsDefault: boolean;
  soundEffectsEnabled: boolean;
}

export const SETTINGS_KEYS = {
  AUTO_LOCK_TIMEOUT: "vault_auto_lock_timeout",
  CLIPBOARD_CLEAR_TIMEOUT: "vault_clipboard_clear_timeout",
  SHOW_PASSWORDS_DEFAULT: "vault_show_passwords_default",
};

export const DEFAULT_SETTINGS: VaultSettings = {
  autoLockTimeout: 5,
  clipboardClearTimeout: 30,
  showPasswordsDefault: false,
  soundEffectsEnabled: false,
};

/**
 * Get vault settings from localStorage
 */
export const getVaultSettings = (): VaultSettings => {
  let soundEffectsEnabled = DEFAULT_SETTINGS.soundEffectsEnabled;
  try {
    const vaultSettings = localStorage.getItem('vault_settings');
    if (vaultSettings) {
      const parsed = JSON.parse(vaultSettings);
      soundEffectsEnabled = parsed.soundEffectsEnabled ?? false;
    }
  } catch (error) {
    devError("Failed to parse vault settings:", error);
  }
  
  return {
    autoLockTimeout: parseInt(
      localStorage.getItem(SETTINGS_KEYS.AUTO_LOCK_TIMEOUT) || 
      String(DEFAULT_SETTINGS.autoLockTimeout)
    ),
    clipboardClearTimeout: parseInt(
      localStorage.getItem(SETTINGS_KEYS.CLIPBOARD_CLEAR_TIMEOUT) || 
      String(DEFAULT_SETTINGS.clipboardClearTimeout)
    ),
    showPasswordsDefault: localStorage.getItem(SETTINGS_KEYS.SHOW_PASSWORDS_DEFAULT) === "true",
    soundEffectsEnabled,
  };
};

let lastCopiedText: string | null = null;
let clearTimeoutId: NodeJS.Timeout | null = null;

/**
 * Clear clipboard after timeout
 */
export const clearClipboardAfterTimeout = (timeout: number, copiedText?: string) => {
  // Clear any existing timeout
  if (clearTimeoutId) {
    clearTimeout(clearTimeoutId);
    clearTimeoutId = null;
  }

  // If no timeout specified or timeout is 0, don't schedule clearing
  if (timeout <= 0) {
    return;
  }

  // Remember what we copied (to avoid clearing if user copied something else)
  if (copiedText !== undefined) {
    lastCopiedText = copiedText;
  }

  // Schedule clipboard clearing
  clearTimeoutId = setTimeout(async () => {
    try {
      // Check if clipboard still contains what we copied
      const currentClipboard = await navigator.clipboard.readText();
      if (currentClipboard === lastCopiedText) {
        // Clear clipboard (set to empty string)
        await navigator.clipboard.writeText('');
        lastCopiedText = null;
      }
    } catch (error) {
      // Clipboard access may fail (e.g., user denied permission)
      // Silently ignore - this is not critical
      devWarn("Failed to clear clipboard:", error);
    } finally {
      clearTimeoutId = null;
    }
  }, timeout * 1000); // Convert seconds to milliseconds
};
