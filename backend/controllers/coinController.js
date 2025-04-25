const User = require('../models/User');
const Book = require('../models/Book');
const Purchase = require('../models/Purchase');
const { v4: uuidv4 } = require('uuid');

// @desc    Get user's coin balance
// @route   GET /api/coins
// @access  Private
const getUserCoins = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ coins: user.coins });
  } catch (error) {
    console.error('Error getting user coins:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Award daily coins to user (10 coins per day)
// @route   POST /api/coins/daily
// @access  Private
const awardDailyCoins = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user already claimed daily coins
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (user.lastCoinReward && new Date(user.lastCoinReward) >= today) {
      return res.status(400).json({ 
        message: 'Daily coins already claimed today',
        nextReward: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
      });
    }

    // Award 10 coins and update last reward date
    user.coins += 10;
    user.lastCoinReward = new Date();
    await user.save();

    res.status(200).json({ 
      message: 'Daily coins awarded successfully!', 
      coins: user.coins,
      coinsAdded: 10
    });
  } catch (error) {
    console.error('Error awarding daily coins:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Award coins for watching ad (25 coins)
// @route   POST /api/coins/ad-reward
// @access  Private
const awardAdCoins = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Award 25 coins for watching ad
    user.coins += 25;
    await user.save();

    res.status(200).json({ 
      message: 'Ad reward coins awarded successfully!', 
      coins: user.coins,
      coinsAdded: 25
    });
  } catch (error) {
    console.error('Error awarding ad reward coins:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Award daily coins to all users automatically (called by cron job or admin)
// @route   POST /api/coins/reward-all (protected by admin middleware)
// @access  Private/Admin
const awardDailyCoinsToAll = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all users who have not received coins today
    const usersToReward = await User.find({
      $or: [
        { lastCoinReward: { $lt: today } },
        { lastCoinReward: null }
      ]
    });

    if (usersToReward.length === 0) {
      return res.status(200).json({ message: 'No users to reward' });
    }

    // Award coins to each user
    const updatePromises = usersToReward.map(user => {
      user.coins += 10;
      user.lastCoinReward = new Date();
      return user.save();
    });

    await Promise.all(updatePromises);

    res.status(200).json({ 
      message: 'Daily coins awarded to all eligible users', 
      usersRewarded: usersToReward.length
    });
  } catch (error) {
    console.error('Error awarding daily coins to all users:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Purchase a premium book using coins
// @route   POST /api/coins/purchase/:bookId
// @access  Private
const purchaseBook = async (req, res) => {
  try {
    const { bookId } = req.params;
    
    if (!bookId) {
      return res.status(400).json({ message: 'Book ID is required' });
    }
    
    console.log(`[COIN PURCHASE] User ${req.user._id} attempting to purchase book ${bookId}`);

    // Find the book
    const book = await Book.findById(bookId);
    
    if (!book) {
      console.log(`[COIN PURCHASE] Book ${bookId} not found`);
      return res.status(404).json({ message: 'Book not found' });
    }
    
    // FIXED: Use the robust premium check that handles serialization issues 
    // Similar to what we have in bookController.js
    
    // Check if the book is premium using multiple methods
    let isPremiumBook = false;
    
    // Method 1: Direct boolean check
    if (book.isPremium === true) {
      isPremiumBook = true;
    }
    
    // Method 2: Check price (if price > 0, it's premium)
    if (typeof book.price === 'number' && book.price > 0) {
      isPremiumBook = true;
    }
    
    // Method 3: String conversion check for different serialization formats
    if (String(book.isPremium).toLowerCase() === 'true') {
      isPremiumBook = true;
    }
    
    // Method 4: Perform a direct database query to bypass serialization
    if (!isPremiumBook) {
      try {
        // Use a lean query for raw data
        const premiumCheck = await Book.findById(bookId)
          .select('isPremium price')
          .lean();
        
        if (premiumCheck) {
          if (premiumCheck.isPremium === true) {
            isPremiumBook = true;
          }
          
          if (typeof premiumCheck.price === 'number' && premiumCheck.price > 0) {
            isPremiumBook = true;
          }
        }
      } catch (err) {
        console.error(`Error in direct premium check for book ${bookId}:`, err);
      }
    }
    
    // Log premium status for debugging
    console.log(`[COIN PURCHASE] Book premium check for purchase - ID: ${bookId}, isPremiumBook: ${isPremiumBook}`);
    console.log(`[COIN PURCHASE] - Raw isPremium: ${book.isPremium} (${typeof book.isPremium})`);
    console.log(`[COIN PURCHASE] - Raw price: ${book.price} (${typeof book.price})`);
    
    // If the book is not premium after all checks, return an error
    if (!isPremiumBook) {
      console.log(`[COIN PURCHASE] Book ${bookId} is not premium, cannot purchase`);
      return res.status(400).json({ message: 'This book is not a premium book' });
    }
    
    // Ensure the price is a number
    const bookPrice = typeof book.price === 'number' ? book.price : 
                     (isPremiumBook && (!book.price || book.price <= 0) ? 25 : 0);
    
    console.log(`[COIN PURCHASE] Book price determined to be ${bookPrice} coins`);
    
    // Find the user
    const user = await User.findById(req.user._id);
    
    if (!user) {
      console.log(`[COIN PURCHASE] User ${req.user._id} not found`);
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log(`[COIN PURCHASE] User ${user._id} current coin balance: ${user.coins}`);
    
    // Check if the user already owns the book
    if (user.purchasedBooks.includes(bookId)) {
      console.log(`[COIN PURCHASE] User ${user._id} already owns book ${bookId}`);
      return res.status(400).json({ 
        message: 'You already own this book. No need to purchase it again.',
        alreadyOwned: true
      });
    }
    
    // ADDED: Check if purchase record already exists (double check for duplicate purchase)
    const existingPurchase = await Purchase.findOne({ user: user._id, book: bookId });
    if (existingPurchase) {
      console.log(`[COIN PURCHASE] Found existing purchase record for user ${user._id} and book ${bookId}`);
      
      // Fix user's purchased books if the book isn't in their list but a purchase record exists
      if (!user.purchasedBooks.includes(bookId)) {
        console.log(`[COIN PURCHASE] Fixing user's purchased books list - adding missing book ${bookId}`);
        user.purchasedBooks.push(bookId);
        await user.save();
        console.log(`[COIN PURCHASE] Fixed user's purchased books list - added missing book ${bookId}`);
      }
      
      return res.status(400).json({ 
        message: 'You already own this book. No need to purchase it again.',
        alreadyOwned: true
      });
    }
    
    // Check if the user has enough coins
    if (user.coins < bookPrice) {
      console.log(`[COIN PURCHASE] User ${user._id} has insufficient coins: ${user.coins} < ${bookPrice}`);
      return res.status(400).json({ 
        message: 'Not enough coins to purchase this book',
        required: bookPrice,
        available: user.coins
      });
    }
    
    // If the book is premium but doesn't have a price set properly, update it
    if (isPremiumBook && (!book.isPremium || book.price <= 0)) {
      console.log(`[COIN PURCHASE] Fixing premium book data for "${book.title}" (${book._id}) in purchase flow`);
      book.isPremium = true;
      book.price = bookPrice > 0 ? bookPrice : 25; // Default to 25 if no price
      await book.save();
      console.log(`[COIN PURCHASE] Updated premium book: isPremium=${book.isPremium}, price=${book.price}`);
    }
    
    // Generate a transaction ID
    const transactionId = uuidv4();
    const balanceBefore = user.coins;
    
    console.log(`[COIN PURCHASE] Starting transaction ${transactionId} - deducting ${bookPrice} coins from user ${user._id}`);
    
    // Deduct coins and add book to user's purchased books
    user.coins -= bookPrice;
    user.purchasedBooks.push(bookId);
    
    // Save changes to user in a try/catch block
    try {
      await user.save();
      console.log(`[COIN PURCHASE] Successfully deducted coins - new balance: ${user.coins}`);
    } catch (saveErr) {
      console.error(`[COIN PURCHASE] Failed to save user after coin deduction:`, saveErr);
      throw saveErr; // Re-throw to be caught by outer catch
    }
    
    // Create purchase record with try-catch for duplicate key errors
    try {
      const purchase = new Purchase({
        user: user._id,
        book: book._id,
        price: bookPrice,
        purchaseDate: new Date(),
        bookDetails: {
          title: book.title,
          author: book.author,
          category: book.category,
          coverImage: book.coverImage
        },
        transactionId,
        balanceBefore,
        balanceAfter: user.coins
      });
      
      await purchase.save();
      console.log(`[COIN PURCHASE] Purchase record created with ID: ${purchase._id}`);
    } catch (err) {
      if (err.code === 11000 && err.keyPattern && err.keyPattern.user && err.keyPattern.book) {
        // This is a duplicate key error on the user-book index
        // It means the user has already purchased this book
        console.log(`[COIN PURCHASE] Duplicate purchase detected - User ${user._id} had already purchased book ${bookId}`);
        
        // No need to roll back since we checked for existing purchase earlier
        // Just return success since the user now has the book
        return res.status(200).json({
          message: 'Book is now in your library',
          coins: user.coins,
          bookId: book._id,
          bookTitle: book.title,
          alreadyPurchased: true
        });
      } else {
        // For other errors, we need to roll back the coin deduction
        console.error('[COIN PURCHASE] Error saving purchase record:', err);
        
        // Roll back changes to user
        console.log(`[COIN PURCHASE] Rolling back coin deduction - restoring balance from ${user.coins} to ${balanceBefore}`);
        user.coins = balanceBefore;
        user.purchasedBooks = user.purchasedBooks.filter(id => id.toString() !== bookId);
        
        try {
          await user.save();
          console.log(`[COIN PURCHASE] Successfully rolled back changes to user`);
        } catch (rollbackErr) {
          console.error(`[COIN PURCHASE] Failed to roll back changes to user:`, rollbackErr);
          // Continue with the error flow even if rollback fails
        }
        
        throw err; // Re-throw to be caught by outer catch
      }
    }
    
    // If we got here, the purchase was successful
    console.log(`[COIN PURCHASE] ✅ Purchase successful - User ${user._id} purchased book ${bookId} for ${bookPrice} coins`);
    
    res.status(200).json({
      message: 'Book purchased successfully',
      coins: user.coins,
      coinsSpent: bookPrice,
      bookId: book._id,
      bookTitle: book.title,
      transactionId
    });
  } catch (error) {
    console.error('[COIN PURCHASE] ❌ Error purchasing book:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Check if user has claimed daily coins
// @route   GET /api/coins/daily-status
// @access  Private
const checkDailyCoinsStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get today's date with time set to midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate next reward time (next day at midnight)
    const nextRewardTime = new Date(today);
    nextRewardTime.setDate(nextRewardTime.getDate() + 1);

    // Check if user already claimed daily coins
    const hasClaimed = user.lastCoinReward && new Date(user.lastCoinReward) >= today;

    // If claimed, calculate when they can claim again
    let claimAgainTime = null;
    if (hasClaimed) {
      claimAgainTime = nextRewardTime.toISOString();
    }

    res.status(200).json({
      hasClaimed,
      nextRewardTime: claimAgainTime,
      lastClaimTime: user.lastCoinReward ? new Date(user.lastCoinReward).toISOString() : null
    });
  } catch (error) {
    console.error('Error checking daily coins status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getUserCoins,
  awardDailyCoins,
  awardAdCoins,
  awardDailyCoinsToAll,
  purchaseBook,
  checkDailyCoinsStatus
}; 