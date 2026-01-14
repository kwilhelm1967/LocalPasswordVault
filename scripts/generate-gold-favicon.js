// Generate gold lock favicons for Legacy Vault
// Creates favicon.ico, favicon-16x16.png, favicon-32x32.png, apple-touch-icon.png
// Gold color: #c9a24e

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const toIco = require('to-ico');

// SVG content for the gold lock icon with circle
const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <!-- Circle background -->
  <circle cx="12" cy="12" r="11" fill="none" stroke="#c9a24e" stroke-width="1.5"/>
  <!-- Lock -->
  <rect x="7" y="11" width="10" height="8" rx="1.5" fill="none" stroke="#c9a24e" stroke-width="1.5"/>
  <path d="M9 11V8a3 3 0 0 1 6 0v3" fill="none" stroke="#c9a24e" stroke-width="1.5"/>
</svg>`;

const svgBuffer = Buffer.from(svgContent);
const rootDir = path.join(__dirname, '..');

async function generateGoldFavicons() {
  try {
    // Generate PNG buffers
    const png16 = await sharp(svgBuffer)
      .resize(16, 16)
      .png()
      .toBuffer();
    
    const png32 = await sharp(svgBuffer)
      .resize(32, 32)
      .png()
      .toBuffer();
    
    const png180 = await sharp(svgBuffer)
      .resize(180, 180)
      .png()
      .toBuffer();
    
    // Generate favicon.ico (multi-resolution ICO)
    const icoBuffer = await toIco([png16, png32]);
    
    // Write favicon files to root directory (for LLV-trial-FOR-HOST-ARMADA-UPLOAD-AS-trial.html)
    // These will be used by Legacy Vault HTML files
    fs.writeFileSync(path.join(rootDir, 'favicon-llv-16x16.png'), png16);
    console.log('✓ Generated favicon-llv-16x16.png');
    
    fs.writeFileSync(path.join(rootDir, 'favicon-llv-32x32.png'), png32);
    console.log('✓ Generated favicon-llv-32x32.png');
    
    fs.writeFileSync(path.join(rootDir, 'favicon-llv.ico'), icoBuffer);
    console.log('✓ Generated favicon-llv.ico');
    
    fs.writeFileSync(path.join(rootDir, 'apple-touch-icon-llv.png'), png180);
    console.log('✓ Generated apple-touch-icon-llv.png');
    
    console.log('\n✅ Gold lock favicons generated successfully!');
    console.log('Location: root directory');
    console.log('\nNote: These are for Legacy Vault files in this repo.');
    console.log('Password Vault files in LPV/ directory keep cyan lock favicons.');
    
  } catch (error) {
    console.error('Error generating gold favicons:', error);
    process.exit(1);
  }
}

generateGoldFavicons();