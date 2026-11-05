const express = require('express');
const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');
const moveRoutes = require('./moveRoutes');
const { directTaskRouter } = require('./taskRoutes');
const { directRoomRouter } = require('./roomRoutes');
const { directBoxRouter } = require('./boxRoutes');
const { roomItemRouter, directItemRouter } = require('./inventoryRoutes');
const { directExpenseRouter } = require('./expenseRoutes');
const { directBookingRouter } = require('./bookingRoutes');

const router = express.Router();

// Health check
router.use('/health', healthRoutes);

// Authentication
router.use('/auth', authRoutes);

// Move management (also mounts /moves/:moveId/tasks, /rooms, /boxes, /members, /expenses, /bookings, /activity internally)
router.use('/moves', moveRoutes);

// Direct CRUD endpoints for child resources
router.use('/tasks', directTaskRouter);
router.use('/rooms', directRoomRouter);
router.use('/boxes', directBoxRouter);

// Inventory: nested under room AND direct item access
router.use('/rooms/:roomId/items', roomItemRouter); // /api/v1/rooms/:roomId/items
router.use('/items', directItemRouter);             // /api/v1/items/:itemId

// Direct expenses and bookings
router.use('/expenses', directExpenseRouter);
router.use('/bookings', directBookingRouter);

module.exports = router;

