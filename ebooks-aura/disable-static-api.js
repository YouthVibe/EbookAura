/**
 * This script disables certain API routes in a static export build by adding
 * export directives to route.js files that don't have them.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const API_ROUTES_DIR = path.join(__dirname, 'src', 'app', 'api');
const MARKER_COMMENT = '// Static export configuration';
const DIRECTIVE = 'export const dynamic = "force-static";';

/**
 * Find all route.js files in API directories
 */
function findRouteFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findRouteFiles(filePath, fileList);
    } else if (file === 'route.js') {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

/**
 * Add static directive to route file if it doesn't have one
 */
function addStaticDirective(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if file already has dynamic or revalidate directive
  if (content.includes('export const dynamic =') || content.includes('export const revalidate =')) {
    console.log(`✓ ${filePath} already has export directive`);
    return;
  }
  
  // Insert directive after imports
  const importEndIndex = content.lastIndexOf('import');
  if (importEndIndex === -1) {
    content = `${MARKER_COMMENT}\n${DIRECTIVE}\n\n${content}`;
  } else {
    // Find the end of the imports section
    const lines = content.split('\n');
    let insertIndex = 0;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import')) {
        // Keep searching for the last import
        insertIndex = i + 1;
      } else if (insertIndex > 0 && !lines[i].trim()) {
        // Found empty line after imports, insert here
        insertIndex = i;
        break;
      }
    }
    
    lines.splice(insertIndex, 0, '', MARKER_COMMENT, DIRECTIVE);
    content = lines.join('\n');
  }
  
  fs.writeFileSync(filePath, content);
  console.log(`✓ Added static directive to ${filePath}`);
}

/**
 * Main function
 */
function main() {
  console.log('Finding API route files...');
  const routeFiles = findRouteFiles(API_ROUTES_DIR);
  
  console.log(`Found ${routeFiles.length} route files.`);
  
  if (routeFiles.length === 0) {
    console.log('No route files found in API directory.');
    return;
  }
  
  routeFiles.forEach(file => {
    addStaticDirective(file);
  });
  
  console.log('Done!');
}

// Run the script
main(); 