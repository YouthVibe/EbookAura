/**
 * Verification script to ensure all critical book IDs are included
 * in the Next.js static generation parameters
 */

const fs = require('fs');
const path = require('path');

// Critical IDs that must be included
const CRITICAL_IDS = [
  '681859bd560ce1fd792c2745', // The problematic ID that was causing errors
  '6807c9d24fb1873f72080fb1', // Another critical ID
  '6807be6cf05cdd8f4bdf933c',
  '6803d0c8cd7950184b1e8cf3'
];

// Files to check
const FILES_TO_CHECK = [
  // STATIC_BOOKS.js file
  {
    path: path.join(__dirname, '../src/app/utils/STATIC_BOOKS.js'),
    altPaths: [
      path.join(__dirname, '../src/utils/STATIC_BOOKS.js'),
      path.join(__dirname, '../utils/STATIC_BOOKS.js')
    ],
    description: 'STATIC_BOOKS.js'
  },
  // Book page component
  {
    path: path.join(__dirname, '../src/app/books/[id]/page.js'),
    altPaths: [],
    description: 'Book page component'
  },
  // Generated .next directory (if it exists)
  {
    path: path.join(__dirname, '../.next/server/app/books'),
    altPaths: [],
    description: 'Build output directory',
    isDirectory: true
  }
];

// Console colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

// Helper function to find a file that exists
function findExistingFile(file) {
  if (fs.existsSync(file.path)) {
    return file.path;
  }
  
  for (const altPath of file.altPaths) {
    if (fs.existsSync(altPath)) {
      return altPath;
    }
  }
  
  return null;
}

// Main verification function
async function verifyBookParams() {
  console.log(`${colors.blue}Verifying critical book IDs are included in static generation...${colors.reset}\n`);
  
  let allValid = true;
  let totalFound = 0;
  
  for (const file of FILES_TO_CHECK) {
    const filePath = findExistingFile(file);
    
    if (!filePath) {
      console.log(`${colors.yellow}⚠️ File not found: ${file.description}${colors.reset}`);
      console.log(`   Skipping verification for this file\n`);
      continue;
    }
    
    console.log(`${colors.blue}Checking ${file.description}:${colors.reset}`);
    
    // For directories, just check they exist
    if (file.isDirectory) {
      console.log(`${colors.green}✓ Build output directory exists${colors.reset}\n`);
      continue;
    }
    
    // Read file content
    let content;
    try {
      content = fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      console.log(`${colors.red}✗ Error reading file: ${error.message}${colors.reset}\n`);
      allValid = false;
      continue;
    }
    
    // Check each critical ID
    for (const id of CRITICAL_IDS) {
      if (content.includes(id)) {
        console.log(`${colors.green}✓ Found critical ID: ${id}${colors.reset}`);
        totalFound++;
      } else {
        console.log(`${colors.red}✗ Missing critical ID: ${id}${colors.reset}`);
        allValid = false;
      }
    }
    
    // Additional checks for book page component
    if (file.description === 'Book page component') {
      if (content.includes('generateStaticParams')) {
        console.log(`${colors.green}✓ Found generateStaticParams function${colors.reset}`);
      } else {
        console.log(`${colors.red}✗ Missing generateStaticParams function${colors.reset}`);
        allValid = false;
      }
    }
    
    console.log('');
  }
  
  // Final results
  console.log(`${colors.blue}Verification Summary:${colors.reset}`);
  console.log(`Total critical IDs checked: ${CRITICAL_IDS.length}`);
  console.log(`Total IDs found: ${totalFound}`);
  
  if (allValid) {
    console.log(`\n${colors.green}✅ All critical book IDs are properly included in static generation!${colors.reset}`);
    return 0;
  } else {
    console.log(`\n${colors.red}❌ Some critical book IDs are missing from static generation!${colors.reset}`);
    console.log(`Please run 'generate-static-books.bat' to update STATIC_BOOKS.js with all required IDs.`);
    return 1;
  }
}

// Run the verification
verifyBookParams()
  .then(exitCode => {
    process.exit(exitCode);
  })
  .catch(error => {
    console.error(`${colors.red}Error during verification:${colors.reset}`, error);
    process.exit(1);
  }); 