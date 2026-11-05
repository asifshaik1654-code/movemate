import api from './client';

export const roomsApi = {
  getMoveRooms: (moveId) => api.get(`/moves/${moveId}/rooms`),
  createRoom: (moveId, data) => api.post(`/moves/${moveId}/rooms`, data),
  getRoom: (roomId) => api.get(`/rooms/${roomId}`),
  updateRoom: (roomId, data) => api.patch(`/rooms/${roomId}`, data),
  deleteRoom: (roomId) => api.delete(`/rooms/${roomId}`)
};

