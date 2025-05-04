/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
/**
 * Seed script to create initial subscription plans in the database
 * This script should be run after initial setup
 * 
 * Usage: node scripts/seed-subscription-plans.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const SubscriptionPlan = require('../models/subscriptionPlanModel');
const readline = require('readline');
const path = require('path');

// Load environment variables - use path.resolve to find the correct path
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// MongoDB connection
const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    
    if (!process.env.MONGO_URI) {
      console.error('MONGO_URI environment variable is not set.');
      console.error('Current directory:', __dirname);
      process.exit(1);
    }
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected successfully.');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Sample subscription plans data
const subscriptionPlansData = [
  {
    name: 'Pro Monthly',
    description: 'Full access to all premium books on EbookAura for 1 month',
    price: 400, // 400 coins
    currency: 'USD',
    duration: {
      value: 1,
      unit: 'months'
    },
    features: [
      'Unlimited premium books',
      'Full reader features',
      'Offline reading',
      'Ad-free experience',
      'Priority support'
    ],
    benefits: {
      maxPremiumBooks: 999999, // effectively unlimited
      offlineReading: true,
      adFree: true,
      earlyAccess: true,
      exclusiveContent: true
    },
    isPopular: false,
    isActive: true,
    displayOrder: 1
  },
  {
    name: 'Pro Quarterly',
    description: 'Full access to all premium books on EbookAura for 3 months',
    price: 1200, // 1200 coins
    currency: 'USD',
    duration: {
      value: 3,
      unit: 'months'
    },
    features: [
      'Unlimited premium books',
      'Full reader features',
      'Offline reading',
      'Ad-free experience',
      'Priority support',
      '3-month access at discounted rate'
    ],
    benefits: {
      maxPremiumBooks: 999999, // effectively unlimited
      offlineReading: true,
      adFree: true,
      earlyAccess: true,
      exclusiveContent: true
    },
    isPopular: true,
    isActive: true,
    displayOrder: 2
  },
  {
    name: 'Pro Annual',
    description: 'Full access to all premium books on EbookAura for 1 year',
    price: 4800, // 4800 coins
    currency: 'USD',
    duration: {
      value: 1,
      unit: 'years'
    },
    features: [
      'Unlimited premium books for a full year',
      'Save on annual subscription',
      'Full reader features',
      'Offline reading',
      'Ad-free experience',
      'Early access to new releases',
      'Exclusive content',
      'Priority support'
    ],
    benefits: {
      maxPremiumBooks: 999999, // effectively unlimited
      offlineReading: true,
      adFree: true,
      earlyAccess: true,
      exclusiveContent: true
    },
    isPopular: false,
    isActive: true,
    displayOrder: 3
  }
];

// Create subscription plans
const seedSubscriptionPlans = async () => {
  try {
    await connectDB();
    
    // Check if plans already exist
    const existingPlansCount = await SubscriptionPlan.countDocuments();
    
    if (existingPlansCount > 0) {
      const answer = await new Promise((resolve) => {
        rl.question(`${existingPlansCount} subscription plans already exist. Do you want to delete them and add new ones? (y/n): `, (answer) => {
          resolve(answer.toLowerCase());
        });
      });
      
      if (answer !== 'y') {
        console.log('Operation cancelled. No changes made.');
        process.exit(0);
      }
      
      // Delete existing plans
      await SubscriptionPlan.deleteMany({});
      console.log('Existing subscription plans deleted.');
    }
    
    // Create new plans
    const createdPlans = await SubscriptionPlan.insertMany(subscriptionPlansData);
    
    console.log(`✅ ${createdPlans.length} subscription plans created successfully!`);
    
    // Display created plans
    console.log('\nCreated Subscription Plans:');
    createdPlans.forEach((plan, index) => {
      console.log(`${index + 1}. ${plan.name} - ${plan.price} coins for ${plan.duration.value} ${plan.duration.unit}`);
    });
    
  } catch (error) {
    console.error('Error seeding subscription plans:', error.message);
  } finally {
    rl.close();
    // Allow time for database operations to complete
    setTimeout(() => process.exit(0), 1000);
  }
};

// Run the seeding function
seedSubscriptionPlans(); 