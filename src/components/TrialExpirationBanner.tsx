import React from "react";
import { Lock, Clock, CreditCard, Key, Shield } from "lucide-react";

// Consistent color palette
const colors = {
  steelBlue600: "#4A6FA5",
  steelBlue500: "#5B82B8",
  steelBlue400: "#7A9DC7",
  warmIvory: "#F3F4F6",
  brandGold: "#C9AE66",
};

interface TrialExpirationBannerProps {
  trialInfo: {
    hasTrialBeenUsed: boolean;
    isExpired: boolean;
    isTrialActive: boolean;
    daysRemaining: number;
    startDate: Date | null;
    endDate: Date | null;
  };
  onApplyLicenseKey?: () => void;
  showLicenseInput?: boolean;
}

export const TrialExpirationBanner: React.FC<TrialExpirationBannerProps> = ({ trialInfo, onApplyLicenseKey, showLicenseInput = false }) => {

  const handlePurchaseNow = () => {
    const url = "https://localpasswordvault.com/#plans";
    if (window.electronAPI) {
      window.electronAPI.openExternal(url);
    } else {
      window.open(url, "_blank");
    }
  };

  const handleApplyKey = () => {
    if (onApplyLicenseKey) {
      onApplyLicenseKey();
    }
  };

  // Don't show banner if trial hasn't been used at all
  if (!trialInfo.hasTrialBeenUsed) {
    return null;
  }

  // Expired trial banner
  if (trialInfo.isExpired && !showLicenseInput) {
    return (
      <div className="w-full max-w-2xl mx-auto mb-8">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-600/50 rounded-2xl p-8 shadow-2xl text-center">
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ 
              background: `linear-gradient(135deg, ${colors.steelBlue500}, ${colors.steelBlue600})`,
              boxShadow: `0 8px 32px ${colors.steelBlue500}30`,
            }}
          >
            <Lock className="w-8 h-8 text-white" strokeWidth={1.5} />
          </div>

          <h1 className="text-2xl font-bold tracking-tight mb-3" style={{ color: colors.warmIvory }}>
            Your Trial Has Ended
          </h1>

          <p className="text-slate-400 text-sm mb-8 leading-relaxed">
            Your 7-day trial has expired.
            <br />
            Your vault is still safely stored on your device.
            <br />
            To continue using Local Password Vault, you need a lifetime key.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handlePurchaseNow}
              className="py-3 px-8 rounded-xl font-semibold transition-all duration-200 text-white flex items-center justify-center gap-2"
              style={{ backgroundColor: colors.steelBlue500 }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = colors.steelBlue600}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = colors.steelBlue500}
            >
              <CreditCard className="w-5 h-5" strokeWidth={1.5} />
              Buy Lifetime Access
            </button>
            <button
              onClick={handleApplyKey}
              className="bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 text-white py-3 px-8 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Key className="w-5 h-5" strokeWidth={1.5} />
              I Already Purchased a Key
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-700/50 flex items-center justify-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" strokeWidth={1.5} />
            <p className="text-xs text-slate-500">Your data remains encrypted and secure</p>
          </div>
        </div>
      </div>
    );
  }

  // Warning banner (3 days or less remaining)
  if (trialInfo.isTrialActive && trialInfo.daysRemaining <= 3) {
    return (
      <div className="w-full max-w-4xl mx-auto mb-8">
        <div 
          className="bg-slate-800/50 backdrop-blur-sm border rounded-2xl p-6 shadow-xl"
          style={{ borderColor: `${colors.brandGold}50` }}
        >
          <div className="flex items-center gap-4 mb-4">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${colors.brandGold}20` }}
            >
              <Clock className="w-6 h-6" strokeWidth={1.5} style={{ color: colors.brandGold }} />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold tracking-tight mb-0.5" style={{ color: colors.warmIvory }}>
                Trial Ending Soon
              </h2>
              <p className="text-sm" style={{ color: colors.brandGold }}>
                {trialInfo.daysRemaining} day{trialInfo.daysRemaining !== 1 ? 's' : ''} remaining in your trial
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handlePurchaseNow}
              className="flex-1 py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-white"
              style={{ backgroundColor: colors.steelBlue500 }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = colors.steelBlue600}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = colors.steelBlue500}
            >
              <CreditCard className="w-4 h-4" strokeWidth={1.5} />
              <span>Get License Now</span>
            </button>
            <button
              onClick={handleApplyKey}
              className="flex-1 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 text-white py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
            >
              <Key className="w-4 h-4" strokeWidth={1.5} />
              <span>Apply Your Key</span>
            </button>
          </div>
          <div 
            className="mt-4 rounded-xl p-3 text-center"
            style={{ backgroundColor: `${colors.brandGold}10` }}
          >
            <p className="text-sm" style={{ color: colors.brandGold }}>
              Expires: {trialInfo.endDate ? new Date(trialInfo.endDate).toLocaleDateString() : 'Unknown'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};