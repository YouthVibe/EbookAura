/**
 * PRODUCTION-SPECIFIC Premium Book Fix Script
 * This script addresses issues with premium book properties not being
 * properly serialized or handled in the production environment.
 * 
 * Run with: node fix-premium-production.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected successfully');
  fixPremiumBooksForProduction();
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Load models
const Book = require('./models/Book');
const User = require('./models/User');
const Purchase = require('./models/Purchase');

// Main fix function
async function fixPremiumBooksForProduction() {
  try {
    console.log('Starting PRODUCTION premium book fix...');
    
    // Get ALL books
    const allBooks = await Book.find({});
    console.log(`Found ${allBooks.length} total books in database`);
    
    let premiumCount = 0;
    let fixedCount = 0;
    
    // Phase 1: Fix all premium-related fields
    for (const book of allBooks) {
      console.log(`\nChecking book: ${book.title} (${book._id})`);
      
      // Check and log current values
      const currentIsPremium = book.isPremium;
      const currentPrice = book.price;
      
      console.log(`- Current isPremium: ${currentIsPremium} (${typeof currentIsPremium})`);
      console.log(`- Current price: ${currentPrice} (${typeof currentPrice})`);
      
      let needsUpdate = false;
      let updates = {};
      
      // STEP 1: Ensure isPremium field exists and is a proper boolean
      if (typeof currentIsPremium !== 'boolean') {
        // Convert to proper boolean
        updates.isPremium = Boolean(currentIsPremium);
        needsUpdate = true;
        console.log(`- Setting isPremium to ${updates.isPremium} (proper boolean type)`);
      }
      
      // STEP 2: Ensure price field exists and is a proper number
      if (typeof currentPrice !== 'number') {
        // Convert to proper number or set default
        updates.price = currentPrice ? Number(currentPrice) : 0;
        needsUpdate = true;
        console.log(`- Setting price to ${updates.price} (proper number type)`);
      }
      
      // STEP 3: Ensure premium books have isPremium=true
      if (currentPrice > 0 && !currentIsPremium) {
        updates.isPremium = true;
        needsUpdate = true;
        console.log(`- Setting isPremium=true for book with price=${currentPrice}`);
      }
      
      // STEP 4: Ensure premium books have a price
      if (currentIsPremium && (!currentPrice || currentPrice <= 0)) {
        updates.price = 25; // Default price
        needsUpdate = true; 
        console.log(`- Setting default price=25 for premium book with no price`);
      }
      
      // Apply updates if needed
      if (needsUpdate) {
        await Book.updateOne({ _id: book._id }, { $set: updates });
        console.log(`✅ Book updated with: ${JSON.stringify(updates)}`);
        fixedCount++;
      } else {
        console.log(`✓ No updates needed for this book`);
      }
      
      // Count premium books for statistics
      const isPremium = updates.isPremium !== undefined ? updates.isPremium : currentIsPremium;
      if (isPremium) {
        premiumCount++;
      }
    }
    
    // Verify premium books after fix
    const premiumBooksAfterFix = await Book.find({ isPremium: true });
    
    // Phase 2: Verify all premium books have proper price values
    for (const book of premiumBooksAfterFix) {
      if (!book.price || book.price <= 0) {
        console.log(`\nFixing premium book with missing price: ${book.title} (${book._id})`);
        book.price = 25; // Default price
        await book.save();
        console.log(`✅ Set price=25 for premium book`);
      }
    }
    
    // Phase 3: Double-check all purchase records
    console.log('\nVerifying purchase records...');
    const purchases = await Purchase.find({});
    console.log(`Found ${purchases.length} purchase records`);
    
    let purchaseFixCount = 0;
    
    for (const purchase of purchases) {
      const book = await Book.findById(purchase.book);
      
      if (book && !book.isPremium) {
        console.log(`\nBook in purchase record is not marked as premium: ${book.title} (${book._id})`);
        book.isPremium = true;
        if (!book.price || book.price <= 0) {
          book.price = purchase.price > 0 ? purchase.price : 25;
        }
        await book.save();
        console.log(`✅ Fixed book premium status and price=${book.price}`);
        purchaseFixCount++;
      }
    }
    
    // Final statistics
    console.log('\n=== PRODUCTION Premium Fix Summary ===');
    console.log(`Total books: ${allBooks.length}`);
    console.log(`Premium books: ${premiumBooksAfterFix.length}`);
    console.log(`Books updated: ${fixedCount}`);
    console.log(`Purchase records checked: ${purchases.length}`);
    console.log(`Additional books fixed from purchases: ${purchaseFixCount}`);
    
    // List all premium books
    console.log('\nAll premium books after fix:');
    const finalPremiumBooks = await Book.find({ isPremium: true });
    finalPremiumBooks.forEach(book => {
      console.log(`- ${book.title} (${book._id}) - Price: ${book.price} coins`);
    });
    
    console.log('\nPRODUCTION premium book fix completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing premium books for production:', error);
    process.exit(1);
  }
} 