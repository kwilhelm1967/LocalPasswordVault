import React, { useState, useCallback, useEffect } from "react";
import {
  Lock,
  Key,
  Shield,
  Users,
  CheckCircle,
  XCircle,
  ExternalLink,
  CreditCard,
  ArrowLeft,
  Download,
  Clock,
} from "lucide-react";
import { analyticsService } from "../utils/analyticsService";
import { licenseService, AppLicenseStatus } from "../utils/licenseService";
import { trialService } from "../utils/trialService";
import { generateHardwareFingerprint } from "../utils/hardwareFingerprint";
import { EulaAgreement } from "./EulaAgreement";
import { DownloadInstructions } from "./DownloadInstructions";
import { DownloadPage } from "./DownloadPage";
import { TrialExpirationBanner } from "./TrialExpirationBanner";
import { ExpiredTrialScreen } from "./ExpiredTrialScreen";
import { KeyActivationScreen } from "./KeyActivationScreen";
import { RecoveryOptionsScreen } from "./RecoveryOptionsScreen";

interface LicenseScreenProps {
  onLicenseValid: () => void;
  showPricingPlans?: boolean;
  onHidePricingPlans?: () => void;
  appStatus: AppLicenseStatus; // Receive appStatus as a prop
}

export const LicenseScreen: React.FC<LicenseScreenProps> = ({
  onLicenseValid,
  showPricingPlans = false,
  onHidePricingPlans,
  appStatus, // Destructure appStatus
}) => {
  const [licenseKey, setLicenseKey] = useState("");
  const [isActivating, setIsActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // const [appStatus, setAppStatus] = useState<AppLicenseStatus | null>(null); // Removed
  // const [isLoading, setIsLoading] = useState(true); // Removed

  // New flow state variables
  const [showExpiredTrialScreen, setShowExpiredTrialScreen] = useState(false);
  const [showKeyActivationScreen, setShowKeyActivationScreen] = useState(false);
  const [showRecoveryOptions, setShowRecoveryOptions] = useState(false);

  // Initialize app status on mount - Removed
  // useEffect(() => {
  //   const initAppStatus = async () => {
  //     try {
  //       const status = await licenseService.getAppStatus();
  //       setAppStatus(status);
  //     } catch (error) {
  //       console.error('Error initializing app status:', error);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };
  //   initAppStatus();
  // }, []);

  const updateAppStatus = useCallback(async () => {
    try {
      // We call onLicenseValid, which is updateAppStatus from App.tsx
      // This will trigger a re-render with a new appStatus prop
      onLicenseValid();
      // No need to fetch status internally anymore
      // const status = await licenseService.getAppStatus();
      // setAppStatus(status);
      // return status;
    } catch (error) {
      console.error('Error updating app status:', error);
      return null;
    }
  }, [onLicenseValid]);
  const [selectedPlan, setSelectedPlan] = useState<"single" | "family">(
    "single"
  );
  const [showEula, setShowEula] = useState(false);
  const [showDownloadInstructions, setShowDownloadInstructions] =
    useState(false);
  const [pendingLicenseKey, setPendingLicenseKey] = useState("");
  const [showDownloadPage, setShowDownloadPage] = useState(false);
  const [showLicenseInput] = useState(false);
  const [isStartingTrial, setIsStartingTrial] = useState(false);
  const [showTrialEula, setShowTrialEula] = useState(false);

  // Get trial information from localStorage
  const getTrialInfoFromLocalStorage = useCallback(() => {
    try {
      const trialUsed = localStorage.getItem('trial_used') === 'true';
      const trialActivationTime = localStorage.getItem('trial_activation_time');
      const trialExpiryTime = localStorage.getItem('trial_expiry_time');

      if (!trialUsed || !trialActivationTime || !trialExpiryTime) {
        return {
          hasTrialBeenUsed: false,
          isExpired: false,
          isTrialActive: false,
          daysRemaining: 0,
          startDate: null,
          endDate: null,
        };
      }

      const startDate = new Date(trialActivationTime);
      const endDate = new Date(trialExpiryTime);
      const now = new Date();
      const isExpired = now > endDate;
      const isTrialActive = !isExpired;
      const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

      return {
        hasTrialBeenUsed: trialUsed,
        isExpired,
        isTrialActive,
        daysRemaining,
        startDate,
        endDate,
      };
    } catch (error) {
      console.error('Error reading trial info from localStorage:', error);
      return {
        hasTrialBeenUsed: false,
        isExpired: false,
        isTrialActive: false,
        daysRemaining: 0,
        startDate: null,
        endDate: null,
      };
    }
  }, []);

  const localStorageTrialInfo = getTrialInfoFromLocalStorage();

  const handleApplyLicenseKey = () => {
    setShowKeyActivationScreen(true);
    setShowExpiredTrialScreen(false);
    setError(null);
    setLicenseKey("");
  };

  // New flow handlers
  const handleBuyLifetimeAccess = () => {
    const url = "https://localpasswordvault.com/#plans";
    if (window.electronAPI) {
      window.electronAPI.openExternal(url);
    } else {
      window.open(url, "_blank");
    }
    analyticsService.trackConversion("purchase_started", { source: "expired_trial" });

    // Hide floating button when user goes to purchase
    if (window.electronAPI?.hideFloatingButton) {
      window.electronAPI.hideFloatingButton();
    }
  };

  const handleAlreadyPurchased = () => {
    setShowKeyActivationScreen(true);
    setShowExpiredTrialScreen(false);
    analyticsService.trackUserAction("already_purchased_clicked");
  };

  const handleBackToActivation = () => {
    setShowKeyActivationScreen(false);
    setShowRecoveryOptions(false);
    if (localStorageTrialInfo.isExpired) {
      setShowExpiredTrialScreen(true);
    }
  };

  const handleNeedHelp = () => {
    setShowRecoveryOptions(true);
    setShowKeyActivationScreen(false);
    analyticsService.trackUserAction("recovery_options_viewed");
  };

  const handleKeyActivation = async (key: string) => {
    setLicenseKey(key);
    await handleActivateLicense();
  };

  // Handle starting a free trial
  const handleStartFreeTrial = () => {
    setShowTrialEula(true);
  };

  const handleTrialEulaAccept = async () => {
    setIsStartingTrial(true);
    setError(null);

    try {
      // Generate a trial license key
      const trialKey = `TRIAL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const hardwareHash = await generateHardwareFingerprint();
      
      // Start the trial using the trial service
      await trialService.startTrial(trialKey, hardwareHash);
      
      // Store trial license info using the SAME keys the license service expects
      localStorage.setItem('app_license_key', trialKey);
      localStorage.setItem('app_license_type', 'trial');
      localStorage.setItem('app_license_activated', new Date().toISOString());
      localStorage.setItem('trial_used', 'true');
      localStorage.setItem('trial_activation_time', new Date().toISOString());
      
      // Set expiry - use same duration as trialService (1 hour in dev, 7 days in prod)
      const isDevMode = import.meta.env.DEV;
      const expiryDate = new Date();
      if (isDevMode) {
        expiryDate.setTime(expiryDate.getTime() + (60 * 60 * 1000)); // 1 hour in dev
      } else {
        expiryDate.setDate(expiryDate.getDate() + 7); // 7 days in prod
      }
      localStorage.setItem('trial_expiry_time', expiryDate.toISOString());
      
      analyticsService.trackLicenseEvent("trial_started", "trial");
      
      // Refresh app status and proceed
      setShowTrialEula(false);
      onLicenseValid();
      
    } catch (error) {
      console.error("Failed to start trial:", error);
      setError("Failed to start trial. Please try again.");
    } finally {
      setIsStartingTrial(false);
    }
  };

  const handleTrialEulaDecline = () => {
    setShowTrialEula(false);
  };

  // Show expired trial screen when trial is expired
  useEffect(() => {
    if (localStorageTrialInfo.isExpired && !showExpiredTrialScreen && !showKeyActivationScreen && !showRecoveryOptions) {
      setShowExpiredTrialScreen(true);
    }
  }, [localStorageTrialInfo.isExpired, showExpiredTrialScreen, showKeyActivationScreen, showRecoveryOptions]);

  // Hide floating button when expired trial screen is shown
  useEffect(() => {
    if (showExpiredTrialScreen && window.electronAPI?.hideFloatingButton) {
      // Hide floating button when trial expires
      window.electronAPI.hideFloatingButton();
    }
  }, [showExpiredTrialScreen]);

  // Reset license input when trial expires
  useEffect(() => {
    if (localStorageTrialInfo.isExpired && showLicenseInput) {
      // Keep license input visible if user already clicked apply key
      // But clear any previous errors
      setError(null);
    }
  }, [localStorageTrialInfo.isExpired, showLicenseInput]);

  const handleActivateLicense = async () => {

    setShowEula(true);
  };

  const handleEulaAccept = async () => {

    setIsActivating(true);
    setError(null);

    try {
      const result = await licenseService.activateLicense(
        licenseKey.trim().toUpperCase()
      );

      if (result.success) {
        analyticsService.trackLicenseEvent(
          "license_activated",
          result.licenseType || "unknown"
        );
        // Refresh app status
        const updatedStatus = await updateAppStatus();
        if (updatedStatus) {
          onLicenseValid();
        }
        setShowEula(false);

        // Show floating button again when license is successfully activated
        if (window.electronAPI?.showFloatingButton) {
          window.electronAPI.showFloatingButton();
        }
      } else {
        // Enhanced error messages based on the new flow specifications
        let enhancedError = result.error || "License activation failed";

        if (result.error?.includes("fetch")) {
          enhancedError =
            "Unable to connect to license server. Please check your internet connection and try again.";
        } else if (result.error?.includes("409")) {
          enhancedError =
            "This key is already activated on another device. You need to purchase an additional key.";
        } else if (result.error?.includes("404")) {
          enhancedError =
            "This is not a valid lifetime key.";
        } else if (result.error?.includes("trial") && result.error?.includes("expir")) {
          enhancedError =
            "This key was for your trial. To continue, purchase a lifetime key.";
        } else if (result.error?.includes("trial") && result.error?.includes("once")) {
          enhancedError =
            "This key was for your trial. To continue, purchase a lifetime key.";
        } else if (result.error?.includes("validation")) {
          enhancedError =
            "This is not a valid lifetime key.";
        } else if (result.error?.includes("network")) {
          enhancedError =
            "Network error occurred. Please check your connection and try again.";
        }

        setError(enhancedError);
        analyticsService.trackLicenseEvent(
          "license_activation_failed",
          undefined,
          {
            error: result.error || "Unknown error",
            enhancedError,
          }
        );
      }
    } catch (error) {
      let enhancedError = "License activation failed. Please try again.";

      if (error instanceof TypeError && error.message.includes("fetch")) {
        enhancedError =
          "Unable to connect to license server. Please check your internet connection and try again.";
      } else if (error instanceof Error) {
        enhancedError = `License activation failed: ${error.message}`;
      }

      setError(enhancedError);
      analyticsService.trackLicenseEvent(
        "license_activation_error",
        undefined,
        {
          error: error instanceof Error ? error.message : "Unknown error",
          enhancedError,
        }
      );
    } finally {
      setIsActivating(false);
    }
  };

  const handleEulaDecline = () => {
    setShowEula(false);
    setPendingLicenseKey("");
    analyticsService.trackUserAction("eula_declined", {
      licenseType: "unknown",
    });

    // Show a message to the user
    setError(
      "License activation cancelled. You must accept the EULA to use the software."
    );
  };

  const handlePurchase = (plan: "single" | "family") => {
    setSelectedPlan(plan);
    analyticsService.trackConversion("purchase_started", { plan });

    // Hide floating button during purchase flow
    if (window.electronAPI?.hideFloatingButton) {
      window.electronAPI.hideFloatingButton();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleActivateLicense();
    }
  };

  const formatLicenseKey = (value: string) => {
    const cleaned = value.replace(/[^A-Z0-9]/g, "");
    const formatted = cleaned.match(/.{1,4}/g)?.join("-") || cleaned;
    return formatted.substring(0, 19); // XXXX-XXXX-XXXX-XXXX
  };

  const handleViewDownloads = () => {
    setShowDownloadPage(true);
  };

  const handleLicenseKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatLicenseKey(e.target.value.toUpperCase());

    setLicenseKey(formatted);
    setError(null);
  };

  // Show loading state while app status is being determined
  if (!appStatus) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">Loading license screen...</p>
        </div>
      </div>
    );
  }

  // Handle new flow screens first
  if (showExpiredTrialScreen) {
    return (
      <>
        <ExpiredTrialScreen
          onBuyLifetimeAccess={handleBuyLifetimeAccess}
          onAlreadyPurchased={handleAlreadyPurchased}
        />
        {/* EULA Modal */}
        {showEula && (
          <EulaAgreement
            onAccept={handleEulaAccept}
            error={error}
            isLoading={isActivating}
            onDecline={handleEulaDecline}
          />
        )}
      </>
    );
  }

  if (showKeyActivationScreen) {
    return (
      <>
        <KeyActivationScreen
          onBack={handleBackToActivation}
          onKeyEntered={handleKeyActivation}
          isActivating={isActivating}
          error={error}
          onNeedHelp={handleNeedHelp}
        />
        {/* EULA Modal */}
        {showEula && (
          <EulaAgreement
            onAccept={handleEulaAccept}
            error={error}
            isLoading={isActivating}
            onDecline={handleEulaDecline}
          />
        )}
      </>
    );
  }

  if (showRecoveryOptions) {
    return <RecoveryOptionsScreen onBack={handleBackToActivation} />;
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* EULA Modals */}
      {showEula && (
        <EulaAgreement
          onAccept={handleEulaAccept}
          error={error}
          isLoading={isActivating}
          onDecline={handleEulaDecline}
        />
      )}
      {showTrialEula && (
        <EulaAgreement
          onAccept={handleTrialEulaAccept}
          error={error}
          isLoading={isStartingTrial}
          onDecline={handleTrialEulaDecline}
        />
      )}
      {showDownloadInstructions && (
        <DownloadInstructions
          licenseKey={pendingLicenseKey}
          licenseType={selectedPlan}
          onClose={() => {
            setShowDownloadInstructions(false);
            onLicenseValid();
          }}
        />
      )}
      {showDownloadPage && (
        <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-4xl w-full">
            <DownloadPage />
            <button
              onClick={() => setShowDownloadPage(false)}
              className="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg mx-auto block text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Main Content - Centered */}
      <div className="flex-grow-0 flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-2xl">
          {/* Compact Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Local Password Vault</h1>
            <p className="text-slate-400 text-sm">Secure • Offline • Private</p>
          </div>

          {/* SCENARIO 0: Trial is active - Compact card matching other cards */}
          {!showPricingPlans && localStorageTrialInfo.hasTrialBeenUsed && !localStorageTrialInfo.isExpired && (
            <div className="max-w-sm mx-auto">
              <div className="bg-slate-800/40 border border-emerald-500/30 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-lg font-semibold text-white">Trial Active</h2>
                  <span className="ml-auto text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                    {localStorageTrialInfo.daysRemaining} day{localStorageTrialInfo.daysRemaining !== 1 ? 's' : ''} left
                  </span>
                </div>
                
                <button
                  onClick={onLicenseValid}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-medium text-sm transition-colors mb-3"
                >
                  Continue to Vault
                </button>
                
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    const url = "https://localpasswordvault.com/#plans";
                    window.electronAPI?.openExternal?.(url) ?? window.open(url, "_blank");
                  }}
                  className="w-full text-slate-400 hover:text-white text-xs py-1.5 transition-colors"
                >
                  Upgrade to Lifetime License
                </button>
              </div>
              
              {/* Footer links - directly under card */}
              <div className="text-center mt-4 space-y-2">
                <button
                  onClick={() => {
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.reload();
                  }}
                  className="px-3 py-1 bg-red-600/10 border border-red-500/20 text-red-400 text-[10px] rounded hover:bg-red-600/20 transition-colors"
                >
                  Reset App
                </button>
                <p className="text-[10px] text-slate-600">
                  <button
                    onClick={() => {
                      const url = "https://localpasswordvault.com";
                      window.electronAPI?.openExternal?.(url) ?? window.open(url, "_blank");
                    }}
                    className="text-slate-500 hover:text-slate-400 transition-colors"
                  >
                    LocalPasswordVault.com
                  </button>
                  <span className="mx-2">•</span>
                  <a href="mailto:support@LocalPasswordVault.com" className="text-slate-500 hover:text-slate-400 transition-colors">
                    Support
                  </a>
                </p>
              </div>
            </div>
          )}

          {/* SCENARIO 1: First time user - Show License OR Trial options */}
          {!showPricingPlans && !localStorageTrialInfo.hasTrialBeenUsed && (
            <div className="grid gap-4 md:grid-cols-2">
              
              {/* License Activation Card */}
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Key className="w-5 h-5 text-blue-400" />
                  <h2 className="text-lg font-semibold text-white">I Have a License Key</h2>
                </div>

                <div className="space-y-3">
                  <input
                    type="text"
                    value={licenseKey}
                    onChange={handleLicenseKeyChange}
                    onKeyPress={handleKeyPress}
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 text-center tracking-widest text-sm font-mono"
                    maxLength={19}
                  />

                  {error && (
                    <div className="flex items-start gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                      <XCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    onClick={handleActivateLicense}
                    disabled={isActivating || !licenseKey.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white py-2.5 rounded-lg font-medium text-sm transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isActivating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Activating...</span>
                      </>
                    ) : (
                      <span>Activate</span>
                    )}
                  </button>

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      const url = "https://localpasswordvault.com/#plans";
                      window.electronAPI?.openExternal?.(url) ?? window.open(url, "_blank");
                      window.electronAPI?.hideFloatingButton?.();
                    }}
                    className="w-full text-slate-400 hover:text-white text-xs py-1.5 transition-colors flex items-center justify-center gap-1"
                  >
                    <span>Purchase a license</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Free Trial Card */}
              <div className="bg-slate-800/40 border border-emerald-500/30 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-lg font-semibold text-white">Try It Free</h2>
                  <span className="ml-auto text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">7 days</span>
                </div>

                <ul className="space-y-2 mb-4 text-sm">
                  {[
                    "Full feature access",
                    "Unlimited passwords",
                    "AES-256 encryption",
                    "100% offline"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-slate-300">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={handleStartFreeTrial}
                  disabled={isStartingTrial}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 text-white py-2.5 rounded-lg font-medium text-sm transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isStartingTrial ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Starting...</span>
                    </>
                  ) : (
                    <span>Start Free Trial</span>
                  )}
                </button>
                <p className="text-slate-500 text-[10px] text-center mt-2">No credit card required</p>
              </div>
            </div>
          )}

          {/* Pricing Plans View */}
          {showPricingPlans && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold text-white">Choose Your Plan</h2>
                <p className="text-slate-400 text-sm">One-time purchase, lifetime access</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Personal */}
                <div className="bg-slate-800/40 border border-blue-500/40 rounded-xl p-5 hover:border-blue-500/60 transition-colors">
                  <div className="text-center mb-4">
                    <Shield className="w-10 h-10 text-blue-400 mx-auto mb-2" />
                    <h3 className="text-lg font-semibold text-white">Personal</h3>
                    <div className="text-2xl font-bold text-white">$49</div>
                    <p className="text-slate-500 text-xs">1 device • Lifetime</p>
                  </div>
                  <button
                    onClick={() => handlePurchase("single")}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium text-sm transition-colors"
                  >
                    Personal
                  </button>
                </div>

                {/* Family */}
                <div className="bg-slate-800/40 border-2 border-purple-500/60 rounded-xl p-5 relative">
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-purple-600 text-white px-2 py-0.5 rounded-full text-[10px] font-medium">
                    Best Value
                  </span>
                  <div className="text-center mb-4">
                    <Users className="w-10 h-10 text-purple-400 mx-auto mb-2" />
                    <h3 className="text-lg font-semibold text-white">Family</h3>
                    <div className="text-2xl font-bold text-white">$79</div>
                    <p className="text-slate-500 text-xs">5 devices • Lifetime</p>
                  </div>
                  <button
                    onClick={() => handlePurchase("family")}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-lg font-medium text-sm transition-colors"
                  >
                    Family
                  </button>
                </div>
              </div>

              <button
                onClick={onHidePricingPlans}
                className="text-slate-400 hover:text-white text-sm transition-colors flex items-center justify-center mx-auto gap-1 mt-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Compact Footer - hide when trial active card is showing (it has its own footer) */}
      {!(localStorageTrialInfo.hasTrialBeenUsed && !localStorageTrialInfo.isExpired && !showPricingPlans) && (
        <div className="flex-shrink-0 py-4">
          <div className="text-center space-y-2">
            {/* Dev Reset - Remove in production */}
            <button
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                window.location.reload();
              }}
              className="px-3 py-1 bg-red-600/10 border border-red-500/20 text-red-400 text-[10px] rounded hover:bg-red-600/20 transition-colors"
            >
              Reset App
            </button>
            <p className="text-[10px] text-slate-600">
              <button
                onClick={() => {
                  const url = "https://localpasswordvault.com";
                  window.electronAPI?.openExternal?.(url) ?? window.open(url, "_blank");
                }}
                className="text-slate-500 hover:text-slate-400 transition-colors"
              >
                LocalPasswordVault.com
              </button>
              <span className="mx-2">•</span>
              <a href="mailto:support@LocalPasswordVault.com" className="text-slate-500 hover:text-slate-400 transition-colors">
                Support
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
