import api from './client';

export const movesApi = {
  getMoves: (params) => api.get('/moves', { params }),
  createMove: (data) => api.post('/moves', data),
  getMove: (moveId) => api.get(`/moves/${moveId}`),
  updateMove: (moveId, data) => api.patch(`/moves/${moveId}`, data),
  deleteMove: (moveId) => api.delete(`/moves/${moveId}`),
  getDashboard: (moveId) => api.get(`/moves/${moveId}/dashboard`),
  getTracking: (moveId) => api.get(`/moves/${moveId}/tracking`),
  getActivity: (moveId, params) => api.get(`/moves/${moveId}/activity`, { params })
};

