const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Subscription = require('../models/subscriptionModel');
const SubscriptionPlan = require('../models/subscriptionPlanModel');
const { ErrorResponse } = require('../utils/errorResponse');
const { v4: uuidv4 } = require('uuid');
const { addDuration } = require('../utils/dateUtils');

/**
 * @desc    Get all subscription plans
 * @route   GET /api/subscriptions/plans
 * @access  Public
 */
const getSubscriptionPlans = asyncHandler(async (req, res) => {
  const plans = await SubscriptionPlan.find({ isActive: true }).sort({ price: 1 });
  
  res.status(200).json({
    success: true,
    count: plans.length,
    plans: plans,
    data: plans
  });
});

/**
 * @desc    Get current user's subscription
 * @route   GET /api/subscriptions/my-subscription
 * @access  Private
 */
const getUserSubscription = asyncHandler(async (req, res) => {
  // Use either req.user.id or req.user._id depending on what's available
  const userId = req.user.id || req.user._id;
  
  const subscription = await Subscription.findOne({ 
    user: userId,
    status: { $in: ['active', 'pending', 'grace_period'] }
  }).populate('plan');
  
  if (!subscription) {
    // Instead of returning a 404 error, return a 200 with a message indicating no subscription
    return res.status(200).json({
      success: true,
      hasSubscription: false,
      message: 'No active subscription found'
    });
  }
  
  res.status(200).json({
    success: true,
    hasSubscription: true,
    data: subscription
  });
});

/**
 * @desc    Purchase a subscription
 * @route   POST /api/subscriptions/purchase
 * @access  Private
 */
const purchaseSubscription = asyncHandler(async (req, res) => {
  const { planId, paymentMethod } = req.body;
  
  if (!planId) {
    res.status(400);
    throw new Error('Please select a subscription plan');
  }
  
  if (!paymentMethod) {
    res.status(400);
    throw new Error('Please provide a payment method');
  }
  
  // Find the plan
  const plan = await SubscriptionPlan.findById(planId);
  
  if (!plan || !plan.isActive) {
    res.status(404);
    throw new Error('Subscription plan not found or inactive');
  }
  
  // Check if user already has an active subscription
  const existingSubscription = await Subscription.findOne({
    user: req.user.id,
    status: { $in: ['active', 'pending', 'grace_period'] }
  });
  
  if (existingSubscription) {
    res.status(400);
    throw new Error('You already have an active subscription');
  }
  
  // Process payment (this would connect to a payment provider like Stripe)
  // For now, we'll simulate a successful payment
  const paymentSuccessful = true;
  
  if (!paymentSuccessful) {
    res.status(400);
    throw new Error('Payment failed. Please try again.');
  }
  
  // Calculate expiration date based on plan duration
  const now = new Date();
  const expiresAt = new Date(now);
  
  if (plan.duration.unit === 'days') {
    expiresAt.setDate(expiresAt.getDate() + plan.duration.value);
  } else if (plan.duration.unit === 'months') {
    expiresAt.setMonth(expiresAt.getMonth() + plan.duration.value);
  } else if (plan.duration.unit === 'years') {
    expiresAt.setFullYear(expiresAt.getFullYear() + plan.duration.value);
  }
  
  // Create subscription
  const subscription = await Subscription.create({
    user: req.user.id,
    plan: planId,
    startDate: now,
    endDate: expiresAt,
    autoRenew: true,
    status: 'active',
    paymentMethod,
    paymentHistory: [{
      amount: plan.price,
      currency: plan.currency,
      date: now,
      status: 'completed'
    }]
  });
  
  // Update user's subscription status
  await User.findByIdAndUpdate(req.user.id, {
    isSubscribed: true,
    subscriptionTier: plan.name
  });
  
  res.status(201).json({
    success: true,
    message: 'Subscription purchased successfully',
    data: subscription
  });
});

/**
 * @desc    Cancel subscription
 * @route   PUT /api/subscriptions/cancel
 * @access  Private
 */
