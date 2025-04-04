const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth.middleware');

// Placeholder route until admin controller is implemented
router.get('/', protect, adminOnly, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Admin routes are working',
    stats: {
      users: 0,
      confessions: 0,
      matches: 0
    }
  });
});

module.exports = router; 