// Generate favicon files from the lock icon (rounded rectangle)
// Creates favicon.ico, favicon-16x16.png, favicon-32x32.png

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// SVG content for the cyan lock icon with circle
const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <!-- Circle background -->
  <circle cx="12" cy="12" r="11" fill="none" stroke="#06b6d4" stroke-width="1.5"/>
  <!-- Lock -->
  <rect x="7" y="11" width="10" height="8" rx="1.5" fill="none" stroke="#06b6d4" stroke-width="1.5"/>
  <path d="M9 11V8a3 3 0 0 1 6 0v3" fill="none" stroke="#06b6d4" stroke-width="1.5"/>
</svg>`;

const svgBuffer = Buffer.from(svgContent);
const lpvDir = path.join(__dirname, '..', 'LPV');

async function generateFavicons() {
  try {
    // Generate 16x16 PNG
    const favicon16 = path.join(lpvDir, 'favicon-16x16.png');
    await sharp(svgBuffer)
      .resize(16, 16)
      .png()
      .toFile(favicon16);
    console.log(`✅ Created: favicon-16x16.png`);

    // Generate 32x32 PNG
    const favicon32 = path.join(lpvDir, 'favicon-32x32.png');
    await sharp(svgBuffer)
      .resize(32, 32)
      .png()
      .toFile(favicon32);
    console.log(`✅ Created: favicon-32x32.png`);

    // Generate favicon.ico (multi-size ICO file)
    // Create 16x16 and 32x32 versions and combine into ICO
    const favicon16Buffer = await sharp(svgBuffer).resize(16, 16).png().toBuffer();
    const favicon32Buffer = await sharp(svgBuffer).resize(32, 32).png().toBuffer();
    
    // For ICO, we'll use the 32x32 PNG and rename it (or use a library)
    // Since sharp doesn't directly create ICO, we'll create a 32x32 ICO-compatible file
    // Most browsers accept PNG as favicon.ico, but let's also try to create a proper one
    const faviconIco = path.join(lpvDir, 'favicon.ico');
    
    // Copy 32x32 PNG as favicon.ico (modern browsers handle this)
    // For proper ICO, you'd need ico-convert library, but PNG works for most cases
    fs.copyFileSync(favicon32, faviconIco);
    console.log(`✅ Created: favicon.ico (using 32x32 PNG)`);

    // Also update the root favicon if it exists
    const rootFavicon = path.join(__dirname, '..', 'favicon.ico');
    if (fs.existsSync(path.dirname(rootFavicon))) {
      fs.copyFileSync(favicon32, rootFavicon);
      console.log(`✅ Updated: root favicon.ico`);
    }

    console.log('\n✅ All favicon files generated successfully!');
    console.log('Location: LPV/ directory');
    
  } catch (error) {
    console.error('Error generating favicons:', error);
    process.exit(1);
  }
}

generateFavicons();
