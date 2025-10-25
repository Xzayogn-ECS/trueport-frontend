import api from './api';

const eventsAPI = {
  assignRole: async (eventId, role, userId) => {
    const response = await api.post(`/events/${eventId}/assign/${role}`, { userId });
    return response.data;
  },

  unassignRole: async (eventId, role, userId) => {
    const response = await api.delete(`/events/${eventId}/assign/${role}`, { data: { userId } });
    return response.data;
  },

  assignPosition: async (eventId, userId, rank, label) => {
    const response = await api.post(`/events/${eventId}/assign-position`, { userId, rank, label });
    return response.data;
  },

  removePosition: async (eventId, userId) => {
    const response = await api.delete(`/events/${eventId}/assign-position/${userId}`);
    return response.data;
  },

  getRankings: async (eventId) => {
    const response = await api.get(`/events/${eventId}/rankings`);
    return response.data;
  },

  pushExperiences: async (eventId, payload) => {
    const response = await api.post(`/events/${eventId}/push-experiences`, payload || {});
    return response.data;
  }
};

export default eventsAPI;
