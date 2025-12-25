/**
 * Storage Quota Handler
 * 
 * Handles localStorage quota exceeded errors and provides fallback strategies.
 * Implements graceful degradation and user-friendly error messages.
 */

import { devError, devWarn } from "./devLog";

export interface StorageQuotaInfo {
  used: number;
  available: number;
  quota: number;
  percentage: number;
}

export interface StorageError {
  code: string;
  message: string;
  recoverable: boolean;
  suggestion: string;
}

/**
 * Check if storage quota is available
 */
export async function checkStorageQuota(): Promise<StorageQuotaInfo | null> {
  if (!('storage' in navigator && 'estimate' in navigator.storage)) {
    return null; // Storage API not available
  }

  try {
    const estimate = await navigator.storage.estimate();
    const used = estimate.usage || 0;
    const quota = estimate.quota || 0;
    const available = quota - used;
    const percentage = quota > 0 ? (used / quota) * 100 : 0;

    return {
      used,
      available,
      quota,
      percentage,
    };
  } catch (error) {
    devError("Failed to check storage quota:", error);
    return null;
  }
}

/**
 * Handle storage quota exceeded error
 */
export function handleStorageQuotaError(error: unknown): StorageError {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Check for quota exceeded error
  if (
    errorMessage.includes("QuotaExceededError") ||
    errorMessage.includes("quota") ||
    errorMessage.includes("QUOTA_EXCEEDED")
  ) {
    return {
      code: "QUOTA_EXCEEDED",
      message: "Storage quota exceeded. Your device's storage is full.",
      recoverable: true,
      suggestion: "Please free up space or export old entries to reduce storage usage.",
    };
  }

  // Check for other storage errors
  if (errorMessage.includes("SecurityError") || errorMessage.includes("SECURITY")) {
    return {
      code: "SECURITY_ERROR",
      message: "Storage access denied. Please check browser permissions.",
      recoverable: false,
      suggestion: "Enable storage permissions in your browser settings.",
    };
  }

  // Unknown error
  return {
    code: "UNKNOWN_ERROR",
    message: "Storage operation failed.",
    recoverable: false,
    suggestion: "Please try again or contact support if the issue persists.",
  };
}

/**
 * Safely set item in localStorage with quota handling
 */
export async function safeSetItem(
  key: string,
  value: string
): Promise<{ success: boolean; error?: StorageError }> {
  try {
    // Check quota before attempting to save
    const quotaInfo = await checkStorageQuota();
    if (quotaInfo) {
      const estimatedSize = new Blob([value]).size;
      
      // Warn if approaching quota (90% full)
      if (quotaInfo.percentage > 90) {
        devWarn(`Storage quota warning: ${quotaInfo.percentage.toFixed(1)}% full`);
      }

      // Check if we have enough space
      if (estimatedSize > quotaInfo.available) {
        return {
          success: false,
          error: {
            code: "INSUFFICIENT_SPACE",
            message: "Not enough storage space available.",
            recoverable: true,
            suggestion: `Need ${(estimatedSize / 1024 / 1024).toFixed(2)}MB, but only ${(quotaInfo.available / 1024 / 1024).toFixed(2)}MB available. Please free up space.`,
          },
        };
      }
    }

    // Attempt to save
    localStorage.setItem(key, value);
    return { success: true };
  } catch (error) {
    const storageError = handleStorageQuotaError(error);
    devError(`Failed to save to localStorage (${key}):`, error);
    return {
      success: false,
      error: storageError,
    };
  }
}

/**
 * Clear old backups to free up space
 */
export function clearOldBackups(): number {
  let cleared = 0;
  const backupKeys: string[] = [];

  // Find all backup keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes("_backup") || key.includes("backup_"))) {
      backupKeys.push(key);
    }
  }

  // Keep only the most recent backup, delete others
  if (backupKeys.length > 1) {
    backupKeys.sort().slice(0, -1).forEach((key) => {
      localStorage.removeItem(key);
      cleared++;
    });
  }

  return cleared;
}

/**
 * Get storage usage statistics
 */
export async function getStorageStats(): Promise<{
  total: number;
  used: number;
  available: number;
  percentage: number;
  entries: number;
  backups: number;
}> {
  let totalSize = 0;
  let entries = 0;
  let backups = 0;

  // Calculate size of all localStorage items
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key) || "";
      totalSize += key.length + value.length;
      
      if (key.includes("password_entries")) {
        entries++;
      }
      if (key.includes("backup")) {
        backups++;
      }
    }
  }

  const quotaInfo = await checkStorageQuota();
  const quota = quotaInfo?.quota || 0;
  const used = quotaInfo?.used || totalSize;
  const available = quotaInfo?.available || (quota - totalSize);
  const percentage = quota > 0 ? (used / quota) * 100 : 0;

  return {
    total: quota,
    used,
    available,
    percentage,
    entries,
    backups,
  };
}

/**
 * Attempt to free up storage space
 */
export async function freeUpStorage(): Promise<{
  success: boolean;
  freed: number;
  message: string;
}> {
  try {
    // Clear old backups
    const backupsCleared = clearOldBackups();
    
    // Clear session storage (temporary data)
    sessionStorage.clear();
    
    // Get stats after cleanup
    const stats = await getStorageStats();
    
    return {
      success: true,
      freed: backupsCleared,
      message: `Freed up space by clearing ${backupsCleared} old backup(s). ${(stats.available / 1024 / 1024).toFixed(2)}MB available.`,
    };
  } catch (error) {
    devError("Failed to free up storage:", error);
    return {
      success: false,
      freed: 0,
      message: "Failed to free up storage space.",
    };
  }
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

