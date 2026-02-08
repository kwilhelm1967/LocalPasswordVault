const crypto = require('crypto');

/**
 * License File Signing Service — ECDSA P-256 Asymmetric Cryptography
 * 
 * Creates cryptographically signed license files that can be validated
 * offline by the desktop app using only the PUBLIC key.
 * 
 * Security:
 * - Uses ECDSA P-256 (asymmetric) for signing
 * - Private key stays on the server only (LICENSE_SIGNING_PRIVATE_KEY)
 * - Public key is embedded in the frontend (VITE_LICENSE_PUBLIC_KEY)
 * - Attackers cannot forge signatures even with full client source code
 * 
 * Key Generation:
 *   node -e "require('./services/licenseSigner').generateKeyPair()"
 * 
 * Backward Compatibility:
 *   If LICENSE_SIGNING_PRIVATE_KEY is not set but LICENSE_SIGNING_SECRET is,
 *   falls back to HMAC-SHA256 (legacy mode). This allows gradual migration.
 */

const PRIVATE_KEY_HEX = process.env.LICENSE_SIGNING_PRIVATE_KEY;
const LEGACY_SECRET = process.env.LICENSE_SIGNING_SECRET;

if (!PRIVATE_KEY_HEX && !LEGACY_SECRET) {
  console.warn('⚠️  Neither LICENSE_SIGNING_PRIVATE_KEY nor LICENSE_SIGNING_SECRET is set. License files will not be signed.');
}

if (PRIVATE_KEY_HEX) {
  console.log('✅ License signing: Using ECDSA P-256 asymmetric signatures');
} else if (LEGACY_SECRET) {
  console.warn('⚠️  License signing: Using legacy HMAC-SHA256 (set LICENSE_SIGNING_PRIVATE_KEY to upgrade to ECDSA)');
}

/**
 * Generate a new ECDSA P-256 key pair.
 * Prints both keys in hex format for .env configuration.
 * 
 * Usage:
 *   node -e "require('./services/licenseSigner').generateKeyPair()"
 */
function generateKeyPair() {
  const { generateKeyPairSync } = crypto;
  
  const { publicKey, privateKey } = generateKeyPairSync('ec', {
    namedCurve: 'P-256',
    publicKeyEncoding: {
      type: 'spki',
      format: 'der',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'der',
    },
  });

  // Extract raw public key (last 65 bytes of the SPKI DER encoding for P-256 uncompressed)
  // SPKI header for P-256 is 26 bytes, followed by 65 bytes of uncompressed point
  const rawPublicKey = publicKey.slice(publicKey.length - 65);
  
  const publicKeyHex = rawPublicKey.toString('hex');
  const privateKeyHex = privateKey.toString('hex');

  console.log('\n🔑 ECDSA P-256 Key Pair Generated\n');
  console.log('═'.repeat(60));
  console.log('\n📋 Add these to your environment:\n');
  console.log('# Backend .env (PRIVATE KEY — NEVER share or commit):');
  console.log(`LICENSE_SIGNING_PRIVATE_KEY=${privateKeyHex}`);
  console.log('');
  console.log('# Frontend .env (PUBLIC KEY — safe to embed in client):');
  console.log(`VITE_LICENSE_PUBLIC_KEY=${publicKeyHex}`);
  console.log('\n' + '═'.repeat(60));
  console.log('\n⚠️  The private key must ONLY exist on the backend server.');
  console.log('    The public key can safely be bundled in the frontend.\n');

  return { publicKeyHex, privateKeyHex };
}

/**
 * Sign a license file using ECDSA P-256 (or HMAC-SHA256 legacy fallback)
 * @param {Object} licenseData - License data to sign
 * @returns {Object} - Signed license file with signature
 */
function signLicenseFile(licenseData) {
  // ECDSA P-256 signing (preferred)
  if (PRIVATE_KEY_HEX) {
    return signWithECDSA(licenseData);
  }
  
  // Legacy HMAC-SHA256 fallback
  if (LEGACY_SECRET) {
    return signWithHMAC(licenseData);
  }

  // No signing key configured — return unsigned (development only)
  return {
    ...licenseData,
    signature: null,
    signed_at: new Date().toISOString(),
  };
}

/**
 * Sign using ECDSA P-256 private key
 */
function signWithECDSA(licenseData) {
  // Create canonical JSON string (sorted keys for consistency)
  const canonicalData = JSON.stringify(licenseData, Object.keys(licenseData).sort());
  
  // Reconstruct the private key from hex
  const privateKeyDer = Buffer.from(PRIVATE_KEY_HEX, 'hex');
  
  const privateKey = crypto.createPrivateKey({
    key: privateKeyDer,
    format: 'der',
    type: 'pkcs8',
  });

  // Sign with ECDSA P-256 + SHA-256
  const signer = crypto.createSign('SHA256');
  signer.update(canonicalData);
  signer.end();
  
  // Get signature in DER format, then convert to hex
  const signatureDer = signer.sign(privateKey);
  const signature = signatureDer.toString('hex');

  return {
    ...licenseData,
    signature,
    signed_at: new Date().toISOString(),
  };
}

/**
 * Sign using legacy HMAC-SHA256 (backward compatibility)
 */
function signWithHMAC(licenseData) {
  const canonicalData = JSON.stringify(licenseData, Object.keys(licenseData).sort());
  
  const signature = crypto
    .createHmac('sha256', LEGACY_SECRET)
    .update(canonicalData)
    .digest('hex');

  return {
    ...licenseData,
    signature,
    signed_at: new Date().toISOString(),
  };
}

/**
 * Verify a signed license file (server-side, for admin/debug purposes)
 * @param {Object} signedLicense - Signed license file from client
 * @returns {boolean} - True if signature is valid
 */
function verifyLicenseFile(signedLicense) {
  if (!signedLicense.signature) {
    // In development, accept unsigned files
    if (!PRIVATE_KEY_HEX && !LEGACY_SECRET) {
      return true;
    }
    return false;
  }

  const { signature, signed_at, ...licenseData } = signedLicense;
  const canonicalData = JSON.stringify(licenseData, Object.keys(licenseData).sort());

  // Try ECDSA verification first
  if (PRIVATE_KEY_HEX) {
    try {
      const privateKeyDer = Buffer.from(PRIVATE_KEY_HEX, 'hex');
      
      // Extract public key from private key for verification
      const privateKey = crypto.createPrivateKey({
        key: privateKeyDer,
        format: 'der',
        type: 'pkcs8',
      });

      const verifier = crypto.createVerify('SHA256');
      verifier.update(canonicalData);
      verifier.end();

      const signatureBuffer = Buffer.from(signature, 'hex');
      return verifier.verify(privateKey, signatureBuffer);
    } catch {
      return false;
    }
  }

  // Try HMAC verification (legacy)
  if (LEGACY_SECRET) {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', LEGACY_SECRET)
        .update(canonicalData)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch {
      return false;
    }
  }

  return false;
}

module.exports = {
  signLicenseFile,
  verifyLicenseFile,
  generateKeyPair,
};
