const express = require('express');
const healthRoutes = require('./healthRoutes');

const router = express.Router();

// Health check endpoint
router.use('/health', healthRoutes);

module.exports = router;

