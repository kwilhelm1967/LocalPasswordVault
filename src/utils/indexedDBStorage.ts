/**
 * IndexedDB Storage Service
 * 
 * Provides IndexedDB-based storage as an alternative to localStorage.
 * IndexedDB offers much larger capacity (50%+ of disk space vs 5-10MB).
 * 
 * This is a better solution for web version than localStorage.
 */

import { devError, devWarn } from "./devLog";

const DB_NAME = "LocalPasswordVault";
const DB_VERSION = 1;
const STORE_NAME = "vault";

interface IDBStorage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<boolean>;
  remove(key: string): Promise<boolean>;
  clear(): Promise<boolean>;
}

/**
 * Initialize IndexedDB database
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error("Failed to open IndexedDB"));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

/**
 * Get value from IndexedDB
 */
async function get(key: string): Promise<string | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(new Error("Failed to read from IndexedDB"));
      };
    });
  } catch (error) {
    devError("IndexedDB get error:", error);
    return null;
  }
}

/**
 * Set value in IndexedDB
 */
async function set(key: string, value: string): Promise<boolean> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(value, key);

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        reject(new Error("Failed to write to IndexedDB"));
      };
    });
  } catch (error) {
    devError("IndexedDB set error:", error);
    return false;
  }
}

/**
 * Remove value from IndexedDB
 */
async function remove(key: string): Promise<boolean> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        reject(new Error("Failed to delete from IndexedDB"));
      };
    });
  } catch (error) {
    devError("IndexedDB remove error:", error);
    return false;
  }
}

/**
 * Clear all data from IndexedDB
 */
async function clear(): Promise<boolean> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        reject(new Error("Failed to clear IndexedDB"));
      };
    });
  } catch (error) {
    devError("IndexedDB clear error:", error);
    return false;
  }
}

/**
 * Check if IndexedDB is available
 */
export function isIndexedDBAvailable(): boolean {
  return typeof indexedDB !== "undefined" && indexedDB !== null;
}

/**
 * Get storage quota information
 */
export async function getStorageQuota(): Promise<{
  quota: number;
  usage: number;
  available: number;
} | null> {
  if (!('storage' in navigator && 'estimate' in navigator.storage)) {
    return null;
  }

  try {
    const estimate = await navigator.storage.estimate();
    return {
      quota: estimate.quota || 0,
      usage: estimate.usage || 0,
      available: (estimate.quota || 0) - (estimate.usage || 0),
    };
  } catch (error) {
    devError("Failed to get storage quota:", error);
    return null;
  }
}

/**
 * IndexedDB Storage Implementation
 */
export const indexedDBStorage: IDBStorage = {
  get,
  set,
  remove,
  clear,
};

/**
 * Hybrid storage: Try IndexedDB first, fallback to localStorage
 */
export async function hybridGet(key: string): Promise<string | null> {
  // Try IndexedDB first
  if (isIndexedDBAvailable()) {
    try {
      const value = await get(key);
      if (value !== null) {
        return value;
      }
    } catch (error) {
      devWarn("IndexedDB get failed, falling back to localStorage:", error);
    }
  }

  // Fallback to localStorage
  try {
    return localStorage.getItem(key);
  } catch (error) {
    devError("localStorage get failed:", error);
    return null;
  }
}

/**
 * Hybrid storage: Try IndexedDB first, fallback to localStorage
 */
export async function hybridSet(key: string, value: string): Promise<boolean> {
  // Try IndexedDB first
  if (isIndexedDBAvailable()) {
    try {
      const success = await set(key, value);
      if (success) {
        // Also sync to localStorage as backup
        try {
          localStorage.setItem(key, value);
        } catch {
          // localStorage backup failed, but IndexedDB succeeded
        }
        return true;
      }
    } catch (error) {
      devWarn("IndexedDB set failed, falling back to localStorage:", error);
    }
  }

  // Fallback to localStorage
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    devError("localStorage set failed:", error);
    return false;
  }
}

