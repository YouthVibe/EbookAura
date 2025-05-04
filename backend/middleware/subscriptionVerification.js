import asyncHandler from 'express-async-handler';
import User from '../models/User.js';

/**
 * Middleware to verify that a user has an active subscription
 * Requires the protect middleware to run first to attach user to req
 */
const subscriptionRequired = asyncHandler(async (req, res, next) => {
  // Check if the user was set by the protect middleware
  if (!req.user) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }

  // Get the fresh user data to check subscription status
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Check if the user has an active subscription
  if (!user.planActive) {
    res.status(403);
    throw new Error('Subscription required to access this resource');
  }

  // Verify that subscription hasn't expired
  if (user.planExpiresAt && new Date(user.planExpiresAt) < new Date()) {
    // Update the user to mark their subscription as inactive
    user.planActive = false;
    await user.save();
    
    res.status(403);
    throw new Error('Subscription has expired');
  }

  // Attach subscription info to the request
  req.subscription = {
    active: user.planActive,
    type: user.planType,
    expiresAt: user.planExpiresAt
  };

  next();
});

export { subscriptionRequired }; 