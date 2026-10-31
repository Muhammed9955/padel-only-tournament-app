const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function createFavicon() {
  const svgPath = path.join(__dirname, '..', 'app', 'icon.svg');
  const svgBuffer = fs.readFileSync(svgPath);

  // Generate PNG buffers for 16x16, 32x32, 48x48
  const png16 = await sharp(svgBuffer).resize(16, 16).png().toBuffer();
  const png32 = await sharp(svgBuffer).resize(32, 32).png().toBuffer();
  const png48 = await sharp(svgBuffer).resize(48, 48).png().toBuffer();
  const png192 = await sharp(svgBuffer).resize(192, 192).png().toBuffer();

  // Save 192x192 PNG for PWA / apple-touch-icon
  fs.writeFileSync(path.join(__dirname, '..', 'public', 'icon.png'), png192);

  // An ICO file containing PNG streams
  // ICO Header: 2 bytes reserved (0), 2 bytes type (1 = icon), 2 bytes image count (3)
  const images = [
    { width: 16, height: 16, buffer: png16 },
    { width: 32, height: 32, buffer: png32 },
    { width: 48, height: 48, buffer: png48 },
  ];

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Icon type
  header.writeUInt16LE(images.length, 4); // Number of images

  let offset = 6 + images.length * 16;
  const directoryEntries = [];

  for (const img of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0);
    entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1);
    entry.writeUInt8(0, 2); // Color count (0 = no palette)
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(img.buffer.length, 8); // Image size in bytes
    entry.writeUInt32LE(offset, 12); // Offset to image data
    directoryEntries.push(entry);
    offset += img.buffer.length;
  }

  const icoBuffer = Buffer.concat([
    header,
    ...directoryEntries,
    ...images.map(img => img.buffer),
  ]);

  fs.writeFileSync(path.join(__dirname, '..', 'app', 'favicon.ico'), icoBuffer);
  fs.writeFileSync(path.join(__dirname, '..', 'public', 'favicon.ico'), icoBuffer);

  console.log('Successfully generated custom PadelOnly favicon.ico and icon.png!');
}

createFavicon().catch(err => {
  console.error('Error generating favicon:', err);
  process.exit(1);
});
