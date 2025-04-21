const express = require('express');
const { protect } = require('../middleware/auth');
const {
  createApiKey,
  getApiKeys,
  getApiKeyById,
  updateApiKey,
  revokeApiKey,
  activateApiKey,
  deleteApiKey
} = require('../controllers/apiKeyController');

const router = express.Router();

// All routes are protected with JWT authentication
router.use(protect);

// GET /api/api-keys - Get all API keys for the current user
router.get('/', getApiKeys);

// POST /api/api-keys - Create a new API key
router.post('/', createApiKey);

// GET /api/api-keys/:id - Get a specific API key
router.get('/:id', getApiKeyById);

// PUT /api/api-keys/:id - Update API key permissions
router.put('/:id', updateApiKey);

// PUT /api/api-keys/:id/revoke - Revoke an API key
router.put('/:id/revoke', revokeApiKey);

// PUT /api/api-keys/:id/activate - Activate an API key
router.put('/:id/activate', activateApiKey);

// DELETE /api/api-keys/:id - Delete an API key
router.delete('/:id', deleteApiKey);

module.exports = router; 