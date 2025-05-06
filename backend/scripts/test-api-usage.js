/**
 * Script to test API key usage tracking
 * This script simulates API requests to verify API usage tracking works correctly
 */
require('dotenv').config();
const mongoose = require('mongoose');
const ApiKey = require('../models/ApiKey');
const User = require('../models/User');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const ApiKeyUsageHistory = require('../models/ApiKeyUsageHistory');
const colors = require('colors');

// Connect to database
const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ebookaura');
    console.log(`MongoDB Connected: ${conn.connection.host}`.cyan.underline);
    return conn;
  } catch (error) {
    console.error(`Error: ${error.message}`.red.bold);
    process.exit(1);
  }
};

// Find or create a test user
const findOrCreateTestUser = async () => {
  console.log('Finding or creating test user...'.yellow);

  let user = await User.findOne({ email: 'test-api-usage@example.com' });
  
  if (!user) {
    console.log('Creating new test user...'.yellow);
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    // Add all required fields for User model
    user = await User.create({
      name: 'API Test User',
      fullName: 'API Test User',  // Add fullName field 
      email: 'test-api-usage@example.com',
      password: hashedPassword,
      isVerified: true,
      role: 'user'
    });
    
    console.log('Test user created successfully'.green);
  } else {
    console.log('Found existing test user'.green);
  }
  
  return user;
};

