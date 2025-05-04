/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
/**
 * Script to check for expired subscriptions and update their status
 * This script should be run on a schedule (e.g., daily via cron job)
 * 
 * Usage: node scripts/check-subscription-expirations.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Subscription = require('../models/subscriptionModel');
const User = require('../models/User');
const { isExpired } = require('../utils/dateUtils');

// Load environment variables
dotenv.config({ path: '../.env' });

// MongoDB connection
const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI environment variable is not set.');
      process.exit(1);
    }
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully.');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Check for expired subscriptions
const checkExpiredSubscriptions = async () => {
  try {
    await connectDB();
    
    console.log('Checking for expired subscriptions...');
    
    // Find active subscriptions that have expired
    const now = new Date();
    const expiredSubscriptions = await Subscription.find({
      status: 'active',
      endDate: { $lt: now }
    }).populate('user', 'email name');
    
    if (expiredSubscriptions.length === 0) {
      console.log('No expired subscriptions found.');
      return;
    }
    
    console.log(`Found ${expiredSubscriptions.length} expired subscriptions.`);
    
    // Update each expired subscription
    for (const subscription of expiredSubscriptions) {
      console.log(`Processing subscription for user: ${subscription.user.email} (${subscription.user.name})`);
      
      // Check if auto-renew is enabled
      if (subscription.autoRenew) {
        console.log('Auto-renew is enabled. Processing renewal...');
        // In a real implementation, you would handle the renewal logic here,
        // including payment processing. For this example, we'll just log it.
        console.log('Renewal would be processed here with payment integration.');
        
        // In this demo, we'll just update the endDate to simulate renewal
        // In a real implementation, this would be handled by the payment processor
        const oldEndDate = new Date(subscription.endDate);
        
        // Calculate new end date based on subscription duration
        let newEndDate;
        if (subscription.duration.unit === 'months') {
          newEndDate = new Date(oldEndDate);
          newEndDate.setMonth(newEndDate.getMonth() + subscription.duration.value);
        } else if (subscription.duration.unit === 'years') {
          newEndDate = new Date(oldEndDate);
          newEndDate.setFullYear(newEndDate.getFullYear() + subscription.duration.value);
        } else {
          // Default to 30 days if unit is not recognized
          newEndDate = new Date(oldEndDate);
          newEndDate.setDate(newEndDate.getDate() + (30 * subscription.duration.value));
        }
        
        // Update subscription with new dates
        subscription.startDate = oldEndDate;
        subscription.endDate = newEndDate;
        await subscription.save();
        
        console.log(`Subscription renewed. New end date: ${newEndDate.toISOString()}`);
      } else {
        // Update subscription status to expired
        subscription.status = 'expired';
        await subscription.save();
        
        console.log(`Subscription marked as expired for user: ${subscription.user.email}`);
        
        // Update user's subscription status if needed
        const user = await User.findById(subscription.user._id);
        if (user) {
          // Update user status to remove premium benefits
          user.isPremium = false;
          user.isSubscribed = false;
          // Keep the subscription tier for record purposes but mark it as expired
          user.subscriptionTier = `Expired ${user.subscriptionTier || 'Premium'}`;
          await user.save();
          console.log(`User ${user.email} subscription status updated: premium access removed.`);
        }
      }
    }
    
    console.log('Subscription expiration check completed.');
    
  } catch (error) {
    console.error('Error checking subscription expirations:', error.message);
    if (error.stack) console.error(error.stack);
  } finally {
    // Allow time for database operations to complete
    setTimeout(() => {
      mongoose.disconnect();
      console.log('MongoDB disconnected.');
      process.exit(0);
    }, 1000);
  }
};

// Run the check
checkExpiredSubscriptions(); 