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
    
    // Get the user with subscription information
    const user = await User.findById(userId);
    
    if (!user) {
      console.error(`User not found: ${userId}`);
      req.user.hasProAccess = false;
      return next();
    }
    
    // Check if the plan is still active
    if (user.planExpiresAt && user.planActive) {
      const now = new Date();
      if (new Date(user.planExpiresAt) < now) {
        // Plan has expired, update the database
        user.planActive = false;
        await user.save();
        
        req.user.hasProAccess = false;
        console.log(`User ${userId} subscription has expired`);
        return next();
      }
    }
    
    // Check if user has an active Pro plan
    const hasProAccess = user.planActive === true && user.planType === 'pro';
    
    // Set the access flag on the request object
    req.user.hasProAccess = hasProAccess;
    
    if (hasProAccess) {
      console.log(`User ${userId} has Pro plan access to all premium books`);
    } else {
      console.log(`User ${userId} does not have Pro plan access`);
    }
    
    return next();
  } catch (error) {
    console.error('Error checking pro plan access:', error);
    // Don't block the request if there's an error checking subscription
    req.user.hasProAccess = false;
    return next();
  }
};

module.exports = { protect, admin, validateAuth, checkProPlanBookAccess }; 