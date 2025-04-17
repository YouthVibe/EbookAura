/**
 * Static Files Preparation Script
 * 
 * This script prepares static files for deployment on Render.com
 * It checks for the existence of static files and creates a symlink or directory if needed
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking for static files...');

// Check if we're on render.com or similar environment
const isRenderEnvironment = process.env.RENDER || process.env.RENDER_EXTERNAL_URL;

// Possible locations where static files might be
const possibleLocations = [
  { path: path.join(__dirname, '..', 'out'), label: 'out directory' },
  { path: path.join(__dirname, '..', 'public'), label: 'public directory' },
  { path: path.join(__dirname, '..', '..', 'out'), label: 'out directory (parent)' },
  { path: path.join(__dirname, '..', 'ebooks-aura', 'out'), label: 'ebooks-aura/out directory' },
];

// Set environment variable for the static files directory
if (process.env.STATIC_FILES_DIR) {
  console.log(`✓ Static files directory already set to: ${process.env.STATIC_FILES_DIR}`);
  possibleLocations.unshift({ 
    path: process.env.STATIC_FILES_DIR, 
    label: 'from environment variable' 
  });
}

// Function to check if directory contains static files
function isValidStaticDir(dirPath) {
  try {
    if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
      // Check for index.html at minimum
      if (fs.existsSync(path.join(dirPath, 'index.html'))) {
        return true;
      }
    }
  } catch (err) {
    console.error(`Error checking ${dirPath}:`, err.message);
  }
  return false;
}

// Find first valid directory 
let staticDir = null;
for (const location of possibleLocations) {
  if (isValidStaticDir(location.path)) {
    staticDir = location.path;
    console.log(`✅ Found static files in ${location.label}: ${location.path}`);
    break;
  }
}

// Handle the case where no static directory was found
if (!staticDir) {
  console.warn('⚠️ No static files directory found!');
  
  // Create an empty static directory if in Render environment
  if (isRenderEnvironment) {
    const outDir = path.join(__dirname, '..', 'out');
    try {
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
        console.log(`📁 Created empty out directory at: ${outDir}`);
      }
      
      // Create a basic index.html if it doesn't exist
      const indexPath = path.join(outDir, 'index.html');
      if (!fs.existsSync(indexPath)) {
        // Create a basic index.html
        const indexContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>EbookAura Maintenance</title>
          <style>
            body { 
              font-family: -apple-system, system-ui, sans-serif; 
              max-width: 800px; 
              margin: 0 auto; 
              padding: 20px; 
              text-align: center;
              line-height: 1.6;
            }
            h1 { color: #ef4444; margin-top: 2rem; }
            .message { 
              background: #f9fafb; 
              padding: 20px; 
              border-radius: 8px;
              margin-top: 2rem;
            }
            .logo {
              font-size: 2.5rem;
              font-weight: 700;
            }
            .logo-ebook {
              color: #111827;
            }
            .logo-aura {
              color: #ef4444;
            }
          </style>
        </head>
        <body>
          <div class="logo">
            <span class="logo-ebook">Ebook</span><span class="logo-aura">Aura</span>
          </div>
          <h1>Site Maintenance</h1>
          <div class="message">
            <p>Our website is currently undergoing scheduled maintenance.</p>
            <p>Please check back soon. The API remains fully operational.</p>
            <p>Server Time: ${new Date().toLocaleString()}</p>
          </div>
        </body>
        </html>
        `;
        fs.writeFileSync(indexPath, indexContent.trim());
        console.log(`📄 Created basic index.html at: ${indexPath}`);
      }
      
      // Set this as our static directory
      staticDir = outDir;
      
      // Set environment variable
      process.env.STATIC_FILES_DIR = outDir;
      console.log(`✅ Static files directory set to: ${outDir}`);
    } catch (err) {
      console.error('❌ Failed to create out directory:', err.message);
    }
  } else {
    console.log('📌 Local development detected, static file serving is optional');
  }
} else {
  // Set environment variable if it's not already set
  if (!process.env.STATIC_FILES_DIR) {
    process.env.STATIC_FILES_DIR = staticDir;
    console.log(`✅ Set STATIC_FILES_DIR environment variable to: ${staticDir}`);
  }
}

console.log('✨ Static files preparation complete!'); 