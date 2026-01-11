import React, { useState } from "react";
import { Shield, Key, Wifi, HelpCircle, ChevronRight, Check } from "lucide-react";

interface SecurityBriefingProps {
  isOpen: boolean;
  onComplete: () => void;
}

interface BriefingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  highlight: string;
}

const briefingSteps: BriefingStep[] = [
  {
    id: 1,
    title: "Your Master Password",
    description:
      "Your master password is the only key to your vault. It's never stored anywhere — not on your device, not in the cloud, nowhere. Only you know it.",
    icon: <Key className="w-10 h-10 text-cyan-400" />,
    highlight: "Choose something memorable but strong. If you forget it, your data cannot be recovered without a recovery key.",
  },
  {
    id: 2,
    title: "Set Up Recovery",
    description:
      "Before you add any passwords, set up your recovery key in Settings. This is your backup if you ever forget your master password.",
    icon: <Shield className="w-10 h-10 text-emerald-400" />,
    highlight: "Go to Settings → Security → Set Up Recovery Key. Store it somewhere safe offline.",
  },
  {
    id: 3,
    title: "100% Offline",
    description:
      "This vault never connects to the internet. Your passwords stay on your device and nowhere else. No accounts, no sync, no tracking.",
    icon: <Wifi className="w-10 h-10 text-amber-400 opacity-50" style={{ textDecoration: 'line-through' }} />,
    highlight: "Need help? Click the ? icon in the sidebar or visit Settings → Help & Support.",
  },
];

export const SecurityBriefing: React.FC<SecurityBriefingProps> = ({
  isOpen,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = briefingSteps[currentStep];
  const isLastStep = currentStep === briefingSteps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/95 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 animate-fadeIn">
        {/* Card */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden">
          {/* Progress indicator */}
          <div className="flex justify-center gap-2 pt-6">
            {briefingSteps.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? "w-8 bg-cyan-400"
                    : index < currentStep
                    ? "w-4 bg-cyan-400/50"
                    : "w-4 bg-slate-600"
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-slate-700/40 rounded-2xl border border-slate-600/30">
                {step.icon}
              </div>
            </div>

            {/* Step indicator */}
            <div className="text-center mb-2">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                {currentStep + 1} of {briefingSteps.length}
              </span>
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-white text-center mb-4">
              {step.title}
            </h2>

            {/* Description */}
            <p className="text-slate-300 text-center leading-relaxed mb-5 text-sm">
              {step.description}
            </p>

            {/* Highlight box */}
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4 mb-6">
              <p className="text-sm text-cyan-300 text-center leading-relaxed">
                {step.highlight}
              </p>
            </div>

            {/* Button */}
            <button
              onClick={handleNext}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-medium transition-all duration-200 shadow-lg shadow-cyan-600/20"
            >
              {isLastStep ? (
                <>
                  <Check className="w-5 h-5" />
                  Got it
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Help note */}
        <div className="flex items-center justify-center gap-2 mt-4 text-slate-500 text-xs">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>You can review this anytime in Settings</span>
        </div>
      </div>
    </div>
  );
};

// Re-export hook from hooks directory for backward compatibility
export { useSecurityBriefing } from "../hooks/useSecurityBriefing";



