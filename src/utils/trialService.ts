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

    localStorage.setItem(TrialService.TRIAL_START_KEY, now.toISOString());
    localStorage.setItem(TrialService.TRIAL_USED_KEY, "true");

    return this.getTrialInfo();
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

    const startDate = new Date(startDateStr);
    const endDate = new Date(
      startDate.getTime() + TrialService.TRIAL_DURATION_MS
    );
    const now = new Date();

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
}

export const trialService = TrialService.getInstance();
