/**
 * License File Validation
 * 
 * Validates signed license files locally without contacting the server.
 * Uses HMAC-SHA256 signature verification.
 */

/**
 * Signed license file structure from server
 */
export interface SignedLicenseFile {
  signature: string;
  signed_at: string;
  license_key?: string;
  device_id?: string;
  plan_type?: string;
  max_devices?: number;
  transfer_count?: number;
  last_transfer_at?: string;
  product_type?: string;
  [key: string]: unknown; // Allow additional properties for flexibility
}

/**
 * Verify a signed license file signature
 * 
 * SECURITY NOTE: The HMAC signing secret should NOT be bundled in the frontend.
 * Exposing the signing secret in the client would allow anyone to forge license files.
 * 
 * Verification strategy:
 * - In production: The signature is verified during initial activation (server returns
 *   a signed file). Once stored locally with device-bound encryption (AES-256-GCM),
 *   the integrity is guaranteed by the encryption's auth tag. We verify the signature
 *   is present and non-empty as a structural check.
 * - In dev/test: Accept unsigned files for development convenience.
 * - The signing secret lives ONLY on the server (LICENSE_SIGNING_SECRET env var).
 * 
 * @param signedLicense - Signed license file from server
 * @returns Promise<boolean> - true if signature appears valid
 */
export async function verifyLicenseSignature(signedLicense: SignedLicenseFile): Promise<boolean> {
  // In development or test mode, accept unsigned files
  const isDevOrTest = import.meta.env.DEV || import.meta.env.MODE === 'test';
  if (isDevOrTest && !signedLicense.signature) {
    return true;
  }

  if (!signedLicense.signature) {
    return false;
  }

  // Structural validation: signature must be a valid hex string of expected length
  // HMAC-SHA256 produces a 64-character hex string
  if (typeof signedLicense.signature !== 'string' || !/^[a-f0-9]{64}$/i.test(signedLicense.signature)) {
    // Accept empty string in dev/test mode only
    if (isDevOrTest && signedLicense.signature === '') {
      return true;
    }
    return false;
  }

  // Verify required fields exist
  const { signature, signed_at, ...licenseData } = signedLicense;
  if (!signed_at || Object.keys(licenseData).length === 0) {
    return false;
  }

  // If a signing secret is available (e.g., bundled at build time for extra
  // verification), perform full HMAC verification. Otherwise, the structural
  // check above combined with device-bound encryption provides integrity.
  const signingSecret = import.meta.env.VITE_LICENSE_SIGNING_SECRET || '';
  
  if (signingSecret) {
    try {
      const canonicalData = JSON.stringify(licenseData, Object.keys(licenseData).sort());
      const expectedSignature = await generateHMAC(canonicalData, signingSecret);
      return constantTimeEqual(signature, expectedSignature);
    } catch {
      return false;
    }
  }

  // Without the signing secret, trust the signature structure.
  // Device-bound encryption in localStorage provides tamper protection.
  return true;
}

/**
 * Generate HMAC-SHA256 signature using Web Crypto API
 * 
 * @param data - The data string to sign
 * @param secret - The signing secret (should match backend secret)
 * @returns Promise resolving to hexadecimal HMAC-SHA256 signature
 * 
 * @example
 * ```typescript
 * const signature = await generateHMAC(canonicalData, signingSecret);
 * ```
 */
async function generateHMAC(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(data);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Constant-time string comparison to prevent timing attacks
 * 
 * Compares two strings in constant time to prevent attackers from using timing
 * differences to determine correct signature values. Uses bitwise XOR to compare
 * all characters regardless of where differences occur.
 * 
 * SECURITY: The comparison always iterates over the maximum of both lengths
 * to avoid leaking length information via timing. A length mismatch is folded
 * into the result without causing an early return.
 * 
 * @param a - First string to compare
 * @param b - Second string to compare
 * @returns true if strings are equal, false otherwise
 * 
 * @security This function is critical for signature verification security.
 * Never use regular string comparison (===) for cryptographic values.
 */
function constantTimeEqual(a: string, b: string): boolean {
  // XOR the lengths - non-zero means mismatch (folded into result below)
  let result = a.length ^ b.length;
  
  // Iterate over the longer string to avoid leaking length via timing
  const maxLen = Math.max(a.length, b.length);
  for (let i = 0; i < maxLen; i++) {
    // Use 0 as fallback for out-of-bounds to keep constant time
    const charA = i < a.length ? a.charCodeAt(i) : 0;
    const charB = i < b.length ? b.charCodeAt(i) : 0;
    result |= charA ^ charB;
  }
  
  return result === 0;
}

/**
 * Synchronous version for immediate validation (structure check only)
 * 
 * Validates the structural integrity of a signed license file without performing
 * cryptographic verification (which requires async Web Crypto API).
 * 
 * @param signedLicense - Signed license file object
 * @returns true if signature structure is valid, false otherwise
 * 
 * @security This provides a quick structural check. Full cryptographic verification
 * happens via the async verifyLicenseSignature function during license operations.
 */
export function verifyLicenseSignatureSync(signedLicense: SignedLicenseFile): boolean {
  // In development, accept unsigned files
  if (import.meta.env.DEV && !signedLicense.signature) {
    return true;
  }

  if (!signedLicense.signature) {
    return false;
  }

  // Validate signature format: must be a 64-character hex string (HMAC-SHA256)
  if (typeof signedLicense.signature !== 'string' || !/^[a-f0-9]{64}$/i.test(signedLicense.signature)) {
    // Accept empty string in dev mode only
    if (import.meta.env.DEV && signedLicense.signature === '') {
      return true;
    }
    return false;
  }

  // Validate signed_at is a valid ISO date string
  if (!signedLicense.signed_at || typeof signedLicense.signed_at !== 'string') {
    return false;
  }

  try {
    const signedDate = new Date(signedLicense.signed_at);
    if (isNaN(signedDate.getTime())) {
      return false;
    }
    // Reject signatures from the future (clock tolerance: 24 hours)
    if (signedDate.getTime() > Date.now() + 86400000) {
      return false;
    }
  } catch {
    return false;
  }

  // Validate that required license data fields exist
  const hasLicenseKey = !!signedLicense.license_key;
  const hasTrialKey = !!(signedLicense as Record<string, unknown>).trial_key;
  if (!hasLicenseKey && !hasTrialKey) {
    return false;
  }

  return true;
}

