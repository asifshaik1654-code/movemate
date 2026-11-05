const express = require('express');
const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');
const moveRoutes = require('./moveRoutes');
const { directTaskRouter } = require('./taskRoutes');

const router = express.Router();

// Health check endpoint
router.use('/health', healthRoutes);

// Authentication endpoints
router.use('/auth', authRoutes);

// Move management endpoints
router.use('/moves', moveRoutes);

// Direct task endpoints (e.g. PATCH /tasks/:taskId, DELETE /tasks/:taskId)
router.use('/tasks', directTaskRouter);

module.exports = router;

