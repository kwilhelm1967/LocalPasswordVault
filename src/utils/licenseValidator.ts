/**
 * License File Validation — Asymmetric Signature Verification
 * 
 * Uses ECDSA P-256 asymmetric cryptography:
 * - Backend signs license files with a PRIVATE key (never leaves the server)
 * - Frontend verifies signatures with the PUBLIC key (safe to embed in client)
 * 
 * This prevents attackers from forging license files even if they have the
 * full client source code, because the private key is never in the bundle.
 * 
 * Key format: Raw hex-encoded ECDSA P-256 keys
 * Signature format: Hex-encoded ECDSA signature over canonical JSON
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
 * ECDSA P-256 public key for license signature verification.
 * 
 * This is the PUBLIC key only — safe to embed in the client.
 * The corresponding PRIVATE key is on the backend (LICENSE_SIGNING_PRIVATE_KEY).
 * 
 * To generate a new key pair, run on the backend:
 *   node -e "const { generateKeyPair } = require('./services/licenseSigner'); generateKeyPair();"
 * 
 * Then set:
 *   - Backend .env: LICENSE_SIGNING_PRIVATE_KEY=<private key hex>
 *   - Frontend .env: VITE_LICENSE_PUBLIC_KEY=<public key hex>
 */
const LICENSE_PUBLIC_KEY = import.meta.env.VITE_LICENSE_PUBLIC_KEY || '';

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
 * Verify a signed license file signature using ECDSA P-256
 * 
 * @param signedLicense - Signed license file from server
 * @returns Promise<boolean> - true if signature is valid
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

  // If no public key is configured
  if (!LICENSE_PUBLIC_KEY) {
    // In development/test, allow without verification
    if (isDevOrTest) {
      return true;
    }
    // In production without a public key, reject
    return false;
  }

  // Extract signature and signed_at from data (signed_at excluded from verification payload)
  const { signature, signed_at: _signedAt, ...licenseData } = signedLicense;
  
  // Create canonical JSON string (sorted keys) — must match backend
  const canonicalData = JSON.stringify(licenseData, Object.keys(licenseData).sort());

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

    return isValid;
  } catch {
    // Signature verification failed
    return false;
  }
}

/**
 * Synchronous version for immediate validation (structure check only)
 * 
 * Note: This only validates structure and signature presence.
 * For full cryptographic signature verification, use the async
 * verifyLicenseSignature function.
 */
export function verifyLicenseSignatureSync(signedLicense: SignedLicenseFile): boolean {
  // In development, accept unsigned files
  if (import.meta.env.DEV && !signedLicense.signature) {
    return true;
  }

  if (!signedLicense.signature) {
    return false;
  }

  // Validate signature looks like a valid hex string (ECDSA P-256 signatures are ~128 hex chars)
  if (!/^[a-f0-9]{80,200}$/i.test(signedLicense.signature)) {
    return false;
  }

  return true;
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
