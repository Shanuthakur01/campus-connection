const Comment = require('../models/comment.model');
const Confession = require('../models/confession.model');
const User = require('../models/user.model');
const { validationResult } = require('express-validator');

// @desc    Create a new comment
// @route   POST /api/comments/:confessionId
// @access  Private
exports.createComment = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { confessionId } = req.params;
    const { content, isAnonymous, parentComment } = req.body;
    const userId = req.user.id;

    // Check if confession exists and is approved
    const confession = await Confession.findById(confessionId);
    if (!confession) {
      return res.status(404).json({
        success: false,
        message: 'Confession not found'
      });
    }

    if (!confession.isApproved) {
      return res.status(400).json({
        success: false,
        message: 'Cannot comment on a confession that is not approved'
      });
    }

    // If parentComment is provided, validate it exists
    if (parentComment) {
      const parentCommentExists = await Comment.findOne({
        _id: parentComment,
        confession: confessionId
      });

      if (!parentCommentExists) {
        return res.status(404).json({
          success: false,
          message: 'Parent comment not found'
        });
      }
    }

    // Create new comment
    const comment = new Comment({
      confession: confessionId,
      user: userId,
      content,
      isAnonymous: isAnonymous || false,
      parentComment: parentComment || null
    });

    await comment.save();

    // Increment confession's comment count
    confession.commentsCount = (confession.commentsCount || 0) + 1;
    await confession.save();

    // Populate user data for response
    await comment.populate({
      path: 'user',
      select: 'name profileImage'
    });

    // Return the comment
    res.status(201).json({
      success: true,
      comment
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create comment',
      error: error.message
    });
  }
};

// @desc    Get comments for a confession
// @route   GET /api/comments/:confessionId
// @access  Public
exports.getCommentsByConfession = async (req, res) => {
  try {
    const { confessionId } = req.params;
    const { page = 1, limit = 20, parentOnly = false } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Check if confession exists and is approved
    const confession = await Confession.findById(confessionId);
    if (!confession) {
      return res.status(404).json({
        success: false,
        message: 'Confession not found'
      });
    }

    // For non-approved confessions, only allow admin or the creator to see comments
    if (!confession.isApproved) {
      if (!req.user || (confession.user.toString() !== req.user.id && !req.user.isAdmin)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Confession is awaiting approval'
        });
      }
    }

    // Build query
    const query = { confession: confessionId };
    
    // If parentOnly is true, only get top-level comments
    if (parentOnly === 'true') {
      query.parentComment = null;
    }

    // Get total count for pagination
    const total = await Comment.countDocuments(query);

    // Get comments
    const comments = await Comment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate({
        path: 'user',
        select: 'name profileImage'
      });

    res.status(200).json({
      success: true,
      count: comments.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      comments
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve comments',
      error: error.message
    });
  }
};

// @desc    Get replies for a comment
// @route   GET /api/comments/:commentId/replies
// @access  Public
exports.getRepliesByComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Check if parent comment exists
    const parentComment = await Comment.findById(commentId);
    if (!parentComment) {
      return res.status(404).json({
        success: false,
        message: 'Parent comment not found'
      });
    }

    // Get confession to check if it's approved
    const confession = await Confession.findById(parentComment.confession);
    if (!confession) {
      return res.status(404).json({
        success: false,
        message: 'Confession not found'
      });
    }

    // For non-approved confessions, only allow admin or the creator to see replies
    if (!confession.isApproved) {
      if (!req.user || (confession.user.toString() !== req.user.id && !req.user.isAdmin)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Confession is awaiting approval'
        });
      }
    }

    // Get replies
    const replies = await Comment.find({
      parentComment: commentId
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate({
        path: 'user',
        select: 'name profileImage'
      });

    // Get total count for pagination
    const total = await Comment.countDocuments({
      parentComment: commentId
    });

    res.status(200).json({
      success: true,
      count: replies.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      replies
    });
  } catch (error) {
    console.error('Get replies error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve replies',
      error: error.message
    });
  }
};

// @desc    Update a comment
// @route   PUT /api/comments/:id
// @access  Private (owner only)
exports.updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    // Find comment
    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check ownership
    if (comment.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own comments'
      });
    }

    // Update content
    comment.content = content;
    comment.isEdited = true;
    await comment.save();

    // Return updated comment
    res.status(200).json({
      success: true,
      message: 'Comment updated successfully',
      comment
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update comment',
      error: error.message
    });
  }
};

// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Private (owner or admin)
exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.isAdmin;

    // Find comment
    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check ownership or admin status
    if (comment.user.toString() !== userId && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own comments'
      });
    }

    // Get confession to update comment count
    const confession = await Confession.findById(comment.confession);

    // Find and count replies if this is a parent comment
    let repliesCount = 0;
    if (!comment.parentComment) {
      repliesCount = await Comment.countDocuments({
        parentComment: id
      });
    }

    // Delete replies if this is a parent comment
    if (repliesCount > 0) {
      await Comment.deleteMany({ parentComment: id });
    }

    // Delete the comment
    await Comment.findByIdAndDelete(id);

    // Update confession comment count
    if (confession) {
      confession.commentsCount = Math.max(0, (confession.commentsCount || 0) - 1 - repliesCount);
      await confession.save();
    }

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
      deletedReplies: repliesCount
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete comment',
      error: error.message
    });
  }
};

// @desc    Like a comment
// @route   POST /api/comments/:id/like
// @access  Private
exports.likeComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find comment
    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user has already liked the comment
    const alreadyLiked = comment.likedBy.includes(userId);

    if (alreadyLiked) {
      // Unlike
      comment.likedBy = comment.likedBy.filter(id => id.toString() !== userId);
      comment.likes = comment.likedBy.length;
    } else {
      // Like
      comment.likedBy.push(userId);
      comment.likes = comment.likedBy.length;
    }

    await comment.save();

    res.status(200).json({
      success: true,
      message: alreadyLiked ? 'Comment unliked' : 'Comment liked',
      liked: !alreadyLiked,
      likes: comment.likes
    });
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to like/unlike comment',
      error: error.message
    });
  }
};

// @desc    Report a comment
// @route   POST /api/comments/:id/report
// @access  Private
exports.reportComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Reason for reporting is required'
      });
    }

    // Find comment
    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Update comment
    comment.isReported = true;
    
    // Add report details
    if (!comment.reports) {
      comment.reports = [];
    }
    
    comment.reports.push({
      user: userId,
      reason,
      date: new Date()
    });

    await comment.save();

    res.status(200).json({
      success: true,
      message: 'Comment reported successfully'
    });
  } catch (error) {
    console.error('Report comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to report comment',
      error: error.message
    });
  }
}; 