import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { devError } from "../utils/devLog";
// NO SENTRY - 100% offline after activation. No data collection from user's app.

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs them, and displays a fallback UI instead of crashing the entire app.
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error for debugging (local only - no network calls)
    devError("Error Boundary caught an error:", error, errorInfo);
    
    // NO SENTRY - 100% offline after activation. No data collection from user's app.
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-xl p-8 text-center">
            {/* Error Icon */}
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>

            {/* Title */}
            <h1 className="text-xl font-bold text-white mb-2">
              Something went wrong
            </h1>
            
            {/* Description */}
            <p className="text-slate-400 text-sm mb-6">
              An unexpected error occurred. Your data is safe — try refreshing the page.
            </p>

            {/* Error details (dev only) */}
            {import.meta.env.DEV && this.state.error && (
              <div className="mb-6 p-3 bg-slate-900/50 rounded-lg text-left">
                <p className="text-xs text-slate-500 mb-1 font-medium">Error details:</p>
                <code className="text-xs text-red-400 break-all">
                  {this.state.error.message}
                </code>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-sm font-medium transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reload
              </button>
            </div>

            {/* Support link */}
            <p className="mt-6 text-xs text-slate-500">
              If this keeps happening, contact{" "}
              <a
                href="mailto:support@localpasswordvault.com"
                className="text-blue-400 hover:underline"
              >
                support@localpasswordvault.com
              </a>
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

