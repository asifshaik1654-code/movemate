const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { checkMoveAccess, checkChildResourceAccess } = require('../middleware/moveAuthMiddleware');
const validate = require('../middleware/validateMiddleware');
const {
  createBookingSchema,
  updateBookingSchema,
  bookingQuerySchema
} = require('../validators/bookingValidators');
const {
  createBooking,
  getBookings,
  getBooking,
  updateBooking,
  deleteBooking
} = require('../controllers/bookingController');
const { getBookingMoveId } = require('../services/bookingService');
const { ROLES } = require('../constants/roles');

// Nested under /moves/:moveId/bookings
const moveBookingRouter = express.Router({ mergeParams: true });
moveBookingRouter.use(authenticate);

moveBookingRouter
  .route('/')
  .get(checkMoveAccess(ROLES.VIEWER), validate(bookingQuerySchema, 'query'), getBookings)
  .post(checkMoveAccess(ROLES.EDITOR), validate(createBookingSchema), createBooking);

// Direct booking operations: /bookings/:bookingId
const directBookingRouter = express.Router();
directBookingRouter.use(authenticate);

directBookingRouter
  .route('/:bookingId')
  .get(checkChildResourceAccess('bookingId', getBookingMoveId, 'Booking', ROLES.VIEWER), getBooking)
  .patch(checkChildResourceAccess('bookingId', getBookingMoveId, 'Booking', ROLES.EDITOR), validate(updateBookingSchema), updateBooking)
  .delete(checkChildResourceAccess('bookingId', getBookingMoveId, 'Booking', ROLES.EDITOR), deleteBooking);

module.exports = { moveBookingRouter, directBookingRouter };

