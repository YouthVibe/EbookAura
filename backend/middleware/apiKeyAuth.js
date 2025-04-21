const ApiKey = require('../models/ApiKey');
const User = require('../models/User');

/**
 * Middleware to authenticate requests with API key
 * Sets req.user and req.apiKey if authentication is successful
 */
const apiKeyAuth = async (req, res, next) => {
  // Get API key from headers
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      message: 'API key is required',
      code: 'NO_API_KEY'
    });
  }
  
  try {
    // Find the API key in the database
    const key = await ApiKey.findOne({ key: apiKey });
    
    if (!key) {
      return res.status(401).json({
        message: 'Invalid API key',
        code: 'INVALID_API_KEY'
      });
    }
    
    // Check if API key is active
    if (!key.isActive) {
      return res.status(401).json({
        message: 'This API key has been deactivated',
        code: 'INACTIVE_API_KEY'
      });
    }
    
    // Reset usage counters if a day has passed
    try {
      key.resetUsageIfNeeded();
      // Update last used timestamp
      key.lastUsed = Date.now();
      await key.save();
    } catch (error) {
      console.error('Error updating API key usage data:', error);
      // Continue with authentication even if usage tracking fails
    }
    
    // Get the user associated with this API key
    const user = await User.findById(key.user).select('-password');
    
    if (!user) {
      return res.status(401).json({
        message: 'User associated with this API key not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Check if user is banned
    if (user.isBanned) {
      return res.status(403).json({
        message: 'This account has been suspended',
        code: 'ACCOUNT_SUSPENDED'
      });
    }
    
    // Set user and apiKey on the request object
    req.user = user;
    req.apiKey = key;
    
    next();
  } catch (error) {
    console.error('API key authentication error:', error);
    return res.status(500).json({
      message: 'Server error during API key authentication',
      code: 'SERVER_ERROR'
    });
  }
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
  apiKeyReadPermission,
  apiKeyWritePermission, 
  apiKeyGetPdfPermission,
  apiKeyDownloadPermission,
  apiKeyPostReviewsPermission,
  trackBookSearchUsage,
  trackReviewPostingUsage
}; 