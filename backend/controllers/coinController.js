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

    // Find the book
    const book = await Book.findById(bookId);
    
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    // Check if the book is premium
    if (!book.isPremium) {
      return res.status(400).json({ message: 'This book is not a premium book' });
    }
    
    // Find the user
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if the user already owns the book
    if (user.purchasedBooks.includes(bookId)) {
      return res.status(400).json({ message: 'You already own this book. No need to purchase it again.' });
    }
    
    // Check if the user has enough coins
    if (user.coins < book.price) {
      return res.status(400).json({ 
        message: 'Not enough coins to purchase this book',
        required: book.price,
        available: user.coins
      });
    }
    
    // Generate a transaction ID
    const transactionId = uuidv4();
    const balanceBefore = user.coins;
    
    // Deduct coins and add book to user's purchased books
    user.coins -= book.price;
    user.purchasedBooks.push(bookId);
    await user.save();
    
    // Create purchase record
    const purchase = new Purchase({
      user: user._id,
      book: book._id,
      price: book.price,
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
    
    res.status(200).json({
      message: 'Book purchased successfully',
      coins: user.coins,
      coinsSpent: book.price,
      bookId: book._id,
      bookTitle: book.title,
      transactionId
    });
  } catch (error) {
    console.error('Error purchasing book:', error);
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