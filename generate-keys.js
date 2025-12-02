/**
 * License Key Generator with Auto-Save
 * 
 * Usage:
 *   node generate-keys.js                    → Show 3 Personal + 2 Family keys
 *   node generate-keys.js 5                  → Show 5 Personal keys  
 *   node generate-keys.js 3 family           → Show 3 Family keys
 *   node generate-keys.js 1 personal --save  → Generate & SAVE 1 Personal key
 *   node generate-keys.js 2 family --save    → Generate & SAVE 2 Family keys
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const LICENSE_FILE = path.join(__dirname, 'src', 'utils', 'licenseKeys.ts');

function generateSegment() {
  let s = '';
  for (let i = 0; i < 4; i++) {
    s += CHARS[crypto.randomInt(CHARS.length)];
  }
  return s;
}

function generateKey(type = 'personal') {
  const prefix = type === 'family' ? 'FMLY' : 'PERS';
  return `${prefix}-${generateSegment()}-${generateSegment()}-${generateSegment()}`;
}

function addKeysToFile(keys, type) {
  let content = fs.readFileSync(LICENSE_FILE, 'utf8');
  
  const licenseType = type === 'family' ? 'family' : 'single';
  const marker = type === 'family' 
    ? '// NEW_FAMILY_KEYS_HERE' 
    : '// NEW_PERSONAL_KEYS_HERE';
  
  if (!content.includes(marker)) {
    console.log(`❌ Marker "${marker}" not found in file.`);
    return false;
  }
  
  // Build new entries
  const newEntries = keys.map(key => `  {
    key: "${key}",
    type: "${licenseType}",
    expires: getExpirationDate().formatted,
    expirationDate: getExpirationDate().date
  },`).join('\n');
  
  // Replace marker with marker + new entries
  content = content.replace(marker, marker + '\n' + newEntries);
  
  fs.writeFileSync(LICENSE_FILE, content, 'utf8');
  return true;
}

// Parse args
const args = process.argv.slice(2);
const saveMode = args.includes('--save');
const filteredArgs = args.filter(a => a !== '--save');

const count = parseInt(filteredArgs[0]) || 3;
const typeArg = filteredArgs[1]?.toLowerCase();
const type = (typeArg === 'family' || typeArg === 'f') ? 'family' : 'personal';

console.log('\n🔑 LICENSE KEY GENERATOR\n');
console.log('═'.repeat(45));

// Generate
const keys = [];
for (let i = 0; i < count; i++) {
  keys.push(generateKey(type));
}

// Display
const label = type === 'family' ? 'FAMILY (5 users - $79)' : 'PERSONAL (1 user - $49)';
console.log(`\n📦 ${label}:\n`);
keys.forEach(key => console.log(`   ${key}`));

if (saveMode) {
  console.log('\n' + '─'.repeat(45));
  if (addKeysToFile(keys, type)) {
    console.log('\n✅ SAVED! Keys ready to share:');
    keys.forEach(key => console.log(`   ${key}`));
    console.log('\n⚠️  Rebuild: npm run build');
  }
} else {
  console.log('\n' + '─'.repeat(45));
  console.log(`\n💡 Add --save to auto-save:`);
  console.log(`   node generate-keys.js ${count} ${type} --save\n`);
}
