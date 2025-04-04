const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  // Users participating in the conversation
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  // Reference to the match that created this conversation
  match: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true
  },
  // Reference to the last message
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  // Map of userId -> unread count
  unreadCount: {
    type: Map,
    of: Number,
    default: new Map()
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Total words exchanged in the conversation
  totalWordsExchanged: {
    type: Number,
    default: 0
  },
  // Whether the quiz feature is unlocked (after 300 words)
  quizUnlocked: {
    type: Boolean,
    default: false
  },
  // Track when quiz was started and completed
  quizStarted: {
    type: Boolean,
    default: false
  },
  quizStartedAt: {
    type: Date
  },
  quizCompleted: {
    type: Boolean,
    default: false
  },
  quizCompletedAt: {
    type: Date
  },
  // Quiz result (compatibility percentage)
  quizResult: {
    type: Number,
    min: 0,
    max: 100
  }
}, {
  timestamps: true
});

// Create an index on participants for efficient querying
conversationSchema.index({ participants: 1 });
// Index for querying by match
conversationSchema.index({ match: 1 }, { unique: true });
// Index for querying active conversations
conversationSchema.index({ isActive: 1, updatedAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema); 