/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
const ApiKey = require('../models/ApiKey');
const User = require('../models/User');
const ApiKeyUsageHistory = require('../models/ApiKeyUsageHistory');
const asyncHandler = require('express-async-handler');

/**
 * Middleware to authenticate using API key
 * Adds user info to req.user if valid API key is provided
 */
const apiKeyAuth = asyncHandler(async (req, res, next) => {
  const apiKeyHeader = req.headers['x-api-key'];
  
  // If no API key provided, move to the next middleware
  if (!apiKeyHeader) {
    return next();
  }
  
  try {
    // Find the API key in the database
    const apiKey = await ApiKey.findOne({ key: apiKeyHeader });
    
    // If API key not found in our new system, try the legacy lookup on User model
    if (!apiKey) {
      // Find user by legacy API key field
      const user = await User.findOne({ apiKey: apiKeyHeader }).select('-password');
      
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
      
      // Set authenticated user on request object using legacy approach
      req.user = user;
      req.apiKeyAuthenticated = true;
      
      // Update lastUsed timestamp for analytics
      user.lastApiKeyUsed = new Date();
      await user.save();
      
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
      
      return next();
    }
    
    // If API key not active, reject the request
    if (!apiKey.isActive) {
      return res.status(401).json({
        success: false,
        message: 'API key has been revoked'
      });
    }
    
    // Get the user associated with this API key
    const user = await User.findById(apiKey.user).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User associated with this API key not found'
      });
    }
    
    // If user is banned, deny access
    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: 'This account has been suspended'
      });
    }
    
    // Set authenticated user and API key on request object
    req.user = user;
    req.apiKey = apiKey;
    req.apiKeyAuthenticated = true;
    
    // Update last used timestamp for analytics
    apiKey.lastUsed = new Date();
    await apiKey.save();
    
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
    
    return next();
  } catch (error) {
    console.error('API key authentication error:', error);
    // Don't block the request, just pass to the next middleware
    next();
  }
});

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
 * Middleware to ensure user has a subscription
 * Used in combination with apiKeyAuth
 */
const requireSubscription = (req, res, next) => {
  if (!req.hasSubscription) {
    return res.status(403).json({
      success: false,
      message: 'Subscription required to access this resource'
    });
  }
  
  next();
};

/**
 * Middleware to ensure user has a Pro Plan
 */
const requireProPlan = (req, res, next) => {
  if (!req.hasSubscription || req.planType !== 'pro') {
    return res.status(403).json({
      success: false,
      message: 'Pro Plan required to access this resource'
    });
  }
  
  next();
};

/**
 * Middleware to check for read permission
 */
const apiKeyReadPermission = (req, res, next) => {
  if (!req.apiKey) {
    // Skip permission check if not using API key auth
    return next();
  }
  
  if (!req.apiKey.permissions.read) {
    return res.status(403).json({
      message: 'API key does not have read permission',
      code: 'PERMISSION_DENIED'
    });
  }
  
  next();
};

/**
 * Middleware to check for write permission
 */
const apiKeyWritePermission = (req, res, next) => {
  if (!req.apiKey) {
    // Skip permission check if not using API key auth
    return next();
  }
  
  if (!req.apiKey.permissions.write) {
    return res.status(403).json({
      message: 'API key does not have write permission',
      code: 'PERMISSION_DENIED'
    });
  }
  
  next();
};

/**
 * Middleware to check for PDF access permission
 */
const apiKeyGetPdfPermission = (req, res, next) => {
  if (!req.apiKey) {
    // Skip permission check if not using API key auth
    return next();
  }
  
  if (!req.apiKey.permissions.getPdf) {
    return res.status(403).json({
      message: 'API key does not have PDF access permission',
      code: 'PERMISSION_DENIED'
    });
  }
  
  next();
};

/**
 * Middleware to check for download permission
 */
const apiKeyDownloadPermission = (req, res, next) => {
  if (!req.apiKey) {
    // Skip permission check if not using API key auth
    return next();
  }
  
  if (!req.apiKey.permissions.download) {
    return res.status(403).json({
      message: 'API key does not have download permission',
      code: 'PERMISSION_DENIED'
    });
  }
  
  next();
};

/**
 * Middleware to check for post reviews permission
 */
const apiKeyPostReviewsPermission = (req, res, next) => {
  if (!req.apiKey) {
    // Skip permission check if not using API key auth
    return next();
  }
  
  if (!req.apiKey.permissions.postReviews) {
    return res.status(403).json({
      message: 'API key does not have post reviews permission',
      code: 'PERMISSION_DENIED'
    });
  }
  
  next();
};

/**
 * Middleware to check and track book search limits
 */
const trackBookSearchUsage = asyncHandler(async (req, res, next) => {
  const apiKey = req.apiKey;
  
  if (!apiKey) {
    res.status(500);
    throw new Error('API key middleware not applied');
  }
  
  // Check if the daily limit has been reached
  if (apiKey.usage.booksSearched >= apiKey.limits.booksPerDay) {
    res.status(429);
    throw new Error(`Daily limit for book searches (${apiKey.limits.booksPerDay}) has been reached`);
  }
  
  // Increment usage counter
  apiKey.usage.booksSearched += 1;
  apiKey.lastUsed = Date.now();
  
  // Save to the database
  await apiKey.save();
  
  // Record the usage in the history collection
  await ApiKeyUsageHistory.recordUsage(apiKey._id, { booksSearched: 1 });
  
  console.log(`API key ${apiKey.name} (${apiKey._id}) used: ${apiKey.usage.booksSearched}/${apiKey.limits.booksPerDay} book searches today`);
  
  next();
});

/**
 * Middleware to check and track review posting limits
 */
const trackReviewPostingUsage = asyncHandler(async (req, res, next) => {
  const apiKey = req.apiKey;
  
  if (!apiKey) {
    res.status(500);
    throw new Error('API key middleware not applied');
  }
  
  // Check if the daily limit has been reached
  if (apiKey.usage.reviewsPosted >= apiKey.limits.reviewsPerDay) {
    res.status(429);
    throw new Error(`Daily limit for review posts (${apiKey.limits.reviewsPerDay}) has been reached`);
  }
  
  // Increment usage counter
  apiKey.usage.reviewsPosted += 1;
  apiKey.lastUsed = Date.now();
  
  // Save to the database
  await apiKey.save();
  
  // Record the usage in the history collection
  await ApiKeyUsageHistory.recordUsage(apiKey._id, { reviewsPosted: 1 });
  
  console.log(`API key ${apiKey.name} (${apiKey._id}) used: ${apiKey.usage.reviewsPosted}/${apiKey.limits.reviewsPerDay} review posts today`);
  
  next();
});

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