const rateLimit = require('express-rate-limit');
const env = require('../config/env');

// General API Rate Limiter
const generalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000,
  max: env.RATE_LIMIT_MAX || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
    errors: []
  }
});

// Stricter Rate Limiter for Authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 auth requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes',
    errors: []
  }
});

module.exports = {
  generalLimiter,
  authLimiter
};
