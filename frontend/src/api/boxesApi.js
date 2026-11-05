import api from './client';

export const boxesApi = {
  getMoveBoxes: (moveId, params) => api.get(`/moves/${moveId}/boxes`, { params }),
  createBox: (moveId, data) => api.post(`/moves/${moveId}/boxes`, data),
  getBox: (boxId) => api.get(`/boxes/${boxId}`),
  updateBox: (boxId, data) => api.patch(`/boxes/${boxId}`, data),
  deleteBox: (boxId) => api.delete(`/boxes/${boxId}`)
};

