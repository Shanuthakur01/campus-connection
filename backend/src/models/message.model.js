const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // Conversation this message belongs to
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  // User who sent the message
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Message content
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Word count in the message (for tracking 300-word threshold)
  wordCount: {
    type: Number,
    default: 0
  },
  // Optional attachment (image, etc.)
  attachment: {
    type: String,
    default: null
  },
  // For feature to allow deleting messages
  isDeleted: {
    type: Boolean,
    default: false
  },
  // Read status
  isRead: {
    type: Boolean,
    default: false
  },
  // Read timestamp
  readAt: {
    type: Date
  },
  // Message type (text, image, etc.)
  type: {
    type: String,
    enum: ['text', 'image', 'system'],
    default: 'text'
  },
  // File URL if the message is an image
  fileUrl: {
    type: String
  }
}, {
  timestamps: true
});

// Create compound indexes for efficient querying
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1, conversation: 1 });
messageSchema.index({ createdAt: 1 });

// Pre-save hook to calculate word count
messageSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    const wordCount = this.content.trim().split(/\s+/).length;
    this.wordCount = wordCount;
  }
  next();
});

module.exports = mongoose.model('Message', messageSchema); 