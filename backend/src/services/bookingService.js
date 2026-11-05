const mongoose = require('mongoose');
const ServiceBooking = require('../models/ServiceBooking');
const Move = require('../models/Move');
const { logActivity } = require('./activityService');
const ApiError = require('../utils/apiError');

/**
 * Get parent moveId for a booking (used by checkChildResourceAccess)
 */
const getBookingMoveId = async (bookingId) => {
  const booking = await ServiceBooking.findById(bookingId).select('moveId');
  if (!booking) throw new ApiError(404, 'Service booking not found');
  return booking.moveId;
};

/**
 * Create a new service booking
 */
const createBooking = async (moveId, userId, bookingData) => {
  const move = await Move.findById(moveId);
  if (!move) throw new ApiError(404, 'Moving plan not found');

  const booking = await ServiceBooking.create({
    moveId,
    ...bookingData
  });

  await logActivity({
    moveId,
    userId,
    action: 'BOOKING_CREATED',
    details: `Booked "${booking.serviceType}" with "${booking.providerName}" on ${new Date(booking.scheduledDate).toLocaleDateString()}`,
    entityType: 'Booking',
    entityId: booking._id
  });

  return booking;
};

/**
 * Get all service bookings for a move
 */
const getMoveBookings = async (moveId, query = {}) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 50;
  const skip = (page - 1) * limit;

  const filter = { moveId };
  if (query.serviceType) filter.serviceType = query.serviceType;
  if (query.status) filter.status = query.status;
  if (query.search) {
    filter.providerName = { $regex: query.search, $options: 'i' };
  }

  const [bookings, total] = await Promise.all([
    ServiceBooking.find(filter).sort('scheduledDate').skip(skip).limit(limit),
    ServiceBooking.countDocuments(filter)
  ]);

  // Status breakdown summary
  const statusCounts = {
    Inquired: 0,
    Booked: 0,
    Confirmed: 0,
    Completed: 0,
    Cancelled: 0
  };

  const allBookings = await ServiceBooking.find({ moveId }).select('status cost');
  let totalCost = 0;

  allBookings.forEach((b) => {
    if (statusCounts[b.status] !== undefined) statusCounts[b.status] += 1;
    totalCost += b.cost || 0;
  });

  return {
    bookings,
    summary: {
      totalBookings: allBookings.length,
      confirmedOrCompleted: (statusCounts.Confirmed || 0) + (statusCounts.Completed || 0),
      statusCounts,
      totalCost
    },
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1
    }
  };
};

/**
 * Get single booking by ID
 */
const getBookingById = async (bookingId) => {
  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    throw new ApiError(400, 'Invalid Booking ID format');
  }

  const booking = await ServiceBooking.findById(bookingId);
  if (!booking) throw new ApiError(404, 'Service booking not found');
  return booking;
};

/**
 * Update a service booking
 */
const updateBooking = async (bookingId, userId, updateData) => {
  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    throw new ApiError(400, 'Invalid Booking ID format');
  }

  const booking = await ServiceBooking.findByIdAndUpdate(
    bookingId,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!booking) throw new ApiError(404, 'Service booking not found');

  await logActivity({
    moveId: booking.moveId,
    userId,
    action: 'BOOKING_UPDATED',
    details: `Updated "${booking.serviceType}" (${booking.providerName}) status to "${booking.status}"`,
    entityType: 'Booking',
    entityId: booking._id
  });

  return booking;
};

/**
 * Delete a service booking
 */
const deleteBooking = async (bookingId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    throw new ApiError(400, 'Invalid Booking ID format');
  }

  const booking = await ServiceBooking.findByIdAndDelete(bookingId);
  if (!booking) throw new ApiError(404, 'Service booking not found');

  await logActivity({
    moveId: booking.moveId,
    userId,
    action: 'BOOKING_DELETED',
    details: `Deleted "${booking.serviceType}" booking with "${booking.providerName}"`,
    entityType: 'Booking',
    entityId: bookingId
  });

  return { deleted: true, bookingId };
};

module.exports = {
  getBookingMoveId,
  createBooking,
  getMoveBookings,
  getBookingById,
  updateBooking,
  deleteBooking
};

