/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
const ApiKey = require('../models/ApiKey');
const crypto = require('crypto');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');

/**
 * @desc    Create a new API key
 * @route   POST /api/api-keys
 * @access  Private
 */
const createApiKey = async (req, res) => {
  try {
    const { name, permissions } = req.body;
    
    if (!name) {
      return res.status(400).json({
        message: 'API key name is required',
        code: 'NAME_REQUIRED'
      });
    }
    
    // Check if user already has 5 API keys
    const hasReachedLimit = await ApiKey.hasReachedLimit(req.user._id);
    if (hasReachedLimit) {
      return res.status(400).json({
        message: 'You have reached the maximum limit of 5 API keys',
        code: 'API_KEY_LIMIT_REACHED'
      });
    }
    
    // Create new API key
    const apiKey = new ApiKey({
      user: req.user._id,
      name: name,
      key: crypto.randomBytes(32).toString('hex')  // Explicitly set the key
    });
    
    // Set permissions if provided
    if (permissions) {
      // Only set the permissions that are explicitly provided
      if (typeof permissions.read === 'boolean') {
        apiKey.permissions.read = permissions.read;
      }
      if (typeof permissions.write === 'boolean') {
        apiKey.permissions.write = permissions.write;
      }
      if (typeof permissions.getPdf === 'boolean') {
        apiKey.permissions.getPdf = permissions.getPdf;
      }
      if (typeof permissions.download === 'boolean') {
        apiKey.permissions.download = permissions.download;
      }
      if (typeof permissions.postReviews === 'boolean') {
        apiKey.permissions.postReviews = permissions.postReviews;
      }
    }
    
    await apiKey.save();
    
    res.status(201).json({
      message: 'API key created successfully',
      apiKey: {
        id: apiKey._id,
        name: apiKey.name,
        key: apiKey.key, // This is shown only once when creating the key
        permissions: apiKey.permissions,
        limits: apiKey.limits,
        createdAt: apiKey.createdAt,
        isActive: apiKey.isActive
      }
    });
  } catch (error) {
    console.error('Error creating API key:', error);
    res.status(500).json({
      message: 'Server error while creating API key',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * @desc    Get all API keys for the current user
 * @route   GET /api/api-keys
 * @access  Private
 */
const getApiKeys = async (req, res) => {
  try {
    const apiKeys = await ApiKey.find({ user: req.user._id });
    
    // Map to remove the actual key value for security
    const secureApiKeys = apiKeys.map(key => ({
      id: key._id,
      name: key.name,
      permissions: key.permissions,
      limits: key.limits,
      usage: key.usage,
      lastUsed: key.lastUsed,
      isActive: key.isActive,
      createdAt: key.createdAt
    }));
    
    res.json({
      message: 'API keys retrieved successfully',
      apiKeys: secureApiKeys
    });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    res.status(500).json({
      message: 'Server error while fetching API keys',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * @desc    Get a specific API key
 * @route   GET /api/api-keys/:id
 * @access  Private
 */
const getApiKeyById = async (req, res) => {
  try {
    const apiKey = await ApiKey.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!apiKey) {
      return res.status(404).json({
        message: 'API key not found',
        code: 'API_KEY_NOT_FOUND'
      });
    }
    
    res.json({
      message: 'API key retrieved successfully',
      apiKey: {
        id: apiKey._id,
        name: apiKey.name,
        permissions: apiKey.permissions,
        limits: apiKey.limits,
        usage: apiKey.usage,
        lastUsed: apiKey.lastUsed,
        isActive: apiKey.isActive,
        createdAt: apiKey.createdAt
      }
    });
  } catch (error) {
    console.error('Error fetching API key:', error);
    res.status(500).json({
      message: 'Server error while fetching API key',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * @desc    Update API key permissions
 * @route   PUT /api/api-keys/:id
 * @access  Private
 */
const updateApiKey = async (req, res) => {
  try {
    const { name, permissions } = req.body;
    
    const apiKey = await ApiKey.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!apiKey) {
      return res.status(404).json({
        message: 'API key not found',
        code: 'API_KEY_NOT_FOUND'
      });
    }
    
    // Update name if provided
    if (name) {
      apiKey.name = name;
    }
    
    // Update permissions if provided
    if (permissions) {
      if (typeof permissions.read === 'boolean') {
        apiKey.permissions.read = permissions.read;
      }
      if (typeof permissions.write === 'boolean') {
        apiKey.permissions.write = permissions.write;
      }
      if (typeof permissions.getPdf === 'boolean') {
        apiKey.permissions.getPdf = permissions.getPdf;
      }
      if (typeof permissions.download === 'boolean') {
        apiKey.permissions.download = permissions.download;
      }
      if (typeof permissions.postReviews === 'boolean') {
        apiKey.permissions.postReviews = permissions.postReviews;
      }
    }
    
    await apiKey.save();
    
    res.json({
      message: 'API key updated successfully',
      apiKey: {
        id: apiKey._id,
        name: apiKey.name,
        permissions: apiKey.permissions,
        limits: apiKey.limits,
        isActive: apiKey.isActive,
        createdAt: apiKey.createdAt
      }
    });
  } catch (error) {
    console.error('Error updating API key:', error);
    res.status(500).json({
      message: 'Server error while updating API key',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * @desc    Revoke/Disable an API key
 * @route   PUT /api/api-keys/:id/revoke
 * @access  Private
 */
const revokeApiKeyById = async (req, res) => {
  try {
    const apiKey = await ApiKey.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!apiKey) {
      return res.status(404).json({
        message: 'API key not found',
        code: 'API_KEY_NOT_FOUND'
      });
    }
    
    apiKey.isActive = false;
    await apiKey.save();
    
    res.json({
      message: 'API key revoked successfully',
      apiKey: {
        id: apiKey._id,
        name: apiKey.name,
        isActive: apiKey.isActive
      }
    });
  } catch (error) {
    console.error('Error revoking API key:', error);
    res.status(500).json({
      message: 'Server error while revoking API key',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * @desc    Activate a previously revoked API key
 * @route   PUT /api/api-keys/:id/activate
 * @access  Private
 */
const activateApiKey = async (req, res) => {
  try {
    const apiKey = await ApiKey.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!apiKey) {
      return res.status(404).json({
        message: 'API key not found',
        code: 'API_KEY_NOT_FOUND'
      });
    }
    
    apiKey.isActive = true;
    await apiKey.save();
    
    res.json({
      message: 'API key activated successfully',
      apiKey: {
        id: apiKey._id,
        name: apiKey.name,
        isActive: apiKey.isActive
      }
    });
  } catch (error) {
    console.error('Error activating API key:', error);
    res.status(500).json({
      message: 'Server error while activating API key',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * @desc    Delete an API key
 * @route   DELETE /api/api-keys/:id
 * @access  Private
 */
const deleteApiKey = async (req, res) => {
  try {
    const apiKey = await ApiKey.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!apiKey) {
      return res.status(404).json({
        message: 'API key not found',
        code: 'API_KEY_NOT_FOUND'
      });
    }
    
    await ApiKey.findByIdAndDelete(apiKey._id);
    
    res.json({
      message: 'API key deleted successfully',
      id: req.params.id
    });
  } catch (error) {
    console.error('Error deleting API key:', error);
    res.status(500).json({
      message: 'Server error while deleting API key',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * @desc    Generate a new API key for the user
 * @route   POST /api/api-keys/generate
 * @access  Private
 */
const generateApiKey = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Generate new API key
    const apiKey = user.generateApiKey();
    
    // Save user with new API key
    await user.save();
    
    return res.status(200).json({
      success: true,
      apiKey,
      message: 'API key generated successfully'
    });
  } catch (error) {
    console.error('Error generating API key:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating API key',
      error: error.message
    });
  }
});

/**
 * @desc    Get current API key for the user
 * @route   GET /api/api-keys/current
 * @access  Private
 */
const getCurrentApiKey = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      hasApiKey: !!user.apiKey,
      // Only show a masked version of the API key for security
      apiKey: user.apiKey ? `${user.apiKey.substring(0, 5)}...${user.apiKey.substring(user.apiKey.length - 5)}` : null
    });
  } catch (error) {
    console.error('Error getting API key:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting API key',
      error: error.message
    });
  }
});

/**
 * @desc    Revoke the current API key
 * @route   DELETE /api/api-keys/revoke
 * @access  Private
 */
const revokeApiKey = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Remove API key
    user.apiKey = undefined;
    
    // Save user with revoked API key
    await user.save();
    
    return res.status(200).json({
      success: true,
      message: 'API key revoked successfully'
    });
  } catch (error) {
    console.error('Error revoking API key:', error);
    res.status(500).json({
      success: false,
      message: 'Error revoking API key',
      error: error.message
    });
  }
});

/**
 * @desc    Verify an API key and return user info
 * @route   POST /api/api-keys/verify
 * @access  Public
 */
const verifyApiKey = asyncHandler(async (req, res) => {
  try {
    const { apiKey } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        message: 'API key is required'
      });
    }
    
    // Find user by API key
    const user = await User.findOne({ apiKey }).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API key'
      });
    }
    
    // If user is banned, deny access
    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: 'This account has been suspended'
      });
    }
    
    return res.status(200).json({
      success: true,
      userId: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      planActive: user.planActive,
      planType: user.planType,
      message: 'API key verified successfully'
    });
  } catch (error) {
    console.error('Error verifying API key:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying API key',
      error: error.message
    });
  }
});

module.exports = {
  createApiKey,
  getApiKeys,
  getApiKeyById,
  updateApiKey,
  revokeApiKeyById,
  activateApiKey,
  deleteApiKey,
  generateApiKey,
  getCurrentApiKey,
  revokeApiKey,
  verifyApiKey
}; 