/**
 * useWhatsNew Hook
 * 
 * Hook for managing "What's New" modal visibility based on version changes.
 */

import { useState, useEffect } from "react";
import { APP_VERSION } from "../config/changelog";

export const useWhatsNew = () => {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    const lastSeenVersion = localStorage.getItem('last_seen_version');
    if (!lastSeenVersion || lastSeenVersion !== APP_VERSION) {
      setShouldShow(true);
    }
  }, []);

  return { shouldShow, dismiss: () => setShouldShow(false) };
};
