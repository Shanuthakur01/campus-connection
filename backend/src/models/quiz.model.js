const mongoose = require('mongoose');

// Schema for individual quiz questions
const QuestionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true
  },
  options: [{
    text: {
      type: String,
      required: true,
      trim: true
    },
    value: {
      type: Number,
      required: true
    }
  }]
});

// Schema for a quiz session
const QuizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['compatibility', 'personality', 'interests', 'values', 'relationship', 'custom'],
    default: 'compatibility'
  },
  // The conversation this quiz is associated with
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  // Questions for this quiz
  questions: [QuestionSchema],
  // First user's answers (user who initiated the quiz)
  user1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  user1Answers: [{
    questionIndex: Number,
    answer: String
  }],
  user1Completed: {
    type: Boolean,
    default: false
  },
  user1CompletedAt: {
    type: Date
  },
  // Second user's answers
  user2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  user2Answers: [{
    questionIndex: Number,
    answer: String
  }],
  user2Completed: {
    type: Boolean,
    default: false
  },
  user2CompletedAt: {
    type: Date
  },
  // Quiz status
  status: {
    type: String,
    enum: ['active', 'completed', 'expired'],
    default: 'active'
  },
  // Result (compatibility percentage)
  compatibilityScore: {
    type: Number,
    min: 0,
    max: 100
  },
  // Expiry time (quiz expires after 24 hours if not completed)
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Create indexes for efficient querying
QuizSchema.index({ conversation: 1 });
QuizSchema.index({ user1: 1, user2: 1 });
QuizSchema.index({ status: 1, expiresAt: 1 });
QuizSchema.index({ category: 1 });
QuizSchema.index({ isActive: 1 });
QuizSchema.index({ createdBy: 1 });

const Quiz = mongoose.model('Quiz', QuizSchema);

module.exports = Quiz; 