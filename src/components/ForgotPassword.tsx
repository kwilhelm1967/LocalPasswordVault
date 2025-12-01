/**
 * ForgotPassword Component
 * 
 * Allows users to recover their vault using their recovery phrase.
 */

import React, { useState } from "react";
import { KeyRound, AlertCircle, Loader2, ArrowLeft, Check, Eye, EyeOff, Shield } from "lucide-react";
import { verifyRecoveryPhrase, hasRecoveryPhrase } from "../utils/recoveryPhrase";

const colors = {
  steelBlue600: "#4A6FA5",
  steelBlue500: "#5B82B8",
  steelBlue400: "#7A9DC7",
  warmIvory: "#F3F4F6",
};

interface ForgotPasswordProps {
  onBack: () => void;
  onRecoverySuccess: () => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({
  onBack,
  onRecoverySuccess,
}) => {
  const [words, setWords] = useState<string[]>(Array(12).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showWords, setShowWords] = useState(false);

  const hasRecovery = hasRecoveryPhrase();

  const handleWordChange = (index: number, value: string) => {
    const newWords = [...words];
    newWords[index] = value.toLowerCase().trim();
    setWords(newWords);
    setError("");
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    const pastedWords = pastedText.toLowerCase().trim().split(/\s+/);
    
    if (pastedWords.length === 12) {
      setWords(pastedWords);
      setError("");
    } else if (pastedWords.length > 1) {
      // Partial paste - fill from current position
      const newWords = [...words];
      pastedWords.forEach((word, i) => {
        if (i < 12) newWords[i] = word;
      });
      setWords(newWords);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const phrase = words.join(" ").trim();
    if (words.some(w => !w)) {
      setError("Please enter all 12 words");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const isValid = await verifyRecoveryPhrase(phrase);
      
      if (isValid) {
        // Clear the vault password so user can create a new one
        localStorage.removeItem("vault_password_hash");
        localStorage.removeItem("vault_salt_v2");
        localStorage.removeItem("vault_test_v2");
        onRecoverySuccess();
      } else {
        setError("Invalid recovery phrase. Please check your words and try again.");
      }
    } catch {
      setError("Recovery failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const filledCount = words.filter(w => w.trim()).length;

  if (!hasRecovery) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}
          >
            <AlertCircle className="w-8 h-8 text-red-400" strokeWidth={1.5} />
          </div>
          <h1 className="text-xl font-bold text-white mb-3">No Recovery Phrase Set</h1>
          <p className="text-slate-400 text-sm mb-6">
            This vault was created without a recovery phrase. Unfortunately, there is no way to recover your password.
          </p>
          <button
            onClick={onBack}
            className="px-6 py-3 rounded-xl text-sm font-medium transition-all flex items-center gap-2 mx-auto"
            style={{
              backgroundColor: `${colors.steelBlue500}15`,
              color: colors.steelBlue400,
              border: `1px solid ${colors.steelBlue500}30`,
            }}
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 overflow-auto">
      <div className="w-full max-w-lg">
        
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
          Back to Login
        </button>

        {/* Header */}
        <header className="text-center mb-6">
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ 
              background: `linear-gradient(135deg, ${colors.steelBlue500}, ${colors.steelBlue600})`,
              boxShadow: `0 8px 32px ${colors.steelBlue500}30`,
            }}
          >
            <KeyRound className="w-8 h-8 text-white" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Recover Your Vault
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Enter your 12-word recovery phrase to reset your password
          </p>
        </header>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Error Alert */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3 mb-6">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Words Input Card */}
          <div 
            className="rounded-xl p-6 mb-6"
            style={{
              backgroundColor: "rgba(30, 41, 59, 0.8)",
              border: `1px solid ${colors.steelBlue500}30`,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-xs uppercase tracking-wider font-medium">
                  Recovery Phrase
                </span>
                <span 
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ 
                    backgroundColor: filledCount === 12 ? "rgba(16, 185, 129, 0.15)" : `${colors.steelBlue500}15`,
                    color: filledCount === 12 ? "#10b981" : colors.steelBlue400,
                  }}
                >
                  {filledCount}/12
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowWords(!showWords)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
                style={{ 
                  backgroundColor: `${colors.steelBlue500}15`,
                  color: colors.steelBlue400,
                }}
              >
                {showWords ? <EyeOff className="w-3.5 h-3.5" strokeWidth={1.5} /> : <Eye className="w-3.5 h-3.5" strokeWidth={1.5} />}
                {showWords ? "Hide" : "Show"}
              </button>
            </div>

            {/* Words Grid */}
            <div className="grid grid-cols-3 gap-2" onPaste={handlePaste}>
              {words.map((word, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1 rounded-lg overflow-hidden"
                  style={{ backgroundColor: "rgba(15, 23, 42, 0.6)" }}
                >
                  <span className="text-slate-500 text-xs pl-2 w-6">{index + 1}.</span>
                  <input
                    type={showWords ? "text" : "password"}
                    value={word}
                    onChange={(e) => handleWordChange(index, e.target.value)}
                    className="flex-1 bg-transparent py-2.5 pr-2 text-sm font-mono focus:outline-none"
                    style={{ color: colors.warmIvory }}
                    placeholder="word"
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck={false}
                  />
                  {word && (
                    <Check className="w-3.5 h-3.5 text-emerald-400 mr-2" strokeWidth={2} />
                  )}
                </div>
              ))}
            </div>

            <p className="text-slate-500 text-xs mt-4 text-center">
              Tip: You can paste your entire phrase at once
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || filledCount !== 12}
            className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
            style={{
              background: filledCount === 12
                ? `linear-gradient(135deg, ${colors.steelBlue500}, ${colors.steelBlue600})`
                : "rgba(51, 65, 85, 0.5)",
              color: "white",
              opacity: filledCount === 12 ? 1 : 0.5,
              cursor: filledCount === 12 ? "pointer" : "not-allowed",
            }}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" strokeWidth={1.5} />
                Recover Vault
              </>
            )}
          </button>
        </form>

        {/* Info */}
        <p className="text-center text-slate-500 text-xs mt-6">
          After recovery, you'll create a new master password.<br />
          Your saved accounts will remain intact.
        </p>
      </div>
    </div>
  );
};

