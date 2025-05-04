/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
const mongoose = require('mongoose');

const subscriptionPlanSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Plan description is required']
    },
    price: {
      type: Number,
      required: [true, 'Plan price is required'],
      min: 0
    },
    currency: {
      type: String,
      required: [true, 'Currency is required'],
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD']
    },
    duration: {
      value: {
        type: Number,
        required: [true, 'Duration value is required'],
        min: 1
      },
      unit: {
        type: String,
        required: [true, 'Duration unit is required'],
        enum: ['days', 'months', 'years'],
        default: 'months'
      }
    },
    features: [{
      type: String
    }],
    benefits: {
      maxPremiumBooks: {
        type: Number,
        default: 0
      },
      offlineReading: {
        type: Boolean,
        default: false
      },
      adFree: {
        type: Boolean,
        default: false
      },
      earlyAccess: {
        type: Boolean,
        default: false
      },
      exclusiveContent: {
        type: Boolean,
        default: false
      }
    },
    isPopular: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    displayOrder: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema); 