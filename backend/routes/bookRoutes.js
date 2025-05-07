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
  incrementDownloads,
  createBook,
  updateBook,
  deleteBook,
  servePdf,
  servePdfContent
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
  trackReviewPostingUsage,
  apiKeyDownloadPermission
} = require('../middleware/apiKeyAuth');
const Book = require('../models/Book');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { requireSubscription, isPremiumContent } = require('../middleware/subscriptionVerification');

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
router.get('/popular', (req, res) => {
  res.status(200).json({ 
    message: 'Popular books feature coming soon', 
    books: [] 
  });
});
router.get('/new-releases', (req, res) => {
  res.status(200).json({ 
    message: 'New releases feature coming soon', 
    books: [] 
  });
});
router.get('/genre/:genre', (req, res) => {
  res.status(200).json({ 
    message: `Books for genre ${req.params.genre} coming soon`, 
    books: [] 
  });
});
router.get('/language/:language', (req, res) => {
  res.status(200).json({ 
    message: `Books for language ${req.params.language} coming soon`, 
    books: [] 
  });
});
router.get('/author/:author', (req, res) => {
  res.status(200).json({ 
    message: `Books by author ${req.params.author} coming soon`, 
    books: [] 
  });
});

// Search route with usage tracking
router.get('/search', trackBookSearchUsage, (req, res) => {
  res.status(200).json({ 
    message: 'Book search feature coming soon', 
    books: [] 
  });
});

// Get recommended books - requires authentication
router.get('/recommended', protect, (req, res) => {
  res.status(200).json({ 
    message: 'Recommended books feature coming soon', 
    books: [] 
  });
});

// PDF routes - support both new and legacy URLs (with API key auth)
router.get('/pdf/:id', apiKeyAuth, servePdf);

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

// Routes with bookId parameter
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

// Book data API routes with placeholders
router.get('/:id/download', (req, res) => {
  res.status(200).json({ 
    message: 'Book download feature coming soon' 
  });
});
router.get('/:id/data', (req, res) => {
  res.status(200).json({ 
    message: 'Book data feature coming soon' 
  });
});
router.get('/:id/files', (req, res) => {
  res.status(200).json({ 
    message: 'Book files list feature coming soon' 
  });
});

// Legacy endpoint for backward compatibility
router.get('/:id/pdf', (req, res) => {
  res.status(200).json({ 
    message: 'Book PDF retrieval feature coming soon' 
  });
});

// PDF content endpoints
router.get('/:id/pdf-content', (req, res) => {
  res.status(200).json({ 
    message: 'PDF content feature coming soon' 
  });
});

// Get single book - flex auth (will check auth if needed for premium)
router.get('/:id', flexAuth, checkProPlanBookAccess, getBook);

// Increment download count - replace the duplicate route
router.post('/:id/increment-download', (req, res) => {
  res.status(200).json({ 
    message: `Increment download count for book ID ${req.params.id}` 
  });
});

// Admin routes
router.post('/', protect, admin, createBook);
router.put('/:id', protect, admin, updateBook);
router.delete('/:id', protect, admin, deleteBook);

module.exports = router; 