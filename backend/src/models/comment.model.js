const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  // The confession this comment belongs to
  confession: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Confession',
    required: true
  },
  // User who created the comment
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Comment content
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    maxlength: [500, 'Comment cannot exceed 500 characters']
  },
  // Whether the comment is anonymous
  isAnonymous: {
    type: Boolean,
    default: false
  },
  // Comment likes
  likes: {
    type: Number,
    default: 0
  },
  // Users who liked the comment
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Parent comment (for replies)
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  },
  // Whether the comment has been reported
  isReported: {
    type: Boolean,
    default: false
  },
  // Whether the comment is hidden/removed
  isHidden: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Create indexes for efficient querying
CommentSchema.index({ confession: 1, createdAt: -1 });
CommentSchema.index({ parentComment: 1 });

module.exports = mongoose.model('Comment', CommentSchema); 