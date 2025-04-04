const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const matchController = require('../controllers/match.controller');

// @route   POST /api/match/swipe
// @desc    Swipe on a user (like or dislike)
// @access  Private
router.post('/swipe', protect, matchController.swipeUser);

// @route   GET /api/match
// @desc    Get all matches for current user
// @access  Private
router.get('/', protect, matchController.getMatches);

// @route   DELETE /api/match/:matchId
// @desc    Unmatch with a user
// @access  Private
router.delete('/:matchId', protect, matchController.unmatchUser);

// @route   GET /api/match/stats
// @desc    Get match statistics for the current user
// @access  Private
router.get('/stats', protect, matchController.getMatchStats);

// @route   GET /api/match/potential
// @desc    Get potential matches to swipe on
// @access  Private
router.get('/potential', protect, matchController.getPotentialMatches);

module.exports = router; 