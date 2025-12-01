import React from "react";
import { Lock, CreditCard, Key, Shield } from "lucide-react";

// Consistent color palette
const colors = {
  steelBlue600: "#4A6FA5",
  steelBlue500: "#5B82B8",
  steelBlue400: "#7A9DC7",
  warmIvory: "#F3F4F6",
};

interface ExpiredTrialScreenProps {
  onBuyLifetimeAccess: () => void;
  onAlreadyPurchased: () => void;
}

export const ExpiredTrialScreen: React.FC<ExpiredTrialScreenProps> = ({
  onBuyLifetimeAccess,
  onAlreadyPurchased,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-600/50 rounded-2xl p-8 shadow-2xl text-center">
          {/* Icon */}
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ 
              background: `linear-gradient(135deg, ${colors.steelBlue500}, ${colors.steelBlue600})`,
              boxShadow: `0 8px 32px ${colors.steelBlue500}30`,
            }}
          >
            <Lock className="w-8 h-8 text-white" strokeWidth={1.5} />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold tracking-tight mb-3" style={{ color: colors.warmIvory }}>
            Your Trial Has Ended
          </h1>

          {/* Message */}
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">
            Your 7-day trial has expired.
            <br />
            Your vault is still safely stored on your device.
            <br />
            To continue using Local Password Vault, you need a lifetime key.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={onBuyLifetimeAccess}
              className="w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 text-white"
              style={{ backgroundColor: colors.steelBlue500 }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = colors.steelBlue600}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = colors.steelBlue500}
            >
              <CreditCard className="w-5 h-5" strokeWidth={1.5} />
              <span>Buy Lifetime Access</span>
            </button>
            <button
              onClick={onAlreadyPurchased}
              className="w-full bg-slate-700/50 hover:bg-slate-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 border border-slate-600/50"
            >
              <Key className="w-5 h-5" strokeWidth={1.5} />
              <span>I Already Purchased a Key</span>
            </button>
          </div>

          {/* Security Badge */}
          <div className="mt-6 pt-6 border-t border-slate-700/50 flex items-center justify-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" strokeWidth={1.5} />
            <p className="text-xs text-slate-500">Your data remains encrypted and secure</p>
          </div>
        </div>
      </div>
    </div>
  );
};