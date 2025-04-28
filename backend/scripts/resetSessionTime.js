/**
 * Reset Session Time Script
 * 
 * This script resets the sessionTimeToday field for all users to 0.
 * It's intended to be run by a daily cron job at midnight.
 */

const mongoose = require('mongoose');
const { resetDailySessionTime } = require('../controllers/coinController');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('MongoDB connected...');
  
  try {
    // Reset session time for all users
    const result = await resetDailySessionTime();
    
    if (result.success) {
      console.log('SUCCESS:', result.message);
    } else {
      console.error('ERROR:', result.error);
    }
  } catch (error) {
    console.error('Script execution error:', error);
  } finally {
    // Close the MongoDB connection
    mongoose.connection.close();
    console.log('MongoDB connection closed.');
    process.exit(0);
  }
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
}); 