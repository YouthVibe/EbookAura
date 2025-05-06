/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  toggleUserBan,
  deleteUser,
  getAllBooks,
  deleteBook,
  updateBook,
  cleanupCloudinaryResources
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/auth');

// All routes are protected by both authentication and admin middleware
router.use(protect, admin);

// User management routes
router.get('/users', getAllUsers);
router.put('/users/:id/ban', toggleUserBan);
router.delete('/users/:id', deleteUser);

// Book management routes
router.get('/books', getAllBooks);
router.delete('/books/:id', deleteBook);
router.put('/books/:id', updateBook);

// Maintenance routes
router.post('/cleanup-cloudinary', cleanupCloudinaryResources);

module.exports = router; 