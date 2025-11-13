import React from "react";
import { X, ExternalLink } from "lucide-react";

interface TrialWarningPopupProps {
  warningType: 'expiring' | 'final';
  timeRemaining: string;
  onClose: () => void;
  onPurchaseNow: () => void;
  onDownloadContent: () => void;
}

export const TrialWarningPopup: React.FC<TrialWarningPopupProps> = ({
  warningType,
  timeRemaining,
  onClose,
  onPurchaseNow,
  onDownloadContent,
}) => {
  const isFinalWarning = warningType === 'final';

  const content = {
    expiring: {
      headline: "Trial Expiring Soon!",
      body: "Your trial period is almost over. Don't lose access to your work or the premium features you've been enjoying.",
    },
    final: {
      headline: "Final Notice: Your Trial Ends Today",
      body: "Your trial period ends today — after this, you'll lose access to your trial features.",
    },
  };

  const currentContent = content[warningType];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[9999]">
      <div className="bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 rounded-2xl overflow-hidden border border-slate-600/50 shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border-b border-slate-700/50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg leading-tight">
                {currentContent.headline}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all flex-shrink-0 ml-4"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            {currentContent.body}
          </p>

          {timeRemaining && (
            <div className="mb-6 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <p className="text-amber-400 text-sm font-medium text-center">
                Time remaining: {timeRemaining}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={onPurchaseNow}
              className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white py-3 px-4 rounded-xl font-medium transition-all text-sm shadow-lg"
            >
              <span>Purchase Now</span>
              <ExternalLink className="w-4 h-4" />
            </button>

            <button
              onClick={onDownloadContent}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-slate-600/50 hover:bg-slate-600 text-white rounded-xl font-medium transition-all text-sm border border-slate-500/50"
            >
              <span>Download Your Current Content</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>

          {/* Urgency indicator for final notice */}
          {isFinalWarning && (
            <div className="mt-4 text-center">
              <p className="text-red-400 text-xs font-medium">
                ⚠️ This is your final warning before trial expiration
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};