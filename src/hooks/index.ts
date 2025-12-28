/**
 * Hooks Index - Local Password Vault
 *
 * Custom React hooks for the Local Password Vault application.
 * Organized by functional area for cleaner imports.
 *
 * @example
 * ```tsx
 * import { useElectron, useEntryManagement } from './hooks';
 * import { useAppStatus, useVaultData } from './hooks';
 * ```
 */

// ==================== Vault State Management ====================
export { useEntryManagement } from './useEntryManagement';
export { useVaultState, DEFAULT_CATEGORIES } from './useVaultState';
export { useVaultData } from './useVaultData';
export { useVaultStatusSync } from './useVaultStatusSync';

// ==================== App State Management ====================
export { useAppStatus } from './useAppStatus';
export { useDarkTheme } from './useDarkTheme';
export { useFloatingMode } from './useFloatingMode';

// ==================== Electron Integration ====================
export { useElectron } from './useElectron';

// ==================== Performance Monitoring ====================
export {
  useRenderTracking,
  useMeasuredCallback,
  useLogMetrics,
  usePerformanceSummary,
  onRenderCallback,
} from './usePerformance';