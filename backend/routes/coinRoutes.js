/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
const express = require('express');
const router = express.Router();
const {
  getUserCoins,
  awardDailyCoins,
  awardAdCoins,
  awardDailyCoinsToAll,
  purchaseBook,
  checkDailyCoinsStatus,
  updateSessionTime,
  awardActivityCoins,
  getSessionStatus
} = require('../controllers/coinController');
const { protect, admin } = require('../middleware/auth');

// Get user coins - requires authentication
router.get('/', protect, getUserCoins);

// Check if daily coins have been claimed - requires authentication
router.get('/daily-status', protect, checkDailyCoinsStatus);

// Get session time status - requires authentication
router.get('/session-status', protect, getSessionStatus);

// Award daily coins - requires authentication
router.post('/daily', protect, awardDailyCoins);

// Update session time - requires authentication
router.post('/update-session', protect, updateSessionTime);

// Award coins for site activity - requires authentication
router.post('/activity-reward', protect, awardActivityCoins);

// Award coins for watching ad - requires authentication
router.post('/ad-reward', protect, awardAdCoins);

// Award daily coins to all users - requires admin rights
router.post('/reward-all', protect, admin, awardDailyCoinsToAll);

// Purchase a book with coins - requires authentication
router.post('/purchase/:bookId', protect, purchaseBook);

module.exports = router; 