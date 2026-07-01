const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Helper to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET || 'stayease_super_secret_jwt_key_2026_unbreakable_token_hash',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );

  const options = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  };

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        loyaltyPoints: user.loyaltyPoints,
        preferences: user.preferences,
        allocatedRoom: user.allocatedRoom,
      },
    });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, preferences } = req.body;

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'guest',
      preferences: preferences || {},
    });

    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide an email and password' });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Log user out / clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    data: {},
  });
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('allocatedRoom');
    res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user preferences (Stay Planner details)
// @route   PUT /api/auth/preferences
// @access  Private (Guest)
exports.updatePreferences = async (req, res, next) => {
  try {
    const { stayType, guestsCount, extraBedding, addOns } = req.body;

    const fieldsToUpdate = {
      preferences: {
        stayType,
        guestsCount: Number(guestsCount),
        extraBedding: Boolean(extraBedding),
        addOns: addOns || [],
      },
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Redeem loyalty points for rewards
// @route   POST /api/auth/redeem
// @access  Private (Guest)
exports.redeemPoints = async (req, res, next) => {
  try {
    const { pointsCost, rewardName } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.loyaltyPoints < pointsCost) {
      return res.status(400).json({ success: false, error: 'Insufficient loyalty points balance' });
    }

    user.loyaltyPoints -= Number(pointsCost);
    await user.save();

    res.status(200).json({
      success: true,
      loyaltyPoints: user.loyaltyPoints,
      message: `Successfully redeemed: ${rewardName}!`
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Add loyalty points to current user (for feedback review submission)
// @route   PUT /api/auth/add-points
// @access  Private (Guest)
exports.addPoints = async (req, res, next) => {
  try {
    const { points } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.loyaltyPoints = (user.loyaltyPoints || 0) + Number(points);
    await user.save();

    res.status(200).json({
      success: true,
      loyaltyPoints: user.loyaltyPoints
    });
  } catch (err) {
    next(err);
  }
};
