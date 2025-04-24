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

// Subscription routes
router.get('/plans', getSubscriptionPlans);
router.get('/my-subscription', getUserSubscription);
router.get('/current', getCurrentSubscription);
router.get('/history', getSubscriptionHistory);

router.post('/', createSubscription);
router.post('/purchase', purchaseSubscription);

router.put('/cancel', cancelSubscription);
router.put('/toggle-auto-renew', toggleAutoRenew);

router.patch('/:id', updateSubscription);
router.post('/:id/cancel', cancelSubscriptionById);

module.exports = router; 