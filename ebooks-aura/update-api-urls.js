/**
 * API URL Consistency Update Script
 * This script ensures all API URLs in the codebase are consistent
 * It will update all API URLs to use the NEXT_PUBLIC_API_URL environment variable
 * or fall back to the production URL
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  // Production API URL (always used as fallback)
  PRODUCTION_API_URL: 'https://ebookaura.onrender.com/api',
  
  // Files to update
  FILES: [
    'src/app/api/apiUtils.js',
    'src/app/utils/config.js'
  ],
  
  // Output file for verification
  VERIFICATION_FILE: 'api-url-verification.log'
};

// Start the update process
console.log('=== API URL Consistency Update ===');
console.log(`Production API URL: ${CONFIG.PRODUCTION_API_URL}`);

// Create a verification log
let verificationLog = '';
const logLine = (message) => {
  console.log(message);
  verificationLog += message + '\n';
};

// Process each file
CONFIG.FILES.forEach(filePath => {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    logLine(`\nProcessing: ${filePath}`);
    
    // Read the file
    const originalContent = fs.readFileSync(fullPath, 'utf8');
    
    // Create updated content
    let updatedContent = originalContent;
    
    // Check if file is apiUtils.js
    if (filePath.includes('apiUtils.js')) {
      logLine('Detected apiUtils.js file');
      
      // Update API base URL
      updatedContent = updatedContent.replace(
        /^const API_BASE_URL = ['"].*['"]/m,
        `const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '${CONFIG.PRODUCTION_API_URL}'`
      );
      
      // Ensure proper comment marks
      updatedContent = updatedContent.replace(
        /\/\/ Production URL[\s\S]*?\/\/ const API_BASE_URL/m,
        `// API base URL with environment fallback to production\n// const API_BASE_URL`
      );
      
      logLine('Updated apiUtils.js with environment variable API URL');
    }
    
    // Check if file is config.js
    if (filePath.includes('config.js')) {
      logLine('Detected config.js file');
      
      // Update API base URL
      updatedContent = updatedContent.replace(
        /^export const API_BASE_URL = ['"].*['"]/m,
        `export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '${CONFIG.PRODUCTION_API_URL}'`
      );
      
      // Ensure proper comment marks
      updatedContent = updatedContent.replace(
        /\/\/ Production URL[\s\S]*?\/\/ export const API_BASE_URL/m,
        `// API base URL with environment fallback to production\n// export const API_BASE_URL`
      );
      
      logLine('Updated config.js with environment variable API URL');
    }
    
    // Write the updated content if changes were made
    if (updatedContent !== originalContent) {
      fs.writeFileSync(fullPath, updatedContent);
      logLine(`Updated: ${filePath}`);
        } else {
      logLine(`No changes needed for: ${filePath}`);
    }
  } catch (error) {
    logLine(`ERROR processing ${filePath}: ${error.message}`);
  }
});

// Save verification log
fs.writeFileSync(CONFIG.VERIFICATION_FILE, verificationLog);
logLine(`\nVerification log saved to: ${CONFIG.VERIFICATION_FILE}`);
logLine('\nAPI URL update completed!'); 