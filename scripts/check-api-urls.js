/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
/**
 * Utility script to check API URL configuration across key files
 * This helps to ensure consistent API URL usage across the application
 * 
 * Run with: node check-api-urls.js
 */

const fs = require('fs');
const path = require('path');

// Production API URL
const PRODUCTION_API_URL = 'https://ebookaura.onrender.com/api';

// Files to check
const files = [
  '.env',
  'src/app/api/apiUtils.js',
  'src/app/utils/config.js',
  'next.config.mjs'
];

console.log('EbookAura API URL Configuration Check');
console.log('====================================');
console.log(`Production API URL: ${PRODUCTION_API_URL}`);
console.log('');

// Read and check each file
files.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  try {
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      console.log(`File: ${filePath}`);
      
      // Check for production URL
      if (content.includes(PRODUCTION_API_URL)) {
        console.log('✅ Production API URL found');
        
        // Check if it's commented out
        const lines = content.split('\n');
        const productionLines = lines.filter(line => 
          line.includes(PRODUCTION_API_URL) && !line.trim().startsWith('//') && !line.trim().startsWith('#'));
        
        if (productionLines.length > 0) {
          console.log('✅ Production API URL is active (not commented out)');
        } else {
          console.log('❌ Production API URL is commented out');
        }
      } else {
        console.log('❌ Production API URL not found');
      }
      
      // Check for localhost URL
      if (content.includes('localhost:5000')) {
        console.log('⚠️ Development URL (localhost) found');
        
        // Check if localhost is active
        const lines = content.split('\n');
        const localLines = lines.filter(line => 
          line.includes('localhost:5000') && !line.trim().startsWith('//') && !line.trim().startsWith('#'));
        
        if (localLines.length > 0) {
          console.log('❌ Development URL is active (not commented out)');
        } else {
          console.log('✅ Development URL is properly commented out');
        }
      } else {
        console.log('✅ No development URL (localhost) found');
      }
      
      console.log('');
    } else {
      console.log(`File not found: ${filePath}`);
      console.log('');
    }
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    console.log('');
  }
});

console.log('Configuration Summary');
console.log('====================');
console.log('1. If all checks are passing (✅), your application is configured to use the production API URL.');
console.log('2. If any warnings (⚠️) or errors (❌) are shown, you may need to update those files.');
console.log('3. Run build-production.bat to automatically fix configuration issues.');
console.log(''); 