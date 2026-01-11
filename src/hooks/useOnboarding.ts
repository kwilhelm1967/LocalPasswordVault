/**
 * useOnboarding Hook
 * 
 * Hook for managing onboarding tutorial visibility.
 */

import { useState, useEffect } from "react";

export const useOnboarding = (isVaultUnlocked: boolean = false) => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    // Only trigger onboarding once per session, after vault is unlocked
    if (!isVaultUnlocked || hasTriggered) return;
    
    const hasSeenOnboarding = localStorage.getItem("onboarding_completed");
    if (!hasSeenOnboarding) {
      // Delay showing onboarding to let the app settle after login
      const timer = setTimeout(() => {
        setShowOnboarding(true);
        setHasTriggered(true);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      // Mark as triggered so we don't check again
      setHasTriggered(true);
    }
  }, [isVaultUnlocked, hasTriggered]);

  // Listen for replay-onboarding event (from Settings)
  useEffect(() => {
    const handleReplayOnboarding = () => {
      setShowOnboarding(true);
    };
    
    window.addEventListener('replay-onboarding', handleReplayOnboarding);
    return () => window.removeEventListener('replay-onboarding', handleReplayOnboarding);
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem("onboarding_completed", "true");
    setShowOnboarding(false);
  };

  const resetOnboarding = () => {
    localStorage.removeItem("onboarding_completed");
    setShowOnboarding(true);
  };

  return {
    showOnboarding,
    setShowOnboarding,
    completeOnboarding,
    resetOnboarding,
  };
};
