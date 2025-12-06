/**
 * @fileoverview Entry Management Hook - CRUD Operations for Password Entries
 * 
 * Provides a custom React hook for managing password entry operations
 * including add, update, and delete with automatic encryption and
 * cross-window synchronization for Electron.
 * 
 * @module hooks/useEntryManagement
 * @version 1.2.0
 * 
 * @example
 * // Using the hook in a component
 * const {
 *   handleAddEntry,
 *   handleUpdateEntry,
 *   handleDeleteEntry,
 *   isProcessing
 * } = useEntryManagement({
 *   entries,
 *   setEntries,
 *   isElectron,
 *   broadcastChange
 * });
 * 
 * // Add a new entry
 * await handleAddEntry({
 *   accountName: 'Gmail',
 *   username: 'user@gmail.com',
 *   password: 'securePassword123',
 *   category: 'email'
 * });
 */

import { useCallback, useState } from "react";
import { PasswordEntry } from "../types";
import { storageService } from "../utils/storage";
import { devError } from "../utils/devLog";

/**
 * Props for the useEntryManagement hook.
 * @interface UseEntryManagementProps
 */
interface UseEntryManagementProps {
  /** Current array of password entries */
  entries: PasswordEntry[];
  /** State setter for updating entries */
  setEntries: React.Dispatch<React.SetStateAction<PasswordEntry[]>>;
  /** Whether running in Electron environment */
  isElectron: boolean;
  /** Optional function to save entries to Electron shared storage */
  saveSharedEntries?: (entries: PasswordEntry[]) => Promise<void>;
  /** Function to broadcast changes to other windows */
  broadcastChange: () => Promise<void>;
}

/**
 * Return type for the useEntryManagement hook.
 * @interface UseEntryManagementReturn
 */
interface UseEntryManagementReturn {
  /** Adds a new password entry to the vault */
  handleAddEntry: (entryData: Omit<PasswordEntry, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  /** Updates an existing password entry */
  handleUpdateEntry: (updatedEntry: PasswordEntry) => Promise<void>;
  /** Deletes a password entry by ID */
  handleDeleteEntry: (id: string) => Promise<void>;
  /** Whether an operation is currently in progress */
  isProcessing: boolean;
}

export const useEntryManagement = ({
  entries,
  setEntries,
  isElectron,
  saveSharedEntries,
  broadcastChange,
}: UseEntryManagementProps): UseEntryManagementReturn => {
  const [isProcessing] = useState(false);

  const handleAddEntry = useCallback(async (
    entryData: Omit<PasswordEntry, "id" | "createdAt" | "updatedAt">
  ) => {
    // Validate required fields based on entry type
    const isSecureNote = entryData.entryType === "secure_note";
    
    if (!isSecureNote) {
      // Password entries require accountName, username, and password
      if (!entryData.accountName?.trim()) {
        throw new Error("Account name is required");
      }
      if (typeof entryData.username !== "string") {
        throw new Error("Username is required");
      }
      if (typeof entryData.password !== "string") {
        throw new Error("Password is required");
      }
    } else {
      // Secure notes only require accountName
      if (!entryData.accountName?.trim()) {
        throw new Error("Note title is required");
      }
    }

    const newEntry: PasswordEntry = {
      ...entryData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedEntries = [...entries, newEntry];
    setEntries(updatedEntries);

    try {
      const isFloatingMode = window.location.hash === "#floating";
      const isVaultLockedLocally = !storageService.isVaultUnlocked();

      if (isElectron && isFloatingMode && isVaultLockedLocally) {
        if (saveSharedEntries) {
          await saveSharedEntries(updatedEntries);
        }
      } else {
        await storageService.saveEntries(updatedEntries);
        if (isElectron && saveSharedEntries) {
          await saveSharedEntries(updatedEntries);
        }
      }

      await broadcastChange();
    } catch (error) {
      devError("Failed to add entry:", error);
      setEntries(entries); // Rollback on error
      throw error;
    }
  }, [entries, setEntries, broadcastChange, isElectron, saveSharedEntries]);

  const handleUpdateEntry = useCallback(async (updatedEntry: PasswordEntry) => {
    const entryIndex = entries.findIndex((e) => e.id === updatedEntry.id);
    if (entryIndex === -1) return;

    const oldPassword = entries[entryIndex].password;
    const passwordChanged = oldPassword !== updatedEntry.password;

    // Update password history if password changed
    let passwordHistory = updatedEntry.passwordHistory || [];
    if (passwordChanged && oldPassword) {
      passwordHistory = [
        { password: oldPassword, changedAt: new Date() },
        ...passwordHistory,
      ].slice(0, 10); // Keep last 10 passwords
    }

    const entryWithHistory = {
      ...updatedEntry,
      updatedAt: new Date(),
      passwordHistory,
      lastPasswordChange: passwordChanged ? new Date() : updatedEntry.lastPasswordChange,
    };

    const updatedEntries = entries.map((e) =>
      e.id === updatedEntry.id ? entryWithHistory : e
    );

    setEntries(updatedEntries);

    try {
      const isFloatingMode = window.location.hash === "#floating";
      const isVaultLockedLocally = !storageService.isVaultUnlocked();

      if (isElectron && isFloatingMode && isVaultLockedLocally) {
        if (saveSharedEntries) {
          await saveSharedEntries(updatedEntries);
        }
      } else {
        await storageService.saveEntries(updatedEntries);
        if (isElectron && saveSharedEntries) {
          await saveSharedEntries(updatedEntries);
        }
      }

      await broadcastChange();
    } catch (error) {
      devError("Failed to update entry:", error);
      setEntries(entries); // Rollback on error
      throw error;
    }
  }, [entries, setEntries, broadcastChange, isElectron, saveSharedEntries]);

  const handleDeleteEntry = useCallback(async (id: string) => {
    const updatedEntries = entries.filter((e) => e.id !== id);
    setEntries(updatedEntries);

    try {
      const isFloatingMode = window.location.hash === "#floating";
      const isVaultLockedLocally = !storageService.isVaultUnlocked();

      if (isElectron && isFloatingMode && isVaultLockedLocally) {
        if (saveSharedEntries) {
          await saveSharedEntries(updatedEntries);
        }
      } else {
        await storageService.saveEntries(updatedEntries);
        if (isElectron && saveSharedEntries) {
          await saveSharedEntries(updatedEntries);
        }
      }

      await broadcastChange();
    } catch (error) {
      devError("Failed to delete entry:", error);
      setEntries(entries); // Rollback on error
      throw error;
    }
  }, [entries, setEntries, broadcastChange, isElectron, saveSharedEntries]);

  return {
    handleAddEntry,
    handleUpdateEntry,
    handleDeleteEntry,
    isProcessing,
  };
};

export default useEntryManagement;


