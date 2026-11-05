import api from './client';

export const membersApi = {
  getMoveMembers: (moveId) => api.get(`/moves/${moveId}/members`),
  inviteMember: (moveId, data) => api.post(`/moves/${moveId}/members`, data),
  updateMemberRole: (moveId, memberId, role) => api.patch(`/moves/${moveId}/members/${memberId}`, { role }),
  removeMember: (moveId, memberId) => api.delete(`/moves/${moveId}/members/${memberId}`)
};

