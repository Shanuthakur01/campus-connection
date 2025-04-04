const Confession = require('../models/confession.model');
const Comment = require('../models/comment.model');
const User = require('../models/user.model');
const { validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');

// @desc    Create a new confession
// @route   POST /api/confessions
// @access  Private
exports.createConfession = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { content, title, tags, college, isAnonymous, image } = req.body;
    const userId = req.user.id;

    // Create confession
    const confession = new Confession({
      user: userId,
      content,
      title,
      tags: tags || [],
      college: college || req.user.college,
      isAnonymous: isAnonymous || false,
      image: image || null
    });

    await confession.save();

    // Return the confession without sensitive information
    const populatedConfession = await Confession.findById(confession._id)
      .populate({
        path: 'user',
        select: 'name profileImage college'
      });

    res.status(201).json({
      success: true,
      confession: populatedConfession
    });
  } catch (error) {
    console.error('Create confession error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create confession',
      error: error.message
    });
  }
};

// @desc    Get all approved confessions with pagination and filters
// @route   GET /api/confessions
// @access  Public
exports.getConfessions = async (req, res) => {
  try {
    const { page = 1, limit = 10, college, tags, sortBy = 'createdAt' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query
    const query = { isApproved: true };

    // Add college filter if provided
    if (college) {
      query.college = college;
    }

    // Add tags filter if provided
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }

    // Sort options
    let sort = {};
    switch (sortBy) {
      case 'popular':
        sort = { likes: -1, createdAt: -1 };
        break;
      case 'recent':
      default:
        sort = { createdAt: -1 };
        break;
    }

    // Execute query with pagination
    const confessions = await Confession.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate({
        path: 'user',
        select: 'name profileImage college'
      });

    // Get total count for pagination
    const total = await Confession.countDocuments(query);

    res.status(200).json({
      success: true,
      count: confessions.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      confessions
    });
  } catch (error) {
    console.error('Get confessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve confessions',
      error: error.message
    });
  }
};

// @desc    Get a specific confession by ID
// @route   GET /api/confessions/:id
// @access  Public for approved, Private for pending own confessions
exports.getConfessionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const confession = await Confession.findById(id)
      .populate({
        path: 'user',
        select: 'name profileImage college'
      });

    if (!confession) {
      return res.status(404).json({
        success: false,
        message: 'Confession not found'
      });
    }

    // If confession is not approved, only allow access to admin or the creator
    if (!confession.isApproved) {
      // If not authenticated or not the creator or admin, deny access
      if (!req.user || (confession.user._id.toString() !== req.user.id && !req.user.isAdmin)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Confession is awaiting approval'
        });
      }
    }

    res.status(200).json({
      success: true,
      confession
    });
  } catch (error) {
    console.error('Get confession error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve confession',
      error: error.message
    });
  }
};

// @desc    Get user's own confessions
// @route   GET /api/confessions/my/confessions
// @access  Private
exports.getMyConfessions = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const userId = req.user.id;

    // Build query
    const query = { user: userId };

    // Add status filter if provided
    if (status) {
      switch (status) {
        case 'approved':
          query.isApproved = true;
          break;
        case 'pending':
          query.isApproved = false;
          query.rejectionReason = { $exists: false };
          break;
        case 'rejected':
          query.isApproved = false;
          query.rejectionReason = { $exists: true, $ne: null };
          break;
      }
    }

    // Execute query with pagination
    const confessions = await Confession.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Confession.countDocuments(query);

    res.status(200).json({
      success: true,
      count: confessions.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      confessions
    });
  } catch (error) {
    console.error('Get my confessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve your confessions',
      error: error.message
    });
  }
};

// @desc    Update a confession
// @route   PUT /api/confessions/:id
// @access  Private (owner only)
exports.updateConfession = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, title, tags, isAnonymous, image } = req.body;
    const userId = req.user.id;

    // Find confession
    const confession = await Confession.findById(id);

    if (!confession) {
      return res.status(404).json({
        success: false,
        message: 'Confession not found'
      });
    }

    // Check ownership
    if (confession.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own confessions'
      });
    }

    // Check if already approved - can't update approved confessions
    if (confession.isApproved) {
      return res.status(400).json({
        success: false,
        message: 'Approved confessions cannot be updated'
      });
    }

    // Update fields
    if (content) confession.content = content;
    if (title) confession.title = title;
    if (tags) confession.tags = tags;
    if (typeof isAnonymous !== 'undefined') confession.isAnonymous = isAnonymous;
    if (image) confession.image = image;

    // Save updated confession
    await confession.save();

    res.status(200).json({
      success: true,
      message: 'Confession updated successfully',
      confession
    });
  } catch (error) {
    console.error('Update confession error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update confession',
      error: error.message
    });
  }
};

