import React, { useState } from "react";
import { Key, ArrowLeft, HelpCircle } from "lucide-react";

interface KeyActivationScreenProps {
  onBack: () => void;
  onKeyEntered: (key: string) => void;
  isActivating: boolean;
  error: string | null;
  onNeedHelp?: () => void;
}

export const KeyActivationScreen: React.FC<KeyActivationScreenProps> = ({
  onBack,
  onKeyEntered,
  isActivating,
  error,
  onNeedHelp,
}) => {
  const [licenseKey, setLicenseKey] = useState("");

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleActivate();
    }
  };

  const handleActivate = () => {
    if (licenseKey.trim()) {
      onKeyEntered(licenseKey.trim());
    }
  };

  const handleLicenseKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatLicenseKey(e.target.value.toUpperCase());
    setLicenseKey(formatted);
  };

  const formatLicenseKey = (value: string) => {
    const cleaned = value.replace(/[^A-Z0-9]/g, "");
    const formatted = cleaned.match(/.{1,4}/g)?.join("-") || cleaned;
    return formatted.substring(0, 19); // XXXX-XXXX-XXXX-XXXX
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Key className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Enter Your Lifetime Key
            </h2>
            <p className="text-slate-400">
              Your license key was provided in your purchase confirmation email
            </p>
          </div>

          {/* License Key Input */}
          <div className="space-y-4 mb-6">
            <input
              type="text"
              value={licenseKey}
              onChange={handleLicenseKeyChange}
              onKeyPress={handleKeyPress}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-center tracking-wider text-lg"
              maxLength={19}
              disabled={isActivating}
            />

            {error && (
              <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={handleActivate}
              disabled={isActivating || !licenseKey.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center space-x-2"
            >
              {isActivating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Activating...</span>
                </>
              ) : (
                <span>Activate Lifetime Access</span>
              )}
            </button>

            <button
              onClick={onBack}
              className="w-full text-slate-400 hover:text-white transition-colors flex items-center justify-center space-x-2 py-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>I Don't Have My Key</span>
            </button>
          </div>

          {/* Error-specific actions */}
          {error && onNeedHelp && (
            <div className="space-y-3">
              <button
                onClick={onNeedHelp}
                className="w-full text-slate-400 hover:text-white transition-colors flex items-center justify-center space-x-2 py-2"
              >
                <HelpCircle className="w-4 h-4" />
                <span>I Need Help With My Key</span>
              </button>
            </div>
          )}

          {/* Help Section */}
          <div className="p-4 bg-slate-700/30 rounded-lg">
            <div className="flex items-center space-x-2 text-slate-400 text-sm">
              <HelpCircle className="w-4 h-4" />
              <p>
                Can't find your key? Check your email from Local Password Vault or contact support.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};