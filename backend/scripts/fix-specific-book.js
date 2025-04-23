/**
 * Script to check and fix a specific book's premium status
 * Provide the book ID as a command-line argument
 * Usage: node fix-specific-book.js <book_id>
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

const fixSpecificBook = async () => {
  try {
    // Get book ID from command line argument
    const bookId = process.argv[2];
    
    if (!bookId) {
      console.error('Book ID is required. Usage: node fix-specific-book.js <book_id>');
      process.exit(1);
    }
    
    console.log(`Starting fix for book ID: ${bookId}`);
    
    // Connect to database
    await connectDB();
    
    // Find the book
    const book = await Book.findById(bookId);
    
    if (!book) {
      console.error(`Book with ID ${bookId} not found.`);
      process.exit(1);
    }
    
    console.log(`Found book: "${book.title}" (${book._id})`);
    console.log(`Current state: isPremium=${book.isPremium}, price=${book.price}`);
    
    // Ask for confirmation
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    // Show options
    console.log('\nWhat would you like to do?');
    console.log('1. Mark as premium and set price (if no price exists)');
    console.log('2. Remove premium status and price');
    console.log('3. Only fix mismatched premium status (make premium if has price)');
    console.log('4. Check relationship with users (find who purchased)');
    
    readline.question('Enter option (1-4): ', async (option) => {
      try {
        switch (option) {
          case '1':
            // Make premium and set price
            book.isPremium = true;
            
            if (!book.price || book.price <= 0) {
              readline.question('Enter price in coins: ', async (price) => {
                try {
                  const priceNum = parseInt(price);
                  if (isNaN(priceNum) || priceNum <= 0) {
                    console.error('Invalid price. Must be a positive number.');
                    readline.close();
                    process.exit(1);
                  }
                  
                  book.price = priceNum;
                  await book.save();
                  
                  console.log(`Book "${book.title}" updated:`);
                  console.log(`  isPremium: ${book.isPremium}`);
                  console.log(`  price: ${book.price}`);
                  
                  readline.close();
                  process.exit(0);
                } catch (err) {
                  console.error('Error updating book:', err);
                  readline.close();
                  process.exit(1);
                }
              });
            } else {
              await book.save();
              console.log(`Book "${book.title}" marked as premium with existing price ${book.price}`);
              readline.close();
              process.exit(0);
            }
            break;
            
          case '2':
            // Remove premium status and price
            book.isPremium = false;
            book.price = 0;
            await book.save();
            
            console.log(`Book "${book.title}" updated:`);
            console.log(`  isPremium: ${book.isPremium}`);
            console.log(`  price: ${book.price}`);
            
            readline.close();
            process.exit(0);
            break;
            
          case '3':
            // Only fix mismatched status
            if (book.price > 0 && !book.isPremium) {
              book.isPremium = true;
              await book.save();
              console.log(`Book "${book.title}" marked as premium based on price ${book.price}`);
            } else if (book.price <= 0 && book.isPremium) {
              readline.question('This book is premium but has no price. Set a price? (y/n): ', async (answer) => {
                if (answer.toLowerCase() === 'y') {
                  readline.question('Enter price in coins: ', async (price) => {
                    const priceNum = parseInt(price);
                    if (isNaN(priceNum) || priceNum <= 0) {
                      console.error('Invalid price. Must be a positive number.');
                      readline.close();
                      process.exit(1);
                    }
                    
                    book.price = priceNum;
                    await book.save();
                    
                    console.log(`Book "${book.title}" updated with price ${book.price}`);
                    readline.close();
                    process.exit(0);
                  });
                } else {
                  console.log('No changes made to the book.');
                  readline.close();
                  process.exit(0);
                }
              });
              return; // Let the nested readline handle the exit
            } else {
              console.log(`Book "${book.title}" already has consistent premium status and price.`);
              readline.close();
              process.exit(0);
            }
            break;
            
          case '4':
            // Check relationship with users
            const User = require('../models/User');
            const Purchase = require('../models/Purchase');
            
            const usersWithBook = await User.find({ 
              purchasedBooks: { $in: [book._id] } 
            }).select('_id name email');
            
            const purchaseRecords = await Purchase.find({ book: book._id });
            
            console.log(`\nPurchase Information for "${book.title}":`);
            console.log(`Users who purchased: ${usersWithBook.length}`);
            console.log(`Purchase records: ${purchaseRecords.length}`);
            
            if (usersWithBook.length > 0) {
              console.log('\nUsers who purchased this book:');
              usersWithBook.forEach(user => {
                console.log(`- ${user.name} (${user.email}), ID: ${user._id}`);
              });
            }
            
            if (purchaseRecords.length > 0) {
              console.log('\nPurchase records:');
              purchaseRecords.forEach(purchase => {
                console.log(`- Date: ${purchase.purchaseDate.toISOString().split('T')[0]}, User: ${purchase.user}, Price: ${purchase.price}`);
              });
            }
            
            if (usersWithBook.length !== purchaseRecords.length) {
              console.log('\nWARNING: Mismatch between user records and purchase records!');
              console.log('Would you like to fix this inconsistency?');
              readline.question('Fix inconsistency? (y/n): ', async (answer) => {
                if (answer.toLowerCase() === 'y') {
                  // Implement fix logic here
                  console.log('Fixing inconsistencies...');
                  
                  // Create missing purchase records
                  for (const user of usersWithBook) {
                    const hasPurchaseRecord = purchaseRecords.some(
                      p => p.user.toString() === user._id.toString()
                    );
                    
                    if (!hasPurchaseRecord) {
                      // Create purchase record
                      const newPurchase = new Purchase({
                        user: user._id,
                        book: book._id,
                        price: book.price || 0,
                        purchaseDate: new Date(),
                        bookDetails: {
                          title: book.title,
                          author: book.author,
                          coverImage: book.coverImage
                        }
                      });
                      
                      await newPurchase.save();
                      console.log(`Created purchase record for user ${user.name}`);
                    }
                  }
                  
                  // Check for any purchase records without corresponding user record
                  for (const purchase of purchaseRecords) {
                    const userHasBook = usersWithBook.some(
                      u => u._id.toString() === purchase.user.toString()
                    );
                    
                    if (!userHasBook) {
                      try {
                        // Add book to user's purchasedBooks
                        const user = await User.findById(purchase.user);
                        if (user) {
                          if (!user.purchasedBooks.includes(book._id)) {
                            user.purchasedBooks.push(book._id);
                            await user.save();
                            console.log(`Added book to user ${user.name}'s purchasedBooks array`);
                          }
                        } else {
                          console.log(`Warning: Purchase record exists for non-existent user: ${purchase.user}`);
                        }
                      } catch (err) {
                        console.error(`Error updating user for purchase ${purchase._id}:`, err);
                      }
                    }
                  }
                  
                  console.log('Inconsistencies fixed.');
                } else {
                  console.log('No changes made to the records.');
                }
                readline.close();
                process.exit(0);
              });
              return; // Let the nested readline handle the exit
            } else {
              console.log('\nPurchase records are consistent with user records.');
              readline.close();
              process.exit(0);
            }
            break;
            
          default:
            console.log('Invalid option selected.');
            readline.close();
            process.exit(1);
        }
      } catch (err) {
        console.error('Error processing option:', err);
        readline.close();
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('Error fixing specific book:', error);
    process.exit(1);
  }
};

// Run the function
fixSpecificBook(); 