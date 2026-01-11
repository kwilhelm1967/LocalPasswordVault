/**
 * useSecurityBriefing Hook
 * 
 * Hook for managing security briefing modal visibility.
 */

import { useState } from "react";

export const useSecurityBriefing = () => {
  const [showBriefing, setShowBriefing] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  // Check if user has seen the security briefing
  const checkBriefing = () => {
    if (hasChecked) return;
    
    const hasSeenBriefing = localStorage.getItem("security_briefing_completed");
    if (!hasSeenBriefing) {
      setShowBriefing(true);
    }
    setHasChecked(true);
  };

  const completeBriefing = () => {
    localStorage.setItem("security_briefing_completed", "true");
    setShowBriefing(false);
  };

  const resetBriefing = () => {
    localStorage.removeItem("security_briefing_completed");
  };

  return {
    showBriefing,
    checkBriefing,
    completeBriefing,
    resetBriefing,
  };
};
