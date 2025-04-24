/**
 * Script to generate subscription analytics data
 * This script analyzes subscription data and generates reports on metrics
 * 
 * Usage: node scripts/generate-subscription-analytics.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const Subscription = require('../models/subscriptionModel');
const SubscriptionPlan = require('../models/subscriptionPlanModel');
const User = require('../models/User');

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

// Generate subscription analytics
const generateAnalytics = async () => {
  try {
    await connectDB();
    
    console.log('Generating subscription analytics...');
    
    // Get current date
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Create date ranges for analysis
    const thisMonth = new Date(currentYear, currentMonth, 1);
    const lastMonth = new Date(currentYear, currentMonth - 1, 1);
    const twoMonthsAgo = new Date(currentYear, currentMonth - 2, 1);
    
    // Get total active subscriptions
    const totalActiveSubscriptions = await Subscription.countDocuments({ status: 'active' });
    
    // Get new subscriptions this month
    const newSubscriptionsThisMonth = await Subscription.countDocuments({
      createdAt: { $gte: thisMonth }
    });
    
    // Get new subscriptions last month
    const newSubscriptionsLastMonth = await Subscription.countDocuments({
      createdAt: { $gte: lastMonth, $lt: thisMonth }
    });
    
    // Calculate month-over-month growth
    const momGrowth = newSubscriptionsLastMonth > 0 
      ? ((newSubscriptionsThisMonth - newSubscriptionsLastMonth) / newSubscriptionsLastMonth) * 100 
      : 100;
    
    // Get subscription distribution by plan
    const subscriptionPlans = await SubscriptionPlan.find({ isActive: true });
    const subscriptionsByPlan = [];
    
    for (const plan of subscriptionPlans) {
      const count = await Subscription.countDocuments({ 
        plan: plan._id,
        status: 'active'
      });
      
      subscriptionsByPlan.push({
        planName: plan.name,
        count,
        percentage: totalActiveSubscriptions > 0 
          ? (count / totalActiveSubscriptions) * 100 
          : 0
      });
    }
    
    // Get renewal rate
    const expiredLastMonth = await Subscription.countDocuments({
      status: 'expired',
      endDate: { $gte: lastMonth, $lt: thisMonth }
    });
    
    const renewedLastMonth = await Subscription.countDocuments({
      status: 'active',
      startDate: { $gte: lastMonth, $lt: thisMonth },
      // Look for subscriptions that are renewals (have previous subscription history)
      previousSubscription: { $exists: true, $ne: null }
    });
    
    const renewalRate = expiredLastMonth > 0 
      ? (renewedLastMonth / expiredLastMonth) * 100 
      : 0;
    
    // Get auto-renew opt-in rate
    const totalSubscriptions = await Subscription.countDocuments();
    const autoRenewEnabled = await Subscription.countDocuments({ autoRenew: true });
    const autoRenewRate = totalSubscriptions > 0 
      ? (autoRenewEnabled / totalSubscriptions) * 100 
      : 0;
    
    // Calculate average subscription duration
    const allActiveSubscriptions = await Subscription.find({ status: 'active' });
    let totalDurationDays = 0;
    
    for (const sub of allActiveSubscriptions) {
      const startDate = new Date(sub.startDate);
      const durationDays = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
      totalDurationDays += durationDays;
    }
    
    const avgDurationDays = allActiveSubscriptions.length > 0 
      ? totalDurationDays / allActiveSubscriptions.length 
      : 0;
    
    // Compile analytics results
    const analyticsData = {
      generatedAt: new Date().toISOString(),
      metrics: {
        totalActiveSubscriptions,
        newSubscriptionsThisMonth,
        newSubscriptionsLastMonth,
        monthOverMonthGrowth: momGrowth.toFixed(2) + '%',
        avgSubscriptionDuration: avgDurationDays.toFixed(1) + ' days',
        renewalRate: renewalRate.toFixed(2) + '%',
        autoRenewRate: autoRenewRate.toFixed(2) + '%'
      },
      subscriptionsByPlan
    };
    
    // Generate report file
    const reportDir = path.join(__dirname, '../reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const reportPath = path.join(reportDir, `subscription-analytics-${now.toISOString().split('T')[0]}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(analyticsData, null, 2));
    
    console.log(`Subscription analytics generated successfully.`);
    console.log(`Report saved to: ${reportPath}`);
    console.log('\nSummary:');
    console.log(`- Total Active Subscriptions: ${totalActiveSubscriptions}`);
    console.log(`- New Subscriptions This Month: ${newSubscriptionsThisMonth}`);
    console.log(`- Month-over-Month Growth: ${momGrowth.toFixed(2)}%`);
    console.log(`- Renewal Rate: ${renewalRate.toFixed(2)}%`);
    console.log(`- Auto-Renew Opt-in Rate: ${autoRenewRate.toFixed(2)}%`);
    
  } catch (error) {
    console.error('Error generating subscription analytics:', error.message);
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

// Run the analytics generation
generateAnalytics(); 