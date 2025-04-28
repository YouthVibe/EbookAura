const jwt = require('jsonwebtoken');
const User = require('../models/User');
const mongoose = require('mongoose');

// Middleware to protect routes with JWT authentication
const protect = async (req, res, next) => {
  let token;

  // Check if token exists in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ 
          message: 'User not found with this token',
          code: 'USER_NOT_FOUND'
        });
      }

      // Check if user is banned
      if (req.user.isBanned) {
        return res.status(403).json({
          message: 'Your account has been suspended. Please contact support.',
          code: 'ACCOUNT_SUSPENDED'
        });
      }

      next();
    } catch (error) {
      console.error('Token verification error:', error);
      
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
  } else if (!token) {
    return res.status(401).json({ 
      message: 'Not authorized, no token provided',
      code: 'NO_TOKEN'
    });
  }
};

// Middleware to check if user is an admin
const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({
      message: 'Not authorized as an admin',
      code: 'NOT_ADMIN'
    });
  }
};

// Middleware to validate API key and token together
const validateAuth = async (req, res, next) => {
  let token;
  const apiKey = req.headers['x-api-key'];

  // Check if API key exists
  if (!apiKey) {
    return res.status(401).json({ 
      message: 'API key is required',
      code: 'NO_API_KEY'
    });
  }

  // Check if token exists in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ 
          message: 'User not found with this token',
          code: 'USER_NOT_FOUND'
        });
      }

      // Check if user is banned
      if (req.user.isBanned) {
        return res.status(403).json({
          message: 'Your account has been suspended. Please contact support.',
          code: 'ACCOUNT_SUSPENDED'
        });
      }

      // API key is validated here (basic validation - should be enhanced in production)
      // In a real system, API keys should be stored in the database and validated
      if (!apiKey.startsWith('ak_')) {
        return res.status(401).json({ 
          message: 'Invalid API key format',
          code: 'INVALID_API_KEY'
        });
      }

      next();
    } catch (error) {
      console.error('Authentication error:', error);
      
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
  } else if (!token) {
    return res.status(401).json({ 
      message: 'Not authorized, no token provided',
      code: 'NO_TOKEN'
    });
  }
};

/**
 * Helper function to safely get a registered Mongoose model or require it
 * @param {string} modelName - The name of the model to look for
 * @param {string} modelPath - The path to require the model from if not found
 * @returns {Model} The mongoose model
 */
const getSafeModel = (modelName, modelPath) => {
  try {
    // Check if the model is already registered
    return mongoose.models[modelName] || require(modelPath);
  } catch (err) {
    console.error(`Error loading model ${modelName} from ${modelPath}:`, err);
    return null;
  }
};

/**
 * Middleware to check if a user has access to premium books through a Pro plan
 * This should be used after the protect middleware
 * It will enhance the req.user object with a hasProAccess property
 */
const checkProPlanBookAccess = async (req, res, next) => {
  // Skip if user is not authenticated
  if (!req.user || !req.user._id) {
    return next();
  }

  try {
    const userId = req.user._id;
    
    // Try to get the Subscription model safely
    let SubscriptionToUse;
    
    // First, check if models are already registered
    if (mongoose.models.Subscription) {
      SubscriptionToUse = mongoose.models.Subscription;
    } else {
      // If not found, try to require them (but handle potential errors)
      try {
        SubscriptionToUse = require('../models/Subscription');
      } catch (mainErr) {
        try {
          SubscriptionToUse = require('../models/subscriptionModel');
        } catch (altErr) {
          console.error('Could not load any Subscription model:', altErr);
        }
      }
    }
    
    if (!SubscriptionToUse) {
      console.error('Could not find valid Subscription model');
      req.user.hasProAccess = false;
      return next();
    }
    
    // Get SubscriptionPlan model if needed for population
    let SubscriptionPlanModel;
    if (mongoose.models.SubscriptionPlan) {
      SubscriptionPlanModel = mongoose.models.SubscriptionPlan;
    } else {
      try {
        SubscriptionPlanModel = require('../models/subscriptionPlanModel');
      } catch (err) {
        // Non-critical, as we'll check the plan info carefully later
        console.warn('Could not load SubscriptionPlan model, will proceed with caution');
      }
    }
    
    // Check for current active subscriptions first
    const activeSubscription = await SubscriptionToUse.findOne({
      user: userId,
      status: 'active'
    }).populate('plan');

    // If user has an active subscription
    if (activeSubscription && activeSubscription.plan) {
      // Check if it's a pro plan that should have access to all premium books
      // We're looking for plans with 'Pro' in the name or with unlimited premium books
      const isPlanPro = activeSubscription.plan.name && 
                        activeSubscription.plan.name.toLowerCase().includes('pro') ||
                        (activeSubscription.plan.benefits && 
                         activeSubscription.plan.benefits.maxPremiumBooks === Infinity);
      
      if (isPlanPro) {
        req.user.hasProAccess = true;
        console.log(`User ${userId} has Pro plan access to all premium books`);
        return next();
      }
    }

    // If no active pro subscription, check for past pro subscriptions
    const pastProSubscription = await SubscriptionToUse.findOne({
      user: userId,
      status: { $in: ['expired', 'canceled'] }
    }).populate('plan');

    if (pastProSubscription && pastProSubscription.plan) {
      // Check if it was a pro plan
      const wasPlanPro = pastProSubscription.plan.name && 
                         pastProSubscription.plan.name.toLowerCase().includes('pro') ||
                         (pastProSubscription.plan.benefits && 
                          pastProSubscription.plan.benefits.maxPremiumBooks === Infinity);
      
      if (wasPlanPro) {
        req.user.hasProAccess = true;
        console.log(`User ${userId} has Pro plan access from past subscription`);
        return next();
      }
    }

    // If neither current nor past pro subscription exists
    req.user.hasProAccess = false;
    return next();
    
  } catch (error) {
    console.error('Error checking pro plan access:', error);
    // Don't block the request if there's an error checking subscription
    req.user.hasProAccess = false;
    return next();
  }
};

module.exports = { protect, admin, validateAuth, checkProPlanBookAccess }; 