const express = require('express');
const router = express.Router();
const { 
  getUserReviews, 
  deleteReview, 
  deleteAllUserReviews 
} = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

// User review routes
router.get('/user', protect, getUserReviews);
router.delete('/user/all', protect, deleteAllUserReviews);
router.delete('/:id', protect, deleteReview);

module.exports = router; 