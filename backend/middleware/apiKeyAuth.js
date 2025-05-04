/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
const ApiKey = require('../models/ApiKey');
const User = require('../models/User');

/**
 * Middleware to authenticate using API key
 * Adds user info to req.user if valid API key is provided
 */
const apiKeyAuth = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  // If no API key provided, move to the next middleware
  if (!apiKey) {
    return next();
  }
  
  try {
    // Find user by API key
    const user = await User.findOne({ apiKey }).select('-password');
    
    if (!user) {
      // Invalid API key, but don't block the request yet
      // Just move to the next middleware without setting req.user
      return next();
    }
    
    // If user is banned, deny access
    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: 'This account has been suspended'
      });
    }
    
    // Set authenticated user on request object
    req.user = user;
    req.apiKeyAuthenticated = true;
    
    // Check subscription status and add to request
    if (user.planActive) {
      // Check if plan is active but expired
      if (user.planExpiresAt) {
        const now = new Date();
        if (new Date(user.planExpiresAt) < now) {
          // Plan has expired, update the user record
          user.planActive = false;
          await user.save();
          req.hasSubscription = false;
        } else {
          req.hasSubscription = true;
          req.planType = user.planType;
        }
      } else {
        req.hasSubscription = true;
        req.planType = user.planType;
      }
    } else {
      req.hasSubscription = false;
    }
    
    next();
  } catch (error) {
    console.error('API key authentication error:', error);
    // Don't block the request, just pass to the next middleware
    next();
  }
};

/**
 * Middleware to ensure that an API key is provided
 * Requires the apiKeyAuth middleware to be called first
 */
const requireApiKey = (req, res, next) => {
  if (!req.user || !req.apiKeyAuthenticated) {
    return res.status(401).json({
      success: false,
      message: 'Valid API key required'
    });
  }
  
  next();
};

/**
 * Middleware to check subscription status for API key
 * Requires the apiKeyAuth middleware to be called first
 */
const requireSubscription = (req, res, next) => {
  if (!req.user || !req.apiKeyAuthenticated) {
    return res.status(401).json({
      success: false,
      message: 'Valid API key required'
    });
  }
  
  if (!req.hasSubscription) {
    return res.status(403).json({
      success: false,
      message: 'Active subscription required'
    });
  }
  
  next();
};

/**
 * Middleware to check for Pro plan subscription
 * Requires the apiKeyAuth middleware to be called first
 */
const requireProPlan = (req, res, next) => {
  if (!req.user || !req.apiKeyAuthenticated) {
    return res.status(401).json({
      success: false,
      message: 'Valid API key required'
    });
  }
  
  if (!req.hasSubscription) {
    return res.status(403).json({
      success: false,
      message: 'Active subscription required'
    });
  }
  
  console.log(`API key authenticated user with active subscription: plan type = ${req.planType}`);
  next();
};

/**
 * Middleware to check if API key has read permission
 */
const apiKeyReadPermission = (req, res, next) => {
  if (!req.apiKey) {
    return res.status(500).json({
      message: 'API key middleware error',
      code: 'MIDDLEWARE_ERROR'
    });
  }
  
  if (req.apiKey.permissions.read) {
    next();
  } else {
    return res.status(403).json({
      message: 'API key does not have read permission',
      code: 'INSUFFICIENT_PERMISSIONS'
    });
  }
};

/**
 * Middleware to check if API key has write permission
 */
const apiKeyWritePermission = (req, res, next) => {
  if (!req.apiKey) {
    return res.status(500).json({
      message: 'API key middleware error',
      code: 'MIDDLEWARE_ERROR'
    });
  }
  
  if (req.apiKey.permissions.write) {
    next();
  } else {
    return res.status(403).json({
      message: 'API key does not have write permission',
      code: 'INSUFFICIENT_PERMISSIONS'
    });
  }
};

/**
 * Middleware to check if API key has getPdf permission
 */
const apiKeyGetPdfPermission = (req, res, next) => {
  if (!req.apiKey) {
    return res.status(500).json({
      message: 'API key middleware error',
      code: 'MIDDLEWARE_ERROR'
    });
  }
  
  if (req.apiKey.permissions.getPdf) {
    next();
  } else {
    return res.status(403).json({
      message: 'API key does not have PDF access permission',
      code: 'INSUFFICIENT_PERMISSIONS'
    });
  }
};

