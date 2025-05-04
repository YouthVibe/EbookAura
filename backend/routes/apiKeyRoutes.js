const express = require('express');
const router = express.Router();
const {
  createApiKey,
  getApiKeys,
  updateApiKey,
  revokeApiKeyById,
  revokeApiKey,
  activateApiKey,
  deleteApiKey,
  generateApiKey,
  getCurrentApiKey,
  verifyApiKey
} = require('../controllers/apiKeyController');
const { protect, admin } = require('../middleware/auth');

// Private routes (require authentication)
router.post('/generate', protect, generateApiKey);
router.get('/current', protect, getCurrentApiKey);
router.delete('/revoke', protect, revokeApiKey);

// Public routes
router.post('/verify', verifyApiKey);

// Admin routes
router.post('/', protect, admin, createApiKey);
router.get('/', protect, admin, getApiKeys);
router.put('/:id', protect, admin, updateApiKey);
router.put('/:id/revoke', protect, admin, revokeApiKeyById);
router.put('/:id/activate', protect, admin, activateApiKey);
router.delete('/:id', protect, admin, deleteApiKey);

module.exports = router; 