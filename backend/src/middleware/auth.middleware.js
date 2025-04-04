const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

// Middleware to protect routes that require authentication
exports.protect = async (req, res, next) => {
  try {
    let token;
    
    // Check if token exists in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // If no token, return unauthorized
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authorized to access this route' 
      });
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find user by id
      const user = await User.findById(decoded.id).select('-password');
      
      // If user not found
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'User not found' 
        });
      }
      
      // Add user to request object
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authorized to access this route' 
      });
    }
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Server error in auth middleware' 
    });
  }
};

// Middleware to restrict routes to admin users
exports.isAdmin = async (req, res, next) => {
  try {
    // Check if user exists and has admin role
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied: Admin privileges required' 
      });
    }
    
    next();
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Server error in admin middleware' 
    });
  }
};

// Middleware to restrict routes to admin users (alias for backward compatibility)
exports.adminOnly = exports.isAdmin;

// Middleware to restrict routes to admin and moderator users
exports.moderator = async (req, res, next) => {
  try {
    // Check if user is admin or moderator
    if (req.user.role !== 'admin' && req.user.role !== 'moderator' && !req.user.isModerator) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied: Moderator privileges required' 
      });
    }
    
    next();
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Server error in moderator middleware' 
    });
  }
};

// Middleware to verify email domain (for college email verification)
exports.verifyCollegeDomain = (req, res, next) => {
  const { email } = req.body;
  
  // Check if email is provided
  if (!email) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email is required' 
    });
  }
  
  // Extract domain from email
  const domain = email.split('@')[1];
  
  // List of allowed college domains in Indore
  const allowedDomains = [
    'iiti.ac.in',         // IIT Indore
    'ipsacademy.org',     // IPS Academy
    'sgsits.ac.in',       // SGSITS
    'medicaps.ac.in',     // Medicaps University
    'acropolis.in',       // Acropolis Institute
    'dauniv.ac.in',       // Devi Ahilya University
    'oriental.ac.in',     // Oriental University
    'indoreinstitute.com' // Indore Institute
    // Add more college domains as needed
  ];
  
  // Check if domain is allowed
  if (!allowedDomains.includes(domain)) {
    return res.status(403).json({ 
      success: false, 
      message: 'Only students from recognized Indore colleges can register' 
    });
  }
  
  next();
}; 