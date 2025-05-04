/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
/**
 * Script to verify static generation parameters
 * This tool checks that all required book IDs are included in the static export
 * 
 * Run with:
 * node scripts/verify-static-params.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const STATIC_BOOKS_PATH = path.join(__dirname, '../src/app/utils/STATIC_BOOKS.js');
const CRITICAL_IDS = [
  '6807be6cf05cdd8f4bdf933c',
  '6803d0c8cd7950184b1e8cf3',
  '6807c9d24fb1873f72080fb1', // The problematic ID
];

// Function to extract book IDs from the STATIC_BOOKS.js file
function extractStaticBookIds() {
  try {
    // Read the STATIC_BOOKS.js file
    const fileContent = fs.readFileSync(STATIC_BOOKS_PATH, 'utf8');
    
    // Extract all IDs using regex
    const matches = fileContent.match(/'([^']+)'/g) || [];
    const ids = matches.map(match => match.replace(/'/g, ''));
    
    return ids;
  } catch (error) {
    console.error(`Error reading STATIC_BOOKS.js: ${error.message}`);
    return [];
  }
}

// Main function to verify static parameters
function verifyStaticParams() {
  console.log('Verifying static book parameters...');
  
  // Read the static book IDs
  const staticBookIds = extractStaticBookIds();
  console.log(`Found ${staticBookIds.length} book IDs in STATIC_BOOKS.js`);
  
  // Check if all critical IDs are included
  const missingIds = [];
  CRITICAL_IDS.forEach(id => {
    if (!staticBookIds.includes(id)) {
      missingIds.push(id);
    }
  });
  
  if (missingIds.length > 0) {
    console.error('❌ MISSING CRITICAL BOOK IDs:');
    missingIds.forEach(id => {
      console.error(`   - ${id}`);
    });
    console.error('\nThis will cause static generation errors!');
    console.error('Please add these IDs to src/app/utils/STATIC_BOOKS.js');
    process.exit(1);
  } else {
    console.log('✅ All critical book IDs are included in STATIC_BOOKS.js');
    
    // List the first few IDs for verification
    console.log('\nSample of included book IDs:');
    staticBookIds.slice(0, 5).forEach(id => {
      console.log(`   - ${id}`);
    });
    
    if (staticBookIds.length > 5) {
      console.log(`   ... and ${staticBookIds.length - 5} more`);
    }
  }
}

// Run the verification
verifyStaticParams(); 