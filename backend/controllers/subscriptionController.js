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
  
  // Check if the subscription has expired based on endDate
  const now = new Date();
  if (new Date(subscription.endDate) < now) {
    // Update the subscription status to expired in the database
    subscription.status = 'expired';
    await subscription.save();
    
    // Also update user's premium status
    await User.findByIdAndUpdate(userId, { 
      isPremium: false,
      isSubscribed: false
    });
    
    // Return a message indicating the subscription has expired
    return res.status(200).json({
      success: true,
      hasSubscription: false,
      message: 'Your subscription has expired',
      wasExpired: true,
      subscription: subscription
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
  
  // If payment method is 'coins', check if user has enough coins and deduct them
  if (paymentMethod === 'coins') {
    // Find the user
    const user = await User.findById(req.user.id);
    
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
    
    // Check if user has enough coins
    if (user.coins < plan.price) {
      res.status(400);
      throw new Error(`Not enough coins. You need ${plan.price} coins but have ${user.coins}`);
    }
    
    // Store the current balance for records
    const balanceBefore = user.coins;
    
    // Deduct coins from user balance
    user.coins -= plan.price;
    await user.save();
    
    // Log the transaction
    console.log(`Deducted ${plan.price} coins from user ${user._id} for subscription purchase. New balance: ${user.coins}`);
  } else {
    // For other payment methods (would connect to payment processors like Stripe)
    // For now, we'll simulate a successful payment
    const paymentSuccessful = true;
    
    if (!paymentSuccessful) {
      res.status(400);
      throw new Error('Payment failed. Please try again.');
    }
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
    paymentAmount: plan.price,
    currency: paymentMethod === 'coins' ? 'COINS' : plan.currency,
    transactionId: uuidv4()
  });
  
  // Update user's subscription status
  await User.findByIdAndUpdate(req.user.id, {
    isSubscribed: true,
    subscriptionTier: plan.name,
    isPremium: true
  });
  
  res.status(201).json({
    success: true,
    message: 'Subscription purchased successfully',
    data: subscription,
    subscription: subscription
  });
});

/**
 * @desc    Cancel subscription (disabled)
 * @route   PUT /api/subscriptions/cancel
 * @access  Private
 */
const cancelSubscription = asyncHandler(async (req, res) => {
  // Prevent cancellation
  return res.status(403).json({
    success: false,
    message: 'Subscription cancellation is not allowed. Subscriptions are non-refundable once purchased.'
  });
  
  // Original functionality commented out
  /*
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
  */
});

/**
 * @desc    Toggle auto-renew for subscription
 * @route   PATCH /api/subscriptions/auto-renew
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
  
  // Toggle auto renew
  subscription.autoRenew = !subscription.autoRenew;
  await subscription.save();
  
  res.status(200).json({
    success: true,
    message: `Auto-renew has been ${subscription.autoRenew ? 'enabled' : 'disabled'}`,
    autoRenew: subscription.autoRenew,
    data: subscription
  });
});

/**
 * @desc    Get subscription history
 * @route   GET /api/subscriptions/history
 * @access  Private
 */
const getSubscriptionHistory = asyncHandler(async (req, res) => {
  const subscriptions = await Subscription.find({
    user: req.user.id
  }).sort({ createdAt: -1 }).populate('plan');
  
  res.status(200).json({
    success: true,
    count: subscriptions.length,
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

  // If payment method is 'coins', check if user has enough coins and deduct them
  if (paymentMethod === 'coins') {
    // Find the user
    const user = await User.findById(req.user._id);
    
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
    
    // Check if user has enough coins
    if (user.coins < plan.price) {
      res.status(400);
      throw new Error(`Not enough coins. You need ${plan.price} coins but have ${user.coins}`);
    }
    
    // Store the current balance for records
    const balanceBefore = user.coins;
    
    // Deduct coins from user balance
    user.coins -= plan.price;
    await user.save();
    
    // Log the transaction
    console.log(`Deducted ${plan.price} coins from user ${user._id} for subscription purchase. New balance: ${user.coins}`);
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
    currency: paymentMethod === 'coins' ? 'COINS' : plan.currency,
    nextPaymentDate: endDate,
    transactionId: transactionId || uuidv4()
  });

  // Update user to premium status
  await User.findByIdAndUpdate(req.user._id, { 
    isPremium: true,
    isSubscribed: true,
    subscriptionTier: plan.name
  });

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

  // Check if the subscription has expired based on endDate
  const now = new Date();
  if (new Date(subscription.endDate) < now) {
    // Update the subscription status to expired in the database
    subscription.status = 'expired';
    await subscription.save();
    
    // Also update user's premium status
    await User.findByIdAndUpdate(userId, { 
      isPremium: false,
      isSubscribed: false
    });
    
    // Return a message indicating the subscription has expired
    return res.status(200).json({
      success: true,
      hasSubscription: false,
      message: 'Your subscription has expired',
      wasExpired: true,
      subscription: subscription
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
 * @desc    Cancel subscription by ID (disabled)
 * @route   DELETE /api/subscriptions/:id
 * @access  Private
 */
const cancelSubscriptionById = asyncHandler(async (req, res) => {
  // Prevent cancellation
  return res.status(403).json({
    success: false,
    message: 'Subscription cancellation is not allowed. Subscriptions are non-refundable once purchased.'
  });
  
  // Original functionality commented out
  /*
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

  // Only allow cancelling active subscriptions
  if (subscription.status !== 'active') {
    res.status(400);
    throw new Error('Only active subscriptions can be cancelled');
  }

  subscription.status = 'cancelled';
  subscription.autoRenew = false;
  subscription.cancelledAt = new Date();
  await subscription.save();

  res.status(200).json({
    success: true,
    message: 'Subscription cancelled successfully. You will have access until the end date.',
    subscription
  });
  */
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
  cancelSubscriptionById
}; 