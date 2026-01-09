/**
 * useAppStatus Hook
 * 
 * Manages application license and trial status.
 */

import { useState, useEffect, useCallback } from "react";
import { licenseService, AppLicenseStatus } from "../utils/licenseService";
import { devError } from "../utils/devLog";

export const useAppStatus = () => {
  const [appStatus, setAppStatus] = useState<AppLicenseStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const updateAppStatus = useCallback(async () => {
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("App status check timed out")), 3000)
      );
      
      const status = await Promise.race([
        licenseService.getAppStatus(),
        timeoutPromise
      ]) as AppLicenseStatus;
      
      setAppStatus(status);
    } catch (error) {
      devError("Failed to get app status:", error);
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
    
    const interval = setInterval(updateAppStatus, 60000);
    
    return () => clearInterval(interval);
  }, [updateAppStatus]);

  return {
    appStatus,
    updateAppStatus,
    checkStatusImmediately,
    isLoading,
  };
};
