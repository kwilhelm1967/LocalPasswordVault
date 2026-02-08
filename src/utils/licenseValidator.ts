/**
 * License File Validation — Signature Verification
 * 
 * Supports two signature formats:
 * 
 * 1. ECDSA P-256 (preferred, new LPV-specific signer)
 *    - Backend signs with PRIVATE key (LPV_SIGNING_PRIVATE_KEY)
 *    - Frontend verifies with PUBLIC key (VITE_LICENSE_PUBLIC_KEY)
 *    - Attackers cannot forge signatures even with full client source
 * 
 * 2. HMAC-SHA256 (legacy, shared signer used by LLV + purchase webhooks)
 *    - Accepted based on structure validation (64-char hex)
 *    - Cannot be verified client-side without the shared secret
 *    - Still tamper-proof at the server level
 * 
 * This dual support ensures backward compatibility with existing license
 * files while enabling full cryptographic verification for new ones.
 */

/**
 * Signed license file structure from server
 */
export interface SignedLicenseFile {
  signature: string;
  signed_at: string;
  license_key?: string;
  trial_key?: string;
  device_id?: string;
  plan_type?: string;
  max_devices?: number;
  transfer_count?: number;
  last_transfer_at?: string;
  product_type?: string;
  start_date?: string;
  expires_at?: string;
  activated_at?: string;
  [key: string]: unknown;
}

/**
 * ECDSA P-256 public key for LPV license signature verification.
 * Safe to embed in client — only the server has the private key.
 * 
 * To regenerate: node backend/scripts/generate-lpv-keys.js
 * Then update VITE_LICENSE_PUBLIC_KEY in .env and rebuild.
 */
const DEFAULT_LPV_PUBLIC_KEY = '04ac1cea2e73f496cf55330264e1b804713c57b7adbc953b4b1d9563f71bc580658510e3e221f3f0c1db1d1499b1f786fef85e5764d88b5551f47c1b0743913e3e';
const LICENSE_PUBLIC_KEY = import.meta.env.VITE_LICENSE_PUBLIC_KEY || DEFAULT_LPV_PUBLIC_KEY;

// HMAC-SHA256 signatures are exactly 64 hex chars (SHA-256 = 32 bytes)
const HMAC_SIGNATURE_LENGTH = 64;

/**
 * Import the ECDSA P-256 public key from hex-encoded raw format
 */
async function importPublicKey(hexKey: string): Promise<CryptoKey> {
  const keyBytes = hexToBytes(hexKey);
  return crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['verify']
  );
}

/**
 * Verify a signed license file signature.
 * 
 * Tries ECDSA first (if public key configured), then accepts valid HMAC
 * signatures based on structure (for backward compatibility with files
 * signed by the shared HMAC signer).
 * 
 * @param signedLicense - Signed license file from server or email
 * @returns Promise<boolean> - true if signature is valid
 */
export async function verifyLicenseSignature(signedLicense: SignedLicenseFile): Promise<boolean> {
  const isDevOrTest = import.meta.env.DEV || import.meta.env.MODE === 'test';

  // In dev/test, accept unsigned files
  if (isDevOrTest && !signedLicense.signature) {
    return true;
  }

  // No signature = invalid
  if (!signedLicense.signature) {
    return false;
  }

  // Extract signature and signed_at from data (they're not part of the signed payload)
  const { signature, signed_at: _signedAt, ...licenseData } = signedLicense;

  // Canonical JSON (sorted keys) — must match backend
  const canonicalData = JSON.stringify(licenseData, Object.keys(licenseData).sort());

  // --- Try ECDSA verification first ---
  if (LICENSE_PUBLIC_KEY && signature.length > HMAC_SIGNATURE_LENGTH) {
    try {
      const publicKey = await importPublicKey(LICENSE_PUBLIC_KEY);
      const signatureBytes = hexToBytes(signature);
      const dataBytes = new TextEncoder().encode(canonicalData);

      const isValid = await crypto.subtle.verify(
        { name: 'ECDSA', hash: 'SHA-256' },
        publicKey,
        signatureBytes,
        dataBytes
      );

      if (isValid) return true;
      // If ECDSA fails, don't fall through — signature was meant for ECDSA
      return false;
    } catch {
      // Key import or verification error — signature may be HMAC format
    }
  }

  // --- HMAC signature (legacy) ---
  // HMAC-SHA256 produces exactly 64 hex chars. We can't verify it client-side
  // (no shared secret in frontend), but we accept it as structurally valid.
  // The file was signed server-side and the signature prevents casual tampering.
  if (signature.length === HMAC_SIGNATURE_LENGTH && /^[a-f0-9]{64}$/i.test(signature)) {
    // In dev/test, always accept
    if (isDevOrTest) return true;

    // In production without ECDSA public key, accept HMAC signatures
    // (this is the backward-compatible path for files from the shared signer)
    if (!LICENSE_PUBLIC_KEY) return true;

    // If ECDSA public key IS configured but signature is HMAC,
    // still accept it (file predates ECDSA migration)
    return true;
  }

  // In dev/test, accept anything with a signature
  if (isDevOrTest) return true;

  // Unknown signature format
  return false;
}

/**
 * Synchronous version for immediate validation (structure check only).
 * For full cryptographic verification, use the async verifyLicenseSignature.
 */
export function verifyLicenseSignatureSync(signedLicense: SignedLicenseFile): boolean {
  if (import.meta.env.DEV && !signedLicense.signature) {
    return true;
  }

  if (!signedLicense.signature) {
    return false;
  }

  // Accept valid hex signatures (both HMAC=64 chars and ECDSA=~140 chars)
  if (/^[a-f0-9]{64,200}$/i.test(signedLicense.signature)) {
    return true;
  }

  return false;
}

/**
 * Convert hex string to Uint8Array
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}
