/**
 * @fileoverview Type Definitions for Local Password Vault
 * 
 * This module contains all TypeScript type definitions used throughout
 * the Local Password Vault application. Types are organized by category:
 * - Core entry types (PasswordEntry, Category)
 * - License and trial types
 * - Utility types (API, validation, forms)
 * - Component prop types
 * - Settings types
 * 
 * @module types
 * @version 1.2.0
 */

// ============================================
// LOCAL PASSWORD VAULT TYPES
// ============================================

/**
 * Type of entry stored in the vault.
 * - `password`: Standard login credentials
 * - `secure_note`: Encrypted text note without login fields
 * @typedef {('password'|'secure_note')} EntryType
 */
export type EntryType = "password" | "secure_note";

/**
 * Represents a historical password entry for password rotation tracking.
 * @interface PasswordHistoryItem
 * @property {string} password - The previous password (encrypted in storage)
 * @property {Date} changedAt - When the password was changed
 */
export interface PasswordHistoryItem {
  password: string;
  changedAt: Date;
}

/**
 * User-defined custom field for storing additional entry data.
 * @interface CustomField
 * @property {string} id - Unique identifier for the field
 * @property {string} label - Display label for the field
 * @property {string} value - The field value (may be encrypted)
 * @property {boolean} [isSecret] - If true, value is masked like a password
 * 
 * @example
 * const securityQuestion: CustomField = {
 *   id: 'sq1',
 *   label: 'Security Question',
 *   value: "Mother's maiden name",
 *   isSecret: false
 * };
 */
export interface CustomField {
  id: string;
  label: string;
  value: string;
  isSecret?: boolean;
}

/**
 * Main password entry interface representing a stored credential or secure note.
 * This is the primary data structure for vault items.
 * 
 * @interface PasswordEntry
 * @property {string} id - Unique identifier (UUID format)
 * @property {EntryType} [entryType='password'] - Type of entry
 * @property {string} accountName - Display name for the entry
 * @property {string} username - Login username/email
 * @property {string} password - Encrypted password
 * @property {string} [website] - Associated website URL
 * @property {string} [notes] - Additional notes
 * @property {string} [balance] - Account balance (for financial entries)
 * @property {string} category - Category ID for organization
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last modification timestamp
 * @property {boolean} [isFavorite] - Marked as favorite
 * @property {Date} [lastPasswordChange] - When password was last changed
 * @property {PasswordHistoryItem[]} [passwordHistory] - Previous passwords
 * @property {string} [totpSecret] - TOTP 2FA secret (Base32)
 * @property {CustomField[]} [customFields] - User-defined fields
 * 
 * @example
 * const entry: PasswordEntry = {
 *   id: 'abc-123',
 *   accountName: 'Gmail',
 *   username: 'user@gmail.com',
 *   password: 'encrypted_password',
 *   category: 'email',
 *   createdAt: new Date(),
 *   updatedAt: new Date()
 * };
 */
export interface PasswordEntry {
  id: string;
  entryType?: EntryType;
  accountName: string;
  username: string;
  password: string;
  website?: string;
  notes?: string;
  balance?: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
  isFavorite?: boolean;
  lastPasswordChange?: Date;
  passwordHistory?: PasswordHistoryItem[];
  totpSecret?: string;
  customFields?: CustomField[];
}

/**
 * Category for organizing entries
 */
export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

/**
 * Raw entry as loaded from JSON storage (dates are strings before conversion)
 * Use with parseRawEntry() to convert to PasswordEntry
 */
export type RawPasswordEntry = Record<string, unknown> & {
  id: string;
  accountName: string;
  username: string;
  password: string;
  category: string;
  createdAt: string;
  updatedAt: string;
};

// ============================================
// LICENSE & TRIAL TYPES
// ============================================

export interface LicenseInfo {
  licenseKey: string;
  planType: "personal" | "family" | "trial";
  isValid: boolean;
  activatedAt?: Date;
  expiresAt?: Date;
}

export interface TrialInfo {
  isActive: boolean;
  isExpired: boolean;
  daysRemaining: number;
  hoursRemaining?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface AppLicenseStatus {
  canUseApp: boolean;
  requiresPurchase: boolean;
  licenseInfo: LicenseInfo | null;
  trialInfo: TrialInfo;
}

// ============================================
// UTILITY TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface FormState<T> {
  data: T;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isDirty: boolean;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

// ============================================
// COMPONENT PROP TYPES
// ============================================

export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

export interface FormFieldProps extends BaseComponentProps {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
}

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

// ============================================
// VAULT SETTINGS
// ============================================

export interface VaultSettings {
  autoLockTimeout: number; // minutes
  clipboardClearTimeout: number; // seconds
  showPasswordsDefault: boolean;
  soundEffectsEnabled: boolean;
}
