const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    match: [
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  phone: {
    type: String,
    match: [/^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/, 'Please provide a valid phone number']
  },
  age: {
    type: Number,
    required: [true, 'Please provide your age'],
    min: [18, 'You must be at least 18 years old']
  },
  gender: {
    type: String,
    required: [true, 'Please specify your gender'],
    enum: ['Male', 'Female', 'Other', 'Prefer not to say']
  },
  college: {
    type: String,
    required: [true, 'Please provide your college name']
  },
  course: {
    type: String
  },
  yearOfStudy: {
    type: String
  },
  bio: {
    type: String,
    maxlength: [300, 'Bio cannot be more than 300 characters']
  },
  interests: {
    type: [String],
    default: []
  },
  location: {
    type: String,
    default: 'Indore'
  },
  profileImages: {
    type: [String],
    default: []
  },
  profileImage: {
    type: String,
    default: 'default-profile.jpg'
  },
  coverImage: {
    type: String,
    default: 'default-cover.jpg'
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  isProfileComplete: {
    type: Boolean,
    default: false
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  emailVerificationToken: String,
  emailVerificationExpire: Date,
  phoneVerificationCode: String,
  phoneVerificationExpire: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date
}, {
  timestamps: true
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  // Only hash password if it's modified or new
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    // Generate salt
    const salt = await bcrypt.genSalt(10);
    
    // Hash password
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check if password matches
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to generate JWT token
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id, email: this.email, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY }
  );
};

// Method to generate email verification token
UserSchema.methods.getEmailVerificationToken = function() {
  const token = Math.random().toString(36).substring(2, 15) + 
                Math.random().toString(36).substring(2, 15);
  
  // Save hashed token to database
  this.emailVerificationToken = token;
  
  // Set expiry (24 hours)
  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000;
  
  return token;
};

// Method to generate phone verification code
UserSchema.methods.getPhoneVerificationCode = function() {
  // Generate 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Save code to database
  this.phoneVerificationCode = code;
  
  // Set expiry (10 minutes)
  this.phoneVerificationExpire = Date.now() + 10 * 60 * 1000;
  
  return code;
};

module.exports = mongoose.model('User', UserSchema); 