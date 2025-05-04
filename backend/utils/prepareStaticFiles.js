/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
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
console.log(`Environment detection: ${isRenderEnvironment ? 'Render.com detected ✓' : 'Local environment'}`);

// Allow override of the detection
if (process.env.FORCE_STATIC_GENERATION === 'true') {
  console.log('Force static generation enabled ✓');
}

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
  } else {
    console.log(`❌ No static files found in ${location.label}`);
  }
}

// Handle the case where no static directory was found
if (!staticDir || process.env.FORCE_STATIC_GENERATION === 'true') {
  console.warn('⚠️ No static files directory found or force regeneration enabled!');
  
  // Create an empty static directory if in Render environment or forced
  if (isRenderEnvironment || process.env.FORCE_STATIC_GENERATION === 'true') {
    const outDir = path.join(__dirname, '..', 'out');
    try {
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
        console.log(`📁 Created out directory at: ${outDir}`);
      } else {
        console.log(`📁 Out directory already exists at: ${outDir}`);
      }
      
      // Create a basic index.html if it doesn't exist
      const indexPath = path.join(outDir, 'index.html');
      
      // Using a dynamic timestamp that will update on each server start
      const currentDate = new Date();
      const formattedDate = currentDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
      });
      const formattedTime = currentDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      
      // Create a more polished maintenance page
      const indexContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>EbookAura - Maintenance</title>
          <style>
              body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                  margin: 0;
                  padding: 0;
                  background-color: #f9fafb;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  min-height: 100vh;
                  text-align: center;
                  color: #111827;
              }
              .container {
                  max-width: 600px;
                  padding: 2rem;
                  background-color: white;
                  border-radius: 1rem;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
                  margin: 1rem;
              }
              .logo {
                  font-size: 2.5rem;
                  font-weight: 700;
                  margin-bottom: 1rem;
              }
              .logo-ebook {
                  color: #111827;
              }
              .logo-aura {
                  color: #ef4444;
              }
              h1 {
                  font-size: 1.8rem;
                  margin-bottom: 1.5rem;
                  color: #111827;
              }
              p {
                  font-size: 1.1rem;
                  line-height: 1.6;
                  color: #4b5563;
                  margin-bottom: 1.5rem;
              }
              .progress {
                  width: 100%;
                  height: 8px;
                  background-color: #e5e7eb;
                  border-radius: 4px;
                  overflow: hidden;
                  margin: 2rem 0;
              }
              .progress-bar {
                  height: 100%;
                  width: 75%;
                  background-color: #ef4444;
                  border-radius: 4px;
                  animation: progress 1.5s ease-in-out infinite;
              }
              @keyframes progress {
                  0% { width: 25%; }
                  50% { width: 75%; }
                  100% { width: 25%; }
              }
              .cta {
                  display: inline-block;
                  margin-top: 1rem;
                  padding: 0.75rem 1.5rem;
                  background-color: #ef4444;
                  color: white;
                  text-decoration: none;
                  border-radius: 0.5rem;
                  font-weight: 500;
                  transition: background-color 0.2s;
              }
              .cta:hover {
                  background-color: #dc2626;
              }
          </style>
          <meta http-equiv="refresh" content="60">
      </head>
      <body>
          <div class="container">
              <div class="logo">
                  <span class="logo-ebook">Ebook</span><span class="logo-aura">Aura</span>
              </div>
              <h1>Site Maintenance</h1>
              <p>Our website is currently undergoing scheduled maintenance.</p>
              
              <div class="progress">
                  <div class="progress-bar"></div>
              </div>
              
              <p>Please check back soon. The API remains fully operational.</p>
              
              <p>Server Time: ${formattedDate}, ${formattedTime}</p>
              
              <a href="/" class="cta">Refresh Page</a>
          </div>
      </body>
      </html>
      `;
      
      fs.writeFileSync(indexPath, indexContent.trim());
      console.log(`📄 Created maintenance page at: ${indexPath}`);
      
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