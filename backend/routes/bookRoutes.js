/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
const express = require('express');
const router = express.Router();
const {
  getBooks,
  getCategories,
  getTags,
  getBook,
  incrementDownloads
} = require('../controllers/bookController');
const {
  getBookReviews,
  getBookRating,
  createBookReview
} = require('../controllers/reviewController');
const { protect, admin, validateAuth, checkProPlanBookAccess } = require('../middleware/auth');
const { 
  apiKeyAuth, 
  apiKeyReadPermission,
  apiKeyGetPdfPermission,
  apiKeyPostReviewsPermission,
  trackBookSearchUsage,
  trackReviewPostingUsage 
} = require('../middleware/apiKeyAuth');
const Book = require('../models/Book');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const mongoose = require('mongoose');
const bookController = require('../controllers/bookController');
const fs = require('fs');
const path = require('path');

// Helper function to safely get a Subscription model
const getSubscriptionModel = () => {
  // First check if the model is already registered with mongoose
  if (mongoose.models.Subscription) {
    return mongoose.models.Subscription;
  }
  
  // If not found, try to require one of the models
  try {
    return require('../models/Subscription');
  } catch (mainErr) {
    try {
      return require('../models/subscriptionModel');
    } catch (altErr) {
      console.error('Could not load any Subscription model:', altErr);
      return null;
    }
  }
};

// Authentication middleware that supports both JWT and API key auth
const flexAuth = async (req, res, next) => {
  // Check if token exists in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      const token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id || decoded._id).select('-password');

      if (!req.user) {
        // If user not found but we need strict auth, send error
        // Otherwise just continue without user
        if (req.path.includes('/reviews') && req.method === 'POST') {
          return res.status(401).json({ 
            message: 'User not found with this token',
            code: 'USER_NOT_FOUND'
          });
        }
      }

      // Check if user is banned
      if (req.user && req.user.isBanned) {
        return res.status(403).json({
          message: 'Your account has been suspended. Please contact support.',
          code: 'ACCOUNT_SUSPENDED'
        });
      }
    } catch (error) {
      console.error('Token verification error in flexAuth:', error);
      
      // If this is a review creation route, handle auth errors
      if (req.path.includes('/reviews') && req.method === 'POST') {
        if (error.name === 'JsonWebTokenError') {
          return res.status(401).json({ 
            message: 'Invalid token format',
            code: 'INVALID_TOKEN'
          });
        } else if (error.name === 'TokenExpiredError') {
          return res.status(401).json({ 
            message: 'Token expired',
            code: 'TOKEN_EXPIRED'
          });
        }
        
        return res.status(401).json({ 
          message: 'Not authorized, token failed',
          code: 'AUTH_FAILED',
          error: error.message
        });
      }
      // For other routes, just continue without user auth
    }
  }
  
  // Allow request to proceed
  // For review creation, we'll check for auth in the route handler
  next();
};

// Public routes - no authentication required
router.get('/', flexAuth, getBooks);
router.get('/categories', getCategories);
router.get('/tags', getTags);

// Get single book - flex auth (will check auth if needed for premium)
// Note that checkProPlanBookAccess middleware is added to scan for pro plan access
router.get('/:id', flexAuth, checkProPlanBookAccess, getBook);

// Increment download count - no authentication needed
router.post('/:id/download', incrementDownloads);

// Review routes
router.get('/:bookId/reviews', getBookReviews);
router.get('/:bookId/rating', getBookRating);

// Create review route - requires authentication and checks permissions for API keys
router.post('/:bookId/reviews', flexAuth, async (req, res, next) => {
  // Ensure the user is authenticated
  if (!req.user || !req.user._id) {
    return res.status(401).json({ 
      message: 'Authentication required to post reviews',
      code: 'AUTH_REQUIRED'
    });
  }
  
  // If using API key, check for review posting permission and track usage
  if (req.apiKey) {
    return apiKeyPostReviewsPermission(req, res, async (err) => {
      if (err) return next(err);
      trackReviewPostingUsage(req, res, async (err) => {
        if (err) return next(err);
        // Call the actual controller
        createBookReview(req, res, next);
      });
    });
  } else {
    // JWT authenticated user without limits
    createBookReview(req, res, next);
  }
});

// PDF routes - support both new and legacy URLs (with API key auth)
router.get('/pdf/:id', apiKeyAuth, bookController.servePdf);

// Legacy endpoint for backward compatibility (with API key auth)
router.get('/:id/pdf', apiKeyAuth, bookController.servePdf);

// PDF content endpoints (with API key auth)
router.get('/:id/pdf-content', apiKeyAuth, bookController.servePdfContent);

// Diagnostic endpoint to test PDF URL parsing
router.get('/test-pdf-url/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    // Get the PDF URL based on the URL type
    let pdfUrl;
    let pdfType;
    
    if (book.isCustomUrl && book.customURLPDF) {
      // Custom URL
      pdfUrl = book.customURLPDF;
      pdfType = "custom";
    } else {
      // Standard Cloudinary URL - use it directly without adding extension
      pdfUrl = book.pdfUrl;
      pdfType = "standard";
    }
    
    // Create filename
    const fileName = `${book.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    
    // Return diagnostic information
    res.json({
      bookId: book._id,
      title: book.title,
      originalUrl: book.pdfUrl,
      pdfId: book.pdfId,
      isCustomUrl: book.isCustomUrl || false,
      customURLPDF: book.customURLPDF || '',
      effectiveUrl: pdfUrl,
      urlType: pdfType,
      fileName: fileName
    });
  } catch (error) {
    console.error('Error in PDF URL test endpoint:', error);
    res.status(500).json({ message: 'Error testing PDF URL', error: error.message });
  }
});

// Protected routes
router.use(protect);

// Admin routes
router.post('/', checkProPlanBookAccess, bookController.createBook);
router.put('/:id', checkProPlanBookAccess, bookController.updateBook);
router.delete('/:id', checkProPlanBookAccess, bookController.deleteBook);

module.exports = router; 