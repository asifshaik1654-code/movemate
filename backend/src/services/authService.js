const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const ApiError = require('../utils/apiError');

/**
 * Generate a JWT token for a given user ID
 * @param {string} userId
 * @returns {string} Signed JWT
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN
  });
};

/**
 * Verify a JWT token
 * @param {string} token
 * @returns {object} Decoded payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, env.JWT_SECRET);
};

/**
 * Register a new user
 * @param {object} userData
 * @returns {Promise<{ user: object, token: string }>}
 */
const registerUser = async ({ name, email, password, phone }) => {
  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, 'An account with this email address already exists');
  }

  // Create new user (pre-save hook hashes password automatically)
  const user = await User.create({
    name,
    email,
    password,
    phone
  });

  const token = generateToken(user._id);

  // Convert to object (stripping password via toJSON schema transform)
  const userSafe = user.toJSON();

  return {
    user: userSafe,
    token
  };
};

/**
 * Authenticate user credentials and issue token
 * @param {object} credentials
 * @returns {Promise<{ user: object, token: string }>}
 */
const loginUser = async ({ email, password }) => {
  // Explicitly select password field since it has select: false
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    // Generic message to avoid email enumeration
    throw new ApiError(401, 'Invalid email or password');
  }

  const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const token = generateToken(user._id);

  const userSafe = user.toJSON();

  return {
    user: userSafe,
    token
  };
};

/**
 * Retrieve user profile by ID
 * @param {string} userId
 * @returns {Promise<object>}
 */
const getUserProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return user.toJSON();
};

module.exports = {
  generateToken,
  verifyToken,
  registerUser,
  loginUser,
  getUserProfile
};

