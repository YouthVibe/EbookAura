const mongoose = require('mongoose');
const crypto = require('crypto');

const apiKeySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  key: {
    type: String,
    required: true,
    unique: true
  },
  permissions: {
    read: {
      type: Boolean,
      default: true
    },
    write: {
      type: Boolean,
      default: false
    },
    getPdf: {
      type: Boolean,
      default: false
    },
    download: {
      type: Boolean,
      default: false
    },
    postReviews: {
      type: Boolean,
      default: false
    }
  },
  limits: {
    booksPerDay: {
      type: Number,
      default: 50
    },
    reviewsPerDay: {
      type: Number,
      default: 10
    }
  },
  usage: {
    booksSearched: {
      type: Number,
      default: 0
    },
    reviewsPosted: {
      type: Number,
      default: 0
    },
    lastReset: {
      type: Date,
      default: Date.now
    }
  },
  lastUsed: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Method to generate a new API key
apiKeySchema.statics.generateKey = function() {
  return crypto.randomBytes(32).toString('hex');
};

// Method to check if user has reached the maximum number of API keys
apiKeySchema.statics.hasReachedLimit = async function(userId) {
  const count = await this.countDocuments({ user: userId });
  return count >= 5; // Maximum 5 API keys per user
};

// Method to reset usage counters if a day has passed
apiKeySchema.methods.resetUsageIfNeeded = function() {
  const now = new Date();
  const lastReset = new Date(this.usage.lastReset);
  
  // Check if a day has passed since last reset
  if (now.getDate() !== lastReset.getDate() || 
      now.getMonth() !== lastReset.getMonth() || 
      now.getFullYear() !== lastReset.getFullYear()) {
    
    this.usage.booksSearched = 0;
    this.usage.reviewsPosted = 0;
    this.usage.lastReset = now;
  }
  
  return this;
};

// Pre-save middleware to handle key generation
apiKeySchema.pre('save', function(next) {
  // Always generate a key if it doesn't exist
  if (!this.key) {
    this.key = crypto.randomBytes(32).toString('hex');
  }
  next();
});

const ApiKey = mongoose.model('ApiKey', apiKeySchema);

module.exports = ApiKey; 