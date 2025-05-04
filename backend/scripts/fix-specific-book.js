/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
/**
 * Script to fix a specific book's premium status and price
 * This ensures the book has correct isPremium flag if price is set
 * Usage: node fix-specific-book.js [bookId]
 * If no bookId is provided, it will prompt for one
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const readline = require('readline');
const Book = require('../models/Book');

// Load environment variables
dotenv.config({ path: '../.env' });

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// MongoDB connection
const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    
    if (!process.env.MONGO_URI) {
      console.error('MONGO_URI environment variable is not set.');
      process.exit(1);
    }
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected successfully.');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Get book ID from arguments or prompt
const getBookId = async () => {
  const bookId = process.argv[2];
  
  if (bookId) {
    return bookId;
  }
  
  return new Promise((resolve) => {
    rl.question('Enter book ID to fix: ', (answer) => {
      resolve(answer.trim());
    });
  });
};

// Fix the specific book
const fixSpecificBook = async (bookId) => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    console.log(`Looking for book with ID: ${bookId}`);
    
    // Find the book
    const book = await Book.findById(bookId);
    
    if (!book) {
      console.error(`Book with ID ${bookId} not found.`);
      process.exit(1);
    }
    
    console.log(`Found book: "${book.title}" by ${book.author}`);
    console.log('Current status:');
    console.log(`- isPremium: ${book.isPremium} (${typeof book.isPremium})`);
    console.log(`- price: ${book.price} (${typeof book.price})`);
    
    // Check if any fixes are needed
    let needsFix = false;
    
    // If price > 0 but isPremium is not true, set isPremium to true
    if (book.price > 0 && book.isPremium !== true) {
      needsFix = true;
      console.log('⚠️ Book has price but isPremium is not set to true');
    }
    
    // If isPremium is true but price is 0, set a default price
    if (book.isPremium === true && (!book.price || book.price <= 0)) {
      needsFix = true;
      console.log('⚠️ Book is marked as premium but has no price');
    }
    
    if (!needsFix) {
      console.log('✅ Book premium status is correct, no fixes needed');
      process.exit(0);
    }
    
    // Ask for confirmation before fixing
    const confirmFix = await new Promise((resolve) => {
      rl.question('Do you want to fix this book? (y/n): ', (answer) => {
        resolve(answer.toLowerCase() === 'y');
      });
    });
    
    if (!confirmFix) {
      console.log('Operation cancelled.');
      process.exit(0);
    }
    
    // Fix the book
    if (book.price > 0 && book.isPremium !== true) {
      book.isPremium = true;
      console.log('Setting isPremium to true');
    }
    
    if (book.isPremium === true && (!book.price || book.price <= 0)) {
      book.price = 25; // Default price
      console.log('Setting price to 25 coins');
    }
    
    // Save the book
    await book.save();
    
    console.log('✅ Book fixed successfully!');
    console.log('Updated status:');
    console.log(`- isPremium: ${book.isPremium} (${typeof book.isPremium})`);
    console.log(`- price: ${book.price} (${typeof book.price})`);
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
    // Allow time for database operations to complete
    setTimeout(() => process.exit(0), 1000);
  }
};

// Main function
const main = async () => {
  try {
    const bookId = await getBookId();
    
    if (!bookId) {
      console.error('No book ID provided.');
      process.exit(1);
    }
    
    await fixSpecificBook(bookId);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

// Run the main function
main(); 