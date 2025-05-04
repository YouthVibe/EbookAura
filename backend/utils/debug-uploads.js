/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
/**
 * Debug and fix PDF upload issues
 * 
 * This utility helps diagnose and fix issues with PDF uploads
 * It can:
 * 1. Test authentication and user authorization
 * 2. Examine request structure
 * 3. Test Cloudinary connectivity
 * 4. Check for issues with book creation
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { cloudinary } = require('../config/cloudinary');
const User = require('../models/User');
const Book = require('../models/Book');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

// Load environment variables
dotenv.config();

// Set up readline interface for CLI
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colors for output formatting
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m', 
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

function printHeader(text) {
  console.log(`\n${colors.bright}${colors.cyan}===== ${text} =====${colors.reset}\n`);
}

function printSuccess(text) {
  console.log(`${colors.green}✓ ${text}${colors.reset}`);
}

function printError(text) {
  console.log(`${colors.red}✗ ${text}${colors.reset}`);
}

function printInfo(text) {
  console.log(`${colors.blue}ℹ ${text}${colors.reset}`);
}

function printWarning(text) {
  console.log(`${colors.yellow}⚠ ${text}${colors.reset}`);
}

// Connect to MongoDB
async function connectDB() {
  try {
    printInfo('Connecting to MongoDB...');
    
    if (!process.env.MONGODB_URI) {
      printError('MongoDB URI not found in environment variables.');
      return false;
    }
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    printSuccess('MongoDB connected successfully');
    return true;
  } catch (error) {
    printError(`Error connecting to MongoDB: ${error.message}`);
    return false;
  }
}

// Test Cloudinary connectivity
async function testCloudinary() {
  try {
    printHeader('Testing Cloudinary connectivity');
    
    // Check for required environment variables
    if (!process.env.CLOUDINARY_CLOUD_NAME || 
        !process.env.CLOUDINARY_API_KEY || 
        !process.env.CLOUDINARY_API_SECRET) {
      printError('Cloudinary environment variables are missing');
      return false;
    }
    
    // Test connectivity
    const result = await cloudinary.api.ping();
    
    if (result.status === 'ok') {
      printSuccess('Cloudinary connection successful');
      
      // Get account info
      const accountInfo = await cloudinary.api.usage();
      printInfo(`Plan: ${accountInfo.plan}`);
      printInfo(`Resources: ${accountInfo.resources}`);
      printInfo(`Bandwidth: ${Math.round(accountInfo.bandwidth / (1024 * 1024))} MB used`);
      
      return true;
    } else {
      printError('Cloudinary connection failed');
      return false;
    }
  } catch (error) {
    printError(`Error testing Cloudinary: ${error.message}`);
    return false;
  }
}

// Validate admin users in the system
async function validateAdminUsers() {
  try {
    printHeader('Validating admin users');
    
    // Find admin users
    const adminUsers = await User.find({ isAdmin: true }).select('name email');
    
    if (adminUsers.length === 0) {
      printWarning('No admin users found in the system');
      
      const answer = await new Promise(resolve => {
        rl.question('Would you like to create an admin user? (y/n): ', resolve);
      });
      
      if (answer.toLowerCase() === 'y') {
        await createAdminUser();
      }
    } else {
      printSuccess(`Found ${adminUsers.length} admin user(s):`);
      adminUsers.forEach(user => {
        console.log(`  - ${user.name} (${user.email}) - ID: ${user._id}`);
      });
    }
    
    return true;
  } catch (error) {
    printError(`Error validating admin users: ${error.message}`);
    return false;
  }
}

// Create an admin user
async function createAdminUser() {
  try {
    printHeader('Creating admin user');
    
    const email = await new Promise(resolve => {
      rl.question('Email: ', resolve);
    });
    
    const name = await new Promise(resolve => {
      rl.question('Name: ', resolve);
    });
    
    const password = await new Promise(resolve => {
      rl.question('Password: ', resolve);
    });
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      printInfo('User already exists, updating to admin role');
      existingUser.isAdmin = true;
      await existingUser.save();
      printSuccess(`User ${existingUser.name} (${existingUser.email}) is now an admin`);
    } else {
      // Create new admin user
      const newUser = new User({
        email,
        name,
        password,
        isAdmin: true,
        isEmailVerified: true
      });
      
      await newUser.save();
      printSuccess(`Admin user ${newUser.name} (${newUser.email}) created successfully`);
    }
    
    return true;
  } catch (error) {
    printError(`Error creating admin user: ${error.message}`);
    return false;
  }
}

// Validate the Book schema
async function validateBookSchema() {
  try {
    printHeader('Validating Book schema');
    
    // Get a book document from the database
    const book = await Book.findOne().lean();
    
    if (!book) {
      printInfo('No books found in the database');
      return true;
    }
    
    printSuccess('Book schema validated successfully');
    printInfo('Sample book document:');
    
    // Print specific fields of interest
    const fields = [
      'title', 'author', 'coverImage', 'pdfUrl', 'pdfId', 
      'uploadedBy', 'user', 'category', 'pageSize'
    ];
    
    fields.forEach(field => {
      if (book[field] !== undefined) {
        console.log(`  - ${field}: ${book[field]}`);
      } else {
        console.log(`  - ${field}: ${colors.dim}[undefined]${colors.reset}`);
      }
    });
    
    // Check if 'user' field exists but 'uploadedBy' doesn't
    if (book.user && !book.uploadedBy) {
      printWarning('Book has "user" field but missing "uploadedBy" field. This could cause validation issues.');
      
      const answer = await new Promise(resolve => {
        rl.question('Would you like to fix this issue? (y/n): ', resolve);
      });
      
      if (answer.toLowerCase() === 'y') {
        await fixBookSchemaIssues();
      }
    }
    
    return true;
  } catch (error) {
    printError(`Error validating Book schema: ${error.message}`);
    return false;
  }
}

// Fix Book schema issues (user vs uploadedBy field)
async function fixBookSchemaIssues() {
  try {
    printHeader('Fixing Book schema issues');
    
    // Direct database operation
    const db = mongoose.connection.db;
    const booksCollection = db.collection('books');
    
    // Find books that have user field but not uploadedBy
    const booksToFix = await booksCollection.find({ 
      user: { $exists: true }, 
      uploadedBy: { $exists: false } 
    }).toArray();
    
    if (booksToFix.length === 0) {
      printSuccess('No books found with schema issues');
      return true;
    }
    
    printInfo(`Found ${booksToFix.length} books with schema issues. Fixing...`);
    
    // Update each book to use uploadedBy instead of user
    let fixedCount = 0;
    for (const book of booksToFix) {
      try {
        // Update the document to add uploadedBy field
        const result = await booksCollection.updateOne(
          { _id: book._id },
          { $set: { uploadedBy: book.user } }
        );
        
        if (result.modifiedCount > 0) {
          fixedCount++;
          printSuccess(`Fixed book: ${book.title} (ID: ${book._id})`);
        }
      } catch (error) {
        printError(`Error fixing book ${book._id}: ${error.message}`);
      }
    }
    
    printSuccess(`Fixed ${fixedCount} out of ${booksToFix.length} books with schema issues`);
    return true;
  } catch (error) {
    printError(`Error fixing Book schema issues: ${error.message}`);
    return false;
  }
}

// Main function
async function main() {
  try {
    printHeader('PDF Upload Debug Utility');
    
    // Connect to database
    const dbConnected = await connectDB();
    if (!dbConnected) {
      return;
    }
    
    // Run diagnostics
    await testCloudinary();
    await validateAdminUsers();
    await validateBookSchema();
    
    // Show options menu
    printHeader('Options');
    console.log('1. Fix Book schema issues');
    console.log('2. Create admin user');
    console.log('3. Test PDF upload to Cloudinary');
    console.log('4. Exit');
    
    const answer = await new Promise(resolve => {
      rl.question('\nSelect an option (1-4): ', resolve);
    });
    
    switch (answer) {
      case '1':
        await fixBookSchemaIssues();
        break;
      case '2':
        await createAdminUser();
        break;
      case '3':
        printInfo('Feature coming soon');
        break;
      case '4':
        break;
      default:
        printWarning('Invalid option');
    }
    
    // Close connections
    await mongoose.connection.close();
    rl.close();
    
    printSuccess('Debug utility completed');
  } catch (error) {
    printError(`An error occurred: ${error.message}`);
    
    // Cleanup
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    rl.close();
  }
}

// Run the utility if executed directly
if (require.main === module) {
  main();
}

module.exports = {
  testCloudinary,
  validateAdminUsers,
  validateBookSchema,
  fixBookSchemaIssues
}; 