export interface TrialInfo {
  isTrialActive: boolean;
  daysRemaining: number;
  isExpired: boolean;
  startDate: Date | null;
  endDate: Date | null;
  hasTrialBeenUsed: boolean;
}

export class TrialService {
  private static instance: TrialService;
  private static readonly TRIAL_START_KEY = "trial_start_date";
  private static readonly TRIAL_USED_KEY = "trial_used";
  private countdownInterval: NodeJS.Timeout | null = null;
  private expirationCallbacks: (() => void)[] = [];
  private expirationConfirmed: boolean = false;
  private expirationConfirmationCount: number = 0;

  // Configurable trial duration - set to 5 minutes for testing, 7 days for production
  // Set this to true for 5-minute testing mode, false for normal 7-day trial
  private static readonly USE_TEST_MODE = true;

  private static get TRIAL_DURATION_MS(): number {
    return TrialService.USE_TEST_MODE ? 5 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
  }

  private static get TRIAL_DURATION_DAYS(): number {
    return TrialService.USE_TEST_MODE ? 0 : 7;
  }

  private static get TRIAL_DURATION_MINUTES(): number {
    return TrialService.USE_TEST_MODE ? 5 : 0;
  }

  static getInstance(): TrialService {
    if (!TrialService.instance) {
      TrialService.instance = new TrialService();
    }
    return TrialService.instance;
  }

  /**
   * Start the trial period
   */
  startTrial(): TrialInfo {
    const now = new Date();
    console.log('🎯 Starting trial at:', now.toISOString());

    localStorage.setItem(TrialService.TRIAL_START_KEY, now.toISOString());
    localStorage.setItem(TrialService.TRIAL_USED_KEY, "true");

    // Start countdown logging for test mode
    if (TrialService.USE_TEST_MODE) {
      this.startCountdownLogging();
    }

    const trialInfo = this.getTrialInfo();
    console.log('🎯 Trial info after start:', trialInfo);
    return trialInfo;
  }

