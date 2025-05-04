/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
/**
 * Render.com Setup Script
 * This script helps configure EbookAura for deployment on Render.com
 * Run with: node setup-render.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up EbookAura for Render.com deployment...');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Ensure we're in the backend directory
const isBackendDir = fs.existsSync(path.join(__dirname, 'server.js')) && 
                     fs.existsSync(path.join(__dirname, 'package.json'));

if (!isBackendDir) {
  console.error(`${colors.red}Error: This script must be run from the backend directory${colors.reset}`);
  process.exit(1);
}

// Create output directory if it doesn't exist
console.log(`${colors.blue}Checking for static files directory...${colors.reset}`);
const outDir = path.join(__dirname, 'out');

if (!fs.existsSync(outDir)) {
  console.log(`${colors.yellow}Creating out directory...${colors.reset}`);
  fs.mkdirSync(outDir, { recursive: true });
  console.log(`${colors.green}Created directory: ${outDir}${colors.reset}`);
} else {
  console.log(`${colors.green}Out directory already exists: ${outDir}${colors.reset}`);
}

// Create maintenance page
console.log(`${colors.blue}Creating maintenance page...${colors.reset}`);
const indexPath = path.join(outDir, 'index.html');

// Using a dynamic timestamp that will update each time this runs
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

// Create a polished maintenance page
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

try {
  fs.writeFileSync(indexPath, indexContent.trim());
  console.log(`${colors.green}Created maintenance page at: ${indexPath}${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}Error creating maintenance page: ${error.message}${colors.reset}`);
}

// Check for environment variables
console.log(`${colors.blue}Checking environment variables...${colors.reset}`);
const envPath = path.join(__dirname, '.env');
let envExists = fs.existsSync(envPath);

if (!envExists) {
  console.log(`${colors.yellow}Creating .env file with production settings...${colors.reset}`);
  
  const envContent = `NODE_ENV=production
RENDER=true
FORCE_STATIC_GENERATION=true
PORT=10000
`;
  
  try {
    fs.writeFileSync(envPath, envContent);
    console.log(`${colors.green}Created .env file with basic production settings${colors.reset}`);
    envExists = true;
  } catch (error) {
    console.error(`${colors.red}Error creating .env file: ${error.message}${colors.reset}`);
  }
} else {
  console.log(`${colors.green}.env file already exists${colors.reset}`);
  
  // Update .env file with render settings if needed
  try {
    let envContent = fs.readFileSync(envPath, 'utf8');
    let updated = false;
    
    if (!envContent.includes('RENDER=')) {
      envContent += '\nRENDER=true';
      updated = true;
    }
    
    if (!envContent.includes('FORCE_STATIC_GENERATION=')) {
      envContent += '\nFORCE_STATIC_GENERATION=true';
      updated = true;
    }
    
    if (updated) {
      fs.writeFileSync(envPath, envContent);
      console.log(`${colors.green}Updated .env file with Render.com settings${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.red}Error updating .env file: ${error.message}${colors.reset}`);
  }
}

// Run the static files preparation script
console.log(`${colors.blue}Running static files preparation script...${colors.reset}`);
try {
  execSync('node utils/prepareStaticFiles.js', { stdio: 'inherit' });
  console.log(`${colors.green}Static files preparation complete${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}Error running static files preparation script: ${error.message}${colors.reset}`);
}

console.log(`\n${colors.green}✅ Setup complete!${colors.reset}`);
console.log(`${colors.cyan}Next steps:${colors.reset}`);
console.log(`${colors.cyan}1. Start the server with: npm run start:render${colors.reset}`);
console.log(`${colors.cyan}2. To replace the maintenance page with your actual frontend:${colors.reset}`);
console.log(`   - Build your frontend with: cd ../ebooks-aura && npm run build:static:prod`);
console.log(`   - Copy output to backend: cd .. && cp -r ebooks-aura/out backend/`);
console.log(`${colors.cyan}3. Restart the server to serve your frontend files${colors.reset}`); 