/**
 * Middleware to check if API key has download permission
 */
const apiKeyDownloadPermission = (req, res, next) => {
  if (!req.apiKey) {
    return res.status(500).json({
      message: 'API key middleware error',
      code: 'MIDDLEWARE_ERROR'
    });
  }
  
  if (req.apiKey.permissions.download) {
    next();
  } else {
    return res.status(403).json({
      message: 'API key does not have download permission',
      code: 'INSUFFICIENT_PERMISSIONS'
    });
  }
};

/**
 * Middleware to check if API key has postReviews permission
 */
const apiKeyPostReviewsPermission = (req, res, next) => {
  if (!req.apiKey) {
    return res.status(500).json({
      message: 'API key middleware error',
      code: 'MIDDLEWARE_ERROR'
    });
  }
  
  if (req.apiKey.permissions.postReviews) {
    next();
  } else {
    return res.status(403).json({
      message: 'API key does not have review posting permission',
      code: 'INSUFFICIENT_PERMISSIONS'
    });
  }
};

/**
 * Middleware to check and track book search limits
 */
const trackBookSearchUsage = async (req, res, next) => {
  if (!req.apiKey) {
    return res.status(500).json({
      message: 'API key middleware error',
      code: 'MIDDLEWARE_ERROR'
    });
  }
  
  try {
    // Reset counters if a day has passed
    req.apiKey.resetUsageIfNeeded();
    
    // Check if daily limit is reached
    if (req.apiKey.usage.booksSearched >= req.apiKey.limits.booksPerDay) {
      // Calculate time until reset (next midnight UTC)
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const hoursUntilReset = Math.ceil((tomorrow - now) / (1000 * 60 * 60));
      
      return res.status(429).json({
        message: 'Daily book search limit reached',
        code: 'RATE_LIMIT_EXCEEDED',
        limit: req.apiKey.limits.booksPerDay,
        used: req.apiKey.usage.booksSearched,
        reset: req.apiKey.usage.lastReset,
        resetIn: `${hoursUntilReset} hours`
      });
    }
    
    // Increment usage counter
    req.apiKey.usage.booksSearched++;
    await req.apiKey.save();
    
    next();
  } catch (error) {
    console.error('Error tracking book search usage:', error);
    // Continue to the next middleware even if tracking fails
    // This ensures the API remains functional even if usage tracking has issues
    next();
  }
};

/**
 * Middleware to check and track review posting limits
 */
const trackReviewPostingUsage = async (req, res, next) => {
  if (!req.apiKey) {
    return res.status(500).json({
      message: 'API key middleware error',
      code: 'MIDDLEWARE_ERROR'
    });
  }
  
  try {
    // Reset counters if a day has passed
    req.apiKey.resetUsageIfNeeded();
    
    // Check if daily limit is reached
    if (req.apiKey.usage.reviewsPosted >= req.apiKey.limits.reviewsPerDay) {
      // Calculate time until reset (next midnight UTC)
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const hoursUntilReset = Math.ceil((tomorrow - now) / (1000 * 60 * 60));
      
      return res.status(429).json({
        message: 'Daily review posting limit reached',
        code: 'RATE_LIMIT_EXCEEDED',
        limit: req.apiKey.limits.reviewsPerDay,
        used: req.apiKey.usage.reviewsPosted,
        reset: req.apiKey.usage.lastReset,
        resetIn: `${hoursUntilReset} hours`
      });
    }
    
    // Increment usage counter
    req.apiKey.usage.reviewsPosted++;
    await req.apiKey.save();
    
    next();
  } catch (error) {
    console.error('Error tracking review posting usage:', error);
    // Continue to the next middleware even if tracking fails
    // This ensures the API remains functional even if usage tracking has issues
    next();
  }
};

module.exports = {
  apiKeyAuth,
  requireApiKey,
  requireSubscription,
  requireProPlan,
  apiKeyReadPermission,
  apiKeyWritePermission, 
  apiKeyGetPdfPermission,
  apiKeyDownloadPermission,
  apiKeyPostReviewsPermission,
  trackBookSearchUsage,
  trackReviewPostingUsage
}; 