const Conversation = require('../models/conversation.model');
const Message = require('../models/message.model');
const Match = require('../models/match.model');
const User = require('../models/user.model');

// @desc    Get conversations for the current user
// @route   GET /api/chat/conversations
// @access  Private
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find conversations where user is a participant
    const conversations = await Conversation.find({
      participants: userId,
      isActive: true
    })
    .select('_id participants lastMessage unreadCount updatedAt match quizUnlocked totalWordsExchanged')
    .populate({
      path: 'participants',
      select: 'name profileImage isOnline lastActive'
    })
    .populate({
      path: 'lastMessage',
      select: 'content createdAt sender readBy'
    })
    .populate({
      path: 'match',
      select: 'matchedAt'
    })
    .sort({ updatedAt: -1 });
    
    // Transform to client-friendly format
    const transformedConversations = conversations.map(conversation => {
      const convoObj = conversation.toObject();
      
      // Get the other participant
      const otherParticipant = convoObj.participants.find(
        p => p._id.toString() !== userId
      );
      
      // Get unread count for current user
      const unreadCount = convoObj.unreadCount.get(userId.toString()) || 0;
      
      // Check if last message is read
      const lastMessageRead = convoObj.lastMessage 
        ? convoObj.lastMessage.readBy.some(id => id.toString() === userId)
        : true;
      
      return {
        id: convoObj._id,
        match: convoObj.match,
        otherUser: otherParticipant,
        lastMessage: convoObj.lastMessage,
        unreadCount,
        lastMessageRead,
        updatedAt: convoObj.updatedAt,
        quizUnlocked: convoObj.quizUnlocked,
        totalWordsExchanged: convoObj.totalWordsExchanged,
        matchedAt: convoObj.match ? convoObj.match.matchedAt : null
      };
    });
    
    res.status(200).json({
      success: true,
      count: transformedConversations.length,
      conversations: transformedConversations
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve conversations',
      error: error.message
    });
  }
};

// @desc    Get messages for a conversation
// @route   GET /api/chat/conversations/:conversationId/messages
// @access  Private
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user.id;
    
    // Check if conversation exists and user is a participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found or you are not a participant'
      });
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get messages with pagination (newest first)
    const messages = await Message.find({ conversation: conversationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate({
        path: 'sender',
        select: 'name profileImage'
      });
    
    // Mark messages as read
    await Message.updateMany(
      { 
        conversation: conversationId,
        sender: { $ne: userId },
        readBy: { $ne: userId }
      },
      { $addToSet: { readBy: userId } }
    );
    
    // Reset unread count for this user
    if (conversation.unreadCount && conversation.unreadCount.get(userId.toString()) > 0) {
      conversation.unreadCount.set(userId.toString(), 0);
      await conversation.save();
    }
    
    // Get total count
    const total = await Message.countDocuments({ conversation: conversationId });
    
    res.status(200).json({
      success: true,
      count: messages.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      messages: messages.reverse() // Return in chronological order
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve messages',
      error: error.message
    });
  }
};

// @desc    Send a message in a conversation
// @route   POST /api/chat/conversations/:conversationId/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;
    
    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }
    
    // Check if conversation exists and user is a participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
      isActive: true
    });
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found, inactive, or you are not a participant'
      });
    }
    
    // Create a new message
    const message = new Message({
      conversation: conversationId,
      sender: userId,
      content: content.trim(),
      readBy: [userId] // Sender automatically reads their own message
    });
    
    await message.save();
    
    // Update the conversation
    conversation.lastMessage = message._id;
    
    // Increment unread count for other participants
    conversation.participants.forEach(participantId => {
      if (participantId.toString() !== userId) {
        const currentCount = conversation.unreadCount.get(participantId.toString()) || 0;
        conversation.unreadCount.set(participantId.toString(), currentCount + 1);
      }
    });
    
    // Update word count and check if quiz should be unlocked
    conversation.totalWordsExchanged += message.wordCount;
    
    if (conversation.totalWordsExchanged >= 300 && !conversation.quizUnlocked) {
      conversation.quizUnlocked = true;
    }
    
    await conversation.save();
    
    // Populate sender info for the response
    await message.populate({
      path: 'sender',
      select: 'name profileImage'
    });
    
    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
};

// @desc    Mark conversation as read
// @route   PUT /api/chat/conversations/:conversationId/read
// @access  Private
exports.markConversationAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    
    // Find conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found or you are not a participant'
      });
    }
    
    // Mark all messages as read
    await Message.updateMany(
      { 
        conversation: conversationId,
        sender: { $ne: userId },
        readBy: { $ne: userId }
      },
      { $addToSet: { readBy: userId } }
    );
    
    // Reset unread count
    conversation.unreadCount.set(userId.toString(), 0);
    await conversation.save();
    
    res.status(200).json({
      success: true,
      message: 'Conversation marked as read'
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark conversation as read',
      error: error.message
    });
  }
};

// @desc    Get conversation by match ID
// @route   GET /api/chat/match/:matchId
// @access  Private
exports.getConversationByMatch = async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user.id;
    
    // Check if match exists and user is part of it
    const match = await Match.findOne({
      _id: matchId,
      $or: [
        { user: userId },
        { target: userId }
      ],
      status: 'matched'
    });
    
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found or you are not a participant'
      });
    }
    
    // Find the conversation for this match
    const conversation = await Conversation.findOne({ match: matchId })
      .populate({
        path: 'participants',
        select: 'name profileImage isOnline lastActive'
      })
      .populate({
        path: 'lastMessage',
        select: 'content createdAt sender readBy'
      });
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found for this match'
      });
    }
    
    // Get the other participant
    const otherParticipant = conversation.participants.find(
      p => p._id.toString() !== userId
    );
    
    res.status(200).json({
      success: true,
      conversation: {
        id: conversation._id,
        match: matchId,
        otherUser: otherParticipant,
        lastMessage: conversation.lastMessage,
        unreadCount: conversation.unreadCount.get(userId.toString()) || 0,
        updatedAt: conversation.updatedAt,
        quizUnlocked: conversation.quizUnlocked,
        totalWordsExchanged: conversation.totalWordsExchanged,
        matchedAt: match.matchedAt
      }
    });
  } catch (error) {
    console.error('Get conversation by match error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve conversation',
      error: error.message
    });
  }
}; 