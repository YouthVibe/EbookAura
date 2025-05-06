console.log('Checking STATIC_BOOKS.js for critical IDs...');
const fs = require('fs');
const path = require('path');

// Critical IDs to check for
const criticalIds = [
  '681859bd560ce1fd792c2745', // Problematic ID
  '6807c9d24fb1873f72080fb1', 
  '6807be6cf05cdd8f4bdf933c',
  '6803d0c8cd7950184b1e8cf3'
];

// Paths to check
const paths = [
  path.join(__dirname, 'src/app/utils/STATIC_BOOKS.js'),
  path.join(__dirname, 'src/utils/STATIC_BOOKS.js'),
  path.join(__dirname, 'utils/STATIC_BOOKS.js')
];

// Find the file
let filePath = null;
for (const p of paths) {
  if (fs.existsSync(p)) {
    filePath = p;
    console.log(`Found STATIC_BOOKS.js at: ${p}`);
    break;
  }
}

if (!filePath) {
  console.error('Error: Could not find STATIC_BOOKS.js file');
  process.exit(1);
}

// Read the file
const content = fs.readFileSync(filePath, 'utf8');

// Check for critical IDs
let allFound = true;
criticalIds.forEach(id => {
  if (content.includes(id)) {
    console.log(`✓ Found critical ID: ${id}`);
  } else {
    console.error(`✗ Missing critical ID: ${id}`);
    allFound = false;
  }
});

if (allFound) {
  console.log('\n✅ All critical IDs found in STATIC_BOOKS.js - VERIFICATION SUCCESSFUL');
  process.exit(0);
} else {
  console.error('\n❌ Some critical IDs are missing from STATIC_BOOKS.js - VERIFICATION FAILED');
  process.exit(1);
} 