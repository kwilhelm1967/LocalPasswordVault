/**
 * useFloatingMode Hook
 * 
 * Determines if the app should run in floating mode (Electron only).
 */

import { useState, useEffect } from "react";

export const useFloatingMode = (isElectron: boolean): boolean => {
  const [isFloatingMode, setIsFloatingMode] = useState(false);

  useEffect(() => {
    if (!isElectron) {
      setIsFloatingMode(false);
      return;
    }

    // Check for floating mode preference
    const savedMode = localStorage.getItem("floatingMode");
    setIsFloatingMode(savedMode === "true");
  }, [isElectron]);

  return isFloatingMode;
};