const cancelSubscription = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findOne({ 
    user: req.user.id,
    status: { $in: ['active', 'pending', 'grace_period'] }
  });
  
  if (!subscription) {
    return res.status(404).json({
      success: false,
      message: 'No active subscription found'
    });
  }
  
  // Update subscription to cancelled but let user keep access until end date
  subscription.status = 'cancelled';
  subscription.autoRenew = false;
  subscription.cancelledAt = new Date();
  await subscription.save();
  
  res.status(200).json({
    success: true,
    message: 'Subscription cancelled. You will have access until your current period ends.',
    data: subscription
  });
});

/**
 * @desc    Toggle auto-renew setting
 * @route   PUT /api/subscriptions/toggle-auto-renew
 * @access  Private
 */
const toggleAutoRenew = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findOne({ 
    user: req.user.id,
    status: 'active'
  });
  
  if (!subscription) {
    return res.status(404).json({
      success: false,
      message: 'No active subscription found'
    });
  }
  
  // Toggle auto-renew setting
  subscription.autoRenew = !subscription.autoRenew;
  await subscription.save();
  
  res.status(200).json({
    success: true,
    message: `Auto-renew is now ${subscription.autoRenew ? 'enabled' : 'disabled'}`,
    data: subscription
  });
});

/**
 * @desc    Get subscription history
 * @route   GET /api/subscriptions/history
 * @access  Private
 */
const getSubscriptionHistory = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user._id;
  
  const subscriptions = await Subscription.find({ 
    user: userId 
  }).populate('plan').sort({ createdAt: -1 });
  
  res.status(200).json({
    success: true,
    count: subscriptions.length,
    subscriptions: subscriptions,
    data: subscriptions
  });
});

/**
 * @desc    Create a new subscription
 * @route   POST /api/subscriptions
 * @access  Private
 */
const createSubscription = asyncHandler(async (req, res) => {
  const { planId, paymentMethod, transactionId } = req.body;

  if (!planId || !paymentMethod) {
    res.status(400);
    throw new Error('Please provide plan ID and payment method');
  }

  // Get subscription plan details
  const plan = await SubscriptionPlan.findById(planId);
  if (!plan) {
    res.status(404);
    throw new Error('Subscription plan not found');
  }

  // Check if user already has an active subscription
  const existingSubscription = await Subscription.findOne({
    user: req.user._id,
    status: 'active'
  });

  if (existingSubscription) {
    res.status(400);
    throw new Error('User already has an active subscription');
  }

  // Calculate end date based on plan duration
  const startDate = new Date();
  const endDate = addDuration(startDate, plan.duration.value, plan.duration.unit);

  // Create subscription
  const subscription = await Subscription.create({
    user: req.user._id,
    plan: planId,
    startDate,
    endDate,
    paymentMethod,
    paymentAmount: plan.price,
    currency: plan.currency,
    nextPaymentDate: endDate,
    transactionId
  });

  // Update user to premium status
  await User.findByIdAndUpdate(req.user._id, { isPremium: true });

  res.status(201).json({
    success: true,
    subscription
  });
});

/**
 * @desc    Get user's current subscription
 * @route   GET /api/subscriptions/current
 * @access  Private
 */
const getCurrentSubscription = asyncHandler(async (req, res) => {
  // Use either req.user.id or req.user._id depending on what's available
  const userId = req.user.id || req.user._id;
  
  const subscription = await Subscription.findOne({
    user: userId,
    status: 'active'
  }).populate('plan');

  if (!subscription) {
    // Instead of returning a 404 error, return a 200 with a message indicating no subscription
    return res.status(200).json({
      success: true,
      hasSubscription: false,
      message: 'No active subscription found'
    });
  }

  res.status(200).json({
    success: true,
    hasSubscription: true,
    subscription
  });
});

/**
 * @desc    Update subscription (toggle auto-renew)
 * @route   PATCH /api/subscriptions/:id
 * @access  Private
 */
