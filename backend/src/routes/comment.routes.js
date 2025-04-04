const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const commentController = require('../controllers/comment.controller');
const { protect, isAdmin } = require('../middleware/auth.middleware');

// @route   POST /api/comments/:confessionId
// @desc    Create a new comment on a confession
// @access  Private
router.post(
  '/:confessionId',
  protect,
  [
    check('content', 'Content is required and must be between 1-500 characters')
      .notEmpty()
      .isLength({ min: 1, max: 500 })
      .trim()
  ],
  commentController.createComment
);

// @route   GET /api/comments/:confessionId
// @desc    Get all comments for a confession
// @access  Public
router.get('/:confessionId', commentController.getCommentsByConfession);

// @route   GET /api/comments/:commentId/replies
// @desc    Get replies for a comment
// @access  Public
router.get('/:commentId/replies', commentController.getRepliesByComment);

// @route   PUT /api/comments/:id
// @desc    Update a comment
// @access  Private (owner only)
router.put(
  '/:id',
  protect,
  [
    check('content', 'Content is required and must be between 1-500 characters')
      .notEmpty()
      .isLength({ min: 1, max: 500 })
      .trim()
  ],
  commentController.updateComment
);

// @route   DELETE /api/comments/:id
// @desc    Delete a comment
// @access  Private (owner or admin)
router.delete('/:id', protect, commentController.deleteComment);

// @route   POST /api/comments/:id/like
// @desc    Like a comment
// @access  Private
router.post('/:id/like', protect, commentController.likeComment);

// @route   POST /api/comments/:id/report
// @desc    Report a comment
// @access  Private
router.post(
  '/:id/report',
  protect,
  [
    check('reason', 'Report reason is required').notEmpty().trim()
  ],
  commentController.reportComment
);

module.exports = router; 