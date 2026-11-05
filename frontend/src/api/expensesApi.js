import api from './client';

export const expensesApi = {
  getMoveExpenses: (moveId, params) => api.get(`/moves/${moveId}/expenses`, { params }),
  createExpense: (moveId, data) => api.post(`/moves/${moveId}/expenses`, data),
  getExpense: (expenseId) => api.get(`/expenses/${expenseId}`),
  updateExpense: (expenseId, data) => api.patch(`/expenses/${expenseId}`, data),
  deleteExpense: (expenseId) => api.delete(`/expenses/${expenseId}`)
};

