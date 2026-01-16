/**
 * Script to create a valid LLVT trial key in the database
 * Run with: node create-trial-key.js
 */

const crypto = require('crypto');

const CHAR_SET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generateSegment(length = 4) {
  let segment = '';
  const randomBytes = crypto.randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    const index = randomBytes[i] % CHAR_SET.length;
    segment += CHAR_SET[index];
  }
  
  return segment;
}

function generateLLVTrialKey() {
  const prefix = 'LLVT';
  return `${prefix}-${generateSegment()}-${generateSegment()}-${generateSegment()}`;
}

// Generate a trial key
const trialKey = generateLLVTrialKey();
const expiresAt = new Date();
expiresAt.setDate(expiresAt.getDate() + 14); // 14 days for LLV

console.log('\n=== GENERATED TRIAL KEY ===');
console.log('Key:', trialKey);
console.log('Format: LLVT-XXXX-XXXX-XXXX');
console.log('Expires:', expiresAt.toISOString());
console.log('Product Type: llv (Local Legacy Vault)');
console.log('\n=== SQL TO INSERT INTO DATABASE ===');
console.log(`
INSERT INTO trials (trial_key, email, expires_at, product_type, is_active, created_at)
VALUES (
  '${trialKey.replace(/-/g, '').toUpperCase()}',
  'test@example.com',
  '${expiresAt.toISOString()}',
  'llv',
  true,
  NOW()
);
`);
console.log('\n=== OR USE TRIAL SIGNUP API ===');
console.log(`POST /api/trial/signup`);
console.log(`Body: { "email": "your-email@example.com", "product_type": "llv" }`);
console.log('\n');

