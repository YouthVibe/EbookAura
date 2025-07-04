/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
const User = require('../models/User');
const Book = require('../models/Book');
const Purchase = require('../models/Purchase');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');

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

// @desc    Award coins for time spent on site (1 coin per minute)
// @route   POST /api/coins/activity-reward
// @access  Private
const awardActivityCoins = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get current time
    const currentTime = new Date();
    
    // Calculate coins to award: 5 coins per minute (60 seconds)
    // Minimum 1 coin, even if less than a minute
    const minutesSpent = Math.max(1, Math.floor(user.sessionTimeToday / 60));
    const coinsToAward = minutesSpent * 5;

    // Award coins based on minutes spent
    user.coins += coinsToAward;
    user.lastSessionReward = currentTime;
    // Reset the session time after claiming reward
    user.sessionTimeToday = 0;
    await user.save();

    res.status(200).json({ 
      message: `Activity reward: ${coinsToAward} coins awarded for ${minutesSpent} minute(s) of activity!`, 
      coins: user.coins,
      coinsAdded: coinsToAward,
      minutesSpent: minutesSpent
    });
  } catch (error) {
    console.error('Error awarding activity reward coins:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update user session time
// @route   POST /api/coins/update-session
// @access  Private
const updateSessionTime = async (req, res) => {
  try {
    const { sessionDuration } = req.body; // Duration in seconds
    
    if (!sessionDuration || typeof sessionDuration !== 'number' || sessionDuration <= 0) {
      return res.status(400).json({ message: 'Invalid session duration' });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get today's date with time set to midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // If it's a new day, reset the session time
    if (user.lastSessionStart && new Date(user.lastSessionStart) < today) {
      user.sessionTimeToday = 0;
    }

    // Update session time
    user.sessionTimeToday += sessionDuration;
    user.lastSessionStart = new Date();
    await user.save();

    // Calculate minutes accumulated and allow claim at any time
    const minutesAccumulated = Math.floor(user.sessionTimeToday / 60);
    
    // User can claim reward if they have accumulated at least 1 minute
    const canClaimReward = minutesAccumulated > 0;

    res.status(200).json({
      message: 'Session time updated successfully',
      sessionTimeToday: user.sessionTimeToday,
      canClaimReward,
      requiredTime: 60, // 1 minute in seconds
      minutesAccumulated
    });
  } catch (error) {
    console.error('Error updating session time:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get user's session time stats
// @route   GET /api/coins/session-status
// @access  Private
const getSessionStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate minutes accumulated (1 minute = 60 seconds)
    const minutesAccumulated = Math.floor(user.sessionTimeToday / 60);
    
    // Calculate progress percentage towards next minute
    const secondsTowardsNextMinute = user.sessionTimeToday % 60;
    const progressPercentage = Math.floor((secondsTowardsNextMinute / 60) * 100);

    res.status(200).json({
      sessionTimeToday: user.sessionTimeToday,
      requiredTime: 60, // 1 minute in seconds
      hasClaimedReward: false, // Always allow claiming
      progress: progressPercentage,
      canClaimReward: minutesAccumulated > 0,
      nextRewardTime: null, // No restriction on next reward
      minutesAccumulated,
      coinsAvailable: minutesAccumulated
    });
  } catch (error) {
    console.error('Error getting session status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Award coins for watching ad (25 coins)
// @route   POST /api/coins/ad-reward
// @access  Private
const awardAdCoins = async (req, res) => {
  try {
    const { adUrl } = req.body;
    
    if (!adUrl || adUrl !== 'https://www.profitableratecpm.com/tv0ps1rfet?key=a753be44cf1e6c5a853397fa67fe886c') {
      return res.status(400).json({ 
        message: 'Invalid ad URL provided',
        code: 'INVALID_AD_URL'
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ 
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check if user can watch ad now
    if (user.nextAdAvailable && new Date() < new Date(user.nextAdAvailable)) {
      return res.status(429).json({
        message: 'Please wait before watching another ad',
        nextAvailable: user.nextAdAvailable,
        code: 'AD_COOLDOWN'
      });
    }

    // Award 10 coins for watching ad
    user.coins += 10;
    
    // Set next available time to 10 seconds from now
    user.nextAdAvailable = new Date(Date.now() + 10000); // 10 seconds
    
    await user.save();

    res.status(200).json({
      message: 'Ad reward coins awarded successfully!',
      coins: user.coins,
      coinsAdded: 10,
      nextAdAvailable: user.nextAdAvailable
    });
  } catch (error) {
    console.error('Error awarding ad coins:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Award daily coins to all users (10 coins)
// @route   POST /api/coins/reward-all
// @access  Admin
const awardDailyCoinsToAll = async (req, res) => {
  try {
    // Check if an amount was specified, default to 10
    const { amount = 10 } = req.body;
    
    // Find all users
    const users = await User.find({});
    
    if (!users || users.length === 0) {
      return res.status(404).json({ message: 'No users found' });
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let rewardedCount = 0;
    let alreadyRewardedCount = 0;
    
    // Loop through each user and award coins
    for (const user of users) {
      // Skip users who already claimed today
      if (user.lastCoinReward && new Date(user.lastCoinReward) >= today) {
        alreadyRewardedCount++;
        continue;
      }
      
      // Award coins and update last reward date
      user.coins += amount;
      user.lastCoinReward = new Date();
      await user.save();
      rewardedCount++;
    }
    
    res.status(200).json({ 
      message: `Daily coins awarded to ${rewardedCount} users. ${alreadyRewardedCount} users already claimed today.`,
      rewardedCount,
      alreadyRewardedCount,
      totalUsers: users.length
    });
  } catch (error) {
    console.error('Error awarding daily coins to all users:', error);
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

// @desc    Purchase a book with coins
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
    
    // For premium books, return a message that they can only be accessed with a subscription
    if (isPremiumBook) {
      console.log(`[COIN PURCHASE] Book ${bookId} is premium, informing user about subscription requirement`);
      return res.status(403).json({ 
        message: 'Premium books can only be accessed with an active subscription. Please subscribe to access this book.',
        requiresSubscription: true
      });
    }
    
    // For non-premium books, process normal purchase
    console.log(`[COIN PURCHASE] Book ${bookId} is not premium, proceeding with normal purchase`);
    
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
    
    // NEW: Check if user has Pro plan access (free access to all premium books)
    let hasProAccess = false;
    
    // Get the registered Subscription model if it exists
    let SubscriptionToUse;
    
    // First, check if either model is already registered with mongoose
    if (mongoose.models.Subscription) {
      SubscriptionToUse = mongoose.models.Subscription;
    } else {
      // If not found, try to require one of the models
      try {
        SubscriptionToUse = require('../models/Subscription');
      } catch (mainErr) {
        try {
          SubscriptionToUse = require('../models/subscriptionModel');
        } catch (altErr) {
          console.error('Could not load any Subscription model:', altErr);
        }
      }
    }
    
    if (SubscriptionToUse) {
      try {
        // Check for active Pro subscription
        const subscription = await SubscriptionToUse.findOne({
          user: user._id,
          status: 'active'
        }).populate('plan');
        
        if (subscription && subscription.plan) {
          hasProAccess = (subscription.plan.name && 
                          subscription.plan.name.toLowerCase().includes('pro')) || 
                         (subscription.plan.benefits && 
                          subscription.plan.benefits.maxPremiumBooks === Infinity);
        }
        
        // If no active subscription with Pro access, check for past Pro subscriptions
        if (!hasProAccess) {
          const pastProSubscription = await SubscriptionToUse.findOne({
            user: user._id,
            status: { $in: ['expired', 'canceled'] }
          }).populate('plan');
          
          if (pastProSubscription && pastProSubscription.plan) {
            hasProAccess = (pastProSubscription.plan.name && 
                            pastProSubscription.plan.name.toLowerCase().includes('pro')) || 
                           (pastProSubscription.plan.benefits && 
                            pastProSubscription.plan.benefits.maxPremiumBooks === Infinity);
          }
        }
      } catch (err) {
        console.error('[COIN PURCHASE] Error checking for Pro plan:', err);
      }
    } else {
      console.warn('[COIN PURCHASE] No Subscription model available to check for Pro plan');
    }
    
    // If user has Pro access, add book to their library without charging coins
    if (hasProAccess) {
      console.log(`[COIN PURCHASE] User ${user._id} has Pro plan access, granting free access to book ${bookId}`);
      
      // Add book to user's purchased books
      user.purchasedBooks.push(bookId);
      
      // Save changes to user
      try {
        await user.save();
        console.log(`[COIN PURCHASE] Successfully added book to Pro user's library`);
        
        // Create a $0 purchase record for the Pro user
        const purchase = new Purchase({
          user: user._id,
          book: book._id,
          price: 0, // $0 purchase because of Pro plan
          purchaseDate: new Date(),
          bookDetails: {
            title: book.title,
            author: book.author,
            category: book.category,
            coverImage: book.coverImage
          },
          transactionId: uuidv4(),
          balanceBefore: user.coins,
          balanceAfter: user.coins,
          purchaseMethod: 'pro_plan' // Indicate this was through Pro plan
        });
        
        await purchase.save();
        console.log(`[COIN PURCHASE] Pro plan access purchase record created with ID: ${purchase._id}`);
        
        return res.status(200).json({
          message: 'Book added to your library (Pro plan benefit)',
          coins: user.coins,
          bookId: book._id,
          bookTitle: book.title,
          proPlanBenefit: true
        });
      } catch (err) {
        console.error('[COIN PURCHASE] Error processing Pro plan access:', err);
        return res.status(500).json({ message: 'Error processing your request' });
      }
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
    console.error('Error in purchaseBook:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reset daily session time at midnight (for cron job)
// @route   N/A - Called by scheduled job
// @access  Private (system only)
const resetDailySessionTime = async () => {
  try {
    console.log('Starting daily session time reset...');
    const result = await User.updateMany(
      {}, // update all users
      { 
        $set: { 
          sessionTimeToday: 0 
        } 
      }
    );
    
    console.log(`Session time reset for ${result.modifiedCount} users.`);
    return { success: true, message: `Session time reset for ${result.modifiedCount} users.` };
  } catch (error) {
    console.error('Error resetting session time:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  getUserCoins,
  awardDailyCoins,
  awardActivityCoins,
  updateSessionTime,
  getSessionStatus,
  awardAdCoins,
  awardDailyCoinsToAll,
  checkDailyCoinsStatus,
  purchaseBook,
  resetDailySessionTime
};