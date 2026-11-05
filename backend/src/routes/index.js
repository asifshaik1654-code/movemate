const express = require('express');
const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');

const router = express.Router();

// Health check endpoint
router.use('/health', healthRoutes);

// Authentication endpoints
router.use('/auth', authRoutes);

module.exports = router;

