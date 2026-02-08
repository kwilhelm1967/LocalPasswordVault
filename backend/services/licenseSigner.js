const crypto = require('crypto');

/**
 * License File Signing Service
 * 
 * Creates cryptographically signed license files that can be validated
 * offline by the desktop app without contacting the server.
 * 
 * Security:
 * - Uses HMAC-SHA256 for signing
 * - Prevents tampering with license data
 * - Secret key stored only on server
 */

const SIGNING_SECRET = process.env.LICENSE_SIGNING_SECRET;

if (!SIGNING_SECRET) {
  console.warn('⚠️  LICENSE_SIGNING_SECRET not set. License files will not be signed.');
}

/**
 * Sign a license file
 * @param {Object} licenseData - License data to sign
 * @returns {Object} - Signed license file with signature
 */
function signLicenseFile(licenseData) {
  if (!SIGNING_SECRET) {
    // Return unsigned file if secret not configured (for development)
    return {
      ...licenseData,
      signature: null,
      signed_at: new Date().toISOString(),
    };
  }

  // Create canonical JSON string (sorted keys for consistency)
  const canonicalData = JSON.stringify(licenseData, Object.keys(licenseData).sort());
  
  // Generate HMAC signature
  const signature = crypto
    .createHmac('sha256', SIGNING_SECRET)
    .update(canonicalData)
    .digest('hex');

  return {
    ...licenseData,
    signature,
    signed_at: new Date().toISOString(),
  };
}

/**
 * Verify a signed license file
 * @param {Object} signedLicense - Signed license file from client
 * @returns {boolean} - True if signature is valid
 */
function verifyLicenseFile(signedLicense) {
  if (!SIGNING_SECRET) {
    // In development, accept unsigned files
    return true;
  }

  if (!signedLicense.signature) {
    return false;
  }

  // Extract data without signature
  const { signature, signed_at, ...licenseData } = signedLicense;
  
  // Recreate canonical JSON
  const canonicalData = JSON.stringify(licenseData, Object.keys(licenseData).sort());
  
  // Generate expected signature
  const expectedSignature = crypto
    .createHmac('sha256', SIGNING_SECRET)
    .update(canonicalData)
    .digest('hex');

  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

module.exports = {
  signLicenseFile,
  verifyLicenseFile,
};

