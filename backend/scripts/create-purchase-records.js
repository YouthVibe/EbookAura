/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
/**
 * Script to create purchase records for books in users' purchasedBooks arrays
 * This ensures data consistency between the user's purchasedBooks and the Purchase collection
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Purchase = require('../models/Purchase');
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

const createMissingPurchaseRecords = async () => {
  try {
    console.log('Starting purchase records creation script...');
    
    // Connect to database
    await connectDB();
    
    // Get all users with purchased books
    const users = await User.find({ purchasedBooks: { $exists: true, $ne: [] } })
      .select('_id username email purchasedBooks');
    
    console.log(`Found ${users.length} users with purchased books.`);
    
    if (users.length === 0) {
      console.log('No users with purchased books found.');
      process.exit(0);
    }
    
    // Track our statistics
    let totalMissingRecords = 0;
    let totalUsersFixed = 0;
    let totalRecordsCreated = 0;
    const usersMissingRecords = [];
    
    // Check each user's purchased books against purchase records
    for (const user of users) {
      // Get all purchase records for this user
      const existingPurchases = await Purchase.find({ user: user._id })
        .select('book purchaseDate');
      
      const purchasedBookIds = user.purchasedBooks.map(id => id.toString());
      const existingPurchaseBookIds = existingPurchases.map(p => p.book.toString());
      
      // Find books in purchasedBooks without a purchase record
      const missingPurchaseRecords = purchasedBookIds.filter(
        bookId => !existingPurchaseBookIds.includes(bookId)
      );
      
      if (missingPurchaseRecords.length > 0) {
        totalMissingRecords += missingPurchaseRecords.length;
        usersMissingRecords.push({
          userId: user._id,
          username: user.username,
          email: user.email,
          missingRecords: missingPurchaseRecords.length,
          bookIds: missingPurchaseRecords
        });
      }
    }
    
    // Print results
    console.log(`\n=== Missing Purchase Records Summary ===`);
    console.log(`Users with missing purchase records: ${usersMissingRecords.length}`);
    console.log(`Total missing purchase records: ${totalMissingRecords}`);
    
    // If no issues found
    if (totalMissingRecords === 0) {
      console.log('\nNo missing purchase records found. All data is consistent!');
      process.exit(0);
    }
    
    // Log details of users with missing records
    console.log('\n=== Users with Missing Purchase Records ===');
    usersMissingRecords.forEach(user => {
      console.log(`User: ${user.username} (${user.userId})`);
      console.log(`Email: ${user.email}`);
      console.log(`Missing records: ${user.missingRecords}`);
      console.log('---');
    });
    
    // Ask to fix issues
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question('\nWould you like to create the missing purchase records? (y/n) ', async (answer) => {
      if (answer.toLowerCase() === 'y') {
        console.log('\nCreating missing purchase records...');
        
        // Get all books to have pricing information
        const allBooks = await Book.find({})
          .select('_id title price isPremium');
        
        const bookMap = {};
        allBooks.forEach(book => {
          bookMap[book._id.toString()] = {
            title: book.title,
            price: book.price || 0,
            isPremium: book.isPremium
          };
        });
        
        // Process each user with missing records
        for (const userData of usersMissingRecords) {
          const user = userData.userId;
          console.log(`\nProcessing user: ${userData.username} (${user})`);
          
          let createdForUser = 0;
          
          // Create purchase records for each missing book
          for (const bookId of userData.bookIds) {
            try {
              const bookInfo = bookMap[bookId] || { title: 'Unknown Book', price: 0 };
              const price = bookInfo.isPremium ? (bookInfo.price || 50) : 0;
              
              // Create a purchase record with a date 1 day ago
              // (or you could choose to use a specific date or estimate based on other data)
              const purchaseDate = new Date();
              purchaseDate.setDate(purchaseDate.getDate() - 1);
              
              const newPurchase = new Purchase({
                user,
                book: bookId,
                price,
                purchaseDate
              });
              
              await newPurchase.save();
              
              console.log(`Created purchase record for "${bookInfo.title}" (${bookId}) - Price: ${price}`);
              createdForUser++;
              totalRecordsCreated++;
            } catch (error) {
              console.error(`Error creating purchase record for book ${bookId}:`, error.message);
            }
          }
          
          if (createdForUser > 0) {
            totalUsersFixed++;
            console.log(`Created ${createdForUser} purchase records for ${userData.username}`);
          }
        }
        
        // Summary
        console.log('\n=== Purchase Records Creation Summary ===');
        console.log(`Users fixed: ${totalUsersFixed}/${usersMissingRecords.length}`);
        console.log(`Purchase records created: ${totalRecordsCreated}/${totalMissingRecords}`);
        
        if (totalRecordsCreated === totalMissingRecords) {
          console.log('\nAll missing purchase records have been created successfully!');
        } else {
          console.log('\nSome purchase records could not be created. Please check the error messages above.');
        }
      } else {
        console.log('No changes were made.');
      }
      
      readline.close();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Error creating purchase records:', error);
    process.exit(1);
  }
};

// Run the function
createMissingPurchaseRecords(); 