/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
/**
 * Render.com Deployment Fix Script
 *
 * This script fixes common issues with deploying Node.js applications to Render.com:
 * - Fixes case sensitivity issues with model files
 * - Ensures all required directories exist
 * - Tests database connectivity
 * - Validates environment variables
 *
 * Run this script before starting your application on Render.com:
 * node render-fix.js && npm start
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { prepareModels } = require('./utils/prepareModels');
const mongoose = require('mongoose');
const { fixBookSchemaIssue } = require('./utils/fix-book-schema');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);
const mkdir = promisify(fs.mkdir);
const stat = promisify(fs.stat);

// ANSI color codes for better readability
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function ensureDirectoryExists(dir) {
  try {
    const dirStat = await stat(dir).catch(() => null);
    if (!dirStat) {
      console.log(`${colors.yellow}Creating directory: ${dir}${colors.reset}`);
      await mkdir(dir, { recursive: true });
    }
  } catch (error) {
    console.error(`${colors.red}Error creating directory ${dir}:${colors.reset}`, error);
  }
}

async function checkDatabaseConnection() {
  try {
    console.log(`${colors.cyan}Checking database connection...${colors.reset}`);
    
    // Load environment variables if .env file exists
    try {
      if (fs.existsSync('.env')) {
        require('dotenv').config();
      }
    } catch (error) {
      console.log(`${colors.yellow}Could not load .env file: ${error.message}${colors.reset}`);
    }

    // Check if we have a MongoDB URI
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      console.log(`${colors.red}MongoDB URI not found in environment variables!${colors.reset}`);
      console.log(`${colors.yellow}Please set MONGODB_URI in your environment variables.${colors.reset}`);
      return false;
    }

    // Try connecting to the database
    try {
      await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log(`${colors.green}Successfully connected to MongoDB!${colors.reset}`);
      await mongoose.disconnect();
      return true;
    } catch (error) {
      console.error(`${colors.red}Failed to connect to MongoDB: ${error.message}${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.error(`${colors.red}Error checking database connection:${colors.reset}`, error);
    return false;
  }
}

async function checkRequiredFolders() {
  const requiredFolders = ['models', 'controllers', 'routes', 'utils'];
  
  console.log(`${colors.cyan}Checking required folders...${colors.reset}`);
  
  for (const folder of requiredFolders) {
    await ensureDirectoryExists(path.join(__dirname, folder));
  }
}

async function validateEnvVariables() {
  console.log(`${colors.cyan}Validating environment variables...${colors.reset}`);
  
  const requiredVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET'
  ];
  
  const missingVars = [];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }
  
  if (missingVars.length > 0) {
    console.log(`${colors.yellow}Missing environment variables: ${missingVars.join(', ')}${colors.reset}`);
    console.log(`${colors.yellow}Make sure to set these in your Render.com dashboard.${colors.reset}`);
  } else {
    console.log(`${colors.green}All required environment variables are set.${colors.reset}`);
  }
}

async function checkServerFile() {
  const serverPath = path.join(__dirname, 'server.js');
  
  try {
    console.log(`${colors.cyan}Checking server.js file...${colors.reset}`);
    
    const fileExists = fs.existsSync(serverPath);
    if (!fileExists) {
      console.log(`${colors.red}server.js file not found! Application may not start properly.${colors.reset}`);
      return false;
    }
    
    // Read server file to check for model preparation
    const serverContent = await readFile(serverPath, 'utf8');
    
    // Check if server.js already includes model preparation
    if (!serverContent.includes('prepareModels') && !serverContent.includes('require(\'./utils/prepareModels\')')) {
      console.log(`${colors.yellow}Server.js file doesn't include model preparation. Updating...${colors.reset}`);
      
      // Insert model preparation code before mongoose.connect
      const updatedContent = serverContent.replace(
        /(mongoose\.connect\()/,
        `// Prepare models (fix case sensitivity issues)\nrequire('./utils/prepareModels').prepareModels();\n\n$1`
      );
      
      await writeFile(serverPath, updatedContent);
      console.log(`${colors.green}Updated server.js to include model preparation.${colors.reset}`);
    } else {
      console.log(`${colors.green}Server.js already includes model preparation.${colors.reset}`);
    }
    
    return true;
  } catch (error) {
    console.error(`${colors.red}Error checking server file:${colors.reset}`, error);
    return false;
  }
}

async function checkApiRoutes() {
  console.log(`${colors.cyan}Checking API routes...${colors.reset}`);
  
  try {
    // Get all route files
    const routeFiles = fs.readdirSync(path.join(__dirname, 'routes'))
      .filter(file => file.endsWith('.js'));
    
    console.log(`${colors.bright}Found route files:${colors.reset}`);
    routeFiles.forEach(file => {
      console.log(`- ${file}`);
    });
    
    // Check auth routes specifically
    if (routeFiles.includes('auth.js') && routeFiles.includes('authRoutes.js')) {
      console.log(`${colors.yellow}Warning: Both auth.js and authRoutes.js exist. This could cause conflicts.${colors.reset}`);
      
      try {
        const authRoutes = require('./routes/auth');
        const authRoutesStack = authRoutes.stack || [];
        console.log(`${colors.green}Routes in auth.js: ${authRoutesStack.length}${colors.reset}`);
        
        const authRoutesModule = require('./routes/authRoutes');
        console.log(`${colors.green}authRoutes.js exports: ${typeof authRoutesModule}${colors.reset}`);
      } catch (error) {
        console.log(`${colors.red}Error checking auth routes: ${error.message}${colors.reset}`);
      }
    }
    
    // Check for login route specifically
    try {
      const authRoutes = require('./routes/auth');
      const hasLoginRoute = (authRoutes.stack || []).some(layer => 
        layer.route && 
        layer.route.path === '/login' && 
        Object.keys(layer.route.methods).includes('post')
      );
      
      if (hasLoginRoute) {
        console.log(`${colors.green}✓ Login route found in auth.js${colors.reset}`);
      } else {
        console.log(`${colors.red}✗ Login route NOT found in auth.js${colors.reset}`);
      }
    } catch (error) {
      console.log(`${colors.red}Error checking login route: ${error.message}${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.red}Error checking API routes:${colors.reset}`, error);
  }
}

async function fixBookSchema() {
  try {
    console.log(`${colors.cyan}Checking Book model schema consistency...${colors.reset}`);
    
    // Call our fix function
    await fixBookSchemaIssue();
    
    return true;
  } catch (error) {
    console.error(`${colors.red}Error fixing Book schema:${colors.reset}`, error);
    return false;
  }
}

async function run() {
  console.log(`\n${colors.bright}${colors.blue}====== RENDER.COM DEPLOYMENT FIX SCRIPT ======${colors.reset}\n`);
  
  try {
    // Check if required folders exist
    await checkRequiredFolders();
    
    // Fix model case sensitivity issues
    console.log(`\n${colors.cyan}Fixing model case sensitivity issues...${colors.reset}`);
    await prepareModels();
    
    // Check and update server.js
    await checkServerFile();
    
    // Check API routes
    await checkApiRoutes();
    
    // Fix Book schema issues
    await fixBookSchema();
    
    // Check database connection
    await checkDatabaseConnection();
    
    // Validate environment variables
    await validateEnvVariables();
    
    console.log(`\n${colors.bright}${colors.green}✓ Fix script completed successfully!${colors.reset}`);
    console.log(`${colors.bright}${colors.green}✓ Your application should now be ready to deploy on Render.com.${colors.reset}\n`);
  } catch (error) {
    console.error(`\n${colors.bright}${colors.red}✗ Error running fix script:${colors.reset}`, error);
    console.log(`${colors.yellow}Please check the logs above for more details.${colors.reset}\n`);
    process.exit(1);
  }
}

// Run the script if it's called directly
if (require.main === module) {
  run().catch(error => {
    console.error(`${colors.red}Unhandled error:${colors.reset}`, error);
    process.exit(1);
  });
}

module.exports = { run }; 