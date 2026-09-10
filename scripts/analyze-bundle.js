#!/usr/bin/env node
// scripts/analyze-bundle.js
// Script to build and analyze the production bundle

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Building and analyzing production bundle...');

try {
  // Run production build
  console.log('\n📦 Building production bundle...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // Path to the stats file
  const statsPath = path.join(__dirname, '../dist/stats.html');
  
  // Check if stats file exists
  if (fs.existsSync(statsPath)) {
    console.log(`\n✅ Build completed! Opening bundle analysis...`);
    
    // Display bundle size information
    const distPath = path.join(__dirname, '../dist');
    const assetFiles = fs.readdirSync(path.join(distPath, 'assets'));
    
    console.log('\n📊 Bundle Size Analysis:');
    console.log('-----------------------');
    
    // Analyze JS files
    const jsFiles = assetFiles.filter(file => file.endsWith('.js'));
    const cssFiles = assetFiles.filter(file => file.endsWith('.css'));
    
    // Sort by size (largest first)
    const getFileSize = (filename) => {
      return fs.statSync(path.join(distPath, 'assets', filename)).size;
    };
    
    jsFiles.sort((a, b) => getFileSize(b) - getFileSize(a));
    cssFiles.sort((a, b) => getFileSize(b) - getFileSize(a));
    
    console.log('\nJavaScript Chunks:');
    jsFiles.forEach(file => {
      const size = getFileSize(file);
      console.log(`- ${file}: ${(size / 1024).toFixed(2)} KB`);
    });
    
    console.log('\nCSS Files:');
    cssFiles.forEach(file => {
      const size = getFileSize(file);
      console.log(`- ${file}: ${(size / 1024).toFixed(2)} KB`);
    });
    
    // Calculate total size
    const totalSize = assetFiles.reduce((acc, file) => {
      return acc + fs.statSync(path.join(distPath, 'assets', file)).size;
    }, 0);
    
    console.log(`\nTotal bundle size: ${(totalSize / 1024).toFixed(2)} KB`);
    console.log(`\nFor detailed visualization, see: ${statsPath}`);
  } else {
    console.error(`\n❌ Stats file not found at: ${statsPath}`);
  }
} catch (error) {
  console.error('\n❌ Build failed:', error);
  process.exit(1);
}
