/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
const express = require('express');
const router = express.Router();
const {
  createApiKey,
  getApiKeys,
  getApiKeyById,
  updateApiKey,
  revokeApiKeyById,
  activateApiKey,
  deleteApiKey,
  generateApiKey,
  getCurrentApiKey,
  verifyApiKey,
  getApiKeyUsage,
  getApiKeyUsageHistory,
  revokeApiKey
} = require('../controllers/apiKeyController');
const { protect, admin } = require('../middleware/auth');

// Public routes
router.post('/verify', verifyApiKey);

// Private routes (require authentication)
router.post('/', protect, createApiKey);
router.post('/generate', protect, generateApiKey);
router.get('/current', protect, getCurrentApiKey);
router.post('/revoke', protect, revokeApiKey);

// Private routes with ID parameter
router.get('/:id', protect, getApiKeyById);
router.put('/:id', protect, updateApiKey);
router.put('/:id/revoke', protect, revokeApiKeyById);
router.put('/:id/activate', protect, activateApiKey);
router.delete('/:id', protect, deleteApiKey);
router.get('/:id/usage', protect, getApiKeyUsage);
router.get('/:id/usage/history', protect, getApiKeyUsageHistory);

// Admin routes
router.get('/', protect, getApiKeys);

module.exports = router; 