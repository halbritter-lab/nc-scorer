// scripts/optimize-images.js
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Paths
const sourceImagePath = path.join(__dirname, '../public/img/logo.png');
const outputPng96Path = path.join(__dirname, '../public/img/logo-96.png');
const outputWebpPath = path.join(__dirname, '../public/img/logo.webp');

// Output dimensions (2x for high DPI displays)
const targetWidth = 96;
const targetHeight = 96;

// Create directory if it doesn't exist
const outputDir = path.dirname(outputPng96Path);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Optimize PNG
async function optimizePng() {
  try {
    await sharp(sourceImagePath)
      .resize(targetWidth, targetHeight)
      .png({ quality: 80, compressionLevel: 9 })
      .toFile(outputPng96Path);
    
    console.log(`✅ Optimized PNG created: ${outputPng96Path}`);
    
    // Log size reduction
    const originalSize = fs.statSync(sourceImagePath).size;
    const optimizedSize = fs.statSync(outputPng96Path).size;
    const reduction = (((originalSize - optimizedSize) / originalSize) * 100).toFixed(2);
    
    console.log(`Original size: ${(originalSize / 1024).toFixed(2)} KB`);
    console.log(`Optimized size: ${(optimizedSize / 1024).toFixed(2)} KB`);
    console.log(`Size reduction: ${reduction}%`);
  } catch (error) {
    console.error('Error optimizing PNG:', error);
  }
}

// Create WebP version
async function createWebp() {
  try {
    await sharp(sourceImagePath)
      .resize(targetWidth, targetHeight)
      .webp({ quality: 85 })
      .toFile(outputWebpPath);
    
    console.log(`✅ WebP version created: ${outputWebpPath}`);
    
    // Log size reduction from original
    const originalSize = fs.statSync(sourceImagePath).size;
    const webpSize = fs.statSync(outputWebpPath).size;
    const reduction = (((originalSize - webpSize) / originalSize) * 100).toFixed(2);
    
    console.log(`Original size: ${(originalSize / 1024).toFixed(2)} KB`);
    console.log(`WebP size: ${(webpSize / 1024).toFixed(2)} KB`);
    console.log(`Size reduction: ${reduction}%`);
  } catch (error) {
    console.error('Error creating WebP:', error);
  }
}

// Run optimization
async function run() {
  console.log('🔧 Optimizing images...');
  await optimizePng();
  await createWebp();
  console.log('🎉 Image optimization completed!');
}

run();
