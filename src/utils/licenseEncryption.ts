/**
 * License File Encryption for Device Binding
 * 
 * Encrypts license files at rest in localStorage using a key derived from
 * the device fingerprint. This ensures that:
 * 
 * 1. License files cannot be copied between devices (device binding)
 * 2. License data is not readable in plaintext from localStorage
 * 3. Tampering with the encrypted blob invalidates it (AES-GCM auth tag)
 * 
 * Security Model:
 * - Encryption key is derived from device fingerprint using PBKDF2
 * - AES-256-GCM provides both confidentiality and integrity
 * - Each encryption uses a random IV (never reused)
 * - The device fingerprint is NOT stored; it's recalculated on each use
 */

import { getLPVDeviceFingerprint } from "./deviceFingerprint";

// Salt for PBKDF2 key derivation (public, constant - device fingerprint is the secret)
const LICENSE_ENCRYPTION_SALT = "lpv-license-device-binding-v1";

/**
 * Derive an AES-256-GCM encryption key from the device fingerprint.
 * Uses PBKDF2 with the device fingerprint as the password material.
 */
async function deriveDeviceKey(deviceFingerprint: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(deviceFingerprint),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode(LICENSE_ENCRYPTION_SALT),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt a license file JSON string using device-bound encryption.
 * 
 * @param plaintext - The JSON string of the license file
 * @param deviceFingerprint - Optional pre-calculated device fingerprint
 * @returns Base64-encoded encrypted data (IV + ciphertext)
 */
export async function encryptLicenseData(
  plaintext: string,
  deviceFingerprint?: string
): Promise<string> {
  const fingerprint = deviceFingerprint || await getLPVDeviceFingerprint();
  const key = await deriveDeviceKey(fingerprint);
  
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
  
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(plaintext)
  );

  // Combine IV + encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  // Encode as base64
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt a license file that was encrypted with device-bound encryption.
 * 
 * @param encryptedData - Base64-encoded encrypted data
 * @param deviceFingerprint - Optional pre-calculated device fingerprint
 * @returns The decrypted JSON string, or null if decryption fails (wrong device)
 */
export async function decryptLicenseData(
  encryptedData: string,
  deviceFingerprint?: string
): Promise<string | null> {
  try {
    const fingerprint = deviceFingerprint || await getLPVDeviceFingerprint();
    const key = await deriveDeviceKey(fingerprint);
    
    // Decode from base64
    const combined = new Uint8Array(
      atob(encryptedData)
        .split("")
        .map((c) => c.charCodeAt(0))
    );

    if (combined.length < 13) {
      // Too short to contain IV + any data
      return null;
    }

    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  } catch {
    // Decryption failed - wrong device or tampered data
    return null;
  }
}

/**
 * Check if data appears to be device-encrypted (base64 with sufficient length).
 * This helps distinguish between legacy plaintext JSON and new encrypted format.
 */
export function isDeviceEncrypted(data: string): boolean {
  // Encrypted data is base64 and doesn't start with '{' (JSON)
  if (!data || data.trim().startsWith("{") || data.trim().startsWith("[")) {
    return false;
  }
  // Check if it's valid base64
  try {
    const decoded = atob(data);
    // Must be at least 13 bytes (12 byte IV + 1 byte data minimum with GCM tag)
    return decoded.length >= 29; // 12 IV + 16 auth tag + 1 min data
  } catch {
    return false;
  }
}
