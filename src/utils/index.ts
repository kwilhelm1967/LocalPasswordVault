/**
 * Utilities Index - Local Password Vault
 *
 * Centralized exports for all utility functions.
 * Organized by functional area for cleaner imports.
 *
 * @example
 * ```ts
 * import { storageService, validateLicenseKey } from './utils';
 * import { memorySecurity, secureWipe } from './utils';
 * ```
 */

// ==================== Storage & Data Management ====================
export { storageService, StorageService } from './storage';
export { indexedDBStorage } from './indexedDBStorage';
export { repository } from './repository';
export { storageQuotaHandler } from './storageQuotaHandler';
export { corruptionHandler } from './corruptionHandler';

// ==================== Security & Encryption ====================
export { memorySecurity, secureWipe, secureCompare } from './memorySecurity';
export { sanitizeTextField as sanitize } from './sanitization';

// ==================== Validation & Sanitization ====================
export {
  sanitizeInput,
  sanitizeTextField,
  sanitizePassword,
  sanitizeNotes,
  validateEmail,
  validateLicenseKey,
  formatLicenseKey,
} from './validation';
export { commonValidation } from './commonValidation';
export { typeGuards } from './typeGuards';

// ==================== License Management ====================
export { licenseService } from './licenseService';
export { licenseValidator } from './licenseValidator';

// ==================== Trial Management ====================
export { trialService } from './trialService';

// ==================== Authentication & Recovery ====================
export { generateRecoveryPhrase, verifyRecoveryPhrase, storeRecoveryPhrase } from './recoveryPhrase';
export { generateLPVHardwareFingerprint } from './deviceFingerprint';
export { generateHardwareFingerprint } from './hardwareFingerprint';

// ==================== Two-Factor Authentication (TOTP) ====================
export { generateTOTP, getTimeRemaining, isValidTOTPSecret } from './totp';

// ==================== Import/Export Services ====================
export { importService } from './importService';

// ==================== Mobile Services ====================
export { mobileService } from './mobileService';

// ==================== User Feedback (Sound Effects) ====================
export { 
  playLockSound, 
  playCopySound, 
  playDeleteSound,
  playSuccessSound,
  playErrorSound 
} from './soundEffects';

// ==================== Error Handling & Recovery ====================
export { 
  ErrorHandler, 
  useErrorHandler, 
  withErrorHandling, 
  withRetry,
  AppError, 
  ValidationError,
  NetworkError,
  StorageError,
  AuthenticationError
} from './errorHandling';

// ==================== Analytics & Monitoring ====================
export { analyticsService } from './analyticsService';
export {
  trackRender,
  measureOperation,
  measureSync,
  snapshotMemory,
  logMetrics,
  clearMetrics,
  getMetricsSummary,
} from './performanceMonitor';

// ==================== Development Tools ====================
export { devLog, devWarn, devError, devLogLabeled, devLogIf } from './devLog';
export { sentry } from './sentry';

// ==================== Safe Utilities & Helpers ====================
export { 
  safeParseJSON, 
  safeGetLocalStorage, 
  safeSetLocalStorage, 
  safeParseJWT,
  safeGet 
} from './safeUtils';
export { serviceRegistry } from './serviceRegistry';
export { apiClient } from './apiClient';
