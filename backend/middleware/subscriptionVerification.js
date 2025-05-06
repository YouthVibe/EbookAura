/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Book = require('../models/Book');
const { syncSubscriptionStatus } = require('../controllers/subscriptionController');

/**
 * Middleware to verify that a user has an active subscription
 * Requires the protect middleware to run first to attach user to req
 */
const subscriptionRequired = asyncHandler(async (req, res, next) => {
  // Check if the user was set by the protect middleware
  if (!req.user) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }

  // Get the fresh user data to check subscription status
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Check if the user has an active subscription
  if (!user.planActive) {
    res.status(403);
    throw new Error('Subscription required to access this resource');
  }

  // Verify that subscription hasn't expired
  if (user.planExpiresAt && new Date(user.planExpiresAt) < new Date()) {
    // Update the user to mark their subscription as inactive
    user.planActive = false;
    await user.save();
    
    res.status(403);
    throw new Error('Subscription has expired');
  }

  // Attach subscription info to the request
  req.subscription = {
    active: user.planActive,
    type: user.planType,
    expiresAt: user.planExpiresAt
  };

  next();
});

/**
 * Middleware to verify if a book is premium and if the user needs subscription
 * Skip the check if the book is not premium
 */
const isPremiumContent = asyncHandler(async (req, res, next) => {
  try {
    // Get the book ID from the params
    const bookId = req.params.id || req.params.bookId;
    
    if (!bookId) {
      return next();
    }
    
    // Check if the book exists and is premium
    const book = await Book.findById(bookId);
    
    if (!book) {
      res.status(404);
      throw new Error('Book not found');
    }
    
    // If the book is not premium, let the request pass
    if (!book.isPremium) {
      return next();
    }
    
    // If the book is premium, verify the user has a subscription
    // Only do this if user is authenticated
    if (req.user) {
      if (!req.user.planActive) {
        res.status(403);
        throw new Error('Subscription required to access premium content');
      }
    } else {
      // For non-authenticated users, don't block but set flag for the route to handle
      req.isPremiumContent = true;
    }
    
    next();
  } catch (error) {
    console.error('Error in premium content verification middleware:', error);
    next(error);
  }
});

/**
 * Middleware to verify and sync subscription status
 * This should be used after the protect middleware to ensure req.user is available
 */
const verifySubscription = async (req, res, next) => {
  try {
    // Only run for authenticated users
    if (!req.user || !req.user._id) {
      return next();
    }
    
    const userId = req.user._id;
    
    // Don't block the request flow, but start the sync process
    syncSubscriptionStatus(userId)
      .then(result => {
        if (result.success) {
          // Set planActive in the req.user object so it's available to the route handler
          req.user.planActive = result.planActive;
          req.user.hasSubscription = result.planActive; // Alias for backward compatibility
        }
      })
      .catch(error => {
        console.error('Error in subscription verification middleware:', error);
      });
    
    // Continue with the request without waiting for sync to complete
    next();
  } catch (error) {
    console.error('Error in subscription verification middleware:', error);
    next();
  }
};

module.exports = { subscriptionRequired, verifySubscription, isPremiumContent, requireSubscription: subscriptionRequired }; 