const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { asyncHandler, AppError } = require('../utils/errorHandler');
const { validateEmail, validatePassword, validateUsername } = require('../utils/validators');
const router = express.Router();

// Register
router.post('/register', asyncHandler(async (req, res, next) => {
  const { username, email, password } = req.body;
  
  // Validate inputs
  if (!validateUsername(username)) {
    throw new AppError('Username must be 3-30 characters', 400);
  }
  
  if (!validateEmail(email)) {
    throw new AppError('Please provide a valid email address', 400);
  }
  
  if (!validatePassword(password)) {
    throw new AppError('Password must be at least 6 characters long', 400);
  }

  // Check if user exists
  const existingUser = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }] });
  if (existingUser) {
    throw new AppError('User already exists with this email or username', 400);
  }

  // Create user
  const user = new User({ 
    username: username.trim(), 
    email: email.toLowerCase().trim(), 
    password 
  });
  await user.save();

  // Generate token
  const token = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.status(201).json({
    success: true,
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email
    }
  });
}));


// Login
router.post('/login', asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  
  // Validate inputs
  if (!validateEmail(email)) {
    throw new AppError('Please provide a valid email address', 400);
  }
  
  if (!password) {
    throw new AppError('Password is required', 400);
  }
  
  // Find user
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  // Check password
  const isValid = await user.comparePassword(password);
  if (!isValid) {
    throw new AppError('Invalid email or password', 401);
  }

  // Generate token
  const token = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    success: true,
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email
    }
  });
}));

module.exports = router;