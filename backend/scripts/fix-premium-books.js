/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
/**
 * Script to check and fix premium books in the database
 * This ensures all books with prices have isPremium=true
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Book = require('../models/Book');

// Load environment variables
dotenv.config({ path: '../.env' });

// Connect to database
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

const fixPremiumBooks = async () => {
  try {
    console.log('Starting premium books fix script...');
    
    // Connect to database
    await connectDB();
    
    // Find all books with price > 0 but isPremium not set to true
    const booksToFix = await Book.find({
      $or: [
        { price: { $exists: true, $gt: 0 }, isPremium: { $ne: true } },
        { price: { $exists: true, $gt: 0 }, isPremium: { $exists: false } }
      ]
    });
    
    if (booksToFix.length === 0) {
      console.log('No books need fixing.');
      process.exit(0);
    }
    
    console.log(`Found ${booksToFix.length} books that need fixing.`);
    
    // Log each book that will be fixed
    booksToFix.forEach(book => {
      console.log(`Book to fix: "${book.title}" (${book._id})`);
      console.log(`  Current state: isPremium=${book.isPremium}, price=${book.price}`);
    });
    
    // Ask for confirmation
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question(`Are you sure you want to fix these ${booksToFix.length} books? (y/n) `, async (answer) => {
      readline.close();
      
      if (answer.toLowerCase() === 'y') {
        // Fix each book
        const updatePromises = booksToFix.map(book => {
          book.isPremium = true;
          console.log(`Setting isPremium=true for book: "${book.title}" (${book._id})`);
          return book.save();
        });
        
        await Promise.all(updatePromises);
        
        console.log(`Successfully fixed ${booksToFix.length} books.`);
        
        // Now find all premium books to verify
        const premiumBooks = await Book.find({ isPremium: true });
        console.log(`\nTotal premium books after fix: ${premiumBooks.length}`);
        premiumBooks.forEach(book => {
          console.log(`Premium book: "${book.title}" (${book._id})`);
          console.log(`  isPremium=${book.isPremium}, price=${book.price}`);
        });
        
        process.exit(0);
      } else {
        console.log('Operation canceled.');
        process.exit(0);
      }
    });
  } catch (error) {
    console.error('Error fixing premium books:', error);
    process.exit(1);
  }
};

// Run the function
fixPremiumBooks(); 