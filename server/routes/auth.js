const express = require('express');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Category = require('../models/Category');
const auth = require('../middleware/auth');

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Create default categories for new user
const createDefaultCategories = async (userId) => {
  const defaultCategories = [
    // Expense categories
    { name: 'Food & Dining', type: 'expense', color: '#ef4444', icon: 'utensils' },
    { name: 'Shopping', type: 'expense', color: '#f59e0b', icon: 'shopping-bag' },
    { name: 'Transportation', type: 'expense', color: '#3b82f6', icon: 'car' },
    { name: 'Bills & Utilities', type: 'expense', color: '#8b5cf6', icon: 'receipt' },
    { name: 'Healthcare', type: 'expense', color: '#10b981', icon: 'heart' },
    { name: 'Entertainment', type: 'expense', color: '#f97316', icon: 'film' },
    { name: 'Education', type: 'expense', color: '#06b6d4', icon: 'book' },
    { name: 'Other', type: 'expense', color: '#6b7280', icon: 'more-horizontal' },
    
    // Income categories
    { name: 'Salary', type: 'income', color: '#10b981', icon: 'dollar-sign' },
    { name: 'Freelance', type: 'income', color: '#3b82f6', icon: 'briefcase' },
    { name: 'Investment', type: 'income', color: '#8b5cf6', icon: 'trending-up' },
    { name: 'Other Income', type: 'income', color: '#6b7280', icon: 'plus' }
  ];

  const categories = defaultCategories.map(cat => ({
    ...cat,
    user: userId,
    isDefault: true
  }));

  await Category.insertMany(categories);
};

// Register with email/password
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().isLength({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create new user
    const user = new User({
      email,
      password,
      name,
      isEmailVerified: true // For demo purposes
    });

    await user.save();

    // Create default categories
    await createDefaultCategories(user._id);

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// Login with email/password
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email, isActive: true }).select('+password');
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// Google OAuth login
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;

    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Find or create user
    let user = await User.findOne({ 
      $or: [{ googleId }, { email }] 
    });

    if (user) {
      // Update Google ID if user exists but doesn't have it
      if (!user.googleId) {
        user.googleId = googleId;
        user.avatar = picture;
        await user.save();
      }
    } else {
      // Create new user
      user = new User({
        googleId,
        email,
        name,
        avatar: picture,
        isEmailVerified: true
      });
      await user.save();

      // Create default categories for new user
      await createDefaultCategories(user._id);
    }

    const jwtToken = generateToken(user._id);

    res.json({
      success: true,
      message: 'Google authentication successful',
      token: jwtToken,
      user
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(400).json({
      success: false,
      message: 'Google authentication failed'
    });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// Update user profile
router.put('/profile', auth, [
  body('name').optional().trim().isLength({ min: 1 }),
  body('preferences.currency').optional().isIn(['USD', 'EUR', 'GBP', 'JPY', 'CAD']),
  body('preferences.theme').optional().isIn(['light', 'dark']),
  body('preferences.dateFormat').optional().isIn(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.preferences) {
      updates.preferences = { ...req.user.preferences, ...req.body.preferences };
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during profile update'
    });
  }
});

// Logout (client-side token removal)
router.post('/logout', auth, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;

    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Find or create user
    let user = await User.findOne({ 
      $or: [{ googleId }, { email }] 
    });

    if (user) {
      // Update Google ID if user exists but doesn't have it
      if (!user.googleId) {
        user.googleId = googleId;
        user.avatar = picture;
        await user.save();
      }
    } else {
      // Create new user
      user = new User({
        googleId,
        email,
        name,
        avatar: picture,
        isEmailVerified: true
      });
      await user.save();

      // Create default categories for new user
      await createDefaultCategories(user._id);
    }

    const jwtToken = generateToken(user._id);

    res.json({
      success: true,
      message: 'Google authentication successful',
      token: jwtToken,
      user
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(400).json({
      success: false,
      message: 'Google authentication failed'
    });
  }
});

// Optional callback route 
router.get('/callback', async (req, res) => {
  try {
    // This is for traditional OAuth redirect flow
    // If you're using the simple token approach above, you don't need this
    const { code } = req.query;
    
    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_code`);
    }

    // Exchange code for tokens (if using OAuth flow)
    // This is optional since we're using the token approach
    
    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  } catch (error) {
    console.error('Callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
  }
});


module.exports = router;