const updateSubscription = asyncHandler(async (req, res) => {
  const { autoRenew } = req.body;

  if (autoRenew === undefined) {
    res.status(400);
    throw new Error('Please provide autoRenew value');
  }

  const subscription = await Subscription.findById(req.params.id);

  if (!subscription) {
    res.status(404);
    throw new Error('Subscription not found');
  }

  // Verify the subscription belongs to the user
  if (subscription.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('User not authorized to update this subscription');
  }

  // Only allow updating active subscriptions
  if (subscription.status !== 'active') {
    res.status(400);
    throw new Error('Only active subscriptions can be updated');
  }

  subscription.autoRenew = autoRenew;
  await subscription.save();

  res.status(200).json({
    success: true,
    subscription
  });
});

/**
 * @desc    Cancel subscription
 * @route   POST /api/subscriptions/:id/cancel
 * @access  Private
 */
const cancelSubscriptionById = asyncHandler(async (req, res) => {
  const { cancelReason } = req.body;

  const subscription = await Subscription.findById(req.params.id);

  if (!subscription) {
    res.status(404);
    throw new Error('Subscription not found');
  }

  // Verify the subscription belongs to the user
  if (subscription.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('User not authorized to cancel this subscription');
  }

  // Only allow canceling active subscriptions
  if (subscription.status !== 'active') {
    res.status(400);
    throw new Error('Only active subscriptions can be canceled');
  }

  subscription.status = 'canceled';
  subscription.autoRenew = false;
  subscription.canceledAt = new Date();
  subscription.cancelReason = cancelReason || 'User canceled';
  
  await subscription.save();

  // User still has premium until the end of the billing period
  // If we want immediate removal of premium status, uncomment below:
  // await User.findByIdAndUpdate(req.user._id, { isPremium: false });

  res.status(200).json({
    success: true,
    message: 'Subscription canceled successfully',
    subscription
  });
});

/**
 * @desc    Retry a failed subscription payment
 * @route   POST /api/subscriptions/:id/retry-payment
 * @access  Private
 */
const retryPayment = asyncHandler(async (req, res) => {
  const subscriptionId = req.params.id;
  
  // Find the subscription
  const subscription = await Subscription.findById(subscriptionId);
  
  if (!subscription) {
    res.status(404);
    throw new Error('Subscription not found');
  }
  
  // Verify the subscription belongs to the user
  if (subscription.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('User not authorized to retry payment for this subscription');
  }
  
  // Check if the subscription is in a valid state for retry
  if (!['pending', 'grace_period'].includes(subscription.status)) {
    res.status(400);
    throw new Error('This subscription is not eligible for payment retry');
  }
  
  // Process the payment (in a real-world scenario, this would connect to a payment processor)
  // Here we'll simulate a successful payment
  const paymentSuccessful = true;
  const paymentAmount = subscription.paymentAmount;
  const paymentCurrency = subscription.currency;
  const transactionId = uuidv4();
  
  if (paymentSuccessful) {
    // Update subscription status
    subscription.status = 'active';
    subscription.lastPaymentDate = new Date();
    
    // Calculate next payment date based on the subscription plan
    const plan = await SubscriptionPlan.findById(subscription.plan);
    subscription.nextPaymentDate = addDuration(new Date(), plan.duration.value, plan.duration.unit);
    
    // Add payment to history (would be implemented in a real app)
    // subscription.paymentHistory.push({
    //   amount: paymentAmount,
    //   currency: paymentCurrency,
    //   date: new Date(),
    //   status: 'completed',
    //   transactionId
    // });
    
    await subscription.save();
    
    // Update user's premium status
    await User.findByIdAndUpdate(subscription.user, { isPremium: true });
    
    return res.status(200).json({
      success: true,
      message: 'Payment processed successfully and subscription reactivated',
      data: {
        subscription,
        transaction: {
          id: transactionId,
          amount: paymentAmount,
          currency: paymentCurrency,
          date: new Date()
        }
      }
    });
  } else {
    // Handle failed payment
    return res.status(400).json({
      success: false,
      message: 'Payment processing failed. Please try again or use a different payment method.',
    });
  }
});

module.exports = {
  getSubscriptionPlans,
  getUserSubscription,
  purchaseSubscription,
  cancelSubscription,
  toggleAutoRenew,
  getSubscriptionHistory,
  createSubscription,
  getCurrentSubscription,
  updateSubscription,
  cancelSubscriptionById,
  retryPayment
}; 