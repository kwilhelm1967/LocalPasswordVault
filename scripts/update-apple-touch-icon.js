const sharp = require('sharp');
const path = require('path');

const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="11" fill="none" stroke="#06b6d4" stroke-width="1.5"/>
  <rect x="7" y="11" width="10" height="8" rx="1.5" fill="none" stroke="#06b6d4" stroke-width="1.5"/>
  <path d="M9 11V8a3 3 0 0 1 6 0v3" fill="none" stroke="#06b6d4" stroke-width="1.5"/>
</svg>`;

const lpvDir = path.join(__dirname, '..', 'LPV');

async function updateAppleTouchIcon() {
  try {
    await sharp(Buffer.from(svgContent))
      .resize(180, 180)
      .png()
      .toFile(path.join(lpvDir, 'apple-touch-icon.png'));
    console.log('✅ Updated: apple-touch-icon.png');
  } catch (error) {
    console.error('Error updating apple-touch-icon:', error);
    process.exit(1);
  }
}

updateAppleTouchIcon();
