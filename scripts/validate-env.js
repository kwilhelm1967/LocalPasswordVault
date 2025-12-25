#!/usr/bin/env node

/**
 * Environment Variable Validation Script
 * 
 * Standalone script to validate environment variables before deployment.
 * Can be run independently: node scripts/validate-env.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });

const { validateEnvironment } = require('../backend/utils/envValidator');

console.log('\n🔍 Validating Environment Variables...\n');

const { errors, warnings } = validateEnvironment();

if (errors.length > 0) {
  console.error('❌ Validation Failed:\n');
  errors.forEach((error) => {
    console.error(`   ✗ ${error}`);
  });
  console.error('\n');
  process.exit(1);
}

if (warnings.length > 0) {
  console.warn('⚠️  Warnings:\n');
  warnings.forEach((warning) => {
    console.warn(`   ⚠ ${warning}`);
  });
  console.warn('');
}

if (errors.length === 0) {
  console.log('✅ All environment variables are valid!\n');
  process.exit(0);
}

