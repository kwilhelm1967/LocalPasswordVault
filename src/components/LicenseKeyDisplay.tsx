import React from "react";

/**
 * LicenseKeyDisplay — REMOVED
 * 
 * This component previously displayed hardcoded license keys from the client bundle.
 * All license management is now handled server-side. Licenses are issued via:
 * - Stripe purchase → webhook → backend generates key → email delivery
 * - Admin dashboard → manual key creation
 * 
 * This stub is kept for backward compatibility with lazy imports in App.tsx.
 */

interface LicenseKeyDisplayProps {
  onClose?: () => void;
}

export const LicenseKeyDisplay: React.FC<LicenseKeyDisplayProps> = ({
  onClose,
}) => {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold text-white mb-4">
        License Management
      </h2>
      <p className="text-slate-400 text-sm mb-6">
        Licenses are managed server-side and delivered via email after purchase.
        Use the Admin Dashboard to create or manage licenses.
      </p>

      {onClose && (
        <div className="text-center mt-6">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};
