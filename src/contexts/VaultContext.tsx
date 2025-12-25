/**
 * Vault Context
 * 
 * Provides centralized state management for vault operations.
 * Reduces prop drilling and improves component decoupling.
 */

import React, { createContext, useContext, useCallback, useState, useEffect, ReactNode } from "react";
import { PasswordEntry, Category } from "../types";
import { storageService } from "../utils/storage";
import { devError } from "../utils/devLog";

interface VaultContextValue {
  // State
  entries: PasswordEntry[];
  isLocked: boolean;
  isInitialized: boolean;
  searchTerm: string;
  selectedCategory: string;
  categories: Category[];

  // Actions
  setEntries: React.Dispatch<React.SetStateAction<PasswordEntry[]>>;
  setIsLocked: React.Dispatch<React.SetStateAction<boolean>>;
  setSearchTerm: (term: string) => void;
  setSelectedCategory: (category: string) => void;

  // Operations
  loadEntries: () => Promise<void>;
  lockVault: () => void;
  unlockVault: (password: string) => Promise<boolean>;
  addEntry: (entry: PasswordEntry) => Promise<void>;
  updateEntry: (entry: PasswordEntry) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  restoreEntry: (entry: PasswordEntry) => Promise<void>;
}

const VaultContext = createContext<VaultContextValue | undefined>(undefined);

interface VaultProviderProps {
  children: ReactNode;
  loadSharedEntries?: () => Promise<PasswordEntry[]>;
  saveSharedEntries?: (entries: PasswordEntry[]) => Promise<boolean>;
  broadcastEntriesChanged?: () => Promise<void>;
}

