const express = require('express');
const { protect } = require('../middleware/auth');
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
  cancelSubscriptionById
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

module.exports = router; 