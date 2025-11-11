import React from "react";
import { Lock, CreditCard, Key } from "lucide-react";

interface ExpiredTrialScreenProps {
  onBuyLifetimeAccess: () => void;
  onAlreadyPurchased: () => void;
}

export const ExpiredTrialScreen: React.FC<ExpiredTrialScreenProps> = ({
  onBuyLifetimeAccess,
  onAlreadyPurchased,
}) => {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8 shadow-2xl text-center">
          {/* Icon */}
          <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-white" />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-white mb-4">
            Your Trial Has Ended
          </h1>

          {/* Message */}
          <p className="text-slate-300 text-lg mb-8 leading-relaxed">
            Your 7 day trial has expired.
            <br />
            Your vault is still safely stored on your device.
            <br />
            To continue using Local Password Vault, you need a lifetime key.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col gap-4">
            <button
              onClick={onBuyLifetimeAccess}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <CreditCard className="w-5 h-5" />
              <span>Buy Lifetime Access</span>
            </button>
            <button
              onClick={onAlreadyPurchased}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <Key className="w-5 h-5" />
              <span>I Already Purchased a Key</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};