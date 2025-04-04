const mongoose = require('mongoose');

const ConfessionSchema = new mongoose.Schema({
  // User who created the confession (kept private)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Confession content
  content: {
    type: String,
    required: [true, 'Confession content is required'],
    maxlength: [1000, 'Confession cannot exceed 1000 characters']
  },
  // Optional title
  title: {
    type: String,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  // Tags for categorization
  tags: [{
    type: String
  }],
  // College (to show related confessions to users from same college)
  college: {
    type: String
  },
  // Image (optional)
  image: {
    type: String
  },
  // Approval status (for moderation)
  isApproved: {
    type: Boolean,
    default: false
  },
  // Hide user's identity (always true for confessions)
  isAnonymous: {
    type: Boolean,
    default: true
  },
  // Likes count
  likes: {
    type: Number,
    default: 0
  },
  // Users who liked
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Comments count
  commentsCount: {
    type: Number,
    default: 0
  },
  // Approval status update time
  approvedAt: {
    type: Date
  },
  // Admin who approved
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Rejection reason (if any)
  rejectionReason: {
    type: String
  }
}, {
  timestamps: true
});

// Create indexes for efficient querying
ConfessionSchema.index({ createdAt: -1 });
ConfessionSchema.index({ college: 1, createdAt: -1 });
ConfessionSchema.index({ tags: 1 });
ConfessionSchema.index({ isApproved: 1 });

module.exports = mongoose.model('Confession', ConfessionSchema); 