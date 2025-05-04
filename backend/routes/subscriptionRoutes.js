const express = require('express');
const { protect, admin } = require('../middleware/auth');
const {
  getUserSubscription,
  getSubscriptionPlans,
  purchaseSubscription,
  cancelSubscription,
  toggleAutoRenew,
  getSubscriptionHistory,
  createSubscription,
  getCurrentSubscription,
  updateSubscription,
  cancelSubscriptionById,
  checkSubscription,
  activateSubscription,
  deactivateSubscription,
  checkSubscriptionByApiKey,
  subscriptionWebhook
} = require('../controllers/subscriptionController');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Get all available subscription plans
router.get('/plans', getSubscriptionPlans);

// Get user's current subscription
router.get('/my-subscription', getUserSubscription);
router.get('/current', getCurrentSubscription);

// Purchase a subscription plan
router.post('/purchase', purchaseSubscription);
router.post('/', createSubscription);

// Toggle auto-renew
router.patch('/auto-renew', toggleAutoRenew);

// Get subscription history
router.get('/history', getSubscriptionHistory);

// Update subscription (toggle auto-renew)
router.patch('/:id', updateSubscription);

// Cancellation routes - these will always return 403 Forbidden
router.put('/cancel', cancelSubscription);
router.delete('/:id', cancelSubscriptionById);

// Public routes (with API key)
router.get('/check-api', checkSubscriptionByApiKey);

// Protected routes (requires authentication)
router.get('/check', protect, checkSubscription);
router.get('/current', protect, getCurrentSubscription);

// Admin routes
router.post('/activate', protect, admin, activateSubscription);
router.post('/deactivate', protect, admin, deactivateSubscription);

// Webhook route
router.post('/webhook', subscriptionWebhook);

module.exports = router; 