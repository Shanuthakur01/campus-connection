const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const chatController = require('../controllers/chat.controller');

// Get all conversations for current user
router.get('/conversations', protect, chatController.getConversations);

// Get messages for a specific conversation
router.get('/conversations/:conversationId/messages', protect, chatController.getMessages);

// Send a message in a conversation
router.post('/conversations/:conversationId/messages', protect, chatController.sendMessage);

// Mark conversation as read
router.put('/conversations/:conversationId/read', protect, chatController.markConversationAsRead);

// Get conversation by match ID
router.get('/match/:matchId', protect, chatController.getConversationByMatch);

module.exports = router; 