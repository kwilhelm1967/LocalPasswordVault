/**
 * Sentry Error Tracking Configuration
 * 
 * Initializes Sentry for error tracking and performance monitoring.
 * Only enabled in production mode.
 */

import * as Sentry from "@sentry/react";
import environment from "../config/environment";

/**
 * Initialize Sentry for error tracking
 */
export function initSentry(): void {
  // Only initialize in production
  if (!environment.environment.isProduction) {
    console.log("[Sentry] Error tracking disabled in non-production mode");
    return;
  }

  const dsn = import.meta.env.VITE_SENTRY_DSN;
  
  if (!dsn) {
    console.warn("[Sentry] DSN not configured. Error tracking disabled.");
    return;
  }

  Sentry.init({
    dsn,
    environment: environment.environment.isProduction ? "production" : "development",
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: 0.1, // 10% of transactions
    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
    
    // Filter out sensitive data
    beforeSend(event, hint) {
      // Don't send events in development
      if (!environment.environment.isProduction) {
        return null;
      }

      // Remove sensitive data from event
      if (event.request) {
        // Remove passwords, license keys, etc.
        if (event.request.data) {
          const sensitiveKeys = ['password', 'license_key', 'device_id', 'masterPassword'];
          sensitiveKeys.forEach(key => {
            if (event.request.data[key]) {
              event.request.data[key] = '[REDACTED]';
            }
          });
        }

        // Remove sensitive query params
        if (event.request.query_string) {
          const sensitiveParams = ['key', 'token', 'password'];
          sensitiveParams.forEach(param => {
            if (event.request.query_string.includes(param)) {
              event.request.query_string = '[REDACTED]';
            }
          });
        }
      }

      // Remove sensitive data from user context
      if (event.user) {
        delete event.user.email;
        delete event.user.username;
      }

      return event;
    },

    // Ignore certain errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'originalCreateNotification',
      'canvas.contentDocument',
      'MyApp_RemoveAllHighlights',
      'atomicFindClose',
      'fb_xd_fragment',
      'bmi_SafeAddOnload',
      'EBCallBackMessageReceived',
      'conduitPage',
      // Network errors that are expected
      'NetworkError',
      'Failed to fetch',
      'Network request failed',
      // User cancellations
      'AbortError',
    ],

    // Don't send errors from browser extensions
    denyUrls: [
      /extensions\//i,
      /^chrome:\/\//i,
      /^chrome-extension:\/\//i,
      /^moz-extension:\/\//i,
    ],
  });

  console.log("[Sentry] Error tracking initialized");
}

/**
 * Set user context for Sentry
 */
export function setSentryUser(userId: string, metadata?: Record<string, unknown>): void {
  if (!environment.environment.isProduction) return;

  Sentry.setUser({
    id: userId,
    // Don't include email or other PII
    ...metadata,
  });
}

/**
 * Clear user context
 */
export function clearSentryUser(): void {
  if (!environment.environment.isProduction) return;
  Sentry.setUser(null);
}

/**
 * Capture exception manually
 */
export function captureException(error: Error, context?: Record<string, unknown>): void {
  if (!environment.environment.isProduction) {
    console.error("[Sentry] Error (not sent in dev):", error, context);
    return;
  }

  Sentry.captureException(error, {
    contexts: {
      custom: context || {},
    },
  });
}

/**
 * Capture message manually
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = "info", context?: Record<string, unknown>): void {
  if (!environment.environment.isProduction) {
    console.log(`[Sentry] Message (not sent in dev): ${message}`, context);
    return;
  }

  Sentry.captureMessage(message, {
    level,
    contexts: {
      custom: context || {},
    },
  });
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message: string, category: string, level: Sentry.SeverityLevel = "info", data?: Record<string, unknown>): void {
  if (!environment.environment.isProduction) return;

  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

