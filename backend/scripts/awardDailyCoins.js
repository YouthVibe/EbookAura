/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
/**
 * Script to award daily coins to all users
 * Can be run as a cron job
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

// Load environment variables
dotenv.config({ path: '../.env' });

// Connect to database
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

const awardDailyCoins = async () => {
  try {
    console.log('Starting daily coin rewards process...');
    
    // Connect to database
    await connectDB();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find all users who have not received coins today
    const usersToReward = await User.find({
      $or: [
        { lastCoinReward: { $lt: today } },
        { lastCoinReward: null }
      ]
    });
    
    if (usersToReward.length === 0) {
      console.log('No users to reward today.');
      process.exit(0);
    }
    
    console.log(`Found ${usersToReward.length} users to reward.`);
    
    // Award coins to each user
    const updatePromises = usersToReward.map(user => {
      console.log(`Awarding 10 coins to user: ${user.name} (${user.email})`);
      user.coins += 10;
      user.lastCoinReward = new Date();
      return user.save();
    });
    
    await Promise.all(updatePromises);
    
    console.log(`Successfully awarded coins to ${usersToReward.length} users.`);
    process.exit(0);
  } catch (error) {
    console.error('Error awarding daily coins:', error);
    process.exit(1);
  }
};

// Run the function
awardDailyCoins(); 