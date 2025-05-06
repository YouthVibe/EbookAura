const mongoose = require('mongoose');

const apiKeyUsageHistorySchema = new mongoose.Schema({
  apiKey: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ApiKey',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  booksSearched: {
    type: Number,
    default: 0,
    min: 0
  },
  reviewsPosted: {
    type: Number,
    default: 0,
    min: 0
  },
  // Store any additional metrics we might want to track in the future
  additionalMetrics: {
    type: Map,
    of: Number,
    default: {}
  }
}, { 
  timestamps: true,
});

// Compound index to ensure we can efficiently query by API key and date range
apiKeyUsageHistorySchema.index({ apiKey: 1, date: 1 });

// Static method to record daily usage
apiKeyUsageHistorySchema.statics.recordUsage = async function(apiKeyId, metrics) {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to start of day
  
  const filter = {
    apiKey: apiKeyId,
    date: today
  };
  
  const update = {};
  
  // Add metrics to update
  if (metrics.booksSearched) {
    update.$inc = update.$inc || {};
    update.$inc.booksSearched = metrics.booksSearched;
  }
  
  if (metrics.reviewsPosted) {
    update.$inc = update.$inc || {};
    update.$inc.reviewsPosted = metrics.reviewsPosted;
  }
  
  // Add any additional metrics
  if (metrics.additionalMetrics && Object.keys(metrics.additionalMetrics).length > 0) {
    for (const [key, value] of Object.entries(metrics.additionalMetrics)) {
      update.$inc = update.$inc || {};
      update.$inc[`additionalMetrics.${key}`] = value;
    }
  }
  
  // If no metrics to update, return null
  if (!update.$inc) return null;
  
  // Use findOneAndUpdate with upsert to create a new document if it doesn't exist
  return this.findOneAndUpdate(
    filter,
    update,
    { 
      new: true, 
      upsert: true,
      setDefaultsOnInsert: true
    }
  );
};

// Static method to get usage history for an API key
apiKeyUsageHistorySchema.statics.getUsageHistory = async function(apiKeyId, days = 7) {
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999); // End of today
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days + 1);
  startDate.setHours(0, 0, 0, 0); // Start of day 'days' ago
  
  const usageHistory = await this.find({
    apiKey: apiKeyId,
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: 1 });
  
  // Fill in missing days with zero values
  const filledHistory = [];
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const existingRecord = usageHistory.find(record => 
      record.date.toISOString().split('T')[0] === currentDate.toISOString().split('T')[0]
    );
    
    if (existingRecord) {
      filledHistory.push(existingRecord);
    } else {
      filledHistory.push({
        apiKey: apiKeyId,
        date: new Date(currentDate),
        booksSearched: 0,
        reviewsPosted: 0,
        additionalMetrics: {}
      });
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return filledHistory;
};

// Static method to get aggregated statistics
apiKeyUsageHistorySchema.statics.getAggregatedStats = async function(apiKeyId, days = 30) {
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days + 1);
  startDate.setHours(0, 0, 0, 0);
  
  // Convert apiKeyId to ObjectId safely
  let apiKeyObjectId;
  try {
    // Check if it's already an ObjectId
    if (apiKeyId instanceof mongoose.Types.ObjectId) {
      apiKeyObjectId = apiKeyId;
    } else {
      // Convert string to ObjectId
      apiKeyObjectId = new mongoose.Types.ObjectId(apiKeyId.toString());
    }
  } catch (err) {
    console.error("Error converting apiKeyId to ObjectId:", err);
    // Return default values if there's an error with the ID conversion
    return {
      totalBooksSearched: 0,
      totalReviewsPosted: 0,
      avgBooksSearched: 0,
      avgReviewsPosted: 0,
      maxBooksSearched: 0,
      maxReviewsPosted: 0,
      daysWithActivity: 0
    };
  }
  
  try {
    const result = await this.aggregate([
      { 
        $match: { 
          apiKey: apiKeyObjectId,
          date: { $gte: startDate, $lte: endDate }
        } 
      },
      {
        $group: {
          _id: null,
          totalBooksSearched: { $sum: "$booksSearched" },
          totalReviewsPosted: { $sum: "$reviewsPosted" },
          avgBooksSearched: { $avg: "$booksSearched" },
          avgReviewsPosted: { $avg: "$reviewsPosted" },
          maxBooksSearched: { $max: "$booksSearched" },
          maxReviewsPosted: { $max: "$reviewsPosted" },
          daysWithActivity: { 
            $sum: { 
              $cond: [
                { $or: [
                  { $gt: ["$booksSearched", 0] },
                  { $gt: ["$reviewsPosted", 0] }
                ]},
                1,
                0
              ]
            }
          }
        }
      }
    ]);
    
    if (result.length === 0) {
      return {
        totalBooksSearched: 0,
        totalReviewsPosted: 0,
        avgBooksSearched: 0,
        avgReviewsPosted: 0,
        maxBooksSearched: 0,
        maxReviewsPosted: 0,
        daysWithActivity: 0
      };
    }
    
    return result[0];
  } catch (err) {
    console.error("Error in getAggregatedStats aggregation:", err);
    // Return default values if the aggregation fails
    return {
      totalBooksSearched: 0,
      totalReviewsPosted: 0,
      avgBooksSearched: 0,
      avgReviewsPosted: 0,
      maxBooksSearched: 0,
      maxReviewsPosted: 0,
      daysWithActivity: 0
    };
  }
};

const ApiKeyUsageHistory = mongoose.model('ApiKeyUsageHistory', apiKeyUsageHistorySchema);

module.exports = ApiKeyUsageHistory; 