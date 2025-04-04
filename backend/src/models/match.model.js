const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  // User who initiated the like/swipe
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // User who was liked/swiped
  target: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['liked', 'disliked', 'matched'],
    required: true
  },
  // Match date (when it became a mutual match)
  matchedAt: {
    type: Date,
    default: null
  },
  // For analytics purposes
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Create compound index to ensure unique user-target pairs
matchSchema.index({ user: 1, target: 1 }, { unique: true });

// Create indexes for better query performance
matchSchema.index({ user: 1, status: 1 });
matchSchema.index({ target: 1, status: 1 });
matchSchema.index({ status: 1 });

module.exports = mongoose.model('Match', matchSchema); 