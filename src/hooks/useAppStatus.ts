/**
 * useAppStatus Hook
 * 
 * Manages application license and trial status.
 */

import { useState, useEffect, useCallback } from "react";
import { licenseService, AppLicenseStatus } from "../utils/licenseService";

export const useAppStatus = () => {
  const [appStatus, setAppStatus] = useState<AppLicenseStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const updateAppStatus = useCallback(async () => {
    try {
      // Reduced timeout from 10s to 5s for faster fallback
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("App status check timed out")), 5000)
      );
      
      const status = await Promise.race([
        licenseService.getAppStatus(),
        timeoutPromise
      ]) as AppLicenseStatus;
      
      setAppStatus(status);
    } catch (error) {
      console.error("Failed to get app status:", error);
      // Set a default status to prevent infinite loading
      // This allows the app to show the license screen even if status check fails
      setAppStatus({
        isLicensed: false,
        canUseApp: false,
        requiresPurchase: true,
        trialInfo: {
          isActive: false,
          isExpired: false,
          daysRemaining: 0,
          startDate: null,
        },
        licenseInfo: null,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkStatusImmediately = useCallback(async () => {
    setIsLoading(true);
    await updateAppStatus();
  }, [updateAppStatus]);

  useEffect(() => {
    updateAppStatus();
    
    // Check status periodically
    const interval = setInterval(updateAppStatus, 60000); // Every minute
    
    return () => clearInterval(interval);
  }, [updateAppStatus]);

  return {
    appStatus,
    updateAppStatus,
    checkStatusImmediately,
    isLoading,
  };
};
