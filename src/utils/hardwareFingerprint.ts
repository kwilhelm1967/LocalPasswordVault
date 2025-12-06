/**
 * Hardware Fingerprint Utility (Backward Compatibility)
 * 
 * This file re-exports from deviceFingerprint.ts for backward compatibility.
 * New code should import from deviceFingerprint.ts directly.
 */

export { 
  getLPVDeviceFingerprint as generateHardwareFingerprint,
  getLPVDeviceFingerprint,
  isValidDeviceId,
  getDisplayDeviceId,
} from './deviceFingerprint';
