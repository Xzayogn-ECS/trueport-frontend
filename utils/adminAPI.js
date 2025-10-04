import api from './api';

// Super Admin API calls
export const superAdminAPI = {
  // Authentication
  login: async (credentials) => {
    const response = await api.post('/super-admin/login', credentials);
    return response.data;
  },

  // Profile Management
  getProfile: async () => {
    const response = await api.get('/super-admin/me');
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.put('/super-admin/me', data);
    return response.data;
  },

  changePassword: async (data) => {
    const response = await api.put('/super-admin/change-password', data);
    return response.data;
  },

  // Institution Management
  getInstitutions: async (params = {}) => {
    const response = await api.get('/super-admin/institutions', { params });
    return response.data;
  },

  createInstitution: async (data) => {
    const response = await api.post('/super-admin/institutions', data);
    return response.data;
  },

  updateInstitution: async (id, data) => {
    const response = await api.put(`/super-admin/institutions/${id}`, data);
    return response.data;
  },

  deleteInstitution: async (id) => {
    const response = await api.delete(`/super-admin/institutions/${id}`);
    return response.data;
  },

  // Institute Admin Management
  getInstituteAdmins: async (params = {}) => {
    const response = await api.get('/super-admin/institute-admins', { params });
    return response.data;
  },

  createInstituteAdmin: async (data) => {
    const response = await api.post('/super-admin/institute-admins', data);
    return response.data;
  },

  updateInstituteAdmin: async (id, data) => {
    const response = await api.put(`/super-admin/institute-admins/${id}`, data);
    return response.data;
  },

  deleteInstituteAdmin: async (id) => {
    const response = await api.delete(`/super-admin/institute-admins/${id}`);
    return response.data;
  },

  // Analytics
  getAnalytics: async () => {
    const response = await api.get('/super-admin/analytics');
    return response.data;
  },

  // CSV Bulk Import for Institute Admins
  bulkImportAdminsCSV: async (csvData) => {
    const response = await api.post('/super-admin/institute-admins/bulk-import-csv', { csvData });
    return response.data;
  },

  // Download template CSV for institute admins
  downloadAdminTemplate: async () => {
    const response = await api.get('/super-admin/institute-admins/csv-template', { responseType: 'blob' });
    return response.data;
  }
};

// Institute Admin API calls
export const instituteAdminAPI = {
  // --- Authentication ---
  login: async (credentials) => {
    const response = await api.post('/institute-admin/login', credentials);
    return response.data;
  },

  // --- Profile Management ---
  getProfile: async () => {
    const response = await api.get('/institute-admin/me');
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.put('/institute-admin/me', data);
    return response.data;
  },

  changePassword: async (data) => {
    const response = await api.put('/institute-admin/change-password', data);
    return response.data;
  },

  // --- Institution Info ---
  getInstitution: async () => {
    const response = await api.get('/institute-admin/institution');
    return response.data;
  },

  // --- User Management ---
  getUsers: async (params = {}) => {
    const response = await api.get('/institute-admin/users', { params });
    return response.data;
  },

  getUser: async (userId) => {
    const response = await api.get(`/institute-admin/users/${userId}`);
    return response.data;
  },

  createUser: async (data) => {
    // backend expects { name, email, password, role, bio?, githubUsername? }
    const response = await api.post('/institute-admin/users', data);
    return response.data;
  },

  updateUserRole: async (userId, { newRole }) => {
    const response = await api.put(`/institute-admin/users/${userId}/role`, { newRole });
    return response.data;
  },

  updateUser: async (userId, data) => {
    const response = await api.put(`/institute-admin/users/${userId}`, data);
    return response.data;
  },

  resetUserPassword: async (userId, newPassword) => {
    const response = await api.put(`/institute-admin/users/${userId}/reset-password`, { newPassword });
    return response.data;
  },

  removeUser: async (userId, action = 'remove') => {
    const response = await api.delete(`/institute-admin/users/${userId}`, { data: { action } });
    return response.data;
  },

  bulkAction: async (action, userIds, data = {}) => {
    const response = await api.post('/institute-admin/users/bulk-action', { action, userIds, data });
    return response.data;
  },

  bulkImport: async (users) => {
    const response = await api.post('/institute-admin/users/bulk-import', { users });
    return response.data;
  },

  // CSV Bulk Import - accepts CSV URL from Cloudinary, returns CSV with generated passwords
  bulkImportCSV: async (csvUrl) => {
    const response = await api.post('/institute-admin/users/bulk-import', { csvUrl });
    return response.data;
  },

  // Download template CSV
  downloadTemplate: async () => {
    const response = await api.get('/institute-admin/users/csv-template', { responseType: 'blob' });
    return response.data;
  },

  exportUsers: async (params = {}) => {
    const response = await api.get('/institute-admin/users/export', { params });
    return response.data;
  },

  // --- Association Requests ---
  getAssociationRequests: async (params = {}) => {
    const response = await api.get('/institute-admin/association-requests', { params });
    return response.data;
  },

  respondToAssociationRequest: async (requestId, { action, response }) => {
    const res = await api.put(`/institute-admin/association-requests/${requestId}/respond`, {
      action,
      response
    });
    return res.data;
  },

  // --- Analytics ---
  getAnalytics: async () => {
    const response = await api.get('/institute-admin/analytics');
    return response.data;
  }
};

// Auth helpers for admin
export const adminAuth = {
  isSuperAdmin: (user) => {
    return user?.role === 'SUPER_ADMIN';
  },

  isInstituteAdmin: (user) => {
    return user?.role === 'INSTITUTE_ADMIN';
  },

  isAdmin: (user) => {
    return adminAuth.isSuperAdmin(user) || adminAuth.isInstituteAdmin(user);
  },

  getAdminDashboardRoute: (user) => {
    if (adminAuth.isSuperAdmin(user)) {
      return '/admin/super-admin/dashboard';
    } else if (adminAuth.isInstituteAdmin(user)) {
      return '/admin/institute-admin/dashboard';
    }
    return '/dashboard';
  }
};