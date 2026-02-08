import React, { useState } from "react";
import { Shield, ArrowLeft, HelpCircle, Loader2, FileDown } from "lucide-react";
import { licenseService } from "../utils/licenseService";

// Consistent color palette
const colors = {
  steelBlue600: "#4A6FA5",
  steelBlue500: "#5B82B8",
  steelBlue400: "#7A9DC7",
  warmIvory: "#F3F4F6",
};

interface KeyActivationScreenProps {
  onBack: () => void;
  onKeyEntered: (key: string) => void;
  isActivating: boolean;
  error: string | null;
  onNeedHelp?: () => void;
  onPurchaseClick?: () => void;
}

export const KeyActivationScreen: React.FC<KeyActivationScreenProps> = ({
  onBack,
  onKeyEntered,
  isActivating,
  error,
  onNeedHelp,
  onPurchaseClick,
}) => {
  const [licenseCode, setLicenseCode] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleActivate();
    }
  };

  const handleActivate = () => {
    if (licenseCode.trim()) {
      onKeyEntered(licenseCode.trim());
    }
  };

  const handleLicenseCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatLicenseCode(e.target.value.toUpperCase());
    setLicenseCode(formatted);
  };

  const formatLicenseCode = (value: string) => {
    const cleaned = value.replace(/[^A-Z0-9]/g, "");
    const formatted = cleaned.match(/.{1,4}/g)?.join("-") || cleaned;
    return formatted.substring(0, 19);
  };

  const handleFileImport = async (file: File) => {
    try {
      setIsImporting(true);
      setImportError(null);
      const text = await file.text();
      const result = await licenseService.importLicenseFile(text);
      if (result.success) {
        // Trigger the parent's success handler with a placeholder
        onKeyEntered("__FILE_IMPORTED__");
      } else {
        setImportError(result.error || "Failed to import license file.");
      }
    } catch {
      setImportError("Failed to read license file.");
    } finally {
      setIsImporting(false);
    }
  };

  const displayError = importError || error;
  const isBusy = isActivating || isImporting;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-600/50 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ 
                background: `linear-gradient(135deg, ${colors.steelBlue500}, ${colors.steelBlue600})`,
                boxShadow: `0 8px 32px ${colors.steelBlue500}30`,
              }}
            >
              <Shield className="w-8 h-8 text-white" strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-bold tracking-tight mb-2" style={{ color: colors.warmIvory }}>
              Activate Your License
            </h2>
            <p className="text-slate-400 text-sm">
              Import the license file from your email, or enter the code manually
            </p>
          </div>

          {/* Primary: File Import */}
          <div
            className="border-2 border-dashed border-slate-600 hover:border-blue-500/60 rounded-xl p-6 text-center transition-all cursor-pointer group mb-4"
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-blue-400', 'bg-blue-500/5'); }}
            onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-blue-400', 'bg-blue-500/5'); }}
            onDrop={async (e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('border-blue-400', 'bg-blue-500/5');
              const file = e.dataTransfer.files[0];
              if (file) await handleFileImport(file);
            }}
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.license,.txt,.json';
              input.onchange = async (ev) => {
                const file = (ev.target as HTMLInputElement).files?.[0];
                if (file) await handleFileImport(file);
              };
              input.click();
            }}
          >
            {isImporting ? (
              <Loader2 className="w-8 h-8 text-blue-400 mx-auto mb-2 animate-spin" />
            ) : (
              <FileDown className="w-8 h-8 text-slate-500 group-hover:text-blue-400 mx-auto mb-2 transition-colors" />
            )}
            <p className="text-sm font-medium text-blue-400 mb-1">
              {isImporting ? "Importing..." : "Import License File"}
            </p>
            <p className="text-xs text-slate-500">
              Drop your .license file here, or click to browse
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-slate-700" />
            <span className="text-xs text-slate-600 uppercase tracking-wider">or enter code</span>
            <div className="flex-1 h-px bg-slate-700" />
          </div>

          {/* Secondary: Manual Code Entry */}
          <div className="space-y-4 mb-6">
            <input
              type="text"
              value={licenseCode}
              onChange={handleLicenseCodeChange}
              onKeyPress={handleKeyPress}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              className="w-full px-4 py-3 bg-slate-700/30 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all text-center tracking-wider text-lg font-mono"
              style={{ color: colors.warmIvory }}
              maxLength={19}
              disabled={isBusy}
            />

            {displayError && (
              <div 
                className="p-3.5 rounded-xl flex items-start gap-2.5"
                style={{ backgroundColor: 'rgba(217, 119, 6, 0.1)', border: '1px solid rgba(217, 119, 6, 0.4)' }}
              >
                <div className="flex-1 text-center">
                  <p className="text-xs font-semibold mb-0.5" style={{ color: '#D97706' }}>Warning</p>
                  <p className="text-xs text-slate-200">{displayError}</p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={handleActivate}
              disabled={isBusy || !licenseCode.trim()}
              className="w-full py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-white disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: colors.steelBlue500,
                opacity: isBusy || !licenseCode.trim() ? 0.6 : 1
              }}
              onMouseOver={(e) => { if (!isBusy && licenseCode.trim()) e.currentTarget.style.backgroundColor = colors.steelBlue600; }}
              onMouseOut={(e) => { if (!isBusy && licenseCode.trim()) e.currentTarget.style.backgroundColor = colors.steelBlue500; }}
            >
              {isActivating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Activating...</span>
                </>
              ) : (
                <span>Activate</span>
              )}
            </button>

            <button
              onClick={onPurchaseClick ?? onBack}
              className="w-full text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-2 py-2 text-sm"
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
              <span>I Don&apos;t Have a License</span>
            </button>
          </div>

          {/* Error-specific actions */}
          {displayError && onNeedHelp && (
            <div className="mb-4">
              <button
                onClick={onNeedHelp}
                className="w-full text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-2 py-2 text-sm"
              >
                <HelpCircle className="w-4 h-4" strokeWidth={1.5} />
                <span>I Need Help</span>
              </button>
            </div>
          )}

          {/* Help Section */}
          <div className="p-4 bg-slate-700/20 rounded-xl border border-slate-700/30">
            <div className="flex items-start gap-3 text-slate-500 text-xs">
              <HelpCircle className="w-4 h-4 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
              <p>
                Check your email for the .license file from Local Password Vault.
                You can also copy the activation code from your email and paste it above.
                Need help? Contact support@localpasswordvault.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
