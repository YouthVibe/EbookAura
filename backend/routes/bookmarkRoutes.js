const express = require('express');
const router = express.Router();
const { 
  getUserBookmarks, 
  deleteBookmark, 
  deleteAllUserBookmarks 
} = require('../controllers/bookmarkController');
const { protect } = require('../middleware/auth');

// User bookmark routes
router.get('/', protect, getUserBookmarks);
router.delete('/all', protect, deleteAllUserBookmarks);
router.delete('/:id', protect, deleteBookmark);

module.exports = router; 