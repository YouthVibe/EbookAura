/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
/**
 * Server Starter Script
 * 
 * This script provides a cross-platform way to start the EbookAura backend server
 * with the correct environment variables and error handling.
 */
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// Console styling helpers
const styles = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Print styled messages
function log(message, style = styles.reset) {
  console.log(`${style}${message}${styles.reset}`);
}

// Check if .env file exists and load variables
function loadEnvFile() {
  const envPath = path.join(__dirname, '.env');
  
  if (!fs.existsSync(envPath)) {
    log('⚠️ No .env file found. Using default environment variables.', styles.yellow);
    return false;
  }
  
  try {
    log('📂 Loading environment variables from .env file...', styles.cyan);
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n');
    
    for (const line of envLines) {
      const trimmed = line.trim();
      // Skip comments and empty lines
      if (trimmed && !trimmed.startsWith('#')) {
        const match = trimmed.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          let value = match[2].trim();
          
          // Remove quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          
          if (key && value) {
            process.env[key] = value;
          }
        }
      }
    }
    return true;
  } catch (error) {
    log(`❌ Error loading .env file: ${error.message}`, styles.red);
    return false;
  }
}

// Check for required environment variables
function checkRequiredEnv() {
  const required = [
    'MONGODB_URI',
    'JWT_SECRET'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    log(`❌ Missing required environment variables: ${missing.join(', ')}`, styles.red);
    log('Please add these to your .env file and try again.', styles.yellow);
    return false;
  }
  
  return true;
}

// Start the server
function startServer() {
  // Default to production if not specified
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production';
  }
  
  log(`\n🚀 Starting server in ${process.env.NODE_ENV} mode...`, styles.green);
  
  // Use node to run server.js
  const server = spawn('node', ['server.js'], {
    cwd: __dirname,
    stdio: 'inherit',
    env: process.env
  });
  
  server.on('error', (error) => {
    log(`❌ Failed to start server: ${error.message}`, styles.red);
    process.exit(1);
  });
  
  server.on('exit', (code) => {
    if (code !== 0) {
      log(`❌ Server exited with code ${code}`, styles.red);
      process.exit(code);
    }
  });
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    log('\n👋 Gracefully shutting down server...', styles.yellow);
    server.kill('SIGINT');
  });
  
  process.on('SIGTERM', () => {
    log('\n👋 Terminating server...', styles.yellow);
    server.kill('SIGTERM');
  });
}

// Main function
function main() {
  log('\n🔷 EbookAura Backend Server Starter 🔷', styles.bright + styles.blue);
  log('-----------------------------------\n', styles.dim);
  
  // Load environment variables
  loadEnvFile();
  
  // Set default environment variables if not set
  if (!process.env.PORT) {
    process.env.PORT = '5000';
  }
  
  // Verify required environment variables
  if (!checkRequiredEnv()) {
    process.exit(1);
  }
  
  // Start the server
  startServer();
}

// Run the main function
main(); 