const jwt = require('jsonwebtoken');
const User = require('../models/User');

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

module.exports = { protect, admin, validateAuth }; 