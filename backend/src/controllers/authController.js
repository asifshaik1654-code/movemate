const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const authService = require('../services/authService');

/**
 * Register a new user
 * POST /api/v1/auth/register
 */
const register = asyncHandler(async (req, res) => {
  const result = await authService.registerUser(req.body);
  return new ApiResponse(201, 'User registered successfully', result).send(res);
});

/**
 * Log in an existing user
 * POST /api/v1/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const result = await authService.loginUser(req.body);
  return new ApiResponse(200, 'Login successful', result).send(res);
});

/**
 * Get current authenticated user profile
 * GET /api/v1/auth/me
 */
const getMe = asyncHandler(async (req, res) => {
  const profile = await authService.getUserProfile(req.user._id);
  return new ApiResponse(200, 'Current user profile fetched successfully', profile).send(res);
});

module.exports = {
  register,
  login,
  getMe
};
