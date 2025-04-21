const ApiKey = require('../models/ApiKey');
const crypto = require('crypto');

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
const revokeApiKey = async (req, res) => {
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

module.exports = {
  createApiKey,
  getApiKeys,
  getApiKeyById,
  updateApiKey,
  revokeApiKey,
  activateApiKey,
  deleteApiKey
}; 