  /**
   * Get current trial information
   */
  getTrialInfo(): TrialInfo {
    const startDateStr = localStorage.getItem(TrialService.TRIAL_START_KEY);
    const hasTrialBeenUsed =
      localStorage.getItem(TrialService.TRIAL_USED_KEY) === "true";

    if (!startDateStr || !hasTrialBeenUsed) {
      // No trial started yet
      return {
        isTrialActive: false,
        daysRemaining: TrialService.TRIAL_DURATION_DAYS,
        isExpired: false,
        startDate: null,
        endDate: null,
        hasTrialBeenUsed: false,
      };
    }

    // Check if we have backend trial data from license token
    try {
      const licenseToken = localStorage.getItem('license_token');
      if (licenseToken) {
        const tokenData = JSON.parse(atob(licenseToken.split('.')[1])); // Decode JWT payload
        console.log('🔍 JWT Token Data:', tokenData);

        // Use backend trial expiry date if available
        if (tokenData.trialExpiryDate && tokenData.isTrial) {
          const backendExpiryDate = new Date(tokenData.trialExpiryDate);
          const now = new Date();
          const isExpired = now > backendExpiryDate;

          console.log('🔍 Trial Expiry Check:', {
            backendExpiryDate: backendExpiryDate.toISOString(),
            now: now.toISOString(),
            isExpired,
            timeDiff: backendExpiryDate.getTime() - now.getTime()
          });

          let daysRemaining = 0;
          if (TrialService.USE_TEST_MODE) {
            // For testing mode, show minutes remaining
            daysRemaining = Math.max(
              0,
              Math.ceil((backendExpiryDate.getTime() - now.getTime()) / (60 * 1000))
            );
          } else {
            // For production mode, show days remaining
            daysRemaining = Math.max(
              0,
              Math.ceil((backendExpiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
            );
          }

          return {
            isTrialActive: !isExpired,
            daysRemaining,
            isExpired,
            startDate: new Date(startDateStr),
            endDate: backendExpiryDate,
            hasTrialBeenUsed: true,
          };
        }
      }
    } catch (error) {
      console.error('Error reading backend trial data:', error);
      // Fall back to local calculation if token parsing fails
    }

    // Fallback to local calculation if no backend data
    const startDate = new Date(startDateStr);
    const endDate = new Date(
      startDate.getTime() + TrialService.TRIAL_DURATION_MS
    );
    const now = new Date();

    console.log('🔍 Local Trial Calculation:', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      now: now.toISOString(),
      durationMs: TrialService.TRIAL_DURATION_MS,
      timeDiff: endDate.getTime() - now.getTime()
    });

    const isExpired = now > endDate;
    let daysRemaining = 0;
    if (TrialService.USE_TEST_MODE) {
      // For testing mode, show minutes remaining
      daysRemaining = Math.max(
        0,
        Math.ceil((endDate.getTime() - now.getTime()) / (60 * 1000))
      );
    } else {
      // For production mode, show days remaining
      daysRemaining = Math.max(
        0,
        Math.ceil((endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
      );
    }

    return {
      isTrialActive: !isExpired,
      daysRemaining,
      isExpired,
      startDate,
      endDate,
      hasTrialBeenUsed: true,
    };
  }

  /**
   * Check if trial has expired
   */
  isTrialExpired(): boolean {
    const trialInfo = this.getTrialInfo();
    return trialInfo.hasTrialBeenUsed && trialInfo.isExpired;
  }

  /**
   * Check and handle trial expiration (triggers callbacks if expired)
   */
  checkAndHandleExpiration(): boolean {
    const trialInfo = this.getTrialInfo();

    console.log('🔍 Expiration Check:', {
      trialInfo,
      expirationConfirmed: this.expirationConfirmed
    });

    // If trial is not used or not expired, no need to check further
    if (!trialInfo.hasTrialBeenUsed || !trialInfo.isExpired) {
      // Reset expiration confirmation if trial is somehow valid again
      if (this.expirationConfirmed && !trialInfo.isExpired) {
        console.log('🔄 Trial is valid again, resetting expiration confirmation');
        this.expirationConfirmed = false;
        this.expirationConfirmationCount = 0;
      }
      return false;
    }

    // If expiration is confirmed, limit further checking
    if (this.expirationConfirmed) {
      this.expirationConfirmationCount++;
      console.log(`🔍 Expiration confirmed check #${this.expirationConfirmationCount} (max 3)`);

      // Only verify 2-3 times after initial confirmation
      if (this.expirationConfirmationCount >= 3) {
        console.log("✅ Expiration fully confirmed - stopping further checks");
        return true;
      }
    } else {
      // First time detecting expiration
      console.log("🚨 TRIAL EXPIRATION DETECTED - Triggering callbacks");
      this.expirationConfirmed = true;
      this.expirationConfirmationCount = 1;
      this.triggerExpirationCallbacks();
    }

    return true;
  }

  /**
   * Check if expiration has been confirmed
   */
  isExpirationConfirmed(): boolean {
    return this.expirationConfirmed;
  }

  /**
   * Reset expiration confirmation (for testing)
   */
  resetExpirationConfirmation(): void {
    this.expirationConfirmed = false;
    this.expirationConfirmationCount = 0;
    console.log("🔄 Expiration confirmation reset");
  }

  /**
   * Check if trial is currently active
   */
  isTrialActive(): boolean {
    const trialInfo = this.getTrialInfo();
    return trialInfo.hasTrialBeenUsed && trialInfo.isTrialActive;
  }

  /**
   * Check if user can start a trial (hasn't used it yet)
   */
  canStartTrial(): boolean {
    const trialInfo = this.getTrialInfo();
    return !trialInfo.hasTrialBeenUsed;
  }

  /**
   * Get remaining trial time in a human-readable format
   */
  getTrialTimeRemaining(): string {
    const trialInfo = this.getTrialInfo();

    if (!trialInfo.hasTrialBeenUsed) {
      if (TrialService.USE_TEST_MODE) {
        return `${TrialService.TRIAL_DURATION_MINUTES} minutes available`;
      } else {
        return `${TrialService.TRIAL_DURATION_DAYS} days available`;
      }
    }

    if (trialInfo.isExpired) {
      return "Trial expired";
    }

    if (TrialService.USE_TEST_MODE) {
      // Show minutes for testing mode
      const minutes = trialInfo.daysRemaining;
      if (minutes === 1) {
        return "1 minute remaining";
      } else if (minutes === 0) {
        return "Less than 1 minute remaining";
      } else {
        return `${minutes} minutes remaining`;
      }
    } else {
      // Show days for production mode
      const days = trialInfo.daysRemaining;
      if (days === 1) {
        return "1 day remaining";
      } else if (days === 0) {
        // Check hours remaining for last day
        const now = new Date();
        const endDate = trialInfo.endDate!;
        const hoursRemaining = Math.max(
          0,
          Math.ceil((endDate.getTime() - now.getTime()) / (60 * 60 * 1000))
        );

        if (hoursRemaining <= 1) {
          return "Less than 1 hour remaining";
        } else {
          return `${hoursRemaining} hours remaining`;
        }
      } else {
        return `${days} days remaining`;
      }
    }
  }

  /**
   * Reset trial (for testing purposes only)
   */
  resetTrial(): void {
    localStorage.removeItem(TrialService.TRIAL_START_KEY);
    localStorage.removeItem(TrialService.TRIAL_USED_KEY);

    // Stop countdown logging if running
    this.stopCountdownLogging();

    console.log("🔄 TRIAL RESET - Countdown stopped");
  }

  /**
   * End trial manually (when user purchases license)
   */
  endTrial(): void {
    // Keep the trial data but mark it as used
    // This prevents starting another trial
    const now = new Date();
    const pastDate = new Date(
      now.getTime() - TrialService.TRIAL_DURATION_MS - 1000
    );
    localStorage.setItem(TrialService.TRIAL_START_KEY, pastDate.toISOString());
    localStorage.setItem(TrialService.TRIAL_USED_KEY, "true");

    // Stop countdown logging if running
    this.stopCountdownLogging();

    // Trigger expiration callbacks since trial ended
    this.triggerExpirationCallbacks();

    console.log("🛑 TRIAL ENDED - Countdown stopped - Expiration callbacks triggered");
  }

  /**
   * Get trial progress as percentage (0-100)
   */
  getTrialProgress(): number {
    const trialInfo = this.getTrialInfo();

    if (!trialInfo.hasTrialBeenUsed) {
      return 0;
    }

    if (trialInfo.isExpired) {
      return 100;
    }

    const totalTime = TrialService.TRIAL_DURATION_MS;
    const elapsed = totalTime - (trialInfo.endDate!.getTime() - new Date().getTime());
    return Math.round((elapsed / totalTime) * 100);
  }

  /**
   * Get test mode status
   */
  isTestMode(): boolean {
    return TrialService.USE_TEST_MODE;
  }

  /**
   * Toggle test mode (for development only)
   */
  static setTestMode(enabled: boolean): void {
    (TrialService as any).USE_TEST_MODE = enabled;
  }

  /**
   * Add callback for trial expiration
   */
  addExpirationCallback(callback: () => void): void {
    this.expirationCallbacks.push(callback);
  }

  /**
   * Remove expiration callback
   */
  removeExpirationCallback(callback: () => void): void {
    const index = this.expirationCallbacks.indexOf(callback);
    if (index > -1) {
      this.expirationCallbacks.splice(index, 1);
    }
  }

  /**
   * Trigger all expiration callbacks
   */
  private triggerExpirationCallbacks(): void {
    console.log("🚨 TRIGGERING TRIAL EXPIRATION CALLBACKS");
    this.expirationCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error("Error in expiration callback:", error);
      }
    });
  }

