/**
 * Static Files Copy Script
 * 
 * This script copies static files from the frontend build directory to the backend
 * for serving alongside the API. It supports both Windows and Unix-like environments.
 */
const fs = require('fs');
const path = require('path');

console.log('🔄 Preparing to copy static files from frontend to backend...');

// Possible source directories in order of preference
const possibleSources = [
  {
    path: path.join(__dirname, '..', 'ebooks-aura', 'out'),
    label: 'ebooks-aura/out directory'
  },
  {
    path: path.join(__dirname, '..', 'out'),
    label: 'out directory (parent)'
  },
  // Add more possible locations if needed
];

// Destination directory (where the backend will serve static files from)
const destDir = path.join(__dirname, 'out');

// Check if a directory is a valid static files directory
function isValidStaticDir(dir) {
  try {
    return fs.existsSync(dir) && 
           fs.statSync(dir).isDirectory() && 
           fs.existsSync(path.join(dir, 'index.html'));
  } catch (error) {
    console.error(`Error checking directory ${dir}:`, error.message);
    return false;
  }
}

// Recursively copy directory
function copyDir(src, dest) {
  let fileCount = 0;
  let dirCount = 0;

  // Create destination directory if it doesn't exist
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
    dirCount++;
  }

  // Read source directory
  const entries = fs.readdirSync(src, { withFileTypes: true });

  // Copy each entry
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      // Recursively copy subdirectory
      const counts = copyDir(srcPath, destPath);
      fileCount += counts.fileCount;
      dirCount += counts.dirCount;
    } else {
      // Copy file
      try {
        fs.copyFileSync(srcPath, destPath);
        fileCount++;
      } catch (error) {
        console.error(`Error copying file ${srcPath} to ${destPath}:`, error.message);
      }
    }
  }

  return { fileCount, dirCount };
}

// Find valid source directory
let validSource = null;
for (const source of possibleSources) {
  if (isValidStaticDir(source.path)) {
    validSource = source;
    console.log(`✅ Found static files in ${source.label} at: ${source.path}`);
    break;
  } else {
    console.log(`❌ No valid static files found in ${source.label}`);
  }
}

// Copy files if a valid source was found
if (validSource) {
  // Clean up destination directory if it exists
  if (fs.existsSync(destDir)) {
    try {
      console.log(`🗑️ Cleaning up existing destination directory: ${destDir}`);
      fs.rmSync(destDir, { recursive: true, force: true });
    } catch (error) {
      console.error(`Error cleaning destination directory: ${error.message}`);
      console.log('Continuing with copy operation...');
    }
  }

  console.log(`📂 Copying static files from ${validSource.path} to ${destDir}...`);
  const { fileCount, dirCount } = copyDir(validSource.path, destDir);
  console.log(`✅ Done! Copied ${fileCount} files and ${dirCount} directories to ${destDir}`);
  console.log('Your static files are now ready to be served by the backend!');
} else {
  console.error('\n❌ ERROR: No static files found to copy!');
  console.log('\n💡 Please build your frontend first using:');
  console.log('   - Navigate to your frontend directory: cd ../ebooks-aura');
  console.log('   - Run the build command: npm run build');
  console.log('   - Then try running this script again\n');
  
  // Exit with error code for CI/CD pipelines
  process.exit(1);
}

console.log('\n💡 TIP: You can add this script to your package.json for easier use:');
console.log('    "copy-static": "node copy-static-files.js"'); 