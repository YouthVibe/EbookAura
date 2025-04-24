const express = require('express');
const router = express.Router();
const {
  getUserCoins,
  awardDailyCoins,
  awardAdCoins,
  awardDailyCoinsToAll,
  purchaseBook,
  checkDailyCoinsStatus
} = require('../controllers/coinController');
const { protect, admin } = require('../middleware/auth');

// Get user coins - requires authentication
router.get('/', protect, getUserCoins);

// Check if daily coins have been claimed - requires authentication
router.get('/daily-status', protect, checkDailyCoinsStatus);

// Award daily coins - requires authentication
router.post('/daily', protect, awardDailyCoins);

// Award coins for watching ad - requires authentication
router.post('/ad-reward', protect, awardAdCoins);

// Award daily coins to all users - requires admin rights
router.post('/reward-all', protect, admin, awardDailyCoinsToAll);

// Purchase a book with coins - requires authentication
router.post('/purchase/:bookId', protect, purchaseBook);

module.exports = router; 