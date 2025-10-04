import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { instituteAdminAPI, adminAuth } from '../../../utils/adminAPI';
import { getAuthToken, removeAuthToken } from '../../../utils/auth';
import SingleToast from '../../../components/SingleToast';
import AdminProtectedRoute from '../../../components/AdminProtectedRoute';
import { parseCSV, validateCSVData, downloadCSVTemplate } from '../../../utils/csvHelper';
import { uploadCSVToCloudinary, validateCSVFile } from '../../../utils/upload';

function InstituteAdminDashboardContent() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [institution, setInstitution] = useState(null);
  const [analytics, setAnalytics] = useState({ overview: {} });
  const [users, setUsers] = useState([]);
  const [usersPagination, setUsersPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [usersSearch, setUsersSearch] = useState('');
  const [associationRequests, setAssociationRequests] = useState([]);
  const [requestsPagination, setRequestsPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // forms
  const [newStudent, setNewStudent] = useState({ name: '', email: '', password: '' });
  const [newVerifier, setNewVerifier] = useState({ name: '', email: '', password: '' });
  const [editUser, setEditUser] = useState(null);
  const [resetPasswordData, setResetPasswordData] = useState({ userId: '', newPassword: '' });
  
  // CSV bulk import
  const [csvFile, setCsvFile] = useState(null);
  const [csvImportLoading, setCsvImportLoading] = useState(false);
  const [csvResults, setCsvResults] = useState(null);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/admin/institute-admin/login');
      return;
    }
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resolveResponseUser = (res) => {
    if (!res) return null;
    return res.admin || res.user || (res.success === false ? null : res);
  };

  const safeArray = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (val.users) return Array.isArray(val.users) ? val.users : [];
    if (val.requests) return Array.isArray(val.requests) ? val.requests : [];
    if (val.data && Array.isArray(val.data)) return val.data;
    return [];
  };

  async function loadDashboardData() {
    try {
      setLoading(true);

      // profile
      const profileResponse = await instituteAdminAPI.getProfile(); // GET /me
      const adminUser = resolveResponseUser(profileResponse);
      if (!adminUser || !adminAuth.isInstituteAdmin(adminUser)) throw new Error('Unauthorized access');
      setUser(adminUser);

      // institution
      const institutionResponse = await instituteAdminAPI.getInstitution(); // GET /institution
      const inst = institutionResponse?.institution || institutionResponse?.data?.institution || institutionResponse;
      setInstitution(inst && (inst._id || inst.name) ? inst : null);

      // analytics
      const analyticsResponse = await instituteAdminAPI.getAnalytics(); // GET /analytics
      const analyticsData = analyticsResponse?.overview || analyticsResponse?.data || analyticsResponse;
      setAnalytics(analyticsData || { overview: {} });

      // users & requests page 1
      await loadUsers(1, usersPagination.limit, '');
      await loadRequests(1, requestsPagination.limit);

    } catch (err) {
      console.error('Dashboard load error', err);
      if (err?.response?.status === 401) {
        removeAuthToken();
        router.push('/admin/institute-admin/login');
      } else {
        setToast({ type: 'error', message: err?.response?.data?.message || err?.message || 'Failed to load data' });
      }
    } finally {
      setLoading(false);
    }
  }

  // USERS
  const loadUsers = async (page = 1, limit = 10, search = '') => {
    try {
      setLoadingUsers(true);
      const res = await instituteAdminAPI.getUsers({ page, limit, search }); // GET /users
      const fetched = res?.users || res?.data?.users || res?.data || [];
      const pagination = res?.pagination || res?.data?.pagination || { page, limit, total: fetched.length, pages: 1 };
      setUsers(Array.isArray(fetched) ? fetched : []);
      setUsersPagination(pagination);
    } catch (err) {
      console.error('loadUsers', err);
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to load users' });
    } finally {
      setLoadingUsers(false);
    }
  };

  const onUsersSearch = async (e) => {
    const q = e.target.value;
    setUsersSearch(q);
    await loadUsers(1, usersPagination.limit, q);
  };

  const changeUsersPage = async (newPage) => await loadUsers(newPage, usersPagination.limit, usersSearch);

  // create student / verifier
  const createUser = async (payload, roleLabel) => {
    try {
      const res = await instituteAdminAPI.createUser(payload); // POST /users
      setToast({ type: 'success', message: res?.message || `${roleLabel} created` });
      setNewStudent({ name: '', email: '', password: '' });
      setNewVerifier({ name: '', email: '', password: '' });
      await loadUsers(usersPagination.page, usersPagination.limit, usersSearch);
      const analyticsResponse = await instituteAdminAPI.getAnalytics();
      setAnalytics(analyticsResponse?.overview || analyticsResponse || { overview: {} });
    } catch (err) {
      console.error('createUser', err);
      setToast({ type: 'error', message: err?.response?.data?.message || `Failed to create ${roleLabel}` });
    }
  };

  const handleCreateStudent = async (e) => {
    e?.preventDefault();
    if (!newStudent.name || !newStudent.email || !newStudent.password) { setToast({ type: 'error', message: 'Fill student fields' }); return; }
    await createUser({ ...newStudent, role: 'STUDENT' }, 'Student');
  };

  const handleCreateVerifier = async (e) => {
    e?.preventDefault();
    if (!newVerifier.name || !newVerifier.email || !newVerifier.password) { setToast({ type: 'error', message: 'Fill verifier fields' }); return; }
    await createUser({ ...newVerifier, role: 'VERIFIER' }, 'Verifier');
  };

  // update user & reset password
  const handleOpenEditUser = (u) => setEditUser(u);
  const handleUpdateUser = async () => {
    if (!editUser) return;
    try {
      const res = await instituteAdminAPI.updateUser(editUser._id, { name: editUser.name, email: editUser.email, bio: editUser.bio, githubUsername: editUser.githubUsername, role: editUser.role });
      setToast({ type: 'success', message: res?.message || 'User updated' });
      setEditUser(null);
      await loadUsers(usersPagination.page, usersPagination.limit, usersSearch);
    } catch (err) {
      console.error('updateUser', err);
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to update user' });
    }
  };

  const handleResetUserPassword = async () => {
    const { userId, newPassword } = resetPasswordData;
    if (!userId || !newPassword) { setToast({ type: 'error', message: 'Provide user and password' }); return; }
    try {
      const res = await instituteAdminAPI.resetUserPassword(userId, { newPassword }); // PUT /users/:userId/reset-password
      setToast({ type: 'success', message: res?.message || 'Password reset' });
      setResetPasswordData({ userId: '', newPassword: '' });
    } catch (err) {
      console.error('resetUserPassword', err);
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to reset password' });
    }
  };

  // change role (admin action)
  const handleRoleChange = async (userId, newRole) => {
    if (!confirm(`Set role to ${newRole} and approve user?`)) return;
    try {
      const res = await instituteAdminAPI.updateUserRole(userId, { newRole }); // PUT /users/:userId/role { newRole }
      setToast({ type: 'success', message: res?.message || `Role changed to ${newRole}` });
      await loadUsers(usersPagination.page, usersPagination.limit, usersSearch);
      const analyticsResponse = await instituteAdminAPI.getAnalytics();
      setAnalytics(analyticsResponse?.overview || analyticsResponse || { overview: {} });
    } catch (err) {
      console.error('updateUserRole', err);
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to update role' });
    }
  };

  // remove user
  const handleRemoveUser = async (userId) => {
    if (!confirm('Remove user from institution?')) return;
    try {
      const res = await instituteAdminAPI.removeUser(userId); // DELETE /users/:userId
      setToast({ type: 'success', message: res?.message || 'User removed' });
      await loadUsers(usersPagination.page, usersPagination.limit, usersSearch);
      const analyticsResponse = await instituteAdminAPI.getAnalytics();
      setAnalytics(analyticsResponse?.overview || analyticsResponse || { overview: {} });
    } catch (err) {
      console.error('removeUser', err);
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to remove user' });
    }
  };

  // REQUESTS
  const loadRequests = async (page = 1, limit = 10) => {
    try {
      setLoadingRequests(true);
      const res = await instituteAdminAPI.getAssociationRequests({ page, limit, status: 'PENDING' }); // GET /association-requests
      const reqs = res?.requests || res?.data?.requests || [];
      const pagination = res?.pagination || res?.data?.pagination || { page, limit, total: reqs.length, pages: 1 };
      setAssociationRequests(Array.isArray(reqs) ? reqs : []);
      setRequestsPagination(pagination);
    } catch (err) {
      console.error('loadRequests', err);
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to load requests' });
    } finally {
      setLoadingRequests(false);
    }
  };

  const changeRequestsPage = async (newPage) => await loadRequests(newPage, requestsPagination.limit);

  const handleAssociationRequest = async (requestId, action) => {
    if (!confirm(`${action === 'approve' ? 'Approve' : 'Reject'} this request?`)) return;
    try {
      const payload = { action, response: action === 'approve' ? 'Approved by institute admin' : 'Rejected by institute admin' };
      const res = await instituteAdminAPI.respondToAssociationRequest(requestId, payload); // PUT /association-requests/:requestId/respond
      setToast({ type: 'success', message: res?.message || `Request ${action}d` });
      await loadRequests(requestsPagination.page, requestsPagination.limit);
      await loadUsers(usersPagination.page, usersPagination.limit, usersSearch);
      const analyticsResponse = await instituteAdminAPI.getAnalytics();
      setAnalytics(analyticsResponse?.overview || analyticsResponse || { overview: {} });
    } catch (err) {
      console.error('respondToAssociationRequest', err);
      setToast({ type: 'error', message: err?.response?.data?.message || `Failed to ${action} request` });
    }
  };

  // export users
  const handleExport = async (format = 'json') => {
    try {
      const res = await instituteAdminAPI.exportUsers({ format }); // GET /users/export?format=csv/json
      if (format === 'csv') {
        // backend sends csv content-type; open in new tab or download
        const blob = new Blob([res], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users-${institution?.name || 'institution'}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        // JSON response object -> show toast and prompt download
        const json = JSON.stringify(res, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users-${institution?.name || 'institution'}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
      setToast({ type: 'success', message: 'Export started' });
    } catch (err) {
      console.error('exportUsers', err);
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to export users' });
    }
  };

  // CSV Bulk Import Functions
  const handleCsvFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validation = validateCSVFile(file);
      if (validation.valid) {
        setCsvFile(file);
        setCsvResults(null);
        setToast({ type: 'success', message: `CSV file "${file.name}" selected successfully` });
      } else {
        setToast({ type: 'error', message: validation.error });
        e.target.value = ''; // Clear the input
      }
    }
  };

  const handleCsvImport = async () => {
    if (!csvFile) {
      setToast({ type: 'error', message: 'Please select a CSV file first' });
      return;
    }

    setCsvImportLoading(true);
    try {
      // Validate CSV file first
      const fileValidation = validateCSVFile(csvFile);
      if (!fileValidation.valid) {
        setToast({ type: 'error', message: fileValidation.error });
        return;
      }

      // Read CSV file content for client-side validation
      const fileContent = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(csvFile);
      });

      // Parse and validate CSV data on client side
      const parsedData = parseCSV(fileContent);
      const validationErrors = validateCSVData(parsedData);
      
      if (validationErrors.length > 0) {
        setToast({ 
          type: 'error', 
          message: `CSV validation failed:\n${validationErrors.slice(0, 3).join('\n')}${validationErrors.length > 3 ? '\n...and more' : ''}` 
        });
        return;
      }

      // Upload CSV to Cloudinary
      setToast({ type: 'info', message: 'Uploading CSV file...' });
      const uploadResult = await uploadCSVToCloudinary(csvFile);
      
      // Send CSV URL to backend
      setToast({ type: 'info', message: 'Processing CSV data...' });
      const response = await instituteAdminAPI.bulkImportCSV(uploadResult.url);
      
      // Store results for download
      setCsvResults(response);
      setToast({ 
        type: 'success', 
        message: `Successfully imported ${response.importedCount || 0} users. Download the CSV with generated passwords.` 
      });

      // Clear the file input
      setCsvFile(null);
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';

      // Refresh user list
      await loadUsers(usersPagination.page, usersPagination.limit, usersSearch);
      const analyticsResponse = await instituteAdminAPI.getAnalytics();
      setAnalytics(analyticsResponse?.overview || analyticsResponse || { overview: {} });

    } catch (err) {
      console.error('CSV bulk import error:', err);
      setToast({ 
        type: 'error', 
        message: err?.response?.data?.message || err.message || 'CSV import failed' 
      });
    } finally {
      setCsvImportLoading(false);
    }
  };

  const downloadCsvResults = () => {
    if (!csvResults?.csvData) {
      setToast({ type: 'error', message: 'No CSV data available for download' });
      return;
    }

    const blob = new Blob([csvResults.csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `users_with_passwords_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const downloadCsvTemplate = () => {
    try {
      downloadCSVTemplate();
      setToast({ type: 'success', message: 'Template downloaded successfully' });
    } catch (err) {
      console.error('Download template error:', err);
      setToast({ type: 'error', message: 'Failed to download template' });
    }
  };

  const handleLogout = () => {
    removeAuthToken();
    router.push('/admin/institute-admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:h-16 space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">Institute Admin Dashboard</h1>
                <p className="text-xs sm:text-sm text-gray-500 truncate">{institution?.displayName || institution?.name || ''}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="text-xs sm:text-sm text-gray-700 truncate max-w-[150px] sm:max-w-none">Welcome, {user?.name}</span>
              <button onClick={handleLogout} className="text-xs sm:text-sm text-red-600 hover:text-red-500 whitespace-nowrap">Logout</button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200 mb-6 overflow-x-auto">
          <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-max sm:min-w-0">
            {[
              { id: 'overview', name: 'Overview' },
              { id: 'users', name: 'Users' },
              { id: 'requests', name: 'Association Requests' },
              { id: 'settings', name: 'Settings' }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                {tab.name}
                {tab.id === 'requests' && associationRequests.length > 0 && (
                  <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{associationRequests.length}</span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview */}
        {activeTab === 'overview' && analytics && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <div className="bg-white shadow rounded-lg p-3 sm:p-6">
                <p className="text-xs sm:text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-lg sm:text-2xl font-semibold text-gray-900">{analytics.overview?.totalUsers || 0}</p>
              </div>
              <div className="bg-white shadow rounded-lg p-3 sm:p-6">
                <p className="text-xs sm:text-sm font-medium text-gray-500">Students</p>
                <p className="text-lg sm:text-2xl font-semibold text-gray-900">{analytics.overview?.totalStudents || 0}</p>
              </div>
              <div className="bg-white shadow rounded-lg p-3 sm:p-6">
                <p className="text-xs sm:text-sm font-medium text-gray-500">Verifiers</p>
                <p className="text-lg sm:text-2xl font-semibold text-gray-900">{analytics.overview?.totalVerifiers || 0}</p>
              </div>
              <div className="bg-white shadow rounded-lg p-3 sm:p-6">
                <p className="text-xs sm:text-sm font-medium text-gray-500">Pending Requests</p>
                <p className="text-lg sm:text-2xl font-semibold text-gray-900">{analytics.overview?.pendingAssociations || 0}</p>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Users</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.slice(0,5).map(u => (
                      <tr key={u._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{u.name}</div>
                          <div className="text-sm text-gray-500">{u.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${u.role === 'VERIFIER' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>{u.role}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Users */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Users</h2>
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <input value={usersSearch} onChange={onUsersSearch} placeholder="Search..." className="form-input px-3 py-2 text-sm flex-1 sm:flex-none sm:w-48" />
                <button onClick={() => loadUsers(1, usersPagination.limit, usersSearch)} className="px-3 py-2 bg-primary-600 text-white rounded text-sm whitespace-nowrap">Search</button>
              </div>
            </div>

            {/* create sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <form onSubmit={handleCreateStudent} className="bg-white shadow rounded-lg p-3 sm:p-4">
                <h3 className="font-medium mb-2 text-sm sm:text-base">Add Student</h3>
                <input className="form-input w-full mb-2 text-sm" placeholder="Name" value={newStudent.name} onChange={e=>setNewStudent(prev=>({...prev,name:e.target.value}))} />
                <input className="form-input w-full mb-2 text-sm" placeholder="Email" value={newStudent.email} onChange={e=>setNewStudent(prev=>({...prev,email:e.target.value}))} />
                <input className="form-input w-full mb-2 text-sm" placeholder="Password" value={newStudent.password} onChange={e=>setNewStudent(prev=>({...prev,password:e.target.value}))} />
                <button type="submit" className="px-3 py-2 bg-green-600 text-white rounded text-sm w-full sm:w-auto">Create Student</button>
              </form>

              <form onSubmit={handleCreateVerifier} className="bg-white shadow rounded-lg p-3 sm:p-4">
                <h3 className="font-medium mb-2 text-sm sm:text-base">Add Verifier</h3>
                <input className="form-input w-full mb-2 text-sm" placeholder="Name" value={newVerifier.name} onChange={e=>setNewVerifier(prev=>({...prev,name:e.target.value}))} />
                <input className="form-input w-full mb-2 text-sm" placeholder="Email" value={newVerifier.email} onChange={e=>setNewVerifier(prev=>({...prev,email:e.target.value}))} />
                <input className="form-input w-full mb-2 text-sm" placeholder="Password" value={newVerifier.password} onChange={e=>setNewVerifier(prev=>({...prev,password:e.target.value}))} />
                <button type="submit" className="px-3 py-2 bg-indigo-600 text-white rounded text-sm w-full sm:w-auto">Create Verifier</button>
              </form>
            </div>

            <div className="bg-white shadow rounded-lg p-3 sm:p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loadingUsers ? (
                      <tr><td colSpan={4} className="p-3 sm:p-6 text-center text-sm">Loading...</td></tr>
                    ) : users.length === 0 ? (
                      <tr><td colSpan={4} className="p-3 sm:p-6 text-center text-gray-500 text-sm">No users</td></tr>
                    ) : users.map(u => (
                      <tr key={u._id}>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <div className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none">{u.name}</div>
                          <div className="text-xs sm:text-sm text-gray-500 truncate max-w-[120px] sm:max-w-none">{u.email}</div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <select value={u.role} onChange={(e) => handleRoleChange(u._id, e.target.value)} className="text-xs sm:text-sm border-gray-300 rounded-md w-full">
                            <option value="STUDENT">STUDENT</option>
                            <option value="VERIFIER">VERIFIER</option>
                          </select>
                        </td>
                        <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                          <button onClick={() => handleOpenEditUser(u)} className="text-primary-600 hover:text-primary-900 mr-2 sm:mr-4">Edit</button>
                          <button onClick={() => handleRemoveUser(u._id)} className="text-red-600 hover:text-red-900">Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* pagination */}
              <div className="mt-4 flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0 px-3 sm:px-0">
                <div className="text-xs sm:text-sm text-gray-600">Page {usersPagination.page} of {usersPagination.pages}</div>
                <div className="flex space-x-2">
                  <button onClick={() => changeUsersPage(Math.max(1, usersPagination.page - 1))} disabled={usersPagination.page <= 1} className="px-2 sm:px-3 py-1 border rounded text-xs sm:text-sm disabled:opacity-50">Prev</button>
                  <button onClick={() => changeUsersPage(Math.min(usersPagination.pages, usersPagination.page + 1))} disabled={usersPagination.page >= usersPagination.pages} className="px-2 sm:px-3 py-1 border rounded text-xs sm:text-sm disabled:opacity-50">Next</button>
                </div>
              </div>
            </div>

            {/* Edit user modal-like area */}
            {editUser && (
              <div className="bg-white shadow rounded-lg p-3 sm:p-4">
                <h3 className="font-medium mb-2 text-sm sm:text-base">Edit User</h3>
                <input className="form-input mb-2 w-full text-sm" value={editUser.name} onChange={e=>setEditUser({...editUser, name: e.target.value})} />
                <input className="form-input mb-2 w-full text-sm" value={editUser.email} onChange={e=>setEditUser({...editUser, email: e.target.value})} />
                <input className="form-input mb-2 w-full text-sm" value={editUser.bio||''} onChange={e=>setEditUser({...editUser, bio: e.target.value})} placeholder="bio" />
                <input className="form-input mb-2 w-full text-sm" value={editUser.githubUsername||''} onChange={e=>setEditUser({...editUser, githubUsername: e.target.value})} placeholder="github username" />
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <button onClick={handleUpdateUser} className="px-3 py-2 bg-primary-600 text-white rounded text-sm">Save</button>
                  <button onClick={()=>setEditUser(null)} className="px-3 py-2 border rounded text-sm">Cancel</button>
                </div>
              </div>
            )}

            {/* Reset password area */}
            <div className="bg-white shadow rounded-lg p-3 sm:p-4">
              <h3 className="font-medium mb-2 text-sm sm:text-base">Reset User Password</h3>
              <input className="form-input mb-2 w-full text-sm" placeholder="User ID" value={resetPasswordData.userId} onChange={e=>setResetPasswordData(prev=>({...prev,userId:e.target.value}))} />
              <input className="form-input mb-2 w-full text-sm" placeholder="New Password" value={resetPasswordData.newPassword} onChange={e=>setResetPasswordData(prev=>({...prev,newPassword:e.target.value}))} />
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <button onClick={handleResetUserPassword} className="px-3 py-2 bg-yellow-600 text-white rounded text-sm">Reset</button>
              </div>
            </div>

            {/* CSV Bulk Import */}
            <div className="bg-white shadow rounded-lg p-3 sm:p-4">
              <h3 className="font-medium mb-2 text-sm sm:text-base">CSV Bulk Import Users</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-2 sm:p-3 mb-4">
                <h4 className="text-xs sm:text-sm font-medium text-blue-800 mb-1">CSV Format Requirements:</h4>
                <ul className="text-xs sm:text-sm text-blue-700 space-y-1">
                  <li>• <strong>Required columns:</strong> name, email</li>
                  <li>• <strong>Optional column:</strong> role (STUDENT or VERIFIER - defaults to STUDENT)</li>
                  <li>• <strong>Passwords:</strong> Generated automatically by the system</li>
                  <li>• <strong>First row:</strong> Must contain column headers</li>
                  <li>• <strong>File size:</strong> Maximum 2MB</li>
                  <li>• <strong>Upload:</strong> Files are securely uploaded to cloud storage</li>
                </ul>
              </div>
              
              <div className="space-y-3 sm:space-y-4">
                {/* Template Download */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                  <button 
                    onClick={downloadCsvTemplate}
                    className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs sm:text-sm w-full sm:w-auto"
                  >
                    Download Template CSV
                  </button>
                  <span className="text-xs sm:text-sm text-gray-500">Get the correct CSV format</span>
                </div>

                {/* File Upload */}
                <div className="flex flex-col space-y-2">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCsvFileChange}
                    className="block w-full text-xs sm:text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:sm:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  />
                  {csvFile && (
                    <span className="text-xs sm:text-sm text-green-600">
                      ✓ {csvFile.name}
                    </span>
                  )}
                </div>

                {/* Import Button */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                  <button
                    onClick={handleCsvImport}
                    disabled={!csvFile || csvImportLoading}
                    className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 text-xs sm:text-sm"
                  >
                    {csvImportLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span>Import CSV</span>
                      </>
                    )}
                  </button>
                  
                  {csvResults && (
                    <button
                      onClick={downloadCsvResults}
                      className="px-3 sm:px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors text-xs sm:text-sm"
                    >
                      📥 Download Results with Passwords
                    </button>
                  )}
                </div>

                {/* Results Summary */}
                {csvResults && (
                  <div className="mt-4 p-2 sm:p-3 bg-green-50 border border-green-200 rounded-md">
                    <h4 className="text-xs sm:text-sm font-medium text-green-800">Import Results:</h4>
                    <ul className="text-xs sm:text-sm text-green-700 mt-1">
                      <li>• Successfully imported: {csvResults.importedCount || 0} users</li>
                      <li>• Failed imports: {csvResults.failedCount || 0} users</li>
                      {csvResults.failedUsers && csvResults.failedUsers.length > 0 && (
                        <li>• Failed emails: {csvResults.failedUsers.map(u => u.email).join(', ')}</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Requests */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Association Requests</h2>
            </div>

            <div className="bg-white shadow rounded-lg p-3 sm:p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                      <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loadingRequests ? (
                      <tr><td colSpan={4} className="p-3 sm:p-6 text-center text-sm">Loading...</td></tr>
                    ) : associationRequests.length === 0 ? (
                      <tr><td colSpan={4} className="p-3 sm:p-6 text-center text-gray-500 text-sm">No pending association requests</td></tr>
                    ) : associationRequests.map(r => (
                      <tr key={r._id}>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <div className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none">{r.studentId?.name || r.user?.name || r.student?.name || 'Unknown'}</div>
                          <div className="text-xs sm:text-sm text-gray-500 truncate max-w-[120px] sm:max-w-none">{r.studentId?.email || r.user?.email}</div>
                        </td>
                        <td className="hidden sm:table-cell px-6 py-4"><div className="text-sm text-gray-900 max-w-xs truncate">{r.message}</div></td>
                        <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                          <button onClick={() => handleAssociationRequest(r._id, 'approve')} className="text-green-600 hover:text-green-900 mr-2 sm:mr-4">Approve</button>
                          <button onClick={() => handleAssociationRequest(r._id, 'reject')} className="text-red-600 hover:text-red-900">Reject</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* pagination */}
                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0 px-3 sm:px-0">
                  <div className="text-xs sm:text-sm text-gray-600">Page {requestsPagination.page} of {requestsPagination.pages}</div>
                  <div className="flex space-x-2">
                    <button onClick={() => changeRequestsPage(Math.max(1, requestsPagination.page - 1))} disabled={requestsPagination.page <= 1} className="px-2 sm:px-3 py-1 border rounded text-xs sm:text-sm disabled:opacity-50">Prev</button>
                    <button onClick={() => changeRequestsPage(Math.min(requestsPagination.pages, requestsPagination.page + 1))} disabled={requestsPagination.page >= requestsPagination.pages} className="px-2 sm:px-3 py-1 border rounded text-xs sm:text-sm disabled:opacity-50">Next</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Settings</h2>

            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input type="text" value={user?.name || ''} className="form-input mt-1" readOnly />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input type="email" value={user?.email || ''} className="form-input mt-1" readOnly />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input type="tel" value={user?.phone || ''} className="form-input mt-1" readOnly />
                </div>
                <button className="px-4 py-2 bg-primary-600 text-white rounded">Change Password</button>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Institution Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Institution Name</label>
                  <input type="text" value={institution?.displayName || institution?.name || ''} className="form-input mt-1" readOnly />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Website</label>
                  <input type="url" value={institution?.website || ''} className="form-input mt-1" readOnly />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea value={institution?.description || ''} className="form-input mt-1" rows={3} readOnly />
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {toast && <SingleToast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}

export default function InstituteAdminDashboard() {
  return (
    <AdminProtectedRoute adminType="institute">
      <InstituteAdminDashboardContent />
    </AdminProtectedRoute>
  );
}
