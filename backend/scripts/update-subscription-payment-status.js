/**
 * Subscription Payment Status Update Script
 * 
 * Automatically checks and updates payment statuses for subscriptions
 * Can be run as a scheduled job to ensure payment statuses are current
 * 
 * Usage: node scripts/update-subscription-payment-status.js
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

// Update subscription payment statuses
const updatePaymentStatuses = async () => {
  try {
    await connectDB();
    
    console.log('Starting subscription payment status update...');
    const now = new Date();
    
    // Find active subscriptions with pending payments that are due
    const pendingPaymentSubscriptions = await Subscription.find({
      status: 'active',
      autoRenew: true,
      nextPaymentDate: { $lte: now }
    }).populate('user', 'email username balance').populate('plan', 'name price');
    
    console.log(`Found ${pendingPaymentSubscriptions.length} subscriptions with pending payments.`);
    
    let successfulRenewals = 0;
    let failedRenewals = 0;
    
    // Process each subscription
    for (const subscription of pendingPaymentSubscriptions) {
      console.log(`Processing subscription ${subscription._id} for user ${subscription.user.username}...`);
      
      try {
        // Simulate payment processing
        const paymentSuccessful = await processPayment(subscription);
        
        if (paymentSuccessful) {
          // Update subscription details
          const oldEndDate = new Date(subscription.endDate);
          const newEndDate = new Date(oldEndDate);
          newEndDate.setDate(oldEndDate.getDate() + subscription.plan.duration);
          
          const oldNextPaymentDate = new Date(subscription.nextPaymentDate);
          const newNextPaymentDate = new Date(oldNextPaymentDate);
          newNextPaymentDate.setDate(oldNextPaymentDate.getDate() + subscription.plan.duration);
          
          // Update subscription with new dates
          subscription.endDate = newEndDate;
          subscription.nextPaymentDate = newNextPaymentDate;
          subscription.lastRenewedAt = now;
          await subscription.save();
          
          // Create payment record
          const payment = new Payment({
            user: subscription.user._id,
            subscription: subscription._id,
            amount: subscription.plan.price,
            status: 'completed',
            paymentMethod: subscription.paymentMethod,
            description: `Auto-renewal for ${subscription.plan.name} subscription`
          });
          await payment.save();
          
          // Send success email
          await sendRenewalSuccessEmail(subscription);
          
          successfulRenewals++;
          console.log(`Successfully renewed subscription for ${subscription.user.username}.`);
        } else {
          // If payment failed, handle accordingly
          await handleFailedPayment(subscription);
          failedRenewals++;
        }
      } catch (error) {
        console.error(`Error processing subscription ${subscription._id}:`, error.message);
        failedRenewals++;
        
        // Attempt to handle the failed payment despite the error
        try {
          await handleFailedPayment(subscription);
        } catch (innerError) {
          console.error(`Error handling failed payment:`, innerError.message);
        }
      }
    }
    
    // Log summary
    console.log('\nSubscription payment status update completed.');
    console.log(`Total processed: ${pendingPaymentSubscriptions.length}`);
    console.log(`Successful renewals: ${successfulRenewals}`);
    console.log(`Failed renewals: ${failedRenewals}`);
    
  } catch (error) {
    console.error('Error updating subscription payment statuses:', error.message);
    if (error.stack) console.error(error.stack);
  } finally {
    setTimeout(() => {
      mongoose.disconnect();
      console.log('MongoDB disconnected.');
      process.exit(0);
    }, 1000);
  }
};

// Process the payment for a subscription renewal
const processPayment = async (subscription) => {
  // In a production environment, this would integrate with a payment processor
  // For this example, we'll simulate payment based on user balance
  
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
  
  // For credit card or other payment methods, would integrate with payment processor
  // Simulate a 95% success rate for card payments
  if (subscription.paymentMethod === 'card') {
    const isSuccessful = Math.random() < 0.95;
    if (!isSuccessful) {
      console.log(`Simulated card payment failure for user ${user.username}.`);
    }
    return isSuccessful;
  }
  
  // Default to successful for testing
  return true;
};

// Handle failed payment
const handleFailedPayment = async (subscription) => {
  console.log(`Handling failed payment for subscription ${subscription._id}...`);
  
  // Create failed payment record
  const payment = new Payment({
    user: subscription.user._id,
    subscription: subscription._id,
    amount: subscription.plan.price,
    status: 'failed',
    paymentMethod: subscription.paymentMethod,
    description: `Failed auto-renewal for ${subscription.plan.name} subscription`
  });
  await payment.save();
  
  // Create retry schedule - attempt 3 more times over next 5 days
  const retryDays = [1, 3, 5];
  const retryDates = retryDays.map(days => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  });
  
  // Update subscription with retry info
  subscription.paymentRetryDates = retryDates;
  subscription.paymentRetryCount = 0;
  await subscription.save();
  
  // Send payment failed email
  await sendPaymentFailedEmail(subscription, retryDates[0]);
};

// Send email for successful renewal
const sendRenewalSuccessEmail = async (subscription) => {
  // In a production environment, this would use your email service
  const user = subscription.user;
  const subject = 'Your subscription has been renewed';
  const message = `
    Hello ${user.username},
    
    Your subscription to ${subscription.plan.name} has been successfully renewed.
    
    Details:
    - Plan: ${subscription.plan.name}
    - Amount: $${subscription.plan.price}
    - Next payment date: ${formatDate(subscription.nextPaymentDate)}
    - Subscription valid until: ${formatDate(subscription.endDate)}
    
    Thank you for your continued support!
    
    The EbookAura Team
  `;
  
  console.log(`Would send success email to ${user.email} with subject: ${subject}`);
  // In production: await sendEmail(user.email, subject, message);
};

// Send email for failed payment
const sendPaymentFailedEmail = async (subscription, nextRetryDate) => {
  // In a production environment, this would use your email service
  const user = subscription.user;
  const subject = 'Action Required: Subscription Payment Failed';
  const message = `
    Hello ${user.username},
    
    We were unable to process your payment for your ${subscription.plan.name} subscription.
    
    Details:
    - Plan: ${subscription.plan.name}
    - Amount Due: $${subscription.plan.price}
    - Next retry date: ${formatDate(nextRetryDate)}
    
    Please update your payment information in your account settings to avoid any interruption to your service.
    
    If your payment method is not updated, we will attempt to process the payment again in a few days.
    
    The EbookAura Team
  `;
  
  console.log(`Would send payment failed email to ${user.email} with subject: ${subject}`);
  // In production: await sendEmail(user.email, subject, message);
};

// Run the update process
updatePaymentStatuses(); 