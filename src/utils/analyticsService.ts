/**
 * Analytics Service - NO-OP Implementation
 * 
 * This service is a complete no-op (no operation) to maintain API compatibility
 * while ensuring ZERO analytics, tracking, or data collection.
 * 
 * SECURITY GUARANTEE:
 * - No data collection
 * - No network calls
 * - No localStorage writes for analytics
 * - No user tracking
 * - No telemetry
 * - No phone-home functionality
 * 
 * All methods are empty functions that do nothing.
 */

interface AnalyticsEventProperties {
  [key: string]: string | number | boolean | undefined;
}

class AnalyticsService {
  private static instance: AnalyticsService;

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  // All methods are no-ops - they do nothing
  track(_event: string, _properties: AnalyticsEventProperties = {}): void {
    // NO-OP: No tracking, no data collection, no network calls
  }

  trackUserAction(_action: string, _details: AnalyticsEventProperties = {}): void {
    // NO-OP: No tracking, no data collection, no network calls
  }

  trackFeatureUsage(_feature: string, _details: AnalyticsEventProperties = {}): void {
    // NO-OP: No tracking, no data collection, no network calls
  }

  trackLicenseEvent(_event: string, _licenseType?: string, _details: AnalyticsEventProperties = {}): void {
    // NO-OP: No tracking, no data collection, no network calls
  }

  trackConversion(_step: string, _details: AnalyticsEventProperties = {}): void {
    // NO-OP: No tracking, no data collection, no network calls
  }
}

export const analyticsService = AnalyticsService.getInstance();