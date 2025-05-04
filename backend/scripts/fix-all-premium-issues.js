/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
/**
 * Script to fix all premium book issues in the database
 * - Sets isPremium=true for all books with price > 0
 * - Sets a default price for books marked as premium but with no price
 * - Logs all changes made for verification
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Book = require('../models/Book');

// Load environment variables
dotenv.config({ path: '../.env' });

// MongoDB connection
const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI environment variable is not set.');
      process.exit(1);
    }
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully.');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Main function to fix all premium book issues
const fixAllPremiumBooks = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    console.log('\n==== PREMIUM BOOK VALIDATION SCRIPT ====\n');
    
    // Get all books
    const books = await Book.find({});
    console.log(`Found ${books.length} total books in the database.`);
    
    let fixedCount = 0;
    let alreadyCorrectCount = 0;
    let problemsFound = 0;
    
    // Find books with inconsistent premium status
    console.log('\nChecking for books with premium issues...');
    
    for (const book of books) {
      let needsFix = false;
      let changes = [];
      
      // Case 1: Book has price but is not marked as premium
      if (book.price > 0 && book.isPremium !== true) {
        needsFix = true;
        problemsFound++;
        changes.push(`isPremium: ${book.isPremium} => true`);
        book.isPremium = true;
      }
      
      // Case 2: Book is marked as premium but has no price
      if (book.isPremium === true && (!book.price || book.price <= 0)) {
        needsFix = true;
        problemsFound++;
        changes.push(`price: ${book.price} => 25`);
        book.price = 25; // Default price
      }
      
      // Save changes if needed
      if (needsFix) {
        console.log(`Fixing book "${book.title}" (${book._id})`);
        changes.forEach(change => console.log(`  - ${change}`));
        await book.save();
        fixedCount++;
      } else {
        alreadyCorrectCount++;
      }
    }
    
    // Final summary
    console.log('\n==== SUMMARY ====');
    console.log(`Total books checked: ${books.length}`);
    console.log(`Books with correct premium settings: ${alreadyCorrectCount}`);
    console.log(`Books with problems found: ${problemsFound}`);
    console.log(`Books fixed: ${fixedCount}`);
    
    // Now verify all books have consistent premium settings
    const verifyBooks = await Book.find({
      $or: [
        { price: { $gt: 0 }, isPremium: { $ne: true } },
        { isPremium: true, price: { $lte: 0 } }
      ]
    });
    
    if (verifyBooks.length > 0) {
      console.log('\n⚠️ WARNING: Some books still have issues:');
      verifyBooks.forEach(book => {
        console.log(`  - "${book.title}" (${book._id}): isPremium=${book.isPremium}, price=${book.price}`);
      });
    } else {
      console.log('\n✅ All books now have consistent premium settings!');
    }
    
    // Get and display all premium books
    const premiumBooks = await Book.find({ isPremium: true });
    console.log(`\nTotal premium books: ${premiumBooks.length}`);
    
    // List premium books with their prices
    if (premiumBooks.length > 0) {
      console.log('\nPremium books:');
      premiumBooks.forEach(book => {
        console.log(`  - "${book.title}" (${book._id}): price=${book.price} coins`);
      });
    }
    
    console.log('\nScript completed successfully!');
    
  } catch (error) {
    console.error('Error fixing premium books:', error);
    process.exit(1);
  } finally {
    // Exit after completion
    setTimeout(() => process.exit(0), 1000);
  }
};

// Run the function
fixAllPremiumBooks(); 