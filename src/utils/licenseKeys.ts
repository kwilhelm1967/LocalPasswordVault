/**
 * License Key Utilities
 * 
 * SECURITY: License keys are validated server-side only.
 * This file provides format validation and type definitions.
 * 
 * IMPORTANT: Never store actual license keys in client-side source code.
 * All key validation happens via the backend API at /api/lpv/license/activate.
 * The client only validates the key FORMAT before sending to the server.
 */

// License key types - Personal and Family only
export type LicenseType = 'single' | 'family';

// License key interface (kept for backward compatibility)
export interface LicenseKey {
  key: string;
  type: LicenseType;
  expires: string;
  expirationDate: Date;
}

// SECURITY: No hardcoded license keys in source code.
// All license validation is done server-side.
export const lifetimeLicenses: LicenseKey[] = [];
export const singleUserLicenses: LicenseKey[] = [];
export const familyLicenses: LicenseKey[] = [];
export const allLicenseKeys: LicenseKey[] = [];

/**
 * Validate license key FORMAT (not validity).
 * 
 * SECURITY: This only checks the format pattern. Actual validation
 * happens server-side via the activation API. A key passing this check
 * does NOT mean it's a valid license - it just has the correct format.
 */
export function validateLicenseKey(key: string): boolean {
  const pattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4,5}$/;
  return pattern.test(key);
}

/**
 * Get license type from key prefix (heuristic only).
 * The actual type is determined server-side during activation.
 */
export function getLicenseType(key: string): LicenseType | null {
  if (!key) return null;
  const upper = key.toUpperCase();
  if (upper.startsWith('FMLY-') || upper.startsWith('FAM-')) return 'family';
  if (upper.startsWith('PERS-') || upper.startsWith('GIFT-')) return 'single';
  // Default: cannot determine from prefix alone
  return null;
}

/**
 * Check if license is expired.
 * 
 * SECURITY: Expiration is determined by the signed license file from the server,
 * NOT by client-side key lookup. This function returns false (not expired) since
 * actual expiration checking happens via the signed license file's expiry date.
 */
export function isLicenseExpired(_key: string): boolean {
  // Actual expiration is checked via the signed license/trial file
  // This function is kept for backward compatibility
  return false;
}
