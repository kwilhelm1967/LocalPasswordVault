/**
 * Input Sanitization Utilities
 * 
 * Provides functions to sanitize user input to prevent XSS attacks
 * and ensure data integrity.
 */

/**
 * HTML entities to escape
 */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * Escape HTML entities to prevent XSS
 */
export function escapeHtml(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Sanitize a general text field (account name, username, notes)
 * - Trims whitespace
 * - Removes null bytes
 * - Limits length
 */
export function sanitizeTextField(
  input: string,
  maxLength: number = 500
): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    // Remove null bytes (security)
    .replace(/\0/g, '')
    // Remove control characters except newlines and tabs
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Trim whitespace
    .trim()
    // Limit length
    .slice(0, maxLength);
}

/**
 * Sanitize a URL field
 * - Validates URL format
 * - Only allows http, https protocols
 * - Prevents javascript: and data: URLs
 */
export function sanitizeUrl(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  const trimmed = input.trim();
  
  // Allow empty URLs
  if (!trimmed) return '';
  
  // Check for dangerous protocols
  const lowerUrl = trimmed.toLowerCase();
  if (
    lowerUrl.startsWith('javascript:') ||
    lowerUrl.startsWith('data:') ||
    lowerUrl.startsWith('vbscript:') ||
    lowerUrl.startsWith('file:')
  ) {
    return '';
  }
  
  // If no protocol, assume https
  if (!trimmed.includes('://')) {
    return `https://${trimmed}`;
  }
  
  // Only allow http and https
  if (!lowerUrl.startsWith('http://') && !lowerUrl.startsWith('https://')) {
    return '';
  }
  
  return trimmed;
}

/**
 * Sanitize password field
 * - Removes null bytes
 * - Limits length
 * - Does NOT trim (whitespace in passwords is intentional)
 */
export function sanitizePassword(input: string, maxLength: number = 256): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    // Remove null bytes
    .replace(/\0/g, '')
    // Limit length
    .slice(0, maxLength);
}

/**
 * Sanitize notes field
 * - Similar to text field but allows longer content
 * - Preserves newlines
 */
export function sanitizeNotes(input: string, maxLength: number = 5000): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove control characters except newlines, carriage returns, and tabs
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Trim whitespace
    .trim()
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Limit length
    .slice(0, maxLength);
}

/**
 * Validate and sanitize a password entry before saving
 */
export interface SanitizedEntry {
  accountName: string;
  username: string;
  password: string;
  website?: string;
  category: string;
  notes?: string;
  balance?: string;
}

export function sanitizePasswordEntry(entry: {
  accountName: string;
  username: string;
  password: string;
  website?: string;
  category: string;
  notes?: string;
  balance?: string;
}): SanitizedEntry {
  return {
    accountName: sanitizeTextField(entry.accountName, 200),
    username: sanitizeTextField(entry.username, 200),
    password: sanitizePassword(entry.password),
    website: entry.website ? sanitizeUrl(entry.website) : undefined,
    category: sanitizeTextField(entry.category, 50),
    notes: entry.notes ? sanitizeNotes(entry.notes) : undefined,
    balance: entry.balance ? sanitizeTextField(entry.balance, 100) : undefined,
  };
}

/**
 * Check if a string contains potentially dangerous content
 */
export function containsDangerousContent(str: string): boolean {
  if (!str) return false;
  
  const dangerous = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // onclick=, onerror=, etc.
    /data:text\/html/i,
    /vbscript:/i,
  ];
  
  return dangerous.some(pattern => pattern.test(str));
}

