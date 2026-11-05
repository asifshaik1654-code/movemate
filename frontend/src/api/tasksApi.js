import api from './client';

export const tasksApi = {
  getMoveTasks: (moveId, params) => api.get(`/moves/${moveId}/tasks`, { params }),
  createTask: (moveId, data) => api.post(`/moves/${moveId}/tasks`, data),
  getTask: (taskId) => api.get(`/tasks/${taskId}`),
  updateTask: (taskId, data) => api.patch(`/tasks/${taskId}`, data),
  deleteTask: (taskId) => api.delete(`/tasks/${taskId}`)
};

