/// <reference types="vite/client" />

// Electron IPC event type (simplified for renderer process)
interface ElectronEvent {
  sender: unknown;
  senderId: number;
}

// Stored entry format (dates as ISO strings for IPC transfer)
interface StoredPasswordEntry {
  id: string;
  accountName: string;
  username: string;
  password: string;
  category: string;
  entryType?: string;
  website?: string;
  notes?: string;
  customFields?: Array<{ name: string; value: string; isSecret?: boolean }>;
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
}

declare global {
  interface Window {
    electronAPI: {
      // Version and platform
      getVersion: () => Promise<string>;
      getPlatform: () => Promise<string>;

      // Event listeners
      onLockVault: (callback: () => void) => void;
      removeAllListeners: (channel: string) => void;

      // Floating panel controls
      showFloatingPanel: () => Promise<void>;
      hideFloatingPanel: () => Promise<void>;
      isFloatingPanelOpen: () => Promise<boolean>;
      getFloatingPanelPosition: () => Promise<{ x: number; y: number } | null>;
      saveFloatingPanelPosition: (x: number, y: number) => Promise<void>;
      setAlwaysOnTop: (flag: boolean) => Promise<void>;

      // Window controls
      minimizeMainWindow: () => Promise<void>;
      hideMainWindow: () => Promise<void>;
      restoreMainWindow: () => Promise<void>;
      showMainWindow: () => Promise<boolean>;

      // Floating button controls
      showFloatingButton: () => Promise<void>;
      hideFloatingButton: () => Promise<void>;
      isFloatingButtonOpen: () => Promise<boolean>;
      toggleFloatingPanelFromButton: () => Promise<void>;
      saveFloatingButtonPosition: (x: number, y: number) => Promise<void>;
      moveFloatingButton: (x: number, y: number) => Promise<boolean>;

      // Vault security controls
      vaultUnlocked: () => Promise<void>;
      vaultLocked: () => Promise<void>;
      isVaultUnlocked: () => Promise<boolean>;
      onVaultStatusChange: (
        callback: (event: ElectronEvent, unlocked: boolean) => void
      ) => void;
      removeVaultStatusListener: () => void;

      // Entries synchronization
      broadcastEntriesChanged: () => Promise<boolean>;
      saveSharedEntries: (entries: StoredPasswordEntry[]) => Promise<boolean>;
      loadSharedEntries: () => Promise<StoredPasswordEntry[]>;
      getVaultStatus: () => Promise<boolean>;
      syncVaultToFloating: () => Promise<boolean>;
      onEntriesChanged: (callback: (event: ElectronEvent) => void) => void;
      removeEntriesChangedListener: (callback: (event: ElectronEvent) => void) => void;
      openExternal: (url: string) => Promise<boolean>;

      // Trial/License management for floating button security
      saveTrialInfo: (trialInfo: {
        hasTrial?: boolean;
        isExpired?: boolean;
        expiryTime?: string | null;
        startTime?: string | null;
        hasValidLicense?: boolean;
        licenseType?: string | null;
      }) => Promise<boolean>;
      checkTrialStatus: () => Promise<{
        hasTrial: boolean;
        isExpired: boolean;
        canUnlock: boolean;
        expiryTime?: string;
      }>;
      isTrialExpired: () => Promise<boolean>;

      // Allow for additional Electron API methods
      [key: string]: ((...args: unknown[]) => unknown) | undefined;
    };
  }
}

export {};
