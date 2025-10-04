import api from './api';

// User API calls for regular users (students/verifiers)
export const userAPI = {
  // Profile Management
  getProfile: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.put('/users/me', data);
    return response.data;
  },

  // Password Management
  changePassword: async (currentPassword, newPassword) => {
    const response = await api.put('/users/me/password', {
      currentPassword,
      newPassword
    });
    return response.data;
  },

  // Institutions
  getInstitutions: async () => {
    const response = await api.get('/users/institutions');
    return response.data;
  },

  // Portfolio Visibility Management
  getPortfolioItems: async () => {
    const response = await api.get('/users/me/portfolio-items');
    return response.data;
  },

  updateItemVisibility: async (itemType, itemId, isPublic) => {
    const response = await api.put(`/users/me/portfolio-item/${itemType}/${itemId}/visibility`, {
      isPublic
    });
    return response.data;
  },

  bulkUpdateVisibility: async (updates) => {
    const response = await api.put('/users/me/portfolio-items/bulk-visibility', {
      updates
    });
    return response.data;
  },

  // Contact Information Management
  getContactInfo: async () => {
    const response = await api.get('/users/me/contact-info');
    console.log("Contact Info is", response.data);
    return response.data;
  },

  updateContactInfo: async (contactData) => {
    const response = await api.put('/users/me/contact-info', contactData);
    return response.data;
  },

  // Contact Visibility Management
  updateContactVisibility: async (visibilitySettings) => {
    const response = await api.put('/users/me/contact-visibility', visibilitySettings);
    return response.data;
  },
};

export default userAPI;