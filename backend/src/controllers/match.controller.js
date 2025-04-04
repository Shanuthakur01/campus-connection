const Match = require('../models/match.model');
const Conversation = require('../models/conversation.model');
const User = require('../models/user.model');

// @desc    Swipe on a user (like or dislike)
// @route   POST /api/match/swipe
// @access  Private
exports.swipeUser = async (req, res) => {
  try {
    const { targetId, action } = req.body;
    const userId = req.user.id;
    
    if (!targetId || !action) {
      return res.status(400).json({
        success: false,
        message: 'Target user ID and action are required'
      });
    }
    
    if (action !== 'like' && action !== 'dislike') {
      return res.status(400).json({
        success: false,
        message: 'Action must be either "like" or "dislike"'
      });
    }
    
    // Prevent swiping yourself
    if (targetId === userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot swipe on yourself'
      });
    }
    
    // Check if target user exists
    const targetUser = await User.findById(targetId).select('_id name profileImage');
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Target user not found'
      });
    }
    
    // Check if user has already swiped on this target
    const existingMatch = await Match.findOne({ user: userId, target: targetId });
    if (existingMatch) {
      return res.status(400).json({
        success: false,
        message: 'You have already swiped on this user'
      });
    }
    
    // Create the swipe record
    const status = action === 'like' ? 'liked' : 'disliked';
    const match = new Match({
      user: userId,
      target: targetId,
      status: status
    });
    
    // If action is like, check if there's a mutual match
    let isMatch = false;
    let conversation = null;
    
    if (status === 'liked') {
      const mutualMatch = await Match.findOne({ 
        user: targetId, 
        target: userId,
        status: 'liked'
      });
      
      if (mutualMatch) {
        // It's a match!
        isMatch = true;
        match.status = 'matched';
        match.matchedAt = Date.now();
        
        // Update the mutual match
        mutualMatch.status = 'matched';
        mutualMatch.matchedAt = Date.now();
        await mutualMatch.save();
        
        // Create a conversation
        conversation = new Conversation({
          participants: [userId, targetId],
          match: match._id
        });
        
        await conversation.save();
      }
    }
    
    await match.save();
    
    res.status(201).json({
      success: true,
      message: isMatch ? `You matched with ${targetUser.name}!` : `You ${status} ${targetUser.name}`,
      match: {
        id: match._id,
        user: userId,
        target: targetUser,
        status: match.status,
        isMatch: isMatch,
        matchedAt: match.matchedAt,
        conversation: conversation ? conversation._id : null
      }
    });
  } catch (error) {
    console.error('Swipe error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to swipe on user',
      error: error.message
    });
  }
};

// @desc    Get all matches for current user
// @route   GET /api/match
// @access  Private
exports.getMatches = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find all matched users
    const matches = await Match.find({ 
      user: userId,
      status: 'matched'
    })
    .populate({
      path: 'target',
      select: 'name age gender college bio interests profileImage isOnline lastActive'
    })
    .sort({ matchedAt: -1 });
    
    // Get conversations for these matches
    const matchIds = matches.map(match => match._id);
    const conversations = await Conversation.find({ 
      match: { $in: matchIds }
    })
    .select('_id match lastMessage unreadCount updatedAt')
    .populate({
      path: 'lastMessage',
      select: 'content createdAt sender'
    });
    
    // Map conversations to matches
    const matchesWithConversation = matches.map(match => {
      const matchObj = match.toObject();
      const conversation = conversations.find(c => 
        c.match.toString() === match._id.toString()
      );
      
      return {
        ...matchObj,
        conversation: conversation || null,
        hasUnread: conversation ? 
          (conversation.unreadCount.get(userId.toString()) > 0) : false
      };
    });
    
    res.status(200).json({
      success: true,
      count: matchesWithConversation.length,
      matches: matchesWithConversation
    });
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve matches',
      error: error.message
    });
  }
};

// @desc    Unmatch with a user
// @route   DELETE /api/match/:matchId
// @access  Private
exports.unmatchUser = async (req, res) => {
  try {
    const matchId = req.params.matchId;
    const userId = req.user.id;
    
    // Find the match
    const match = await Match.findById(matchId);
    
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }
    
    // Ensure the user is part of this match
    if (match.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to unmatch this user'
      });
    }
    
    // Find and update the mutual match
    const mutualMatch = await Match.findOne({
      user: match.target,
      target: userId,
      status: 'matched'
    });
    
    if (mutualMatch) {
      mutualMatch.status = 'liked';
      await mutualMatch.save();
    }
    
    // Set match to disliked
    match.status = 'disliked';
    await match.save();
    
    // Find and deactivate the conversation
    const conversation = await Conversation.findOne({ match: matchId });
    if (conversation) {
      conversation.isActive = false;
      await conversation.save();
    }
    
    res.status(200).json({
      success: true,
      message: 'Successfully unmatched user'
    });
  } catch (error) {
    console.error('Unmatch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unmatch user',
      error: error.message
    });
  }
};

// @desc    Get match statistics for the current user
// @route   GET /api/match/stats
// @access  Private
exports.getMatchStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get count of matches, likes sent, likes received
    const matchCount = await Match.countDocuments({ 
      user: userId,
      status: 'matched'
    });
    
    const likesSent = await Match.countDocuments({
      user: userId,
      status: { $in: ['liked', 'matched'] }
    });
    
    const likesReceived = await Match.countDocuments({
      target: userId,
      status: { $in: ['liked', 'matched'] }
    });
    
    const matchRate = likesSent > 0 ? (matchCount / likesSent) * 100 : 0;
    
    res.status(200).json({
      success: true,
      stats: {
        matchCount,
        likesSent,
        likesReceived,
        matchRate: Math.round(matchRate)
      }
    });
  } catch (error) {
    console.error('Get match stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve match statistics',
      error: error.message
    });
  }
};

// @desc    Get potential matches to swipe on
// @route   GET /api/match/potential
// @access  Private
exports.getPotentialMatches = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10 } = req.query;
    
    // Get current user to check preferences
    const currentUser = await User.findById(userId).select('gender preferences college');
    
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get all users that the current user has already swiped on
    const swipedUsers = await Match.find({ user: userId }).select('target');
    const swipedUserIds = swipedUsers.map(match => match.target);
    
    // Add current user ID to excluded users
    swipedUserIds.push(userId);
    
    // Build query based on user preferences
    const query = {
      _id: { $nin: swipedUserIds },
      college: currentUser.college // Match users from same college
    };
    
    // Add gender preference if set
    if (currentUser.preferences && currentUser.preferences.gender) {
      query.gender = currentUser.preferences.gender;
    }
    
    // Find potential matches
    const potentialMatches = await User.find(query)
      .select('name age gender college bio interests profileImage isOnline lastActive createdAt')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    // Check if any users have liked the current user
    const receivedLikes = await Match.find({
      target: userId,
      status: 'liked',
      user: { $in: potentialMatches.map(user => user._id) }
    }).select('user');
    
    const likedUserIds = receivedLikes.map(match => match.user.toString());
    
    // Add hasLikedYou flag to each potential match
    const matchesWithLikeStatus = potentialMatches.map(user => {
      const userObj = user.toObject();
      userObj.hasLikedYou = likedUserIds.includes(user._id.toString());
      return userObj;
    });
    
    res.status(200).json({
      success: true,
      count: matchesWithLikeStatus.length,
      potentialMatches: matchesWithLikeStatus
    });
  } catch (error) {
    console.error('Get potential matches error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve potential matches',
      error: error.message
    });
  }
}; 