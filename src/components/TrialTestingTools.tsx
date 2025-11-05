import React from "react";
import { Settings, RefreshCw, Calendar, Trash2, ToggleLeft, ToggleRight, Clock } from "lucide-react";
import { licenseService } from "../utils/licenseService";
import { trialService, TrialService } from "../utils/trialService";

interface TrialTestingToolsProps {
  onClose: () => void;
}

export const TrialTestingTools: React.FC<TrialTestingToolsProps> = ({
  onClose,
}) => {
  const appStatus = licenseService.getAppStatus();
  const [testMode, setTestMode] = React.useState(trialService.isTestMode());

  const handleResetTrial = () => {
    trialService.resetTrial();
    window.location.reload();
  };

  const handleStartTrial = () => {
    if (licenseService.canStartTrial()) {
      licenseService.startTrial();
      window.location.reload();
    }
  };

  const handleSimulateExpiry = () => {
    // Manually set trial to expired for testing
    const pastDate = new Date();
    if (testMode) {
      // Set to 6 minutes ago (expired for 5-minute mode)
      pastDate.setTime(pastDate.getTime() - 6 * 60 * 1000);
    } else {
      // Set to 8 days ago (expired for 7-day mode)
      pastDate.setDate(pastDate.getDate() - 8);
    }
    localStorage.setItem("trial_start_date", pastDate.toISOString());
    localStorage.setItem("trial_used", "true");
    window.location.reload();
  };

  const handleSimulateLastDay = () => {
    // Set trial to expire soon
    const pastDate = new Date();
    if (testMode) {
      // Set to 4 minutes ago (1 minute remaining for 5-minute mode)
      pastDate.setTime(pastDate.getTime() - 4 * 60 * 1000);
    } else {
      // Set to 6 days ago (1 day remaining for 7-day mode)
      pastDate.setDate(pastDate.getDate() - 6);
    }
    localStorage.setItem("trial_start_date", pastDate.toISOString());
    localStorage.setItem("trial_used", "true");
    window.location.reload();
  };

  const handleSimulateLastMinute = () => {
    // Set trial to expire in 30 seconds (only for 5-minute mode)
    if (!testMode) return;

    const pastDate = new Date();
    pastDate.setTime(pastDate.getTime() - 4.5 * 60 * 1000); // 4.5 minutes ago (30 seconds remaining)
    localStorage.setItem("trial_start_date", pastDate.toISOString());
    localStorage.setItem("trial_used", "true");
    window.location.reload();
  };

  const handleRemoveLicense = () => {
    licenseService.removeLicense();
    window.location.reload();
  };

  const handleToggleTestMode = () => {
    const newMode = !testMode;
    setTestMode(newMode);
    // Dynamically update the test mode
    (TrialService as any).USE_TEST_MODE = newMode;
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">
              Trial Testing Tools
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            ×
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-slate-700/50 rounded-lg p-4">
            <h3 className="font-medium text-white mb-2">Test Mode Settings</h3>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-300">
                5-Minute Testing Mode
              </span>
              <button
                onClick={handleToggleTestMode}
                className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
              >
                {testMode ? (
                  <ToggleRight className="w-5 h-5" />
                ) : (
                  <ToggleLeft className="w-5 h-5" />
                )}
                <span className="text-sm">
                  {testMode ? "Enabled" : "Disabled"}
                </span>
              </button>
            </div>
            <div className="text-xs text-slate-400">
              {testMode
                ? "⚡ Trial runs for 5 minutes (perfect for quick testing)"
                : "⏰ Trial runs for 7 days (normal production mode)"}
            </div>
          </div>

          <div className="bg-slate-700/50 rounded-lg p-4">
            <h3 className="font-medium text-white mb-2">Current Status</h3>
            <div className="text-sm text-slate-300 space-y-1">
              <p>Licensed: {appStatus.isLicensed ? "Yes" : "No"}</p>
              <p>
                Trial Active: {appStatus.trialInfo.isTrialActive ? "Yes" : "No"}
              </p>
              <p>
                Trial Used:{" "}
                {appStatus.trialInfo.hasTrialBeenUsed ? "Yes" : "No"}
              </p>
              <p>
                {testMode ? "Minutes" : "Days"} Remaining: {appStatus.trialInfo.daysRemaining}
              </p>
              <p>Can Use App: {appStatus.canUseApp ? "Yes" : "No"}</p>
              <p>
                Requires Purchase: {appStatus.requiresPurchase ? "Yes" : "No"}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleResetTrial}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-all flex items-center justify-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reset Trial</span>
          </button>

          <button
            onClick={handleStartTrial}
            disabled={!licenseService.canStartTrial()}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-all flex items-center justify-center space-x-2"
          >
            <Calendar className="w-4 h-4" />
            <span>Start Trial</span>
          </button>

          <button
            onClick={handleSimulateLastDay}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-lg transition-all flex items-center justify-center space-x-2"
          >
            <Calendar className="w-4 h-4" />
            <span>
              {testMode ? "Simulate 1 Minute Left" : "Simulate Last Day"}
            </span>
          </button>

          {testMode && (
            <button
              onClick={handleSimulateLastMinute}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-all flex items-center justify-center space-x-2"
            >
              <Clock className="w-4 h-4" />
              <span>Simulate 30 Seconds Left</span>
            </button>
          )}

          <button
            onClick={handleSimulateExpiry}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-all flex items-center justify-center space-x-2"
          >
            <Calendar className="w-4 h-4" />
            <span>Simulate Expired Trial</span>
          </button>

          <button
            onClick={handleRemoveLicense}
            className="w-full bg-slate-600 hover:bg-slate-700 text-white py-2 px-4 rounded-lg transition-all flex items-center justify-center space-x-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Remove License</span>
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-700">
          <p className="text-xs text-slate-400 text-center">
            Development tools - only visible in test environment
          </p>
        </div>
      </div>
    </div>
  );
};
