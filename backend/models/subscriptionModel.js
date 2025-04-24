const mongoose = require('mongoose');

const subscriptionSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User'
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'SubscriptionPlan'
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    endDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      required: true,
      enum: ['active', 'canceled', 'expired', 'pending'],
      default: 'active'
    },
    autoRenew: {
      type: Boolean,
      default: true
    },
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: ['credit_card', 'paypal', 'apple_pay', 'google_pay', 'coins']
    },
    lastPaymentDate: {
      type: Date,
      default: Date.now
    },
    nextPaymentDate: {
      type: Date
    },
    paymentAmount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      required: true,
      default: 'USD'
    },
    canceledAt: {
      type: Date
    },
    cancelReason: {
      type: String
    },
    isTrialPeriod: {
      type: Boolean,
      default: false
    },
    transactionId: {
      type: String
    },
    metadata: {
      type: Object
    }
  },
  {
    timestamps: true
  }
);

// Create an index to optimize queries for active user subscriptions
subscriptionSchema.index({ user: 1, status: 1 });

// Create an index for expiring subscriptions to help with renewal jobs
subscriptionSchema.index({ endDate: 1, status: 1, autoRenew: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema); 