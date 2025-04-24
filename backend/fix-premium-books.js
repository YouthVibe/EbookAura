/**
 * Script to fix premium book status in the database
 * Run with: node fix-premium-books.js
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
    console.log('Starting premium book check and fix...');
    
    // 1. Find all books with a price > 0 but isPremium is not true
    const booksNeedingFix = await Book.find({
      $or: [
        // Books with price > 0 but isPremium not set
        { price: { $gt: 0 }, isPremium: { $ne: true } },
        // Books with price > 0 but isPremium is false
        { price: { $gt: 0 }, isPremium: false },
        // Books with isPremium=true but no price
        { isPremium: true, $or: [{ price: { $exists: false } }, { price: null }, { price: 0 }] }
      ]
    });
    
    console.log(`Found ${booksNeedingFix.length} books that need fixing`);
    
    // 2. Fix each book
    for (const book of booksNeedingFix) {
      console.log(`Checking book: ${book.title} (${book._id})`);
      console.log(` - Current isPremium: ${book.isPremium} (${typeof book.isPremium})`);
      console.log(` - Current price: ${book.price} (${typeof book.price})`);
      
      let updates = {};
      
      // If book has a price > 0, ensure isPremium is true
      if (book.price > 0 && !book.isPremium) {
        updates.isPremium = true;
        console.log(` - Setting isPremium to true`);
      }
      
      // If book is premium but has no price, set default price
      if (book.isPremium && (!book.price || book.price === 0)) {
        updates.price = 25; // Default price
        console.log(` - Setting default price to 25 coins`);
      }
      
      // Update the book if changes are needed
      if (Object.keys(updates).length > 0) {
        await Book.updateOne({ _id: book._id }, { $set: updates });
        console.log(` - Book updated successfully`);
      } else {
        console.log(` - No updates needed`);
      }
    }
    
    // 3. Double-check that all premium books have proper values
    const premiumBooksAfterFix = await Book.find({ isPremium: true });
    console.log(`\nAfter fix: ${premiumBooksAfterFix.length} premium books in database`);
    
    // Check each premium book
    for (const book of premiumBooksAfterFix) {
      if (!book.price || book.price === 0) {
        console.log(`Warning: Premium book ${book.title} (${book._id}) still has no price`);
        // Set a default price
        await Book.updateOne({ _id: book._id }, { $set: { price: 25 } });
        console.log(` - Set default price to 25 coins`);
      }
    }
    
    console.log('\nPremium book fix completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing premium books:', error);
    process.exit(1);
  }
} 