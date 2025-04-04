const User = require('../models/user.model');
const Match = require('../models/match.model');
const fs = require('fs');
const path = require('path');

// @desc    Get all users for discovery
// @route   GET /api/users/discover
// @access  Private
exports.getDiscoverUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, filters } = req.query;
    const userId = req.user.id;
    
    // Parse filters if provided
    const filterOptions = filters ? JSON.parse(filters) : {};
    
    // Build query
    const query = {
      _id: { $ne: userId }, // Exclude current user
      isProfileComplete: true, // Only complete profiles
      isApproved: true // Only approved profiles
    };
    
    // Apply filters if provided
    if (filterOptions.gender) {
      query.gender = filterOptions.gender;
    }
    
    if (filterOptions.minAge && filterOptions.maxAge) {
      query.age = { $gte: parseInt(filterOptions.minAge), $lte: parseInt(filterOptions.maxAge) };
    } else if (filterOptions.minAge) {
      query.age = { $gte: parseInt(filterOptions.minAge) };
    } else if (filterOptions.maxAge) {
      query.age = { $lte: parseInt(filterOptions.maxAge) };
    }
    
    if (filterOptions.college) {
      query.college = filterOptions.college;
    }
    
    // Get users who the current user has already swiped on
    const swipedUsers = await Match.find({ user: userId }).select('target');
    const swipedUserIds = swipedUsers.map(match => match.target);
    
    // Exclude already swiped users
    query._id.$nin = swipedUserIds;
    
    // Get total count
    const total = await User.countDocuments(query);
    
    // Get users with pagination
    const users = await User.find(query)
      .select('name age gender college bio interests location profileImage profileImages')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: users.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      users
    });
  } catch (error) {
    console.error('Get discover users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve users',
      error: error.message
    });
  }
};

// @desc    Get user profile by ID
// @route   GET /api/users/:id
// @access  Private
exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    
    const user = await User.findById(userId).select('-password -emailVerificationToken -emailVerificationExpire -phoneVerificationCode -phoneVerificationExpire -resetPasswordToken -resetPasswordExpire');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user',
      error: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      name, age, gender, college, course, yearOfStudy, 
      bio, interests, location
    } = req.body;
    
    // Find user
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update fields
    if (name) user.name = name;
    if (age) user.age = age;
    if (gender) user.gender = gender;
    if (college) user.college = college;
    if (course) user.course = course;
    if (yearOfStudy) user.yearOfStudy = yearOfStudy;
    if (bio) user.bio = bio;
    if (interests) {
      // If interests is a string, convert to array
      user.interests = typeof interests === 'string' 
        ? interests.split(',').map(item => item.trim()) 
        : interests;
    }
    if (location) user.location = location;
    
    // Check if profile is complete
    const requiredFields = ['name', 'age', 'gender', 'college', 'bio'];
    const isComplete = requiredFields.every(field => user[field]);
    
    user.isProfileComplete = isComplete;
    
    // Save updated user
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        age: user.age,
        gender: user.gender,
        college: user.college,
        course: user.course,
        yearOfStudy: user.yearOfStudy,
        bio: user.bio,
        interests: user.interests,
        location: user.location,
        profileImage: user.profileImage,
        profileImages: user.profileImages,
        coverImage: user.coverImage,
        isProfileComplete: user.isProfileComplete,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        isApproved: user.isApproved
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

// @desc    Upload profile image
// @route   POST /api/users/profile/image
// @access  Private
exports.uploadProfileImage = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image'
      });
    }
    
    // Get file path
    const filePath = req.file.path.replace(/\\/g, '/'); // Normalize path for all OS
    
    // Update user
    const user = await User.findById(userId);
    
    // If user already has a profile image that's not the default, delete it
    if (user.profileImage && user.profileImage !== 'default-profile.jpg') {
      const oldImagePath = path.join('uploads/profiles', path.basename(user.profileImage));
      
      // Check if file exists before deleting
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }
    
    // Update profile image
    user.profileImage = filePath;
    
    // Add to profile images array if not already there
    if (!user.profileImages.includes(filePath)) {
      // Limit to 3 images
      if (user.profileImages.length >= 3) {
        user.profileImages.shift(); // Remove oldest image
      }
      
      user.profileImages.push(filePath);
    }
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Profile image uploaded successfully',
      profileImage: filePath
    });
  } catch (error) {
    console.error('Upload profile image error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload profile image',
      error: error.message
    });
  }
};

// @desc    Upload cover image
// @route   POST /api/users/profile/cover
// @access  Private
exports.uploadCoverImage = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image'
      });
    }
    
    // Get file path
    const filePath = req.file.path.replace(/\\/g, '/'); // Normalize path for all OS
    
    // Update user
    const user = await User.findById(userId);
    
    // If user already has a cover image that's not the default, delete it
    if (user.coverImage && user.coverImage !== 'default-cover.jpg') {
      const oldImagePath = path.join('uploads/profiles', path.basename(user.coverImage));
      
      // Check if file exists before deleting
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }
    
    // Update cover image
    user.coverImage = filePath;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Cover image uploaded successfully',
      coverImage: filePath
    });
  } catch (error) {
    console.error('Upload cover image error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload cover image',
      error: error.message
    });
  }
};

// @desc    Delete profile image
// @route   DELETE /api/users/profile/images/:imageId
// @access  Private
exports.deleteProfileImage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { imageId } = req.params;
    
    // Find user
    const user = await User.findById(userId);
    
    // Check if image exists in user's profile images
    const imageIndex = user.profileImages.findIndex(img => img.includes(imageId));
    
    if (imageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }
    
    // Get image path
    const imagePath = user.profileImages[imageIndex];
    
    // Remove from array
    user.profileImages.splice(imageIndex, 1);
    
    // If the deleted image was the profile image, set a new one
    if (user.profileImage === imagePath) {
      user.profileImage = user.profileImages.length > 0 
        ? user.profileImages[0] 
        : 'default-profile.jpg';
    }
    
    await user.save();
    
    // Delete the file
    const fullPath = path.join('uploads/profiles', path.basename(imagePath));
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
    
    res.status(200).json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Delete profile image error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete image',
      error: error.message
    });
  }
}; 