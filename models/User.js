/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: [3, 'Username must be at least 3 characters long']
  },
  fullName: {
    type: String,
    required: true
  },
  bio: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phoneNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  password: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    default: ''
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  coins: {
    type: Number,
    default: 0
  },
  lastCoinReward: {
    type: Date,
    default: null
  },
  // Track session time for activity rewards
  lastSessionStart: {
    type: Date,
    default: null
  },
  lastSessionReward: {
    type: Date,
    default: null
  },
  sessionTimeToday: {
    type: Number, // in seconds
    default: 0
  },
  // Track purchased books
  purchasedBooks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book'
  }],
  // Track subscription status
  planActive: {
    type: Boolean,
    default: false
  },
  planType: {
    type: String,
    enum: ['basic', 'pro', null],
    default: null
  },
  planExpiresAt: {
    type: Date,
    default: null
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  profileImage: {
    type: String,
    default: ''
  },
  profileImageId: {
    type: String
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  // API key field
  apiKey: {
    type: String,
    unique: true,
    sparse: true
  },
}, {
  timestamps: true
});

// Password hashing middleware
userSchema.pre('save', async function(next) {
  // Skip password hashing if flag is set
  if (this.$skipPasswordHashing) {
    // Remove the flag to ensure future saves will hash the password
    delete this.$skipPasswordHashing;
    return next();
  }
  
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate email verification code
userSchema.methods.generateVerificationCode = function() {
  // Generate a random 6-digit number
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Hash the code for storage (for security)
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationCode)
    .digest('hex');
    
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  return verificationCode;
};

// Generate reset password token
userSchema.methods.generateResetPasswordToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
    
  this.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  
  return resetToken;
};

// Generate API key
userSchema.methods.generateApiKey = function() {
  // Generate a secure API key with a prefix for identification
  const apiKey = `ak_${crypto.randomBytes(24).toString('hex')}`;
  this.apiKey = apiKey;
  return apiKey;
};

const User = mongoose.model('User', userSchema);

module.exports = User; 