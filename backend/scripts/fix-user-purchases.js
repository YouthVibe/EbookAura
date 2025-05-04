/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
/**
 * Script to check and fix user purchasedBooks arrays
 * Ensures consistency between user's purchasedBooks and purchase records
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

const checkUserPurchasedBooks = async () => {
  try {
    console.log('Starting user purchasedBooks check script...');
    
    // Connect to database
    await connectDB();
    
    // Get all users
    const users = await User.find({});
    console.log(`Found ${users.length} users.`);
    
    // Get all purchases (grouped by userId for efficiency)
    const allPurchases = await Purchase.find({});
    const purchasesByUser = {};
    
    allPurchases.forEach(purchase => {
      const userId = purchase.userId.toString();
      if (!purchasesByUser[userId]) {
        purchasesByUser[userId] = [];
      }
      purchasesByUser[userId].push(purchase.bookId.toString());
    });
    
    // Track issues
    const usersWithMissingBooks = [];
    const usersWithExtraBooks = [];
    
    // Check each user
    for (const user of users) {
      const userId = user._id.toString();
      const userPurchasedBooks = user.purchasedBooks || [];
      const purchaseRecords = purchasesByUser[userId] || [];
      
      // Find books in purchase records but not in user.purchasedBooks
      const missingBooks = purchaseRecords.filter(
        bookId => !userPurchasedBooks.some(
          userBookId => userBookId.toString() === bookId
        )
      );
      
      // Find books in user.purchasedBooks but not in purchase records
      const extraBooks = userPurchasedBooks.filter(
        userBookId => !purchaseRecords.some(
          bookId => bookId === userBookId.toString()
        )
      );
      
      if (missingBooks.length > 0) {
        usersWithMissingBooks.push({
          user: {
            _id: user._id,
            name: user.name,
            email: user.email
          },
          missingBooks
        });
      }
      
      if (extraBooks.length > 0) {
        usersWithExtraBooks.push({
          user: {
            _id: user._id,
            name: user.name,
            email: user.email
          },
          extraBooks
        });
      }
    }
    
    // Display results
    console.log('\n=== User PurchasedBooks Check Results ===');
    console.log(`Users with missing books in purchasedBooks: ${usersWithMissingBooks.length}`);
    console.log(`Users with extra books in purchasedBooks: ${usersWithExtraBooks.length}`);
    
    // Log details if issues found
    if (usersWithMissingBooks.length > 0) {
      console.log('\n=== Users with missing books in purchasedBooks ===');
      for (const item of usersWithMissingBooks) {
        console.log(`User: ${item.user.name} (${item.user._id}), Email: ${item.user.email}`);
        console.log(`  Missing books: ${item.missingBooks.length}`);
        // Get book details for better reporting
        for (const bookId of item.missingBooks) {
          try {
            const book = await Book.findById(bookId);
            if (book) {
              console.log(`    - "${book.title}" (${bookId})`);
            } else {
              console.log(`    - Unknown book (${bookId})`);
            }
          } catch (error) {
            console.log(`    - Error retrieving book (${bookId}): ${error.message}`);
          }
        }
      }
    }
    
    if (usersWithExtraBooks.length > 0) {
      console.log('\n=== Users with extra books in purchasedBooks ===');
      for (const item of usersWithExtraBooks) {
        console.log(`User: ${item.user.name} (${item.user._id}), Email: ${item.user.email}`);
        console.log(`  Extra books: ${item.extraBooks.length}`);
        // Get book details for better reporting
        for (const bookId of item.extraBooks) {
          try {
            const book = await Book.findById(bookId);
            if (book) {
              console.log(`    - "${book.title}" (${bookId})`);
            } else {
              console.log(`    - Unknown book (${bookId})`);
            }
          } catch (error) {
            console.log(`    - Error retrieving book (${bookId}): ${error.message}`);
          }
        }
      }
    }
    
    // Ask to fix issues if any found
    const hasIssues = usersWithMissingBooks.length > 0 || usersWithExtraBooks.length > 0;
    
    if (hasIssues) {
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      readline.question('\nWould you like to fix these issues? (y/n) ', async (answer) => {
        if (answer.toLowerCase() === 'y') {
          // Fix missing books in user purchasedBooks
          if (usersWithMissingBooks.length > 0) {
            console.log('\nFixing missing books in user purchasedBooks...');
            let fixedMissingCount = 0;
            
            for (const item of usersWithMissingBooks) {
              try {
                const user = await User.findById(item.user._id);
                if (user) {
                  // Add missing books to purchasedBooks
                  const currentPurchasedBooks = user.purchasedBooks || [];
                  for (const bookId of item.missingBooks) {
                    // Check if book exists
                    const book = await Book.findById(bookId);
                    if (book) {
                      // Only add valid book IDs
                      currentPurchasedBooks.push(mongoose.Types.ObjectId(bookId));
                      fixedMissingCount++;
                    }
                  }
                  
                  user.purchasedBooks = currentPurchasedBooks;
                  await user.save();
                  console.log(`Updated user "${user.name}" (${user._id}) with ${item.missingBooks.length} missing books`);
                }
              } catch (error) {
                console.error(`Error updating user ${item.user._id}:`, error.message);
              }
            }
            
            console.log(`Fixed ${fixedMissingCount} missing books across ${usersWithMissingBooks.length} users`);
          }
          
          // Fix extra books in user purchasedBooks (create purchase records)
          if (usersWithExtraBooks.length > 0) {
            console.log('\nFixing extra books in user purchasedBooks...');
            let fixedExtraCount = 0;
            
            for (const item of usersWithExtraBooks) {
              try {
                // For each extra book, either:
                // 1. Create a purchase record if the book exists
                // 2. Remove it from purchasedBooks if book doesn't exist
                
                const user = await User.findById(item.user._id);
                if (user) {
                  const validBookIds = [];
                  const invalidBookIds = [];
                  
                  for (const bookId of item.extraBooks) {
                    try {
                      const book = await Book.findById(bookId);
                      if (book) {
                        // Book exists, create purchase record
                        await Purchase.create({
                          userId: user._id,
                          bookId: bookId,
                          price: book.price || 0,
                          purchaseDate: new Date()
                        });
                        validBookIds.push(bookId);
                        fixedExtraCount++;
                      } else {
                        // Book doesn't exist, mark for removal
                        invalidBookIds.push(bookId);
                      }
                    } catch (error) {
                      console.error(`Error checking book ${bookId}:`, error.message);
                      invalidBookIds.push(bookId);
                    }
                  }
                  
                  // Remove invalid book IDs from user.purchasedBooks
                  if (invalidBookIds.length > 0) {
                    user.purchasedBooks = user.purchasedBooks.filter(
                      id => !invalidBookIds.includes(id.toString())
                    );
                    await user.save();
                    console.log(`Removed ${invalidBookIds.length} invalid books from user "${user.name}" (${user._id})`);
                  }
                  
                  console.log(`Created ${validBookIds.length} purchase records for user "${user.name}" (${user._id})`);
                }
              } catch (error) {
                console.error(`Error processing user ${item.user._id}:`, error.message);
              }
            }
            
            console.log(`Fixed ${fixedExtraCount} extra books across ${usersWithExtraBooks.length} users`);
          }
          
          console.log('\nIssues fixed successfully!');
        } else {
          console.log('No changes were made.');
        }
        
        readline.close();
        process.exit(0);
      });
    } else {
      console.log('\nNo issues found with user purchasedBooks arrays!');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('Error checking user purchasedBooks:', error);
    process.exit(1);
  }
};

// Run the function
checkUserPurchasedBooks(); 