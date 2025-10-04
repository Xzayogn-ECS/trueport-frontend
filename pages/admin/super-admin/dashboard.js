import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { superAdminAPI, adminAuth } from '../../../utils/adminAPI';
import { getAuthToken, removeAuthToken } from '../../../utils/auth';
import SingleToast from '../../../components/SingleToast';
import AdminProtectedRoute from '../../../components/AdminProtectedRoute';

function SuperAdminDashboardContent() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [institutions, setInstitutions] = useState([]);
  const [instituteAdmins, setInstituteAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // modal toggles
  const [showCreateInstitution, setShowCreateInstitution] = useState(false);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  // editing states
  const [editingInstitutionId, setEditingInstitutionId] = useState(null);
  const [editingAdminId, setEditingAdminId] = useState(null);

  // CSV bulk import for admins
  const [adminCsvFile, setAdminCsvFile] = useState(null);
  const [adminCsvImportLoading, setAdminCsvImportLoading] = useState(false);
  const [adminCsvResults, setAdminCsvResults] = useState(null);

  // form states - match backend fields
  const [institutionForm, setInstitutionForm] = useState({
    name: '',
    displayName: '',
    description: '',
    website: '',
    logo: '',
    address: '',
    contactInfo: { email: '', phone: '' },
    settings: { allowSelfRegistration: true, requireVerifierApproval: true, maxUsersLimit: 1000 }
  });

  const [adminForm, setAdminForm] = useState({
    name: '',
    email: '',
    phone: '',
    institution: '',
    password: '',
    permissions: { manageUsers: true, manageVerifiers: true, viewAnalytics: true, manageSettings: false }
  });

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return router.push('/admin/super-admin/login');
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const profileResponse = await superAdminAPI.getProfile();
      const adminUser = profileResponse?.admin || profileResponse?.user || profileResponse;
      const isValidAdmin = adminAuth.isSuperAdmin?.(adminUser) || adminUser?.role === 'SUPER_ADMIN';
      if (!adminUser || !isValidAdmin) throw new Error('Unauthorized access');
      setUser(adminUser);

      const analyticsResponse = await superAdminAPI.getAnalytics();
      if (analyticsResponse) setAnalytics(analyticsResponse);

      const institutionsResponse = await superAdminAPI.getInstitutions({ limit: 100 });
      if (institutionsResponse?.institutions) setInstitutions(institutionsResponse.institutions || []);

      const adminsResponse = await superAdminAPI.getInstituteAdmins({ limit: 100 });
      if (adminsResponse?.admins) setInstituteAdmins(adminsResponse.admins || []);
    } catch (err) {
      console.error('Load dashboard error', err);
      if (err?.response?.status === 401) {
        removeAuthToken();
        router.push('/admin/super-admin/login');
      } else {
        setToast({ type: 'error', message: err?.response?.data?.message || err.message || 'Failed to load data' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    removeAuthToken();
    router.push('/admin/super-admin/login');
  };

  // --- Institution form handlers ---
  const handleInstitutionChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('contactInfo.')) {
      const key = name.split('.')[1];
      setInstitutionForm(prev => ({ ...prev, contactInfo: { ...prev.contactInfo, [key]: value } }));
      return;
    }
    if (name.startsWith('settings.')) {
      const key = name.split('.')[1];
      const val = type === 'checkbox' ? checked : (key === 'maxUsersLimit' ? parseInt(value || 0) : value);
      setInstitutionForm(prev => ({ ...prev, settings: { ...prev.settings, [key]: val } }));
      return;
    }
    setInstitutionForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateInstitution = async (e) => {
    e?.preventDefault?.();
    if (!institutionForm.name || !institutionForm.displayName) {
      setToast({ type: 'error', message: 'Name and display name required' });
      return;
    }
    try {
      setSubmitting(true);
      const payload = {
        name: institutionForm.name,
        displayName: institutionForm.displayName,
        description: institutionForm.description,
        website: institutionForm.website,
        logo: institutionForm.logo,
        address: institutionForm.address,
        contactInfo: institutionForm.contactInfo,
        settings: institutionForm.settings
      };

      let resp;
      if (editingInstitutionId) {
        resp = await superAdminAPI.updateInstitution(editingInstitutionId, payload);
        if (resp?.institution) {
          setInstitutions(prev => prev.map(i => i._id === editingInstitutionId ? resp.institution : i));
          setToast({ type: 'success', message: resp.message || 'Institution updated' });
        } else {
          setToast({ type: 'error', message: resp?.message || 'Update failed' });
        }
      } else {
        resp = await superAdminAPI.createInstitution(payload);
        if (resp?.institution) {
          setInstitutions(prev => [resp.institution, ...prev]);
          setToast({ type: 'success', message: resp.message || 'Institution created' });
        } else {
          setToast({ type: 'error', message: resp?.message || 'Failed to create institution' });
        }
      }

      // close & reset
      setShowCreateInstitution(false);
      setEditingInstitutionId(null);
      setInstitutionForm({
        name: '',
        displayName: '',
        description: '',
        website: '',
        logo: '',
        address: '',
        contactInfo: { email: '', phone: '' },
        settings: { allowSelfRegistration: true, requireVerifierApproval: true, maxUsersLimit: 1000 }
      });
    } catch (err) {
      console.error('Create/Update institution error', err);
      setToast({ type: 'error', message: err?.response?.data?.message || err.message || 'Create/Update failed' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteInstitution = async (id) => {
    if (!confirm('Delete institution?')) return;
    try {
      const resp = await superAdminAPI.deleteInstitution(id);
      if (resp?.message) {
        setInstitutions(prev => prev.filter(i => i._id !== id));
        setToast({ type: 'success', message: resp.message });
      } else {
        setToast({ type: 'error', message: resp?.message || 'Delete failed' });
      }
    } catch (err) {
      console.error('Delete institution error', err);
      setToast({ type: 'error', message: err?.response?.data?.message || err.message || 'Delete failed' });
    }
  };

  // --- Admin form handlers ---
  const handleAdminChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('permissions.')) {
      const key = name.split('.')[1];
      setAdminForm(prev => ({ ...prev, permissions: { ...prev.permissions, [key]: checked } }));
      return;
    }
    setAdminForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateAdmin = async (e) => {
    e?.preventDefault?.();
    if (!adminForm.name || !adminForm.email || !adminForm.institution || (!adminForm.password && !editingAdminId)) {
      setToast({ type: 'error', message: 'All fields required for admin' });
      return;
    }
    try {
      setSubmitting(true);
      const payload = {
        name: adminForm.name,
        email: adminForm.email,
        phone: adminForm.phone,
        institution: adminForm.institution,
        permissions: adminForm.permissions
      };
      if (adminForm.password) payload.password = adminForm.password;

      let resp;
      if (editingAdminId) {
        resp = await superAdminAPI.updateInstituteAdmin(editingAdminId, payload);
        if (resp?.admin) {
          setInstituteAdmins(prev => prev.map(a => a._id === editingAdminId ? resp.admin : a));
          setToast({ type: 'success', message: resp.message || 'Admin updated' });
        } else {
          setToast({ type: 'error', message: resp?.message || 'Update failed' });
        }
      } else {
        resp = await superAdminAPI.createInstituteAdmin(payload);
        if (resp?.admin) {
          setInstituteAdmins(prev => [resp.admin, ...prev]);
          setToast({ type: 'success', message: resp.message || 'Institute admin created' });
        } else {
          setToast({ type: 'error', message: resp?.message || 'Failed to create admin' });
        }
      }

      setShowCreateAdmin(false);
      setEditingAdminId(null);
      setAdminForm({
        name: '',
        email: '',
        phone: '',
        institution: '',
        password: '',
        permissions: { manageUsers: true, manageVerifiers: true, viewAnalytics: true, manageSettings: false }
      });
    } catch (err) {
      console.error('Create/Update admin error', err);
      setToast({ type: 'error', message: err?.response?.data?.message || err.message || 'Create/Update failed' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAdmin = async (id) => {
    if (!confirm('Delete admin?')) return;
    try {
      const resp = await superAdminAPI.deleteInstituteAdmin(id);
      if (resp?.message) {
        setInstituteAdmins(prev => prev.filter(a => a._id !== id));
        setToast({ type: 'success', message: resp.message });
      } else {
        setToast({ type: 'error', message: resp?.message || 'Delete failed' });
      }
    } catch (err) {
      console.error('Delete admin error', err);
      setToast({ type: 'error', message: err?.response?.data?.message || err.message || 'Delete failed' });
    }
  };

  // --- Change password (super admin) ---
  const handlePasswordChange = async (e) => {
    e?.preventDefault?.();
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setToast({ type: 'error', message: 'Both current and new password required' });
      return;
    }
    try {
      setSubmitting(true);
      const resp = await superAdminAPI.changePassword(passwordForm);
      if (resp?.message) {
        setShowChangePassword(false);
        setPasswordForm({ currentPassword: '', newPassword: '' });
        setToast({ type: 'success', message: resp.message });
      } else {
        setToast({ type: 'error', message: resp?.message || 'Failed to change password' });
      }
    } catch (err) {
      console.error('Change password error', err);
      setToast({ type: 'error', message: err?.response?.data?.message || err.message || 'Change failed' });
    } finally {
      setSubmitting(false);
    }
  };

  const openEditInstitution = (inst) => {
    setEditingInstitutionId(inst._id);
    setInstitutionForm({
      name: inst.name || '',
      displayName: inst.displayName || '',
      description: inst.description || '',
      website: inst.website || '',
      logo: inst.logo || '',
      address: inst.address || '',
      contactInfo: { email: inst.contactInfo?.email || '', phone: inst.contactInfo?.phone || '' },
      settings: {
        allowSelfRegistration: inst.settings?.allowSelfRegistration ?? true,
        requireVerifierApproval: inst.settings?.requireVerifierApproval ?? true,
        maxUsersLimit: inst.settings?.maxUsersLimit ?? 1000
      }
    });
    setShowCreateInstitution(true);
  };

  const openEditAdmin = (a) => {
    setEditingAdminId(a._id);
    setAdminForm({
      name: a.name || '',
      email: a.email || '',
      phone: a.phone || '',
      institution: a.institution || '',
      password: '',
      permissions: {
        manageUsers: !!a.permissions?.manageUsers,
        manageVerifiers: !!a.permissions?.manageVerifiers,
        viewAnalytics: !!a.permissions?.viewAnalytics,
        manageSettings: !!a.permissions?.manageSettings
      }
    });
    setShowCreateAdmin(true);
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:h-16 space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Super Admin Dashboard</h1>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="text-xs sm:text-sm text-gray-700 truncate max-w-[150px] sm:max-w-none">Welcome, {user?.name}</span>
              <button onClick={handleLogout} className="text-xs sm:text-sm text-red-600 hover:text-red-500 whitespace-nowrap">Logout</button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[{ id: 'overview', name: 'Overview' },{ id: 'institutions', name: 'Institutions' },{ id: 'admins', name: 'Institute Admins' },{ id: 'settings', name: 'Settings' }].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab===tab.id ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === 'overview' && analytics && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <div className="card p-3 sm:p-6 bg-white shadow rounded-lg">
                <p className="text-xs sm:text-sm font-medium text-gray-500">Total Institutions</p>
                <p className="text-lg sm:text-2xl font-semibold text-gray-900">{analytics.overview?.totalInstitutions || 0}</p>
              </div>
              <div className="card p-3 sm:p-6 bg-white shadow rounded-lg">
                <p className="text-xs sm:text-sm font-medium text-gray-500">Institute Admins</p>
                <p className="text-lg sm:text-2xl font-semibold text-gray-900">{analytics.overview?.totalInstituteAdmins || 0}</p>
              </div>
              <div className="card p-3 sm:p-6 bg-white shadow rounded-lg">
                <p className="text-xs sm:text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-lg sm:text-2xl font-semibold text-gray-900">{analytics.overview?.totalUsers || 0}</p>
              </div>
              <div className="card p-3 sm:p-6 bg-white shadow rounded-lg">
                <p className="text-xs sm:text-sm font-medium text-gray-500">Active Institutions</p>
                <p className="text-lg sm:text-2xl font-semibold text-gray-900">{analytics.overview?.activeInstitutions || 0}</p>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Institutions</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Institution</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {institutions.slice(0,5).map(inst=> (
                      <tr key={inst._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{inst.displayName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{inst.userCount || 0}</td>
                        <td className="px-6 py-4 whitespace-nowrap"><span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${inst.status==='ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{inst.status}</span></td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inst.createdAt ? new Date(inst.createdAt).toLocaleDateString() : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'institutions' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Institutions</h2>
              <button onClick={()=>{
                setEditingInstitutionId(null);
                setInstitutionForm({
                  name: '',
                  displayName: '',
                  description: '',
                  website: '',
                  logo: '',
                  address: '',
                  contactInfo: { email: '', phone: '' },
                  settings: { allowSelfRegistration: true, requireVerifierApproval: true, maxUsersLimit: 1000 }
                });
                setShowCreateInstitution(true);
              }} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">Add Institution</button>
            </div>

            <div className="bg-white shadow rounded-lg">
              <div className="p-3 sm:p-6 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Institution</th>
                      <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Website</th>
                      <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
                      <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {institutions.map(inst=> (
                      <tr key={inst._id}>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap"><div className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none">{inst.displayName}</div><div className="text-xs sm:text-sm text-gray-500 truncate max-w-[120px] sm:max-w-none">{inst.name}</div></td>
                        <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inst.website ? <a href={inst.website} target="_blank" rel="noreferrer" className="text-primary-600">{inst.website}</a> : '-'}</td>
                        <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900">{inst.userCount || 0}</td>
                        <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap"><span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${inst.status==='ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{inst.status||'ACTIVE'}</span></td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                          <button onClick={()=>openEditInstitution(inst)} className="text-primary-600 hover:text-primary-900 mr-2 sm:mr-4">Edit</button>
                          <button onClick={()=>handleDeleteInstitution(inst._id)} className="text-red-600 hover:text-red-900">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'admins' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Institute Admins</h2>
              <button onClick={()=>{
                setEditingAdminId(null);
                setAdminForm({
                  name: '',
                  email: '',
                  phone: '',
                  institution: '',
                  password: '',
                  permissions: { manageUsers: true, manageVerifiers: true, viewAnalytics: true, manageSettings: false }
                });
                setShowCreateAdmin(true);
              }} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">Add Institute Admin</button>
            </div>

            <div className="bg-white shadow rounded-lg p-3 sm:p-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
                    <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Institution</th>
                    <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {instituteAdmins.map(a=> (
                    <tr key={a._id}>
                      <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900">{a.name}</div><div className="text-sm text-gray-500">{a.email}</div></td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{a.institution}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{a.phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap"><span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${a.status==='ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{a.status||'ACTIVE'}</span></td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button onClick={()=>openEditAdmin(a)} className="text-primary-600 hover:text-primary-900 mr-4">Edit</button>
                        <button onClick={()=>handleDeleteAdmin(a._id)} className="text-red-600 hover:text-red-900">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Settings</h2>
            <div className="bg-white shadow rounded-lg p-3 sm:p-6">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Profile Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">Name</label>
                  <input type="text" value={user?.name||''} className="form-input mt-1 text-sm" readOnly />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">Email</label>
                  <input type="email" value={user?.email||''} className="form-input mt-1 text-sm" readOnly />
                </div>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <button onClick={()=>setShowChangePassword(true)} className="bg-primary-600 hover:bg-primary-700 text-white px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors">Change Password</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {toast && <SingleToast type={toast.type} message={toast.message} onClose={()=>setToast(null)} />}

      {/* Create / Edit Institution Modal */}
      {showCreateInstitution && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-4">
          <form onSubmit={handleCreateInstitution} className="bg-white p-4 sm:p-6 rounded shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">{editingInstitutionId ? 'Edit Institution' : 'Create Institution'}</h3>
            <div className="space-y-2 sm:space-y-3">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700">Name (unique)</label>
                <input name="name" value={institutionForm.name} onChange={handleInstitutionChange} className="form-input mt-1 w-full text-sm" required />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700">Display Name</label>
                <input name="displayName" value={institutionForm.displayName} onChange={handleInstitutionChange} className="form-input mt-1 w-full text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea name="description" value={institutionForm.description} onChange={handleInstitutionChange} className="form-input mt-1 w-full" rows={3} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Website</label>
                <input name="website" value={institutionForm.website} onChange={handleInstitutionChange} className="form-input mt-1 w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Logo URL</label>
                <input name="logo" value={institutionForm.logo} onChange={handleInstitutionChange} className="form-input mt-1 w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <textarea name="address" value={institutionForm.address} onChange={handleInstitutionChange} className="form-input mt-1 w-full" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact Email</label>
                  <input name="contactInfo.email" value={institutionForm.contactInfo.email} onChange={handleInstitutionChange} type="email" className="form-input mt-1 w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
                  <input name="contactInfo.phone" value={institutionForm.contactInfo.phone} onChange={handleInstitutionChange} className="form-input mt-1 w-full" />
                </div>
              </div>

              <div className="flex items-center space-x-3 mt-2">
                <label className="flex items-center space-x-2"><input type="checkbox" name="settings.allowSelfRegistration" checked={institutionForm.settings.allowSelfRegistration} onChange={handleInstitutionChange} /> <span className="text-sm">Allow Self Registration</span></label>
                <label className="flex items-center space-x-2"><input type="checkbox" name="settings.requireVerifierApproval" checked={institutionForm.settings.requireVerifierApproval} onChange={handleInstitutionChange} /> <span className="text-sm">Require Verifier Approval</span></label>
                <div className="ml-4">
                  <label className="block text-sm font-medium text-gray-700">Max Users</label>
                  <input name="settings.maxUsersLimit" value={institutionForm.settings.maxUsersLimit} onChange={handleInstitutionChange} type="number" min={1} className="form-input mt-1 w-32" />
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <button type="button" onClick={()=>{
                setShowCreateInstitution(false);
                setEditingInstitutionId(null);
              }} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
              <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary-600 text-white rounded">{submitting ? (editingInstitutionId ? 'Saving...' : 'Creating...') : (editingInstitutionId ? 'Save' : 'Create')}</button>
            </div>
          </form>
        </div>
      )}

      {/* Create / Edit Admin Modal */}
      {showCreateAdmin && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-4">
          <form onSubmit={handleCreateAdmin} className="bg-white p-4 sm:p-6 rounded shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">{editingAdminId ? 'Edit Institute Admin' : 'Create Institute Admin'}</h3>
            <div className="space-y-2 sm:space-y-3">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700">Name</label>
                <input name="name" value={adminForm.name} onChange={handleAdminChange} className="form-input mt-1 w-full text-sm" required />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700">Email</label>
                <input name="email" value={adminForm.email} onChange={handleAdminChange} type="email" className="form-input mt-1 w-full text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input name="phone" value={adminForm.phone} onChange={handleAdminChange} className="form-input mt-1 w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Institution (name)</label>
                <select name="institution" value={adminForm.institution} onChange={handleAdminChange} className="form-input mt-1 w-full" required>
                  <option value="">Select institution</option>
                  {institutions.map(i=> <option key={i._id} value={i.name}>{i.displayName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password {editingAdminId ? '(leave blank to keep current)' : ''}</label>
                <input name="password" value={adminForm.password} onChange={handleAdminChange} type="password" className="form-input mt-1 w-full" {...(!editingAdminId ? { required: true } : {})} />
              </div>

              <div className="mt-2">
                <p className="text-sm font-medium text-gray-700">Permissions</p>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <label className="flex items-center space-x-2"><input type="checkbox" name="permissions.manageUsers" checked={adminForm.permissions.manageUsers} onChange={handleAdminChange} /> <span className="text-sm">Manage Users</span></label>
                  <label className="flex items-center space-x-2"><input type="checkbox" name="permissions.manageVerifiers" checked={adminForm.permissions.manageVerifiers} onChange={handleAdminChange} /> <span className="text-sm">Manage Verifiers</span></label>
                  <label className="flex items-center space-x-2"><input type="checkbox" name="permissions.viewAnalytics" checked={adminForm.permissions.viewAnalytics} onChange={handleAdminChange} /> <span className="text-sm">View Analytics</span></label>
                  <label className="flex items-center space-x-2"><input type="checkbox" name="permissions.manageSettings" checked={adminForm.permissions.manageSettings} onChange={handleAdminChange} /> <span className="text-sm">Manage Settings</span></label>
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <button type="button" onClick={()=>{
                setShowCreateAdmin(false);
                setEditingAdminId(null);
              }} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
              <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary-600 text-white rounded">{submitting ? (editingAdminId ? 'Saving...' : 'Creating...') : (editingAdminId ? 'Save' : 'Create')}</button>
            </div>
          </form>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <form onSubmit={handlePasswordChange} className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Change Password</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Current Password</label>
                <input name="currentPassword" value={passwordForm.currentPassword} onChange={(e)=>setPasswordForm(prev=>({...prev,currentPassword:e.target.value}))} type="password" className="form-input mt-1 w-full" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">New Password</label>
                <input name="newPassword" value={passwordForm.newPassword} onChange={(e)=>setPasswordForm(prev=>({...prev,newPassword:e.target.value}))} type="password" className="form-input mt-1 w-full" required minLength={8} />
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <button type="button" onClick={()=>setShowChangePassword(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
              <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary-600 text-white rounded">{submitting ? 'Saving...' : 'Save'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function SuperAdminDashboard() {
  return (
    <AdminProtectedRoute adminType="super">
      <SuperAdminDashboardContent />
    </AdminProtectedRoute>
  );
}
