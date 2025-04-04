const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const confessionController = require('../controllers/confession.controller');
const { protect, isAdmin } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

// @route   POST /api/confessions
// @desc    Create a new confession
// @access  Private
router.post(
  '/',
  protect,
  upload.single('image'),
  [
    check('title', 'Title is required').notEmpty().trim(),
    check('content', 'Content is required and must be between 10-2000 characters')
      .notEmpty()
      .isLength({ min: 10, max: 2000 })
      .trim()
  ],
  confessionController.createConfession
);

// @route   GET /api/confessions
// @desc    Get all approved confessions with pagination and filters
// @access  Public
router.get('/', confessionController.getConfessions);

// IMPORTANT: Specific routes must be defined before parameterized routes
// @route   GET /api/confessions/my/confessions
// @desc    Get current user's confessions
// @access  Private
router.get('/my/confessions', protect, confessionController.getMyConfessions);

// @route   GET /api/confessions/admin/pending
// @desc    Get all pending confessions for approval
// @access  Private (Admin only)
router.get('/admin/pending', protect, isAdmin, confessionController.getPendingConfessions);

// @route   GET /api/confessions/:id
// @desc    Get a specific confession by ID
// @access  Public for approved, Private for pending own confessions
router.get('/:id', confessionController.getConfessionById);

// @route   PUT /api/confessions/:id
// @desc    Update a confession
// @access  Private (owner only)
router.put(
  '/:id',
  protect,
  upload.single('image'),
  [
    check('title', 'Title must not be empty if provided').optional().notEmpty().trim(),
    check('content', 'Content must be between 10-2000 characters if provided')
      .optional()
      .isLength({ min: 10, max: 2000 })
      .trim()
  ],
  confessionController.updateConfession
);

// @route   DELETE /api/confessions/:id
// @desc    Delete a confession
// @access  Private (owner or admin)
router.delete('/:id', protect, confessionController.deleteConfession);

// @route   POST /api/confessions/:id/like
// @desc    Like a confession
// @access  Private
router.post('/:id/like', protect, confessionController.likeConfession);

// @route   POST /api/confessions/:id/approve
// @desc    Approve a confession (admin only)
// @access  Private (Admin only)
router.post('/:id/approve', protect, isAdmin, confessionController.approveConfession);

// @route   POST /api/confessions/:id/reject
// @desc    Reject a confession (admin only)
// @access  Private (Admin only)
router.post(
  '/:id/reject',
  protect,
  isAdmin,
  [
    check('reason', 'Rejection reason is required').notEmpty().trim()
  ],
  confessionController.rejectConfession
);

module.exports = router; 