// Create a test API key
const createTestApiKey = async (userId) => {
  console.log('Creating test API key...'.yellow);
  
  // Delete existing test API keys
  await ApiKey.deleteMany({ 
    user: userId,
    name: 'API Usage Test Key'
  });
  
  // Create a new API key
  const apiKey = await ApiKey.create({
    user: userId,
    name: 'API Usage Test Key',
    key: `test_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
    isActive: true,
    permissions: {
      searchBooks: true,
      postReviews: true,
      downloadBooks: false,
      manageFavorites: false
    },
    limits: {
      booksPerDay: 50,
      reviewsPerDay: 10
    },
    usage: {
      booksSearched: 0,
      reviewsPosted: 0,
      lastReset: new Date()
    }
  });
  
  console.log('Test API key created successfully'.green);
  console.log(`API Key: ${apiKey.key}`.cyan);
  
  return apiKey;
};

// Simulate API usage (book searches)
const simulateBookSearches = async (apiKey, count) => {
  console.log(`Simulating ${count} book searches...`.yellow);
  
  for (let i = 0; i < count; i++) {
    // Increment usage counter
    apiKey.usage.booksSearched += 1;
    apiKey.lastUsed = new Date();
    
    // Save changes
    await apiKey.save();
    
    // Also record in history
    await ApiKeyUsageHistory.recordUsage(apiKey._id, { booksSearched: 1 });
    
    // Log progress
    if ((i + 1) % 5 === 0 || i === 0 || i === count - 1) {
      console.log(`Book searches: ${apiKey.usage.booksSearched}/${apiKey.limits.booksPerDay}`.cyan);
    }
    
    // Check if limit is reached
    if (apiKey.usage.booksSearched >= apiKey.limits.booksPerDay) {
      console.log('Daily book search limit reached!'.red.bold);
      break;
    }
  }
  
  console.log('Book search simulation completed'.green);
};

// Simulate API usage (review posts)
const simulateReviewPosts = async (apiKey, count) => {
  console.log(`Simulating ${count} review posts...`.yellow);
  
  for (let i = 0; i < count; i++) {
    // Increment usage counter
    apiKey.usage.reviewsPosted += 1;
    apiKey.lastUsed = new Date();
    
    // Save changes
    await apiKey.save();
    
    // Also record in history
    await ApiKeyUsageHistory.recordUsage(apiKey._id, { reviewsPosted: 1 });
    
    // Log progress
    if ((i + 1) % 2 === 0 || i === 0 || i === count - 1) {
      console.log(`Review posts: ${apiKey.usage.reviewsPosted}/${apiKey.limits.reviewsPerDay}`.cyan);
    }
    
    // Check if limit is reached
    if (apiKey.usage.reviewsPosted >= apiKey.limits.reviewsPerDay) {
      console.log('Daily review posting limit reached!'.red.bold);
      break;
    }
  }
  
  console.log('Review post simulation completed'.green);
};

// Simulate historical usage for previous days to test graphs
const simulateHistoricalUsage = async (apiKey) => {
  console.log('Simulating historical usage data for the past week...'.yellow);
  
  const now = new Date();
  
  // For each of the past 6 days (excluding today which will have real data)
  for (let i = 6; i >= 1; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0); // Start of the day
    
    // Generate random usage counts between 20% and 80% of daily limits
    const booksSearched = Math.floor(Math.random() * (apiKey.limits.booksPerDay * 0.6) + (apiKey.limits.booksPerDay * 0.2));
    const reviewsPosted = Math.floor(Math.random() * (apiKey.limits.reviewsPerDay * 0.6) + (apiKey.limits.reviewsPerDay * 0.2));
    
    // Delete any existing records for that day
    await ApiKeyUsageHistory.deleteOne({ 
      apiKey: apiKey._id,
      date: { 
        $gte: date,
        $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000)
      }
    });
    
    // Create a new history record for that day
    await ApiKeyUsageHistory.create({
      apiKey: apiKey._id,
      date: date,
      booksSearched: booksSearched,
      reviewsPosted: reviewsPosted
    });
    
    console.log(`Historical data for ${date.toISOString().split('T')[0]}: ${booksSearched} books, ${reviewsPosted} reviews`.cyan);
  }
  
  console.log('Historical usage data simulation completed'.green);
};

// View API key usage stats
const viewApiKeyUsage = async (apiKey) => {
  console.log('\nAPI Key Usage Statistics:'.cyan.bold);
  console.log('========================='.cyan);
  
  // Refresh the API key data
  apiKey = await ApiKey.findById(apiKey._id);
  
  console.log(`Name: ${apiKey.name}`.white);
  console.log(`Key: ${apiKey.key}`.white);
  console.log(`Status: ${apiKey.isActive ? 'Active'.green : 'Revoked'.red}`);
  
  console.log('\nUsage Limits:'.yellow);
  console.log(`Books per day: ${apiKey.limits.booksPerDay}`.white);
  console.log(`Reviews per day: ${apiKey.limits.reviewsPerDay}`.white);
  
  console.log('\nCurrent Usage:'.yellow);
  console.log(`Books searched: ${apiKey.usage.booksSearched}/${apiKey.limits.booksPerDay} (${Math.round(apiKey.usage.booksSearched / apiKey.limits.booksPerDay * 100)}%)`.white);
  console.log(`Reviews posted: ${apiKey.usage.reviewsPosted}/${apiKey.limits.reviewsPerDay} (${Math.round(apiKey.usage.reviewsPosted / apiKey.limits.reviewsPerDay * 100)}%)`.white);
  
  console.log('\nTimestamps:'.yellow);
  console.log(`Last reset: ${apiKey.usage.lastReset}`.white);
  console.log(`Last used: ${apiKey.lastUsed || 'Never'}`.white);
  
  // Get usage history
  const usageHistory = await ApiKeyUsageHistory.getUsageHistory(apiKey._id, 7);
  const stats = await ApiKeyUsageHistory.getAggregatedStats(apiKey._id, 30);
  
  console.log('\nUsage History (Last 7 Days):'.yellow);
  usageHistory.forEach(day => {
    console.log(`${day.date.toISOString().split('T')[0]}: ${day.booksSearched} books, ${day.reviewsPosted} reviews`.white);
  });
  
  console.log('\nAggregate Statistics (Last 30 Days):'.yellow);
  console.log(`Total books searched: ${stats.totalBooksSearched}`.white);
  console.log(`Total reviews posted: ${stats.totalReviewsPosted}`.white);
  console.log(`Average books per day: ${stats.avgBooksSearched.toFixed(1)}`.white);
  console.log(`Average reviews per day: ${stats.avgReviewsPosted.toFixed(1)}`.white);
  console.log(`Peak books in one day: ${stats.maxBooksSearched}`.white);
  console.log(`Peak reviews in one day: ${stats.maxReviewsPosted}`.white);
  console.log(`Days with activity: ${stats.daysWithActivity}`.white);
};

// Main function
const main = async () => {
  try {
    const conn = await connectDB();
    
    const user = await findOrCreateTestUser();
    const apiKey = await createTestApiKey(user._id);
    
    // Simulate historical usage for testing analytics
    await simulateHistoricalUsage(apiKey);
    
    // Simulate some book searches (25 searches = 50% of daily limit)
    await simulateBookSearches(apiKey, 25);
    
    // Simulate some review posts (5 posts = 50% of daily limit)
    await simulateReviewPosts(apiKey, 5);
    
    // View API key usage statistics
    await viewApiKeyUsage(apiKey);
    
    console.log('\nAPI usage test completed successfully!'.green.bold);
    
    // Close database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error running API usage test:', error);
  }
};

// Run the main function
main().catch(err => {
  console.error('Error in main function:', err);
  process.exit(1);
}); 