// @desc    Delete a confession
// @route   DELETE /api/confessions/:id
// @access  Private (owner or admin)
exports.deleteConfession = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.isAdmin;

    // Find confession
    const confession = await Confession.findById(id);

    if (!confession) {
      return res.status(404).json({
        success: false,
        message: 'Confession not found'
      });
    }

    // Check ownership or admin status
    if (confession.user.toString() !== userId && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own confessions'
      });
    }

    // Delete related comments first
    await Comment.deleteMany({ confession: id });

    // Delete confession
    await Confession.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Confession and related comments deleted successfully'
    });
  } catch (error) {
    console.error('Delete confession error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete confession',
      error: error.message
    });
  }
};

// @desc    Like a confession
// @route   POST /api/confessions/:id/like
// @access  Private
exports.likeConfession = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const confession = await Confession.findById(id);

    if (!confession) {
      return res.status(404).json({
        success: false,
        message: 'Confession not found'
      });
    }

    // Check if confession is approved
    if (!confession.isApproved) {
      return res.status(400).json({
        success: false,
        message: 'Cannot like a confession that is not approved'
      });
    }

    // Check if already liked
    const alreadyLiked = confession.likedBy.includes(userId);

    if (alreadyLiked) {
      // Unlike
      confession.likedBy = confession.likedBy.filter(id => id.toString() !== userId);
      confession.likes = confession.likedBy.length;
    } else {
      // Like
      confession.likedBy.push(userId);
      confession.likes = confession.likedBy.length;
    }

    await confession.save();

    res.status(200).json({
      success: true,
      message: alreadyLiked ? 'Confession unliked' : 'Confession liked',
      liked: !alreadyLiked,
      likes: confession.likes
    });
  } catch (error) {
    console.error('Like confession error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to like/unlike confession',
      error: error.message
    });
  }
};

// @desc    Get pending confessions for approval (admin only)
// @route   GET /api/confessions/admin/pending
// @access  Private (admin only)
exports.getPendingConfessions = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Check admin status
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    // Query for pending confessions
    const pendingConfessions = await Confession.find({
      isApproved: false,
      rejectionReason: { $exists: false }
    })
      .sort({ createdAt: 1 }) // Oldest first
      .skip(skip)
      .limit(parseInt(limit))
      .populate({
        path: 'user',
        select: 'name profileImage college'
      });

    // Get total count for pagination
    const total = await Confession.countDocuments({
      isApproved: false,
      rejectionReason: { $exists: false }
    });

    res.status(200).json({
      success: true,
      count: pendingConfessions.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      confessions: pendingConfessions
    });
  } catch (error) {
    console.error('Get pending confessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve pending confessions',
      error: error.message
    });
  }
};

// @desc    Approve a confession (admin only)
// @route   POST /api/confessions/:id/approve
// @access  Private (admin only)
exports.approveConfession = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    // Check admin status
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const confession = await Confession.findById(id);

    if (!confession) {
      return res.status(404).json({
        success: false,
        message: 'Confession not found'
      });
    }

    // Update confession
    confession.isApproved = true;
    confession.approvedAt = new Date();
    confession.approvedBy = adminId;
    
    // Remove rejection reason if it exists
    confession.rejectionReason = undefined;

    await confession.save();

    res.status(200).json({
      success: true,
      message: 'Confession approved successfully',
      confession
    });
  } catch (error) {
    console.error('Approve confession error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve confession',
      error: error.message
    });
  }
};

// @desc    Reject a confession (admin only)
// @route   POST /api/confessions/:id/reject
// @access  Private (admin only)
exports.rejectConfession = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Check admin status
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const confession = await Confession.findById(id);

    if (!confession) {
      return res.status(404).json({
        success: false,
        message: 'Confession not found'
      });
    }

    // Update confession
    confession.isApproved = false;
    confession.rejectionReason = reason;

    await confession.save();

    res.status(200).json({
      success: true,
      message: 'Confession rejected successfully',
      confession
    });
  } catch (error) {
    console.error('Reject confession error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject confession',
      error: error.message
    });
  }
}; 