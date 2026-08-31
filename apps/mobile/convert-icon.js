const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, 'assets/images/saveit-icon.svg');
const outputDir = path.join(__dirname, 'assets/images');

async function convertSvgToPng() {
  const svgBuffer = fs.readFileSync(svgPath);

  const conversions = [
    { name: 'icon.png', size: 1024 },
    { name: 'maskable_logo.png', size: 1024 },
    { name: 'splash-icon.png', size: 1024 },
    { name: 'favicon.png', size: 48 },
    { name: 'adaptive-icon.png', size: 1024 }
  ];

  console.log('Converting SVG to PNG...\n');

  for (const conversion of conversions) {
    const outputPath = path.join(outputDir, conversion.name);

    try {
      await sharp(svgBuffer)
        .resize(conversion.size, conversion.size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(outputPath);

      const stats = fs.statSync(outputPath);
      console.log(`✓ Created ${conversion.name} (${conversion.size}x${conversion.size}) - ${(stats.size / 1024).toFixed(1)}KB`);
    } catch (error) {
      console.error(`✗ Failed to create ${conversion.name}:`, error.message);
    }
  }

  console.log('\n✨ Icon conversion complete!');
}

convertSvgToPng().catch(console.error);
