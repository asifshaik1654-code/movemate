import api from './client';

export const inventoryApi = {
  getRoomItems: (roomId, params) => api.get(`/rooms/${roomId}/items`, { params }),
  createItem: (roomId, data) => api.post(`/rooms/${roomId}/items`, data),
  getItem: (itemId) => api.get(`/items/${itemId}`),
  updateItem: (itemId, data) => api.patch(`/items/${itemId}`, data),
  deleteItem: (itemId) => api.delete(`/items/${itemId}`)
};

