/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
/**
 * Script to fix premium status for books with purchase records
 * This ensures that any book that has been purchased has proper premium status
 * Run with: node fix-purchase-premium-books.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected successfully');
  fixPurchasedPremiumBooks();
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Load models
const Book = require('./models/Book');
const Purchase = require('./models/Purchase');
const User = require('./models/User');

// Main fix function
async function fixPurchasedPremiumBooks() {
  try {
    console.log('Starting purchase records premium book fix...');
    
    // Step 1: Find all purchase records
    const purchases = await Purchase.find({}).populate('book', 'title isPremium price');
    console.log(`Found ${purchases.length} purchase records`);
    
    let fixedBooks = 0;
    let alreadyOkBooks = 0;
    let missingBooks = 0;
    
    // Process each purchase
    for (const purchase of purchases) {
      // Skip purchases with missing books
      if (!purchase.book) {
        console.log(`Purchase ${purchase._id} has no associated book (likely deleted)`);
        missingBooks++;
        continue;
      }
      
      const bookId = purchase.book._id;
      
      // Find the full book to check and update
      const book = await Book.findById(bookId);
      
      if (!book) {
        console.log(`Book ${bookId} not found, but has purchase record`);
        missingBooks++;
        continue;
      }
      
      console.log(`\nChecking book: ${book.title} (${book._id})`);
      console.log(`- Current isPremium: ${book.isPremium} (${typeof book.isPremium})`);
      console.log(`- Current price: ${book.price} (${typeof book.price})`);
      
      // Check if the book is properly marked as premium
      const needsUpdate = (!book.isPremium || book.price <= 0);
      
      if (needsUpdate) {
        // Book has purchase record but is not marked as premium
        console.log(`Book "${book.title}" has purchase record but is not properly marked as premium`);
        
        // Get the price from the purchase record or set to default
        const priceToSet = purchase.price > 0 ? purchase.price : 25;
        
        // Update the book
        book.isPremium = true;
        book.price = priceToSet;
        await book.save();
        
        console.log(`✅ Updated book to premium status with price=${priceToSet}`);
        fixedBooks++;
      } else {
        console.log(`✓ Book is already correctly marked as premium`);
        alreadyOkBooks++;
      }
    }
    
    // Step 2: Check all users' purchasedBooks to ensure books are premium
    console.log('\nChecking user purchased books...');
    const usersWithPurchases = await User.find({ purchasedBooks: { $exists: true, $ne: [] } });
    console.log(`Found ${usersWithPurchases.length} users with purchased books`);
    
    let userBookFixed = 0;
    
    for (const user of usersWithPurchases) {
      if (!user.purchasedBooks || user.purchasedBooks.length === 0) continue;
      
      console.log(`\nChecking ${user.purchasedBooks.length} purchased books for user ${user.email}`);
      
      for (const bookId of user.purchasedBooks) {
        const book = await Book.findById(bookId);
        
        if (!book) {
          console.log(`- Book ${bookId} not found in database but in user's purchases`);
          continue;
        }
        
        if (!book.isPremium || book.price <= 0) {
          console.log(`- Book "${book.title}" in user's purchases is not properly marked as premium`);
          
          // Set default price
          const priceToSet = 25;
          
          // Update the book
          book.isPremium = true;
          book.price = priceToSet;
          await book.save();
          
          console.log(`  ✅ Updated book to premium status with price=${priceToSet}`);
          userBookFixed++;
        }
      }
    }
    
    // Summary
    console.log('\n=== Purchase Premium Fix Summary ===');
    console.log(`Total purchase records: ${purchases.length}`);
    console.log(`Books already correctly marked as premium: ${alreadyOkBooks}`);
    console.log(`Books fixed (from purchase records): ${fixedBooks}`);
    console.log(`Books fixed (from user purchase lists): ${userBookFixed}`);
    console.log(`Missing books (book deleted but purchase exists): ${missingBooks}`);
    
    console.log('\nPurchase premium book fix completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing purchased premium books:', error);
    process.exit(1);
  }
} 