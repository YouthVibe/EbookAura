/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
const express = require('express');
const router = express.Router();
const { 
  getBookReviews,
  getBookRating,
  createBookReview,
  getUserReviews,
  deleteReview
} = require('../controllers/reviewController');
const { protect, admin } = require('../middleware/auth');
const { apiKeyPostReviewsPermission, trackReviewPostingUsage } = require('../middleware/apiKeyAuth');

// Public routes - these must come before the router.use(protect) middleware
router.get('/book/:bookId', getBookReviews);
router.get('/:id', (req, res) => {
  res.status(404).json({ message: 'Individual review details not implemented yet' });
});

// Protected routes
router.use(protect);

// User reviews
router.get('/user/:userId', getUserReviews);

// Track usage when posting reviews via API key
router.post('/', (req, res) => {
  res.status(404).json({ message: 'Direct review creation not implemented yet - use /api/books/:bookId/reviews instead' });
});
router.put('/:id', (req, res) => {
  res.status(404).json({ message: 'Review update not implemented yet' });
});
router.delete('/:id', deleteReview);

module.exports = router; 