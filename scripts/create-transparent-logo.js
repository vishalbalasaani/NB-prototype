
const path = require('path');
const fs = require('fs');
const sharp = require(path.resolve(__dirname, '../node_modules/sharp'));

async function makeTransparentLogo() {
  const inputPath = 'C:/Users/visha/.gemini/antigravity-ide/brain/afa5fae4-3ce7-43cf-9d05-7ae3c75aa854/.user_uploaded/media_1790705292013.jpg';
  const outDir = path.resolve(__dirname, '../public/images');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  const outputPath = path.join(outDir, 'nodebricks-logo-white.png');

  const { data, info } = await sharp(inputPath)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const rgbaBuffer = Buffer.alloc(width * height * 4);

  for (let i = 0; i < width * height; i++) {
    const srcIdx = i * 3;
    const dstIdx = i * 4;

    const r = data[srcIdx];
    const g = data[srcIdx + 1];
    const b = data[srcIdx + 2];

    // Compute luminance from RGB
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    // Remove JPEG compression black artifacts (anything below 12 is transparent)
    // Scale smoothly from 12 to 220
    let alpha = 0;
    if (lum > 12) {
      alpha = Math.min(255, Math.round(((lum - 12) / (220 - 12)) * 255));
    }

    rgbaBuffer[dstIdx] = 255;     // Pure White R
    rgbaBuffer[dstIdx + 1] = 255; // Pure White G
    rgbaBuffer[dstIdx + 2] = 255; // Pure White B
    rgbaBuffer[dstIdx + 3] = alpha;
  }

  await sharp(rgbaBuffer, {
    raw: {
      width,
      height,
      channels: 4,
    }
  })
  .png({ compressionLevel: 9 })
  .toFile(outputPath);

  console.log(`[SUCCESS] Created transparent white logo: ${outputPath} (${width}x${height})`);

  // Also create a trimmed version (tight bounding box) in case needed for tight UI layouts
  let minX = width, maxX = 0, minY = height, maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const a = rgbaBuffer[(y * width + x) * 4 + 3];
      if (a > 10) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // Add 16px safe padding around the trimmed bounds
  const pad = 16;
  const cropX = Math.max(0, minX - pad);
  const cropY = Math.max(0, minY - pad);
  const cropW = Math.min(width - cropX, (maxX - minX + 1) + pad * 2);
  const cropH = Math.min(height - cropY, (maxY - minY + 1) + pad * 2);

  const tightOutputPath = path.join(outDir, 'nodebricks-logo-white-tight.png');

  await sharp(outputPath)
    .extract({ left: cropX, top: cropY, width: cropW, height: cropH })
    .png({ compressionLevel: 9 })
    .toFile(tightOutputPath);

  console.log(`[SUCCESS] Created tight transparent white logo: ${tightOutputPath} (${cropW}x${cropH})`);
}

makeTransparentLogo().catch(console.error);
