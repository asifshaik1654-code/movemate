import api from './client';

export const bookingsApi = {
  getMoveBookings: (moveId, params) => api.get(`/moves/${moveId}/bookings`, { params }),
  createBooking: (moveId, data) => api.post(`/moves/${moveId}/bookings`, data),
  getBooking: (bookingId) => api.get(`/bookings/${bookingId}`),
  updateBooking: (bookingId, data) => api.patch(`/bookings/${bookingId}`, data),
  deleteBooking: (bookingId) => api.delete(`/bookings/${bookingId}`)
};

