const mongoose = require('mongoose');

const paymentSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User'
    },
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription'
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'USD'
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['credit_card', 'paypal', 'apple_pay', 'google_pay', 'coins', 'balance']
    },
    transactionId: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString()
    },
    description: {
      type: String
    },
    metadata: {
      type: Object
    },
    failureReason: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Create an index to optimize queries by user
paymentSchema.index({ user: 1 });

// Create an index for subscription payments
paymentSchema.index({ subscription: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment; 