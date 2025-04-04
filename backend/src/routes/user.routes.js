const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const userController = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

// @route   GET /api/users/discover
// @desc    Get all users for discovery
// @access  Private
router.get('/discover', protect, userController.getDiscoverUsers);

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', protect, userController.getUserById);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put(
  '/profile',
  protect,
  [
    check('name', 'Name must not be empty if provided').optional().notEmpty().trim(),
    check('age', 'Age must be between 18 and 100 if provided')
      .optional()
      .isInt({ min: 18, max: 100 }),
    check('gender', 'Gender must be valid if provided')
      .optional()
      .isIn(['male', 'female', 'non-binary', 'other']),
    check('bio', 'Bio must be at most 500 characters if provided')
      .optional()
      .isLength({ max: 500 })
      .trim(),
    check('interests', 'Interests must be valid if provided')
      .optional()
  ],
  userController.updateProfile
);

// @route   POST /api/users/profile/image
// @desc    Upload profile image
// @access  Private
router.post(
  '/profile/image',
  protect,
  upload.single('profileImage'),
  userController.uploadProfileImage
);

// @route   POST /api/users/profile/cover
// @desc    Upload cover image
// @access  Private
router.post(
  '/profile/cover',
  protect,
  upload.single('coverImage'),
  userController.uploadCoverImage
);

// @route   DELETE /api/users/profile/images/:imageId
// @desc    Delete profile image
// @access  Private
router.delete(
  '/profile/images/:imageId',
  protect,
  userController.deleteProfileImage
);

module.exports = router; 