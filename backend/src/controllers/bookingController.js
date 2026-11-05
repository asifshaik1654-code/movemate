const bookingService = require('../services/bookingService');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * POST /api/v1/moves/:moveId/bookings
 */
const createBooking = asyncHandler(async (req, res) => {
  const { moveId } = req.params;
  const booking = await bookingService.createBooking(moveId, req.user._id, req.body);

  return new ApiResponse(201, 'Service booking created successfully', booking).send(res);
});

/**
 * GET /api/v1/moves/:moveId/bookings
 */
const getBookings = asyncHandler(async (req, res) => {
  const { moveId } = req.params;
  const result = await bookingService.getMoveBookings(moveId, req.query);

  return new ApiResponse(200, 'Service bookings retrieved successfully', result).send(res);
});

/**
 * GET /api/v1/bookings/:bookingId
 */
const getBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const booking = await bookingService.getBookingById(bookingId);

  return new ApiResponse(200, 'Service booking details retrieved successfully', booking).send(res);
});

/**
 * PATCH /api/v1/bookings/:bookingId
 */
const updateBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const booking = await bookingService.updateBooking(bookingId, req.user._id, req.body);

  return new ApiResponse(200, 'Service booking updated successfully', booking).send(res);
});

/**
 * DELETE /api/v1/bookings/:bookingId
 */
const deleteBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const result = await bookingService.deleteBooking(bookingId, req.user._id);

  return new ApiResponse(200, 'Service booking deleted successfully', result).send(res);
});

module.exports = {
  createBooking,
  getBookings,
  getBooking,
  updateBooking,
  deleteBooking
};

