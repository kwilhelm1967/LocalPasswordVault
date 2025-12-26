/**
 * Sentry Error Tracking Configuration
 * 
 * DISABLED - 100% OFFLINE AFTER ACTIVATION
 * 
 * This file is kept for API compatibility but all functions are NO-OPs.
 * NO data is collected or sent from the user's application after activation.
 * 
 * Backend Sentry (server-side only) is separate and does not affect app offline operation.
 */

/**
 * Initialize Sentry for error tracking
 * NO-OP: Does nothing. No data collection.
 */
export function initSentry(): void {
  // NO-OP - No Sentry in frontend. 100% offline after activation.
  return;
}

/**
 * Set user context for Sentry
 * NO-OP: Does nothing. No data collection.
 */
export function setSentryUser(_userId: string, _metadata?: Record<string, unknown>): void {
  // NO-OP - No Sentry in frontend. 100% offline after activation.
  return;
}

/**
 * Clear user context
 * NO-OP: Does nothing. No data collection.
 */
export function clearSentryUser(): void {
  // NO-OP - No Sentry in frontend. 100% offline after activation.
  return;
}

/**
 * Capture exception manually
 * NO-OP: Does nothing. No data collection.
 */
export function captureException(_error: Error, _context?: Record<string, unknown>): void {
  // NO-OP - No Sentry in frontend. 100% offline after activation.
  return;
}

/**
 * Capture message manually
 * NO-OP: Does nothing. No data collection.
 */
export function captureMessage(_message: string, _level: string = "info", _context?: Record<string, unknown>): void {
  // NO-OP - No Sentry in frontend. 100% offline after activation.
  return;
}

/**
 * Add breadcrumb for debugging
 * NO-OP: Does nothing. No data collection.
 */
export function addBreadcrumb(_message: string, _category: string, _level: string = "info", _data?: Record<string, unknown>): void {
  // NO-OP - No Sentry in frontend. 100% offline after activation.
  return;
}
