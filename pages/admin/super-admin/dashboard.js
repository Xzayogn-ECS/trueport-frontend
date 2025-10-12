import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { superAdminAPI, adminAuth } from '../../../utils/adminAPI';
import { getAuthToken, removeAuthToken } from '../../../utils/auth';
import SingleToast from '../../../components/SingleToast';
import AdminProtectedRoute from '../../../components/AdminProtectedRoute';
import AdminSidebarLayout from '../../../components/AdminSidebarLayout';

function SuperAdminDashboardContent() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [institutions, setInstitutions] = useState([]);
  // Filters for institutions
  const [stateFilter, setStateFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [claimedFilter, setClaimedFilter] = useState(''); // 'claimed' | 'unclaimed'
  const [kycFilter, setKycFilter] = useState(''); // 'yes' | 'no'
  const [statusFilter, setStatusFilter] = useState('');
  // Compute filter options
  const statesList = [...new Set(institutions.map(i => i.address?.state))].filter(Boolean);
  const districtsList = [...new Set(institutions.map(i => i.address?.district))].filter(Boolean);
  const statusList = [...new Set(institutions.map(i => i.status))];
  // Filtered Institutions
  const displayedInstitutions = institutions.filter(inst => {
    if (stateFilter && inst.address?.state !== stateFilter) return false;
    if (districtFilter && inst.address?.district !== districtFilter) return false;
    if (claimedFilter) {
      const claimed = claimedFilter === 'claimed';
      if (inst.claimed !== claimed) return false;
    }
    if (kycFilter) {
      const kyc = kycFilter === 'yes';
      if (inst.kycVerified !== kyc) return false;
    }
    if (statusFilter && inst.status !== statusFilter) return false;
    return true;
  });
  const [instituteAdmins, setInstituteAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // modal toggles
  const [showCreateInstitution, setShowCreateInstitution] = useState(false);
  const [showInstitutionDetails, setShowInstitutionDetails] = useState(false);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showClaimDetail, setShowClaimDetail] = useState(false);

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
    address: { district: '', state: '' },
    contactInfo: { email: '', phone: '' },
      settings: { allowSelfRegistration: true, requireVerifierApproval: true, maxUsersLimit: 1000 },
      type: '',
      // address object handles district and state separately
      // type options: SCHOOL, COLLEGE_UNIVERSITY, NGO, COMPANY, GOVT_BODY
    claimed: false,
    kycVerified: false
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
  const [detailsInstitution, setDetailsInstitution] = useState(null);
  const [claimDetail, setClaimDetail] = useState(null);
  const [geoStateDistrictData, setGeoStateDistrictData] = useState({});
  const [geoStatesList, setGeoStatesList] = useState([]);
  const [geoDistrictsList, setGeoDistrictsList] = useState([]);
  
  const normalizeStateDistrict = (raw) => {
    if (raw?.states && Array.isArray(raw.states)) {
      const map = {};
      raw.states.forEach(s => { map[s.state] = s.districts || []; });
      return map;
    }
    return raw || {};
  };

  // Load India state/district data
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/sab99r/Indian-States-And-Districts/master/states-and-districts.json')
      .then(res => res.json())
      .then(raw => {
        const data = normalizeStateDistrict(raw);
        setGeoStateDistrictData(data);
        setGeoStatesList(Object.keys(data).sort((a, b) => a.localeCompare(b)));
      })
      .catch(err => console.error('Failed to load geo data', err));
  }, []);
  
  // Update geoDistrictsList when address.state changes
  useEffect(() => {
    const list = geoStateDistrictData[institutionForm.address.state] || [];
    setGeoDistrictsList([...list].sort((a, b) => a.localeCompare(b)));
    setInstitutionForm(prev => ({ ...prev, address: { ...prev.address, district: '' } }));
  }, [institutionForm.address.state, geoStateDistrictData]);

  // Claim Requests State
  const [claimRequests, setClaimRequests] = useState([]);
  const [claimPagination, setClaimPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [claimStatusFilter, setClaimStatusFilter] = useState('');
  const [claimLoading, setClaimLoading] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return router.push('/admin/super-admin/login');
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync activeTab with URL hash
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
    if (hash && ['overview', 'institutions', 'admins', 'claims', 'settings'].includes(hash)) {
      setActiveTab(hash);
      } else {
        setActiveTab('overview');
      }
    };

    // Set initial tab based on hash
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
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

  const fetchClaimRequests = async () => {
    try {
      setClaimLoading(true);
      const params = { status: claimStatusFilter, page: claimPagination.page, limit: claimPagination.limit };
      const data = await superAdminAPI.getClaimRequests(params);
      setClaimRequests(data.requests || []);
      setClaimPagination(data.pagination || { page:1, limit:20, total:0, pages:0 });
    } catch (err) {
      console.error('Fetch claim requests error', err);
      setToast({ type: 'error', message: err?.response?.data?.message || err.message || 'Failed to load claim requests' });
    } finally {
      setClaimLoading(false);
    }
  };

  // Load claims on tab switch or filter change
  useEffect(() => {
    if (activeTab === 'claims') fetchClaimRequests();
  }, [activeTab, claimStatusFilter, claimPagination.page]);

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
    if (name.startsWith('address.')) {
      const key = name.split('.')[1];
      setInstitutionForm(prev => ({ ...prev, address: { ...prev.address, [key]: value } }));
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
        district: institutionForm.address.district,
        state: institutionForm.address.state,
        institutionType: institutionForm.type,
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
          type: '',
        description: '',
        website: '',
        logo: '',
        address: { district: '', state: '' },
        contactInfo: { email: '', phone: '' },
        settings: { allowSelfRegistration: true, requireVerifierApproval: true, maxUsersLimit: 1000 },
        claimed: false,
        kycVerified: false
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

  // Approve institution (super admin)
  const handleApproveInstitution = async (id) => {
    if (!confirm('Approve this institution?')) return;
    try {
      const resp = await superAdminAPI.approveInstitution(id);
      if (resp?.institution) {
        setInstitutions(prev => prev.map(inst => inst._id === id ? resp.institution : inst));
        setToast({ type: 'success', message: resp.message || 'Institution approved' });
      } else {
        setToast({ type: 'error', message: resp.message || 'Approval failed' });
      }
    } catch (err) {
      console.error('Approve error', err);
      setToast({ type: 'error', message: err?.response?.data?.message || err.message || 'Approval error' });
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
      address: { district: inst.address?.district || '', state: inst.address?.state || '' },
      contactInfo: { email: inst.contactInfo?.email || '', phone: inst.contactInfo?.phone || '' },
      settings: { allowSelfRegistration: inst.settings?.allowSelfRegistration ?? true, requireVerifierApproval: inst.settings?.requireVerifierApproval ?? true, maxUsersLimit: inst.settings?.maxUsersLimit ?? 1000 },
      claimed: inst.claimed ?? false,
      kycVerified: inst.kycVerified ?? false
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

  // View institution details
  const openInstitutionDetails = async (inst) => {
    try {
      const data = await superAdminAPI.getInstitution(inst._id);
      setDetailsInstitution(data.institution || data);
      setShowInstitutionDetails(true);
    } catch (err) {
      console.error('Fetch details error', err);
      setToast({ type: 'error', message: err?.response?.data?.message || err.message || 'Failed to load details' });
    }
  };

  // Get and view claim detail
  const openClaimDetail = async (id) => {
    try {
      const data = await superAdminAPI.getClaimRequest(id);
      setClaimDetail(data.claimRequest || data);
      setShowClaimDetail(true);
    } catch (err) {
      console.error('Fetch claim detail error', err);
      setToast({ type: 'error', message: err?.response?.data?.message || err.message || 'Failed to load claim detail' });
    }
  };

  // Approve/Reject handlers for claims
  const handleApproveClaim = async (id) => {
    if (!confirm('Approve this claim request?')) return;
    try {
      await superAdminAPI.approveClaimRequest(id);
      fetchClaimRequests();
      setToast({ type: 'success', message: 'Claim approved' });
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: err?.response?.data?.message || err.message || 'Approve failed' });
    }
  };
  const handleRejectClaim = async (id) => {
    const reason = prompt('Reason for rejection:');
    if (reason === null) return;
    try {
      await superAdminAPI.rejectClaimRequest(id, reason);
      fetchClaimRequests();
      setToast({ type: 'success', message: 'Claim rejected' });
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: err?.response?.data?.message || err.message || 'Reject failed' });
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Tab Navigation */}
        <nav className="mb-6">
          <ul className="flex space-x-4 border-b">
            {['overview', 'institutions', 'admins', 'claims', 'settings'].map(tab => (
              <li key={tab}>
                <button
                  onClick={() => { setActiveTab(tab); window.location.hash = tab; }}
                  className={`px-3 py-2 text-sm font-medium ${activeTab === tab ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-600 hover:text-gray-800'}`}
                >{tab.charAt(0).toUpperCase() + tab.slice(1)}</button>
              </li>
            ))}
          </ul>
        </nav>

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
                   address: { district: '', state: '' },
                   contactInfo: { email: '', phone: '' },
                   settings: { allowSelfRegistration: true, requireVerifierApproval: true, maxUsersLimit: 1000 },
                   claimed: false,
                   kycVerified: false
                 });
                 setShowCreateInstitution(true);
               }} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">Add Institution</button>
             </div>
             {/* Filters */}
             <div className="flex flex-wrap gap-4 mb-4">
               <select value={stateFilter} onChange={e=>setStateFilter(e.target.value)} className="form-select">
                 <option value="">All States</option>
                 {statesList.map(s=> <option key={s} value={s}>{s}</option>)}
               </select>
               <select value={districtFilter} onChange={e=>setDistrictFilter(e.target.value)} className="form-select">
                 <option value="">All Districts</option>
                 {districtsList.map(d=> <option key={d} value={d}>{d}</option>)}
               </select>
               <select value={claimedFilter} onChange={e=>setClaimedFilter(e.target.value)} className="form-select">
                 <option value="">All Claims</option>
                 <option value="claimed">Claimed</option>
                 <option value="unclaimed">Unclaimed</option>
               </select>
               <select value={kycFilter} onChange={e=>setKycFilter(e.target.value)} className="form-select">
                 <option value="">All KYC</option>
                 <option value="yes">Verified</option>
                 <option value="no">Unverified</option>
               </select>
               <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="form-select">
                 <option value="">All Statuses</option>
                 {statusList.map(st=> <option key={st} value={st}>{st}</option>)}
               </select>
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
                     {displayedInstitutions.map(inst=> (
                       <tr key={inst._id}>
                         <td className="px-3 sm:px-6 py-4 whitespace-nowrap"><div className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none">{inst.displayName}</div><div className="text-xs sm:text-sm text-gray-500 truncate max-w-[120px] sm:max-w-none">{inst.name}</div></td>
                         <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inst.website ? <a href={inst.website} target="_blank" rel="noreferrer" className="text-primary-600">{inst.website}</a> : '-'}</td>
                         <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900">{inst.userCount || 0}</td>
                         <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap"><span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${inst.status==='ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{inst.status||'ACTIVE'}</span></td>
                         <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                           <button onClick={() => openInstitutionDetails(inst)} className="text-primary-600 hover:text-primary-900 mr-2">View</button>
                           {inst.status === 'ACTIVE' ? (
                             <>
                               <button onClick={() => openEditInstitution(inst)} className="text-primary-600 hover:text-primary-900 mr-2">Edit</button>
                               <button onClick={() => handleDeleteInstitution(inst._id)} className="text-red-600 hover:text-red-900">Delete</button>
                             </>
                           ) : (
                             <>
                               <button onClick={() => handleApproveInstitution(inst._id)} className="text-green-600 hover:text-green-900 mr-2">Approve</button>
                               <button onClick={() => handleDeleteInstitution(inst._id)} className="text-red-600 hover:text-red-900">Reject</button>
                             </>
                           )}
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

         {activeTab === 'claims' && (
           <div className="space-y-6">
             <div className="flex items-center justify-between">
               <h2 className="text-2xl font-bold text-gray-900">Claim Requests</h2>
               <select value={claimStatusFilter} onChange={e => { setClaimStatusFilter(e.target.value); setClaimPagination(prev => ({ ...prev, page:1 })); }} className="form-select">
                 <option value=''>All Statuses</option>
                 <option value='PENDING'>Pending</option>
                 <option value='APPROVED'>Approved</option>
                 <option value='REJECTED'>Rejected</option>
               </select>
             </div>
             <div className="bg-white shadow rounded-lg overflow-x-auto">
               <table className="min-w-full divide-y divide-gray-200">
                 <thead className="bg-gray-50">
                   <tr>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Institution</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Requester</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Requested At</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="bg-white divide-y divide-gray-200">
                   {claimLoading ? (
                     <tr><td colSpan={5} className="px-6 py-4">Loading...</td></tr>
                   ) : claimRequests.length ? claimRequests.map(r => (
                     <tr key={r._id}>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.institutionId.displayName}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.userId.name}</td>
                       <td className="px-6 py-4 whitespace-nowrap"><span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${r.status==='APPROVED'? 'bg-green-100 text-green-800': r.status==='PENDING'? 'bg-yellow-100 text-yellow-800':'bg-red-100 text-red-800'}`}>{r.status}</span></td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                         <button onClick={()=>openClaimDetail(r._id)} className="text-blue-600 hover:text-blue-900">View</button>
                         {r.status==='PENDING' && (
                           <button onClick={()=>handleApproveClaim(r._id)} className="text-green-600">Approve</button>
                         )}
                         {r.status==='PENDING' && (
                           <button onClick={()=>handleRejectClaim(r._id)} className="text-red-600">Reject</button>
                         )}
                       </td>
                     </tr>
                   )) : (
                     <tr><td colSpan={5} className="px-6 py-4 text-sm text-gray-500">No requests found</td></tr>
                   )}
                 </tbody>
               </table>
             </div>
             {/* Pagination controls could go here */}
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
               {/* Institution Name */}
               <div>
                 <label className="block text-xs sm:text-sm font-medium text-gray-700">Institution Name *</label>
                 <input name="name" value={institutionForm.name} onChange={handleInstitutionChange} className="form-input mt-1 w-full text-sm" required />
               </div>
               
               {/* Display Name */}
               <div>
                 <label className="block text-xs sm:text-sm font-medium text-gray-700">Display Name *</label>
                 <input name="displayName" value={institutionForm.displayName} onChange={handleInstitutionChange} className="form-input mt-1 w-full text-sm" required />
               </div>
               
               {/* Institution Type */}
               <div>
                 <label className="block text-xs sm:text-sm font-medium text-gray-700">Institution Type *</label>
                 <select name="type" value={institutionForm.type} onChange={handleInstitutionChange} className="form-select mt-1 w-full text-sm" required>
                   <option value="">Select type</option>
                   <option value="SCHOOL">School</option>
                   <option value="COLLEGE_UNIVERSITY">College/University</option>
                   <option value="NGO">NGO</option>
                   <option value="COMPANY">Company</option>
                   <option value="GOVT_BODY">Government Body</option>
                 </select>
               </div>
               
               {/* Contact Email */}
               <div>
                 <label className="block text-sm font-medium text-gray-700">Contact Email *</label>
                 <input name="contactInfo.email" value={institutionForm.contactInfo.email} onChange={handleInstitutionChange} type="email" className="form-input mt-1 w-full" required />
               </div>
               
               {/* Contact Phone */}
               <div>
                 <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
                 <input name="contactInfo.phone" value={institutionForm.contactInfo.phone} onChange={handleInstitutionChange} className="form-input mt-1 w-full" />
               </div>
               
               {/* Website */}
               <div>
                 <label className="block text-sm font-medium text-gray-700">Website</label>
                 <input name="website" value={institutionForm.website} onChange={handleInstitutionChange} type="url" className="form-input mt-1 w-full" />
               </div>
               
               {/* Address (optional field for street address) */}
               <div>
                 <label className="block text-sm font-medium text-gray-700">Address</label>
                 <input name="address" value={institutionForm.address} onChange={handleInstitutionChange} className="form-input mt-1 w-full" placeholder="Street address" />
               </div>
               
               {/* State */}
               <div>
                 <label className="block text-sm font-medium text-gray-700">State</label>
                 <select name="address.state" value={institutionForm.address.state} onChange={handleInstitutionChange} className="form-select mt-1 w-full text-sm">
                   <option value="">Select state</option>
                   {geoStatesList.map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
               </div>
               
               {/* District */}
               <div>
                 <label className="block text-sm font-medium text-gray-700">District</label>
                 <select name="address.district" value={institutionForm.address.district} onChange={handleInstitutionChange} className="form-select mt-1 w-full text-sm" disabled={!institutionForm.address.state}>
                   <option value="">{institutionForm.address.state ? 'Select district' : 'Select state first'}</option>
                   {geoDistrictsList.map(d => <option key={d} value={d}>{d}</option>)}
                 </select>
               </div>
               
               {/* Description */}
               <div>
                 <label className="block text-sm font-medium text-gray-700">Description</label>
                 <textarea name="description" value={institutionForm.description} onChange={handleInstitutionChange} className="form-input mt-1 w-full" rows={3} />
               </div>
               
               {/* Logo URL */}
               <div>
                 <label className="block text-sm font-medium text-gray-700">Logo URL</label>
                 <input name="logo" value={institutionForm.logo} onChange={handleInstitutionChange} type="url" className="form-input mt-1 w-full" />
               </div>

               {/* Admin-only fields */}
               <div className="flex items-center space-x-3 mt-2">
                 <label className="flex items-center space-x-2"><input type="checkbox" name="settings.allowSelfRegistration" checked={institutionForm.settings.allowSelfRegistration} onChange={handleInstitutionChange} /> <span className="text-sm">Allow Self Registration</span></label>
                 <label className="flex items-center space-x-2"><input type="checkbox" name="settings.requireVerifierApproval" checked={institutionForm.settings.requireVerifierApproval} onChange={handleInstitutionChange} /> <span className="text-sm">Require Verifier Approval</span></label>
                 <div className="ml-4">
                   <label className="block text-sm font-medium text-gray-700">Max Users</label>
                   <input name="settings.maxUsersLimit" value={institutionForm.settings.maxUsersLimit} onChange={handleInstitutionChange} type="number" min={1} className="form-input mt-1 w-32" />
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-4 mt-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700">Claimed</label>
                   <select name="claimed" value={institutionForm.claimed} onChange={handleInstitutionChange} className="form-select mt-1 w-full">
                     <option value="true">Yes</option>
                     <option value="false">No</option>
                   </select>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700">KYC Verified</label>
                   <select name="kycVerified" value={institutionForm.kycVerified} onChange={handleInstitutionChange} className="form-select mt-1 w-full">
                     <option value="true">Yes</option>
                     <option value="false">No</option>
                   </select>
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

       {/* Institution Details Modal */}
       {showInstitutionDetails && detailsInstitution && (
         <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-4">
           <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
             <h3 className="text-lg font-bold mb-4">Institution Details</h3>
             <div className="space-y-2 text-sm">
               <p><strong>Name:</strong> {detailsInstitution.name}</p>
               <p><strong>Display Name:</strong> {detailsInstitution.displayName}</p>
               <p><strong>Description:</strong> {detailsInstitution.description || '-'}</p>
               <p><strong>Website:</strong> {detailsInstitution.website ? <a href={detailsInstitution.website} target="_blank" rel="noreferrer" className="text-primary-600">{detailsInstitution.website}</a> : '-'}</p>
        <p><strong>Address:</strong> {detailsInstitution.address ? `${detailsInstitution.address.district}, ${detailsInstitution.address.state}` : '-'}</p>
               <p><strong>Contact Email:</strong> {detailsInstitution.contactInfo?.email || '-'}</p>
               <p><strong>Contact Phone:</strong> {detailsInstitution.contactInfo?.phone || '-'}</p>
               <p><strong>Created By:</strong> {detailsInstitution.createdBy?.name} ({detailsInstitution.createdBy?.email})</p>
               <p><strong>Status:</strong> {detailsInstitution.status}</p>
               <p><strong>KYC Verified:</strong> {detailsInstitution.kycVerified ? 'Yes' : 'No'}</p>
               <p><strong>Created At:</strong> {new Date(detailsInstitution.createdAt).toLocaleString()}</p>
             </div>
             <div className="mt-4 flex justify-end space-x-2">
               {detailsInstitution.status === 'ACTIVE' ? (
                 <>
                   <button onClick={() => { openEditInstitution(detailsInstitution); setShowInstitutionDetails(false); }} className="text-primary-600 hover:text-primary-900 px-4 py-2 rounded">Edit</button>
                   <button onClick={() => { handleDeleteInstitution(detailsInstitution._id); setShowInstitutionDetails(false); }} className="text-red-600 hover:text-red-900 px-4 py-2 rounded">Delete</button>
                 </>
               ) : (
                 <>
                   <button onClick={() => { handleApproveInstitution(detailsInstitution._id); setShowInstitutionDetails(false); }} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">Approve</button>
                   <button onClick={() => { handleDeleteInstitution(detailsInstitution._id); setShowInstitutionDetails(false); }} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">Reject</button>
                 </>
               )}
               <button onClick={() => setShowInstitutionDetails(false)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded">Close</button>
             </div>
           </div>
         </div>
       )}

       {/* Claim Detail Modal */}
       {showClaimDetail && claimDetail && (
         <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-4">
           <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
             <h3 className="text-lg font-bold mb-4">Claim Request Details</h3>
             <div className="space-y-2 text-sm">
               <p><strong>Institution:</strong> {claimDetail.institutionId.displayName}</p>
               <p><strong>Requester Name:</strong> {claimDetail.userId.name}</p>
               <p><strong>Email:</strong> {claimDetail.userId.email}</p>
               <p><strong>Phone:</strong> {claimDetail.userId.phone}</p>
               <p><strong>Designation:</strong> {claimDetail.designation}</p>
               <p><strong>Status:</strong> {claimDetail.status}</p>
               {claimDetail.rejectionReason && <p><strong>Rejection Reason:</strong> {claimDetail.rejectionReason}</p>}
               <p><strong>Requested At:</strong> {new Date(claimDetail.createdAt).toLocaleString()}</p>
               {claimDetail.reviewedAt && <p><strong>Reviewed At:</strong> {new Date(claimDetail.reviewedAt).toLocaleString()}</p>}
               {claimDetail.reviewedBy && <p><strong>Reviewed By:</strong> {claimDetail.reviewedBy.name} ({claimDetail.reviewedBy.email})</p>}
             </div>
             <div className="mt-4 flex justify-end space-x-2">
               {claimDetail.status==='PENDING' && (
                 <button onClick={()=>{handleApproveClaim(claimDetail._id); setShowClaimDetail(false);}} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">Approve</button>
               )}
               {claimDetail.status==='PENDING' && (
                 <button onClick={()=>{handleRejectClaim(claimDetail._id); setShowClaimDetail(false);}} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">Reject</button>
               )}
               <button onClick={()=>setShowClaimDetail(false)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded">Close</button>
             </div>
           </div>
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

SuperAdminDashboard.getLayout = function getLayout(page) {
  return <AdminSidebarLayout title="Super Admin">{page}</AdminSidebarLayout>;
};
