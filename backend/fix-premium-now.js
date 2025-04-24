/**
 * IMMEDIATE FIX for premium book status in the database
 * This script ensures all premium-related fields are properly set
 * Run with: node fix-premium-now.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected successfully');
  fixPremiumBooks();
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Load Book model
const Book = require('./models/Book');

// Function to fix premium book status
async function fixPremiumBooks() {
  try {
    console.log('Starting EMERGENCY premium book fix...');
    
    // Get ALL books to ensure none are missed
    const allBooks = await Book.find({});
    console.log(`Found ${allBooks.length} total books in database`);
    
    let fixedCount = 0;
    let alreadyOkCount = 0;
    let nonPremiumCount = 0;
    
    // Check each book and ensure premium properties are set
    for (const book of allBooks) {
      console.log(`Checking book: ${book.title} (${book._id})`);
      console.log(` - Current isPremium: ${book.isPremium} (${typeof book.isPremium})`);
      console.log(` - Current price: ${book.price} (${typeof book.price})`);
      
      let updates = {};
      let needsUpdate = false;
      
      // Check if price exists but is greater than 0
      if (book.price > 0) {
        // This should be a premium book
        if (book.isPremium !== true) {
          updates.isPremium = true;
          needsUpdate = true;
          console.log(` - Setting isPremium=true based on price=${book.price}`);
        }
      }
      
      // Check if book is marked premium but has no price
      if (book.isPremium === true && (!book.price || book.price <= 0)) {
        updates.price = 25; // Default price
        needsUpdate = true;
        console.log(` - Setting default price=25 for premium book with no price`);
      }
      
      // Ensure fields exist even if undefined
      if (book.isPremium === undefined) {
        updates.isPremium = false;
        needsUpdate = true;
        console.log(` - Adding missing isPremium field (set to false)`);
      }
      
      if (book.price === undefined) {
        updates.price = 0;
        needsUpdate = true;
        console.log(` - Adding missing price field (set to 0)`);
      }
      
      // Update if changes needed
      if (needsUpdate) {
        await Book.updateOne({ _id: book._id }, { $set: updates });
        console.log(` ✅ Book updated successfully`);
        fixedCount++;
      } else {
        if (book.isPremium === true) {
          console.log(` ✓ No updates needed - Premium book already correctly configured`);
          alreadyOkCount++;
        } else {
          console.log(` ✓ No updates needed - Non-premium book`);
          nonPremiumCount++;
        }
      }
    }
    
    // Show a summary
    console.log('\n=== Premium Fix Summary ===');
    console.log(`Total books: ${allBooks.length}`);
    console.log(`Fixed books: ${fixedCount}`);
    console.log(`Already correct premium books: ${alreadyOkCount}`);
    console.log(`Non-premium books: ${nonPremiumCount}`);
    
    // Verify premium books after fix
    const premiumBooksAfterFix = await Book.find({ isPremium: true });
    console.log(`\nTotal premium books after fix: ${premiumBooksAfterFix.length}`);
    
    // List all premium books
    if (premiumBooksAfterFix.length > 0) {
      console.log('\nPremium books:');
      premiumBooksAfterFix.forEach(book => {
        console.log(` - ${book.title} (Price: ${book.price} coins)`);
      });
    }
    
    console.log('\nEmergency premium book fix completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing premium books:', error);
    process.exit(1);
  }
} 