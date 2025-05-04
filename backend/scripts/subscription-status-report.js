/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
/**
 * Subscription Status Report Generator
 * 
 * Generates a comprehensive report of subscription statuses across the platform
 * for administrative monitoring and decision-making.
 * 
 * Usage: node scripts/subscription-status-report.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const Subscription = require('../models/subscriptionModel');
const User = require('../models/User');
const SubscriptionPlan = require('../models/subscriptionPlanModel');

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

// Generate subscription status report
const generateStatusReport = async () => {
  try {
    await connectDB();
    
    console.log('Generating subscription status report...');
    
    // Get current date and time
    const now = new Date();
    
    // Define time periods for expiration alerts
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(now.getDate() + 3);
    
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(now.getDate() + 7);
    
    // Find subscriptions expiring soon (within 7 days)
    const expiringSubscriptions = await Subscription.find({
      status: 'active',
      endDate: { $gte: now, $lte: sevenDaysFromNow },
      autoRenew: false // Only include those not set to auto-renew
    }).populate('user', 'email username').populate('plan', 'name duration price');
    
    // Find recently expired subscriptions (within last 7 days)
    const recentlyExpired = await Subscription.find({
      status: 'expired',
      endDate: { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000), $lte: now }
    }).populate('user', 'email username').populate('plan', 'name duration price');
    
    // Get subscriptions by status
    const activeCount = await Subscription.countDocuments({ status: 'active' });
    const expiredCount = await Subscription.countDocuments({ status: 'expired' });
    const cancelledCount = await Subscription.countDocuments({ status: 'cancelled' });
    
    // Get counts by plan
    const plans = await SubscriptionPlan.find();
    const subscriptionsByPlan = [];
    
    for (const plan of plans) {
      const activeForPlan = await Subscription.countDocuments({ 
        plan: plan._id,
        status: 'active'
      });
      
      subscriptionsByPlan.push({
        planId: plan._id,
        planName: plan.name,
        duration: plan.duration,
        price: plan.price,
        activeSubscriptions: activeForPlan
      });
    }
    
    // Get auto-renewal statistics
    const autoRenewEnabled = await Subscription.countDocuments({ 
      status: 'active',
      autoRenew: true 
    });
    
    const autoRenewDisabled = await Subscription.countDocuments({ 
      status: 'active',
      autoRenew: false 
    });
    
    // Format expiring subscriptions for report
    const formattedExpiringSubscriptions = expiringSubscriptions.map(sub => ({
      userId: sub.user._id,
      username: sub.user.username,
      email: sub.user.email,
      planName: sub.plan.name,
      subscriptionStart: formatDate(sub.startDate),
      subscriptionEnd: formatDate(sub.endDate),
      daysUntilExpiration: Math.ceil((new Date(sub.endDate) - now) / (1000 * 60 * 60 * 24)),
      price: sub.plan.price
    }));
    
    // Format recently expired subscriptions for report
    const formattedRecentlyExpired = recentlyExpired.map(sub => ({
      userId: sub.user._id,
      username: sub.user.username,
      email: sub.user.email,
      planName: sub.plan.name,
      subscriptionStart: formatDate(sub.startDate),
      subscriptionEnd: formatDate(sub.endDate),
      daysSinceExpiration: Math.ceil((now - new Date(sub.endDate)) / (1000 * 60 * 60 * 24)),
      price: sub.plan.price
    }));
    
    // Compile report data
    const reportData = {
      generatedAt: now.toISOString(),
      summary: {
        totalSubscriptions: activeCount + expiredCount + cancelledCount,
        activeSubscriptions: activeCount,
        expiredSubscriptions: expiredCount,
        cancelledSubscriptions: cancelledCount,
        autoRenewEnabled: autoRenewEnabled,
        autoRenewDisabled: autoRenewDisabled,
        autoRenewRate: ((autoRenewEnabled / (autoRenewEnabled + autoRenewDisabled)) * 100).toFixed(2) + '%'
      },
      subscriptionsByPlan,
      expiringSubscriptions: formattedExpiringSubscriptions,
      recentlyExpiredSubscriptions: formattedRecentlyExpired
    };
    
    // Generate report file
    const reportDir = path.join(__dirname, '../reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const reportPath = path.join(reportDir, `subscription-status-report-${now.toISOString().split('T')[0]}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    
    // Also generate a more human-readable report
    const textReportPath = path.join(reportDir, `subscription-status-report-${now.toISOString().split('T')[0]}.txt`);
    
    let textReport = `SUBSCRIPTION STATUS REPORT - ${formatDate(now)}\n`;
    textReport += `============================================\n\n`;
    
    textReport += `SUMMARY\n`;
    textReport += `-------\n`;
    textReport += `Total Subscriptions: ${reportData.summary.totalSubscriptions}\n`;
    textReport += `Active Subscriptions: ${reportData.summary.activeSubscriptions}\n`;
    textReport += `Expired Subscriptions: ${reportData.summary.expiredSubscriptions}\n`;
    textReport += `Cancelled Subscriptions: ${reportData.summary.cancelledSubscriptions}\n`;
    textReport += `Auto-Renew Enabled: ${reportData.summary.autoRenewEnabled}\n`;
    textReport += `Auto-Renew Rate: ${reportData.summary.autoRenewRate}\n\n`;
    
    textReport += `SUBSCRIPTIONS BY PLAN\n`;
    textReport += `---------------------\n`;
    subscriptionsByPlan.forEach(plan => {
      textReport += `${plan.planName} (${plan.duration} days, $${plan.price}): ${plan.activeSubscriptions} active subscriptions\n`;
    });
    textReport += `\n`;
    
    textReport += `SUBSCRIPTIONS EXPIRING SOON (${formattedExpiringSubscriptions.length})\n`;
    textReport += `------------------------------------------\n`;
    if (formattedExpiringSubscriptions.length === 0) {
      textReport += `No subscriptions expiring within the next 7 days.\n`;
    } else {
      formattedExpiringSubscriptions.forEach(sub => {
        textReport += `User: ${sub.username} (${sub.email})\n`;
        textReport += `Plan: ${sub.planName} - $${sub.price}\n`;
        textReport += `Expires: ${sub.subscriptionEnd} (${sub.daysUntilExpiration} days from now)\n`;
        textReport += `\n`;
      });
    }
    textReport += `\n`;
    
    textReport += `RECENTLY EXPIRED SUBSCRIPTIONS (${formattedRecentlyExpired.length})\n`;
    textReport += `------------------------------------------\n`;
    if (formattedRecentlyExpired.length === 0) {
      textReport += `No subscriptions expired within the past 7 days.\n`;
    } else {
      formattedRecentlyExpired.forEach(sub => {
        textReport += `User: ${sub.username} (${sub.email})\n`;
        textReport += `Plan: ${sub.planName} - $${sub.price}\n`;
        textReport += `Expired: ${sub.subscriptionEnd} (${sub.daysSinceExpiration} days ago)\n`;
        textReport += `\n`;
      });
    }
    
    fs.writeFileSync(textReportPath, textReport);
    
    console.log(`Subscription status report generated successfully.`);
    console.log(`JSON Report saved to: ${reportPath}`);
    console.log(`Text Report saved to: ${textReportPath}`);
    
  } catch (error) {
    console.error('Error generating subscription status report:', error.message);
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

// Run the report generation
generateStatusReport(); 