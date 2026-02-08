const crypto = require('crypto');

/**
 * LPV License File Signing Service — ECDSA P-256 Asymmetric Cryptography
 * 
 * LPV-SPECIFIC: This file is used ONLY by Local Password Vault routes.
 * It does NOT affect Local Legacy Vault (which uses the shared licenseSigner.js).
 * 
 * Creates cryptographically signed license/trial files that can be validated
 * offline by the LPV desktop app using only the PUBLIC key.
 * 
 * Security:
 * - Uses ECDSA P-256 (asymmetric) for signing
 * - Private key stays on the server only (LPV_SIGNING_PRIVATE_KEY)
 * - Public key is embedded in the LPV frontend (VITE_LICENSE_PUBLIC_KEY)
 * - Attackers cannot forge signatures even with full client source code
 * 
 * Backward Compatibility:
 *   If LPV_SIGNING_PRIVATE_KEY is not set, falls back to the shared
 *   LICENSE_SIGNING_SECRET (HMAC) so existing deployments keep working.
 * 
 * Key Generation:
 *   node -e "require('./services/lpvLicenseSigner').generateKeyPair()"
 */

const LPV_PRIVATE_KEY_HEX = process.env.LPV_SIGNING_PRIVATE_KEY;
const FALLBACK_SECRET = process.env.LICENSE_SIGNING_SECRET;

if (LPV_PRIVATE_KEY_HEX) {
  console.log('[LPV Signer] ✅ Using ECDSA P-256 asymmetric signatures');
} else if (FALLBACK_SECRET) {
  console.log('[LPV Signer] ⚠️  LPV_SIGNING_PRIVATE_KEY not set — falling back to shared HMAC (LICENSE_SIGNING_SECRET)');
} else {
  console.warn('[LPV Signer] ⚠️  No signing key configured. LPV license files will not be signed.');
}

/**
 * Generate a new ECDSA P-256 key pair for LPV.
 * Prints both keys in hex format for .env configuration.
 * 
 * Usage:
 *   node -e "require('./services/lpvLicenseSigner').generateKeyPair()"
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

  // Extract raw public key (last 65 bytes of SPKI DER for P-256 uncompressed point)
  const rawPublicKey = publicKey.slice(publicKey.length - 65);
  
  const publicKeyHex = rawPublicKey.toString('hex');
  const privateKeyHex = privateKey.toString('hex');

  console.log('\n🔑 LPV ECDSA P-256 Key Pair Generated\n');
  console.log('═'.repeat(60));
  console.log('\n📋 Add these to your backend .env:\n');
  console.log('# LPV Backend (PRIVATE KEY — NEVER share or commit):');
  console.log(`LPV_SIGNING_PRIVATE_KEY=${privateKeyHex}`);
  console.log('');
  console.log('# LPV Frontend .env (PUBLIC KEY — safe to embed in client):');
  console.log(`VITE_LICENSE_PUBLIC_KEY=${publicKeyHex}`);
  console.log('\n' + '═'.repeat(60));
  console.log('\n⚠️  The private key must ONLY exist on the backend server.');
  console.log('    The public key can safely be bundled in the LPV frontend.\n');

  return { publicKeyHex, privateKeyHex };
}

/**
 * Sign a license/trial file for LPV
 * Uses ECDSA P-256 if configured, otherwise falls back to shared HMAC.
 * 
 * @param {Object} licenseData - License or trial data to sign
 * @returns {Object} - Signed file with signature and signed_at
 */
function signLpvLicenseFile(licenseData) {
  if (LPV_PRIVATE_KEY_HEX) {
    return signWithECDSA(licenseData);
  }

  if (FALLBACK_SECRET) {
    return signWithHMAC(licenseData);
  }

  // No signing key — return unsigned (development only)
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
  const canonicalData = JSON.stringify(licenseData, Object.keys(licenseData).sort());
  
  const privateKeyDer = Buffer.from(LPV_PRIVATE_KEY_HEX, 'hex');
  const privateKey = crypto.createPrivateKey({
    key: privateKeyDer,
    format: 'der',
    type: 'pkcs8',
  });

  const signer = crypto.createSign('SHA256');
  signer.update(canonicalData);
  signer.end();
  
  const signatureDer = signer.sign(privateKey);
  const signature = signatureDer.toString('hex');

  return {
    ...licenseData,
    signature,
    signed_at: new Date().toISOString(),
  };
}

/**
 * Sign using shared HMAC-SHA256 (fallback when LPV key not configured)
 */
function signWithHMAC(licenseData) {
  const canonicalData = JSON.stringify(licenseData, Object.keys(licenseData).sort());
  
  const signature = crypto
    .createHmac('sha256', FALLBACK_SECRET)
    .update(canonicalData)
    .digest('hex');

  return {
    ...licenseData,
    signature,
    signed_at: new Date().toISOString(),
  };
}

module.exports = {
  signLpvLicenseFile,
  generateKeyPair,
};
