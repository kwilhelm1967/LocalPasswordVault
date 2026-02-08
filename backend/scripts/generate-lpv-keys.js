#!/usr/bin/env node
/**
 * Generate ECDSA P-256 Key Pair for LPV License Signing
 * 
 * Usage:
 *   node backend/scripts/generate-lpv-keys.js
 * 
 * Outputs the keys to add to your .env files.
 * Run this ONCE when setting up a new deployment.
 */

const crypto = require('crypto');

const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
  namedCurve: 'P-256',
  publicKeyEncoding: { type: 'spki', format: 'der' },
  privateKeyEncoding: { type: 'pkcs8', format: 'der' },
});

// Extract raw uncompressed public point (65 bytes) from SPKI DER
const rawPublicKey = publicKey.slice(publicKey.length - 65);
const publicKeyHex = rawPublicKey.toString('hex');
const privateKeyHex = privateKey.toString('hex');

// Verify the pair works
const testData = 'lpv-key-verification-test';
const signer = crypto.createSign('SHA256');
signer.update(testData);
const testSig = signer.sign(crypto.createPrivateKey({ key: privateKey, format: 'der', type: 'pkcs8' }));

// Rebuild public key from raw for verification
const spkiHeader = Buffer.from('3059301306072a8648ce3d020106082a8648ce3d030107034200', 'hex');
const pubKeyDer = Buffer.concat([spkiHeader, rawPublicKey]);
const pubCrypto = crypto.createPublicKey({ key: pubKeyDer, format: 'der', type: 'spki' });
const verifier = crypto.createVerify('SHA256');
verifier.update(testData);
const isValid = verifier.verify(pubCrypto, testSig);

if (!isValid) {
  console.error('❌ Key pair verification FAILED. Do not use these keys.');
  process.exit(1);
}

console.log('\n🔑 LPV ECDSA P-256 Key Pair Generated & Verified\n');
console.log('═'.repeat(70));

console.log('\n# ── Backend .env (PRIVATE KEY — NEVER commit or share) ──');
console.log(`LPV_SIGNING_PRIVATE_KEY=${privateKeyHex}`);

console.log('\n# ── Frontend .env (PUBLIC KEY — safe to bundle in client) ──');
console.log(`VITE_LICENSE_PUBLIC_KEY=${publicKeyHex}`);

console.log('\n' + '═'.repeat(70));
console.log('\n✅ Keys verified — signing and verification test passed.');
console.log('⚠️  Keep the PRIVATE key secret. Only the server should have it.');
console.log('📋 The PUBLIC key is safe to embed in the frontend build.\n');