  /**
   * Start countdown logging for test mode
   */
  private startCountdownLogging(): void {
    // Clear any existing countdown
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

    console.log("🕒 TRIAL COUNTDOWN STARTED");
    console.log("================================");

    // Update countdown every second in test mode, every minute in production
    const updateInterval = TrialService.USE_TEST_MODE ? 1000 : 60000;

    this.countdownInterval = setInterval(() => {
      const trialInfo = this.getTrialInfo();

      if (!trialInfo.hasTrialBeenUsed) {
        if (this.countdownInterval) {
          clearInterval(this.countdownInterval);
          this.countdownInterval = null;
        }
        console.log("⏸️  Trial not started yet");
        return;
      }

      const now = new Date();
      const remainingMs = trialInfo.endDate!.getTime() - now.getTime();

      // Check if trial has expired (with high precision)
      if (remainingMs <= 0) {
        if (this.countdownInterval) {
          clearInterval(this.countdownInterval);
          this.countdownInterval = null;
        }
        console.log("⏰ TRIAL EXPIRED!");
        console.log("================================");
        console.log(`🔴 EXPIRATION TIME: ${trialInfo.endDate!.toISOString()}`);
        console.log(`🔴 CURRENT TIME: ${now.toISOString()}`);
        console.log(`🔴 OVERDUE BY: ${Math.abs(remainingMs)}ms`);

        // Trigger expiration callbacks
        this.triggerExpirationCallbacks();
        return;
      }

      // Calculate remaining time with high precision
      const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      const milliseconds = remainingMs % 1000;

      // Format time display based on mode
      let timeDisplay: string;
      if (TrialService.USE_TEST_MODE) {
        // Precise display for testing
        if (minutes > 0) {
          timeDisplay = `${minutes}m ${seconds}s ${milliseconds}ms`;
        } else if (seconds > 0) {
          timeDisplay = `${seconds}s ${milliseconds}ms`;
        } else {
          timeDisplay = `${milliseconds}ms`;
        }
      } else {
        // Simple display for production
        if (totalSeconds >= 86400) {
          const days = Math.floor(totalSeconds / 86400);
          timeDisplay = `${days} day${days === 1 ? '' : 's'}`;
        } else if (totalSeconds >= 3600) {
          const hours = Math.floor(totalSeconds / 3600);
          timeDisplay = `${hours} hour${hours === 1 ? '' : 's'}`;
        } else if (totalSeconds >= 60) {
          timeDisplay = `${minutes}m ${seconds}s`;
        } else {
          timeDisplay = `${seconds}s`;
        }
      }

      // Calculate percentage with high precision
      const percentage = Math.round(this.getTrialProgress() * 100) / 100;

      // Create progress bar
      const barLength = 20;
      const filledLength = Math.round((percentage / 100) * barLength);
      const progressBar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);

      console.log(`⏱️  [${progressBar}] ${percentage}% | ${timeDisplay} remaining | Status: ${trialInfo.isTrialActive ? 'ACTIVE' : 'EXPIRED'}`);

      // Warning levels based on mode
      if (TrialService.USE_TEST_MODE) {
        // Test mode warnings
        if (totalSeconds <= 30 && totalSeconds > 0) {
          console.log(`⚠️  WARNING: Less than 30 seconds remaining!`);
        }
        if (totalSeconds <= 10 && totalSeconds > 0) {
          console.log(`🚨 FINAL COUNTDOWN: ${totalSeconds} seconds left!`);
        }
        if (totalSeconds <= 5 && totalSeconds > 0) {
          console.log(`🔴 CRITICAL: ${totalSeconds} seconds remaining!`);
        }
      } else {
        // Production mode warnings
        const totalHours = totalSeconds / 3600;
        if (totalHours <= 24 && totalHours > 0) {
          console.log(`⚠️  WARNING: Less than 24 hours remaining!`);
        }
        if (totalHours <= 1 && totalHours > 0) {
          console.log(`🚨 FINAL COUNTDOWN: Less than 1 hour remaining!`);
        }
      }
    }, updateInterval);
  }

  /**
   * Stop countdown logging
   */
  private stopCountdownLogging(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
      console.log("🛑 TRIAL COUNTDOWN STOPPED");
    }
  }

  /**
   * Validate trial timing accuracy (for testing)
   */
  validateTrialAccuracy(): {
    isAccurate: boolean;
    expectedDuration: number;
    actualDuration: number;
    variance: number;
    details: string;
  } {
    const trialInfo = this.getTrialInfo();

    if (!trialInfo.hasTrialBeenUsed || !trialInfo.startDate || !trialInfo.endDate) {
      return {
        isAccurate: false,
        expectedDuration: TrialService.TRIAL_DURATION_MS,
        actualDuration: 0,
        variance: 0,
        details: "Trial not started"
      };
    }

    const expectedDuration = TrialService.TRIAL_DURATION_MS;
    const actualDuration = trialInfo.endDate.getTime() - trialInfo.startDate.getTime();
    const variance = Math.abs(actualDuration - expectedDuration);
    const variancePercent = (variance / expectedDuration) * 100;

    const isAccurate = variance <= 1000; // Allow 1 second variance

    const mode = TrialService.USE_TEST_MODE ? "Test Mode" : "Production Mode";
    const expectedDisplay = TrialService.USE_TEST_MODE ? "5 minutes" : "7 days";

    return {
      isAccurate,
      expectedDuration,
      actualDuration,
      variance,
      details: `${mode}: Expected ${expectedDisplay} (${expectedDuration}ms), got ${actualDuration}ms, variance: ${variancePercent.toFixed(2)}%`
    };
  }

  /**
   * Get precise trial status with millisecond accuracy
   */
  getPreciseTrialStatus(): {
    isActive: boolean;
    isExpired: boolean;
    remainingMs: number;
    remainingSeconds: number;
    progressPercent: number;
    expiresAt: Date | null;
    startedAt: Date | null;
  } {
    const trialInfo = this.getTrialInfo();
    const now = new Date();

    let remainingMs = 0;
    if (trialInfo.endDate) {
      remainingMs = Math.max(0, trialInfo.endDate.getTime() - now.getTime());
    }

    return {
      isActive: trialInfo.isTrialActive,
      isExpired: trialInfo.isExpired,
      remainingMs,
      remainingSeconds: Math.max(0, Math.floor(remainingMs / 1000)),
      progressPercent: this.getTrialProgress(),
      expiresAt: trialInfo.endDate,
      startedAt: trialInfo.startDate
    };
  }
}

export const trialService = TrialService.getInstance();
