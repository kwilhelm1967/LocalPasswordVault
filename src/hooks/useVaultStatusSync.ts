/**
 * useVaultStatusSync Hook
 * 
 * Syncs vault lock status with Electron main process.
 */

import { useEffect } from "react";
import { useElectron } from "./useElectron";

export const useVaultStatusSync = (
  isElectron: boolean,
  setIsLocked: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const { ipcRenderer } = useElectron();

  useEffect(() => {
    if (!isElectron || !ipcRenderer) {
      return;
    }

    // Listen for vault lock/unlock events from main process
    const handleVaultLocked = () => {
      setIsLocked(true);
    };

    const handleVaultUnlocked = () => {
      setIsLocked(false);
    };

    ipcRenderer.on?.("vault-locked", handleVaultLocked);
    ipcRenderer.on?.("vault-unlocked", handleVaultUnlocked);

    return () => {
      ipcRenderer.removeListener?.("vault-locked", handleVaultLocked);
      ipcRenderer.removeListener?.("vault-unlocked", handleVaultUnlocked);
    };
  }, [isElectron, ipcRenderer, setIsLocked]);
};
