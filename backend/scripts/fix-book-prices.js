/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
/**
 * Script to check and fix premium book prices
 * Ensures all premium books have a consistent pricing structure
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

const DEFAULT_PRICE = 50; // Default price for premium books without a price

const checkBookPrices = async () => {
  try {
    console.log('Starting book price check script...');
    
    // Connect to database
    await connectDB();
    
    // Get all books
    const books = await Book.find({});
    console.log(`Found ${books.length} total books.`);
    
    // Check premium books without prices
    const premiumBooksWithoutPrice = books.filter(book => 
      book.isPremium && (!book.price || book.price <= 0)
    );
    
    // Check non-premium books with prices
    const nonPremiumBooksWithPrice = books.filter(book => 
      !book.isPremium && book.price && book.price > 0
    );
    
    // Display results
    console.log('\n=== Book Price Check Results ===');
    console.log(`Premium books without valid price: ${premiumBooksWithoutPrice.length}`);
    console.log(`Non-premium books with price set: ${nonPremiumBooksWithPrice.length}`);
    
    // Log details if issues found
    if (premiumBooksWithoutPrice.length > 0) {
      console.log('\n=== Premium books without valid price ===');
      premiumBooksWithoutPrice.forEach(book => {
        console.log(`"${book.title}" (${book._id}) - Current price: ${book.price || 'not set'}`);
      });
    }
    
    if (nonPremiumBooksWithPrice.length > 0) {
      console.log('\n=== Non-premium books with price set ===');
      nonPremiumBooksWithPrice.forEach(book => {
        console.log(`"${book.title}" (${book._id}) - Current price: ${book.price}`);
      });
    }
    
    // Ask to fix issues if any found
    const hasIssues = premiumBooksWithoutPrice.length > 0 || nonPremiumBooksWithPrice.length > 0;
    
    if (hasIssues) {
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      readline.question('\nWould you like to fix these pricing issues? (y/n) ', async (answer) => {
        if (answer.toLowerCase() === 'y') {
          // Fix premium books without prices
          if (premiumBooksWithoutPrice.length > 0) {
            console.log(`\nFixing premium books without valid prices (setting to default: ${DEFAULT_PRICE} coins)...`);
            let updatedCount = 0;
            
            for (const book of premiumBooksWithoutPrice) {
              try {
                book.price = DEFAULT_PRICE;
                await book.save();
                console.log(`Updated "${book.title}" (${book._id}) - Set price to ${DEFAULT_PRICE} coins`);
                updatedCount++;
              } catch (error) {
                console.error(`Error updating book ${book._id}:`, error.message);
              }
            }
            
            console.log(`Fixed ${updatedCount} premium books with missing prices`);
          }
          
          // Fix non-premium books with prices
          if (nonPremiumBooksWithPrice.length > 0) {
            const subMenu = async () => {
              console.log('\nFor non-premium books with prices, choose an option:');
              console.log('1. Remove price from all non-premium books');
              console.log('2. Mark all these books as premium (keep their prices)');
              console.log('3. Review each book individually');
              console.log('4. Skip fixing non-premium books with prices');
              
              readline.question('Enter option (1-4): ', async (option) => {
                let updatedCount = 0;
                
                switch (option) {
                  case '1':
                    // Remove price from all non-premium books
                    for (const book of nonPremiumBooksWithPrice) {
                      try {
                        book.price = 0;
                        await book.save();
                        console.log(`Updated "${book.title}" (${book._id}) - Removed price`);
                        updatedCount++;
                      } catch (error) {
                        console.error(`Error updating book ${book._id}:`, error.message);
                      }
                    }
                    console.log(`Removed prices from ${updatedCount} non-premium books`);
                    break;
                    
                  case '2':
                    // Mark all as premium, keeping their prices
                    for (const book of nonPremiumBooksWithPrice) {
                      try {
                        book.isPremium = true;
                        await book.save();
                        console.log(`Updated "${book.title}" (${book._id}) - Marked as premium with price ${book.price}`);
                        updatedCount++;
                      } catch (error) {
                        console.error(`Error updating book ${book._id}:`, error.message);
                      }
                    }
                    console.log(`Marked ${updatedCount} books as premium`);
                    break;
                    
                  case '3':
                    // Review each book individually
                    const reviewBooks = async (index) => {
                      if (index >= nonPremiumBooksWithPrice.length) {
                        console.log(`Finished reviewing all ${updatedCount} books`);
                        complete();
                        return;
                      }
                      
                      const book = nonPremiumBooksWithPrice[index];
                      console.log(`\nReviewing book ${index + 1}/${nonPremiumBooksWithPrice.length}:`);
                      console.log(`Title: "${book.title}"`);
                      console.log(`ID: ${book._id}`);
                      console.log(`Current price: ${book.price} coins`);
                      console.log(`Status: Non-premium with price`);
                      console.log('\nOptions:');
                      console.log('1. Remove price (keep as non-premium)');
                      console.log('2. Mark as premium (keep price)');
                      console.log('3. Skip this book');
                      
                      readline.question('Enter option (1-3): ', async (bookOption) => {
                        try {
                          switch (bookOption) {
                            case '1':
                              book.price = 0;
                              await book.save();
                              console.log(`Updated "${book.title}" - Removed price`);
                              updatedCount++;
                              break;
                              
                            case '2':
                              book.isPremium = true;
                              await book.save();
                              console.log(`Updated "${book.title}" - Marked as premium with price ${book.price}`);
                              updatedCount++;
                              break;
                              
                            case '3':
                              console.log(`Skipped "${book.title}"`);
                              break;
                              
                            default:
                              console.log('Invalid option, skipping book');
                          }
                        } catch (error) {
                          console.error(`Error updating book ${book._id}:`, error.message);
                        }
                        
                        // Process next book
                        reviewBooks(index + 1);
                      });
                    };
                    
                    // Start reviewing books
                    await reviewBooks(0);
                    return; // This path handles its own completion
                    
                  case '4':
                    console.log('Skipping non-premium books with prices');
                    complete();
                    break;
                    
                  default:
                    console.log('Invalid option, skipping non-premium books with prices');
                    complete();
                }
                
                complete();
              });
            };
            
            const complete = () => {
              console.log('\nPrice fixing completed!');
              readline.close();
              process.exit(0);
            };
            
            await subMenu();
          } else {
            console.log('\nPrice fixing completed!');
            readline.close();
            process.exit(0);
          }
        } else {
          console.log('No changes were made.');
          readline.close();
          process.exit(0);
        }
      });
    } else {
      console.log('\nNo pricing issues found!');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('Error checking book prices:', error);
    process.exit(1);
  }
};

// Run the function
checkBookPrices(); 