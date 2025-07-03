/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const tempUserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: [3, 'Username must be at least 3 characters long']
  },
  fullName: {
    type: String,
    required: true
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
  verificationCode: {
    type: String,
    required: true
  },
  emailVerificationToken: {
    type: String
  },
  verificationExpires: {
    type: Date,
    required: true
  },
  emailVerificationExpires: Date,
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // 24 hours - auto delete unverified users after 24 hours
  }
});

// Password hashing middleware
tempUserSchema.pre('save', async function(next) {
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

// Generate verification code
tempUserSchema.methods.generateVerificationCode = function() {
  // Generate a random 6-digit number
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Hash the code for storage (for security)
  const hashedCode = crypto
    .createHash('sha256')
    .update(verificationCode)
    .digest('hex');
    
  this.verificationCode = hashedCode;
  this.verificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  return verificationCode;
};

// Verify the code
tempUserSchema.methods.verifyCode = function(code) {
  // Hash the provided code for comparison
  const hashedCode = crypto
    .createHash('sha256')
    .update(code)
    .digest('hex');
    
  // Check if code matches and has not expired
  return hashedCode === this.verificationCode && 
         this.verificationExpires > Date.now();
};

const TempUser = mongoose.model('TempUser', tempUserSchema);

module.exports = TempUser; 