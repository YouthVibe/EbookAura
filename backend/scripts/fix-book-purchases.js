/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
/**
 * Script to check and fix book purchase records
 * This ensures all purchase records are valid and consistent
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Book = require('../models/Book');
const User = require('../models/User');
const Purchase = require('../models/Purchase');

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

const checkPurchaseRecords = async () => {
  try {
    console.log('Starting purchase records check script...');
    
    // Connect to database
    await connectDB();
    
    // Get all purchases
    const purchases = await Purchase.find({});
    console.log(`Found ${purchases.length} purchase records.`);
    
    // Track issues
    const orphanedPurchases = [];
    const invalidUserPurchases = [];
    const invalidBookPurchases = [];
    const nonPremiumBookPurchases = [];
    
    // Check each purchase
    for (const purchase of purchases) {
      // Check if user exists
      const user = await User.findById(purchase.userId);
      if (!user) {
        invalidUserPurchases.push(purchase);
        continue;
      }
      
      // Check if book exists
      const book = await Book.findById(purchase.bookId);
      if (!book) {
        invalidBookPurchases.push(purchase);
        continue;
      }
      
      // Check if book is premium
      if (!book.isPremium && book.price <= 0) {
        nonPremiumBookPurchases.push({
          purchase,
          book: {
            _id: book._id,
            title: book.title,
            isPremium: book.isPremium,
            price: book.price
          }
        });
      }
    }
    
    // Display results
    console.log('\n=== Purchase Record Check Results ===');
    console.log(`Total purchases: ${purchases.length}`);
    console.log(`Purchases with invalid users: ${invalidUserPurchases.length}`);
    console.log(`Purchases with invalid books: ${invalidBookPurchases.length}`);
    console.log(`Purchases for non-premium books: ${nonPremiumBookPurchases.length}`);
    
    // Log details if issues found
    if (invalidUserPurchases.length > 0) {
      console.log('\n=== Purchases with invalid users ===');
      invalidUserPurchases.forEach(purchase => {
        console.log(`Purchase ID: ${purchase._id}, User ID: ${purchase.userId}, Book ID: ${purchase.bookId}`);
      });
    }
    
    if (invalidBookPurchases.length > 0) {
      console.log('\n=== Purchases with invalid books ===');
      invalidBookPurchases.forEach(purchase => {
        console.log(`Purchase ID: ${purchase._id}, User ID: ${purchase.userId}, Book ID: ${purchase.bookId}`);
      });
    }
    
    if (nonPremiumBookPurchases.length > 0) {
      console.log('\n=== Purchases for non-premium books ===');
      nonPremiumBookPurchases.forEach(item => {
        console.log(`Purchase ID: ${item.purchase._id}, Book: "${item.book.title}" (${item.book._id})`);
        console.log(`  Book info: isPremium=${item.book.isPremium}, price=${item.book.price}`);
      });
    }
    
    // Ask to fix issues if any found
    const hasIssues = invalidUserPurchases.length > 0 || 
                      invalidBookPurchases.length > 0 || 
                      nonPremiumBookPurchases.length > 0;
    
    if (hasIssues) {
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      readline.question('\nWould you like to fix these issues? (y/n) ', async (answer) => {
        if (answer.toLowerCase() === 'y') {
          // First, fix non-premium book purchases by marking their books as premium
          if (nonPremiumBookPurchases.length > 0) {
            console.log('\nFixing non-premium book purchases...');
            for (const item of nonPremiumBookPurchases) {
              const book = await Book.findById(item.book._id);
              if (book) {
                book.isPremium = true;
                if (!book.price || book.price <= 0) {
                  book.price = 5; // Default price if none is set
                }
                await book.save();
                console.log(`Set book "${book.title}" (${book._id}) as premium with price ${book.price}`);
              }
            }
          }
          
          // Remove invalid purchases
          if (invalidUserPurchases.length > 0 || invalidBookPurchases.length > 0) {
            console.log('\nRemoving invalid purchases...');
            const invalidPurchaseIds = [
              ...invalidUserPurchases.map(p => p._id),
              ...invalidBookPurchases.map(p => p._id)
            ];
            
            const result = await Purchase.deleteMany({ _id: { $in: invalidPurchaseIds } });
            console.log(`Removed ${result.deletedCount} invalid purchase records`);
          }
          
          console.log('\nIssues fixed successfully!');
        } else {
          console.log('No changes were made.');
        }
        
        readline.close();
        process.exit(0);
      });
    } else {
      console.log('\nNo issues found with purchase records!');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('Error checking purchase records:', error);
    process.exit(1);
  }
};

// Run the function
checkPurchaseRecords(); 