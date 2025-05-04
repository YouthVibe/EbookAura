/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
/**
 * Retry Failed Subscription Payments Script
 * 
 * Automatically retries failed subscription payments based on retry schedule
 * Can be run as a scheduled job (daily) to ensure timely payment retries
 * 
 * Usage: node scripts/retry-failed-subscription-payments.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Subscription = require('../models/subscriptionModel');
const User = require('../models/User');
const Payment = require('../models/paymentModel');
const { sendEmail } = require('../utils/emailService');

// Load environment variables
dotenv.config({ path: '../.env' });

// MongoDB connection
const connectDB = async () => {
  try {
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

// Format date for display
const formatDate = (date) => {
  return new Date(date).toISOString().split('T')[0];
};

// Check if a date is today
const isToday = (date) => {
  const today = new Date();
  const compareDate = new Date(date);
  
  return (
    compareDate.getDate() === today.getDate() &&
    compareDate.getMonth() === today.getMonth() &&
    compareDate.getFullYear() === today.getFullYear()
  );
};

// Retry failed subscription payments
const retryFailedPayments = async () => {
  try {
    await connectDB();
    
    console.log('Starting failed payment retry process...');
    const now = new Date();
    
    // Find active subscriptions with payment retry dates for today
    const subscriptionsToRetry = await Subscription.find({
      status: 'active',
      autoRenew: true,
      paymentRetryDates: { $exists: true, $ne: [] }
    }).populate('user', 'email username balance').populate('plan', 'name price duration');
    
    console.log(`Found ${subscriptionsToRetry.length} subscriptions with potential retry dates.`);
    
    let successfulRetries = 0;
    let failedRetries = 0;
    let skippedRetries = 0;
    
    // Process each subscription with retry dates
    for (const subscription of subscriptionsToRetry) {
      // Check if any retry date is today
      const retryDatesToday = subscription.paymentRetryDates.filter(date => isToday(date));
      
      if (retryDatesToday.length === 0) {
        skippedRetries++;
        continue; // No retry scheduled for today
      }
      
      console.log(`Processing retry for subscription ${subscription._id} for user ${subscription.user.username}...`);
      
      try {
        // Increment retry count
        subscription.paymentRetryCount = (subscription.paymentRetryCount || 0) + 1;
        
        // Remove today's date from retry dates
        subscription.paymentRetryDates = subscription.paymentRetryDates.filter(date => !isToday(date));
        
        // Attempt to process payment
        const paymentSuccessful = await processPayment(subscription);
        
        if (paymentSuccessful) {
          // Update subscription details
          const oldEndDate = new Date(subscription.endDate);
          const newEndDate = new Date(oldEndDate);
          newEndDate.setDate(oldEndDate.getDate() + subscription.plan.duration);
          
          const oldNextPaymentDate = new Date();
          const newNextPaymentDate = new Date(oldNextPaymentDate);
          newNextPaymentDate.setDate(oldNextPaymentDate.getDate() + subscription.plan.duration);
          
          // Update subscription with new dates
          subscription.endDate = newEndDate;
          subscription.nextPaymentDate = newNextPaymentDate;
          subscription.lastRenewedAt = now;
          subscription.paymentRetryDates = []; // Clear retry dates
          subscription.paymentRetryCount = 0; // Reset retry count
          await subscription.save();
          
          // Create successful payment record
          const payment = new Payment({
            user: subscription.user._id,
            subscription: subscription._id,
            amount: subscription.plan.price,
            status: 'completed',
            paymentMethod: subscription.paymentMethod,
            description: `Successful retry for ${subscription.plan.name} subscription renewal`
          });
          await payment.save();
          
          // Send success email
          await sendRetrySuccessEmail(subscription);
          
          successfulRetries++;
          console.log(`Successfully processed retry payment for ${subscription.user.username}.`);
        } else {
          // Handle failed retry
          // Create failed payment record
          const payment = new Payment({
            user: subscription.user._id,
            subscription: subscription._id,
            amount: subscription.plan.price,
            status: 'failed',
            paymentMethod: subscription.paymentMethod,
            description: `Failed retry #${subscription.paymentRetryCount} for ${subscription.plan.name} subscription renewal`
          });
          await payment.save();
          
          // Check if retries are exhausted
          if (subscription.paymentRetryDates.length === 0 || subscription.paymentRetryCount >= 3) {
            console.log(`Retries exhausted for subscription ${subscription._id}. Cancelling auto-renewal.`);
            
            // Cancel auto-renewal
            subscription.autoRenew = false;
            await subscription.save();
            
            // Send final failure notice
            await sendFinalFailureEmail(subscription);
          } else {
            // Save updated retry count
            await subscription.save();
            
            // Send retry failed email with next date
            const nextRetryDate = subscription.paymentRetryDates.length > 0 ? 
              subscription.paymentRetryDates[0] : null;
            
            if (nextRetryDate) {
              await sendRetryFailedEmail(subscription, nextRetryDate);
            }
          }
          
          failedRetries++;
        }
      } catch (error) {
        console.error(`Error processing retry for subscription ${subscription._id}:`, error.message);
        failedRetries++;
        
        // Save updated retry count and dates in case of error
        try {
          await subscription.save();
        } catch (innerError) {
          console.error(`Error saving subscription after retry:`, innerError.message);
        }
      }
    }
    
    // Log summary
    console.log('\nSubscription payment retry process completed.');
    console.log(`Total potential retries: ${subscriptionsToRetry.length}`);
    console.log(`Skipped (no retry scheduled today): ${skippedRetries}`);
    console.log(`Successful retries: ${successfulRetries}`);
    console.log(`Failed retries: ${failedRetries}`);
    
  } catch (error) {
    console.error('Error in retry failed payments process:', error.message);
    if (error.stack) console.error(error.stack);
  } finally {
    setTimeout(() => {
      mongoose.disconnect();
      console.log('MongoDB disconnected.');
      process.exit(0);
    }, 1000);
  }
};

// Process payment for subscription retry
const processPayment = async (subscription) => {
  // In a production environment, this would integrate with a payment processor
  
  const user = subscription.user;
  const planPrice = subscription.plan.price;
  
  // If using balance as payment method, check if user has sufficient balance
  if (subscription.paymentMethod === 'balance') {
    if (user.balance >= planPrice) {
      // Deduct from user balance
      await User.findByIdAndUpdate(user._id, { 
        $inc: { balance: -planPrice } 
      });
      return true;
    } else {
      console.log(`Insufficient balance for user ${user.username}. Required: ${planPrice}, Available: ${user.balance}`);
      return false;
    }
  } 
  
  // For credit card, simulate increased success rate for retries (assuming user may have updated payment method)
  if (subscription.paymentMethod === 'card') {
    // Increase success probability with each retry
    const baseSuccessRate = 0.6; // 60% success rate for first retry
    const successRate = Math.min(0.95, baseSuccessRate + (subscription.paymentRetryCount * 0.1));
    
    const isSuccessful = Math.random() < successRate;
    if (!isSuccessful) {
      console.log(`Simulated card payment retry failure for user ${user.username}.`);
    }
    return isSuccessful;
  }
  
  // Default to successful for testing
  return true;
};

// Send email for successful retry
const sendRetrySuccessEmail = async (subscription) => {
  const user = subscription.user;
  const subject = 'Your subscription payment has been processed';
  const message = `
    Hello ${user.username},
    
    Good news! We have successfully processed your payment for your ${subscription.plan.name} subscription.
    
    Details:
    - Plan: ${subscription.plan.name}
    - Amount: $${subscription.plan.price}
    - Next payment date: ${formatDate(subscription.nextPaymentDate)}
    - Subscription valid until: ${formatDate(subscription.endDate)}
    
    Thank you for your continued support!
    
    The EbookAura Team
  `;
  
  console.log(`Would send retry success email to ${user.email} with subject: ${subject}`);
  // In production: await sendEmail(user.email, subject, message);
};

// Send email for failed retry
const sendRetryFailedEmail = async (subscription, nextRetryDate) => {
  const user = subscription.user;
  const subject = 'Action Required: Subscription Payment Retry Failed';
  const message = `
    Hello ${user.username},
    
    We were unable to process your payment for your ${subscription.plan.name} subscription.
    
    Details:
    - Plan: ${subscription.plan.name}
    - Amount Due: $${subscription.plan.price}
    - Next retry date: ${formatDate(nextRetryDate)}
    - Retry attempt: ${subscription.paymentRetryCount} of 3
    
    Please update your payment information in your account settings to avoid any interruption to your service.
    
    The EbookAura Team
  `;
  
  console.log(`Would send retry failed email to ${user.email} with subject: ${subject}`);
  // In production: await sendEmail(user.email, subject, message);
};

// Send final failure notice
const sendFinalFailureEmail = async (subscription) => {
  const user = subscription.user;
  const subject = 'Important: Your Subscription Auto-Renewal Has Been Cancelled';
  const message = `
    Hello ${user.username},
    
    After multiple attempts, we were unable to process your payment for your ${subscription.plan.name} subscription.
    
    As a result, auto-renewal has been disabled for your subscription. Your subscription will remain active until ${formatDate(subscription.endDate)}.
    
    To continue enjoying premium features after this date, please:
    1. Visit your account settings
    2. Update your payment information
    3. Re-enable auto-renewal or purchase a new subscription
    
    If you need any assistance, please contact our support team.
    
    The EbookAura Team
  `;
  
  console.log(`Would send final failure email to ${user.email} with subject: ${subject}`);
  // In production: await sendEmail(user.email, subject, message);
};

// Run the retry process
retryFailedPayments(); 