export function VaultProvider({
  children,
  loadSharedEntries,
  saveSharedEntries,
  broadcastEntriesChanged,
}: VaultProviderProps) {
  const [entries, setEntries] = useState<PasswordEntry[]>([]);
  const [isLocked, setIsLocked] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Fixed categories
  const categories: Category[] = [
    { id: "all", name: "All", color: "#3b82f6", icon: "Grid3X3" },
    { id: "banking", name: "Banking", color: "#10b981", icon: "CircleDollarSign" },
    { id: "shopping", name: "Shopping", color: "#f59e0b", icon: "ShoppingCart" },
    { id: "entertainment", name: "Entertainment", color: "#a855f7", icon: "Ticket" },
    { id: "email", name: "Email", color: "#f43f5e", icon: "Mail" },
    { id: "work", name: "Work", color: "#3b82f6", icon: "Briefcase" },
    { id: "business", name: "Business", color: "#8b5cf6", icon: "TrendingUp" },
    { id: "other", name: "Other", color: "#6b7280", icon: "FileText" },
  ];

  /**
   * Load entries from storage
   */
  const loadEntries = useCallback(async () => {
    if (isLocked || !storageService.isVaultUnlocked()) {
      setEntries([]);
      setIsInitialized(true);
      return;
    }

    try {
      let loadedEntries: PasswordEntry[] = [];

      // Try shared storage first (Electron)
      if (loadSharedEntries) {
        try {
          const sharedEntries = await loadSharedEntries();
          if (sharedEntries && sharedEntries.length > 0) {
            loadedEntries = sharedEntries.map((entry) => ({
              ...entry,
              createdAt: entry.createdAt instanceof Date ? entry.createdAt : new Date(entry.createdAt),
              updatedAt: entry.updatedAt instanceof Date ? entry.updatedAt : new Date(entry.updatedAt),
            }));
            await storageService.saveEntries(loadedEntries);
          }
        } catch (error) {
          devError("Shared entries load failed, using localStorage:", error);
        }
      }

      // Fallback to localStorage
      if (loadedEntries.length === 0) {
        loadedEntries = await storageService.loadEntries();

        // Sync to shared storage
        if (saveSharedEntries && loadedEntries.length > 0) {
          try {
            await saveSharedEntries(loadedEntries);
          } catch (error) {
            devError("Failed to sync to shared storage:", error);
          }
        }
      }

      setEntries(loadedEntries || []);
      setIsInitialized(true);
    } catch (error) {
      devError("Failed to load entries:", error);
      setEntries([]);
      setIsInitialized(true);
    }
  }, [isLocked, loadSharedEntries, saveSharedEntries]);

  /**
   * Lock vault
   */
  const lockVault = useCallback(() => {
    storageService.lockVault();
    setIsLocked(true);
    setEntries([]);
    setSearchTerm("");
    setSelectedCategory("all");
  }, []);

  /**
   * Unlock vault
   */
  const unlockVault = useCallback(
    async (password: string): Promise<boolean> => {
      try {
        const success = await storageService.unlockVault(password);
        if (success) {
          setIsLocked(false);
          await loadEntries();
          return true;
        }
        return false;
      } catch (error) {
        devError("Failed to unlock vault:", error);
        return false;
      }
    },
    [loadEntries]
  );

  /**
   * Add entry
   */
  const addEntry = useCallback(
    async (entry: PasswordEntry) => {
      try {
        const updatedEntries = [...entries, entry];
        await storageService.saveEntries(updatedEntries);
        setEntries(updatedEntries);

        // Sync to shared storage
        if (saveSharedEntries) {
          await saveSharedEntries(updatedEntries);
        }

        // Broadcast change
        if (broadcastEntriesChanged) {
          await broadcastEntriesChanged();
        }
      } catch (error) {
        devError("Failed to add entry:", error);
        throw error;
      }
    },
    [entries, saveSharedEntries, broadcastEntriesChanged]
  );

  /**
   * Update entry
   */
  const updateEntry = useCallback(
    async (entry: PasswordEntry) => {
      try {
        const updatedEntries = entries.map((e) => (e.id === entry.id ? entry : e));
        await storageService.saveEntries(updatedEntries);
        setEntries(updatedEntries);

        // Sync to shared storage
        if (saveSharedEntries) {
          await saveSharedEntries(updatedEntries);
        }

        // Broadcast change
        if (broadcastEntriesChanged) {
          await broadcastEntriesChanged();
        }
      } catch (error) {
        devError("Failed to update entry:", error);
        throw error;
      }
    },
    [entries, saveSharedEntries, broadcastEntriesChanged]
  );

  /**
   * Delete entry
   */
  const deleteEntry = useCallback(
    async (id: string) => {
      try {
        const updatedEntries = entries.filter((e) => e.id !== id);
        await storageService.saveEntries(updatedEntries);
        setEntries(updatedEntries);

        // Sync to shared storage
        if (saveSharedEntries) {
          await saveSharedEntries(updatedEntries);
        }

        // Broadcast change
        if (broadcastEntriesChanged) {
          await broadcastEntriesChanged();
        }
      } catch (error) {
        devError("Failed to delete entry:", error);
        throw error;
      }
    },
    [entries, saveSharedEntries, broadcastEntriesChanged]
  );

  /**
   * Restore entry
   */
  const restoreEntry = useCallback(
    async (entry: PasswordEntry) => {
      try {
        await addEntry(entry);
      } catch (error) {
        devError("Failed to restore entry:", error);
        throw error;
      }
    },
    [addEntry]
  );

  // Check initial vault state
  useEffect(() => {
    const checkVaultState = () => {
      const vaultExists = storageService.vaultExists();
      const isUnlocked = storageService.isVaultUnlocked();

      if (vaultExists && isUnlocked) {
        setIsLocked(false);
        loadEntries();
      } else {
        setIsInitialized(true);
      }
    };

    checkVaultState();
  }, [loadEntries]);

  // Reload entries when vault is unlocked
  useEffect(() => {
    if (!isLocked) {
      loadEntries();
    }
  }, [isLocked, loadEntries]);

  const value: VaultContextValue = {
    entries,
    isLocked,
    isInitialized,
    searchTerm,
    selectedCategory,
    categories,
    setEntries,
    setIsLocked,
    setSearchTerm,
    setSelectedCategory,
    loadEntries,
    lockVault,
    unlockVault,
    addEntry,
    updateEntry,
    deleteEntry,
    restoreEntry,
  };

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
}

/**
 * Hook to use vault context
 */
export function useVault(): VaultContextValue {
  const context = useContext(VaultContext);
  if (context === undefined) {
    throw new Error("useVault must be used within a VaultProvider");
  }
  return context;
}

