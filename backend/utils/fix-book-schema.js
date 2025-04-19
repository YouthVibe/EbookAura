/**
 * Fix Book Schema Issues
 * 
 * This script fixes issues with the Book schema where some documents
 * might have a "user" field instead of "uploadedBy".
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Define colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Connect to MongoDB
async function connectDB() {
  try {
    console.log(`${colors.cyan}Connecting to MongoDB...${colors.reset}`);
    
    if (!process.env.MONGODB_URI) {
      console.error(`${colors.red}MongoDB URI not found in environment variables.${colors.reset}`);
      process.exit(1);
    }
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log(`${colors.green}✓ MongoDB connected successfully.${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}Error connecting to MongoDB:${colors.reset}`, error.message);
    return false;
  }
}

async function fixBookSchemaIssue() {
  try {
    console.log(`${colors.bright}${colors.blue}====== FIXING BOOK SCHEMA ISSUES ======${colors.reset}\n`);
    
    // Connect to MongoDB
    const connected = await connectDB();
    if (!connected) {
      return false;
    }
    
    // Direct database operation
    const db = mongoose.connection.db;
    const booksCollection = db.collection('books');
    
    console.log(`${colors.yellow}Checking for books with 'user' field instead of 'uploadedBy'...${colors.reset}`);
    
    // Find books that have user field but not uploadedBy
    const booksToFix = await booksCollection.find({ 
      user: { $exists: true }, 
      uploadedBy: { $exists: false } 
    }).toArray();
    
    if (booksToFix.length === 0) {
      console.log(`${colors.green}✓ No books found with schema issues.${colors.reset}`);
      return true;
    }
    
    console.log(`${colors.yellow}Found ${booksToFix.length} books with schema issues. Fixing...${colors.reset}`);
    
    // Update each book to use uploadedBy instead of user
    let fixedCount = 0;
    for (const book of booksToFix) {
      try {
        // Update the document to add uploadedBy field and keep user field
        // (we'll keep user for backward compatibility)
        const result = await booksCollection.updateOne(
          { _id: book._id },
          { $set: { uploadedBy: book.user } }
        );
        
        if (result.modifiedCount > 0) {
          fixedCount++;
          console.log(`${colors.green}✓ Fixed book: ${book.title} (ID: ${book._id})${colors.reset}`);
        }
      } catch (error) {
        console.error(`${colors.red}Error fixing book ${book._id}:${colors.reset}`, error.message);
      }
    }
    
    console.log(`\n${colors.green}✓ Fixed ${fixedCount} books out of ${booksToFix.length} with schema issues.${colors.reset}`);
    
    return true;
  } catch (error) {
    console.error(`${colors.red}Error fixing book schema issues:${colors.reset}`, error);
    return false;
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log(`${colors.blue}Database connection closed.${colors.reset}`);
  }
}

// Run the script if executed directly
if (require.main === module) {
  fixBookSchemaIssue()
    .then(success => {
      if (success) {
        console.log(`\n${colors.bright}${colors.green}✓ Book schema fix operation completed successfully!${colors.reset}\n`);
      } else {
        console.error(`\n${colors.bright}${colors.red}✗ Book schema fix operation failed.${colors.reset}\n`);
        process.exit(1);
      }
      process.exit(0);
    })
    .catch(error => {
      console.error(`\n${colors.bright}${colors.red}✗ Unhandled error:${colors.reset}`, error);
      process.exit(1);
    });
}

module.exports = { fixBookSchemaIssue }; 