import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import ProtectedRoute from '../components/ProtectedRoute';
import EducationCard from '../components/EducationCard';
import ProjectCard from '../components/ProjectCard';
import api from '../utils/api';
import userAPI from '../utils/userAPI';
import WCard from '../components/WCard';

export default function Profile({ showToast }) {
  const router = useRouter();
  const [user, setUser] = useState({
    name: '',
    email: '',
    institute: '',
    githubUsername: '',
    bio: '',
    role: 'STUDENT',
  });
  const [education, setEducation] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [associationStatus, setAssociationStatus] = useState('NONE'); // NONE, PENDING, APPROVED, REJECTED
  const [institutionRequest, setInstitutionRequest] = useState(null);
  const [institutions, setInstitutions] = useState([]);
  
  // Portfolio visibility state
  const [portfolioItems, setPortfolioItems] = useState({
    experiences: [],
    education: [],
    projects: []
  });
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Contact info state
  const [contactInfo, setContactInfo] = useState({
    phone: '',
    linkedinUrl: '',
    emailVisible: true,
    phoneVisible: false,
    linkedinVisible: true,
    githubVisible: true
  });
  const [contactLoading, setContactLoading] = useState(false);

  useEffect(() => {
    fetchUser();
    fetchEducation();
    fetchProjects();
    fetchAssociationStatus();
    fetchInstitutions();
    fetchContactInfo();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await api.get('/users/me');
      console.log(response);
      setUser(response.data.user);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      showToast('Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchEducation = async () => {
    try {
      const response = await api.get('/education?limit=3');
      const educationData = Array.isArray(response.data?.education) 
        ? response.data.education 
        : Array.isArray(response.data) 
        ? response.data 
        : [];
      setEducation(educationData);
    } catch (error) {
      console.error('Failed to fetch education:', error);
      setEducation([]);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects?limit=3');
      const projectsData = Array.isArray(response.data?.projects) 
        ? response.data.projects 
        : Array.isArray(response.data?.githubProjects) 
        ? response.data.githubProjects 
        : Array.isArray(response.data) 
        ? response.data 
        : [];
      setProjects(projectsData);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      setProjects([]);
    }
  };

  const fetchAssociationStatus = async () => {
    try {
      const response = await api.get('/associations/my-requests');
      setAssociationStatus(response.data.associationStatus || 'NONE');
      setInstitutionRequest(response.data.request || null);
    } catch (error) {
      console.error('Failed to fetch association status:', error);
      // If endpoint doesn't exist yet, assume NONE status
      setAssociationStatus('NONE');
    }
  };

  const fetchInstitutions = async () => {
    try {
      const response = await userAPI.getInstitutions();
      setInstitutions(response.institutions || response.data?.institutions || response || []);
    } catch (error) {
      console.error('Failed to fetch institutions:', error);
      setInstitutions([]);
    }
  };

  const fetchPortfolioItems = async () => {
    try {
      setPortfolioLoading(true);
      const response = await userAPI.getPortfolioItems();
      setPortfolioItems({
        experiences: response.experiences || [],
        education: response.education || [],
        projects: response.projects || []
      });
    } catch (error) {
      console.error('Failed to fetch portfolio items:', error);
      // Fallback: use existing data from profile
      setPortfolioItems({
        experiences: Array.isArray(experiences) ? experiences : [],
        education: Array.isArray(education) ? education : [],
        projects: Array.isArray(projects) ? projects : []
      });
      showToast('Using cached portfolio data', 'info');
    } finally {
      setPortfolioLoading(false);
    }
  };

const fetchContactInfo = async () => {
  try {
    const res = await userAPI.getContactInfo(); // returns response.data from axios
    // backend returns: { contactInfo: { email, phone, linkedinUrl, githubUsername }, contactVisibility: { email, phone, linkedinUrl, githubUsername } }
    const data = res?.contactInfo ? res : (res?.data ? res.data : res);
    console.log(data);
    
    const ci = data.contactInfo || {};
    console.log('Contact Info from DB:', ci);
    const vis = data.visibility || {};
    console.log('Contact Visibility from DB:', vis);

    setContactInfo({
      phone: ci.phone || '',
      linkedinUrl: ci.linkedinUrl || '',
      // Use actual database values, only fall back to defaults if truly undefined/null
      emailVisible: vis.email ?? true,
      phoneVisible: vis.phone ?? false,
      linkedinVisible: vis.linkedinUrl ?? true,
      githubVisible: vis.githubUsername ?? true
    });
  } catch (err) {
    console.error('Failed to fetch contact info:', err);
  }
};
  const handleVisibilityToggle = async (itemType, itemId, currentVisibility) => {
    try {
      const newVisibility = !currentVisibility;
      await userAPI.updateItemVisibility(itemType, itemId, newVisibility);
      
      // Update local state
      setPortfolioItems(prev => ({
        ...prev,
        [itemType]: Array.isArray(prev[itemType]) ? prev[itemType].map(item => 
          (item.id || item._id) === itemId 
            ? { ...item, isPublic: newVisibility }
            : item
        ) : []
      }));
      
      showToast(`Item ${newVisibility ? 'shown' : 'hidden'} from public portfolio`, 'success');
    } catch (error) {
      console.error('Failed to update visibility:', error);
      showToast('Failed to update visibility', 'error');
    }
  };

  const portfolioUrl = `${process.env.NEXT_PUBLIC_FRONTEND_URL}/portfolio/${user?._id || ''}`;

  const handleContactInfoChange = (e) => {
    setContactInfo({
      ...contactInfo,
      [e.target.name]: e.target.value,
    });
  };

  const handleContactVisibilityToggle = async (field) => {
    try {
      const newVisibility = !contactInfo[field];
      setContactLoading(true);
      
      // Map frontend field names to backend field names
      const fieldMapping = {
        'emailVisible': 'email',
        'phoneVisible': 'phone', 
        'linkedinVisible': 'linkedinUrl',
        'githubVisible': 'githubUsername'
      };
      
      const backendFieldName = fieldMapping[field];
      if (!backendFieldName) {
        throw new Error(`Invalid field: ${field}`);
      }
      
      // Update visibility using the dedicated contact visibility API
      const visibilityUpdate = {
        [backendFieldName]: newVisibility
      };
      
      await userAPI.updateContactVisibility(visibilityUpdate);
      
      // Update local state
      const updatedContactInfo = {
        ...contactInfo,
        [field]: newVisibility
      };
      setContactInfo(updatedContactInfo);
      
      showToast(`${field.replace('Visible', '')} ${newVisibility ? 'shown' : 'hidden'} on public portfolio`, 'success');
    } catch (error) {
      console.error('Failed to update contact visibility:', error);
      showToast('Failed to update visibility', 'error');
    } finally {
      setContactLoading(false);
    }
  };

  const handleContactInfoSubmit = async (e) => {
    e.preventDefault();
    try {
      setContactLoading(true);
      await userAPI.updateContactInfo(contactInfo);
      showToast('Contact information updated successfully', 'success');
    } catch (error) {
      console.error('Failed to update contact info:', error);
      showToast('Failed to update contact information', 'error');
    } finally {
      setContactLoading(false);
    }
  };

  const handleChange = (e) => {
    setUser({
      ...user,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await api.put('/users/me', user);
      console.log(response);
      setUser(response.data.user);
      showToast('Profile updated successfully!', 'success');
    } catch (error) {
      console.error('Failed to update profile:', error);
      showToast(error.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleInstitutionRequest = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (user.role === 'STUDENT') {
        // For students, submit a request for approval
        const response = await api.post('/associations/request', {
          institute: user.institute,
          requestedRole: user.role
        });
        setAssociationStatus('PENDING');
        setInstitutionRequest(response.data.request);
        showToast('Institution association request submitted! Waiting for verifier approval.', 'success');
      } else {
        // For verifiers, update directly (they can self-approve)
        const response = await api.put('/users/me', user);
        setUser(response.data.user);
        setAssociationStatus('APPROVED');
        showToast('Institution association updated successfully!', 'success');
      }
    } catch (error) {
      console.error('Failed to request institution association:', error);
      showToast(error.response?.data?.message || 'Failed to submit request', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEducation = async (educationId) => {
    if (!confirm('Are you sure you want to delete this education entry?')) return;

    try {
      await api.delete(`/education/${educationId}`);
      showToast('Education entry deleted successfully', 'success');
      fetchEducation();
    } catch (error) {
      console.error('Failed to delete education:', error);
      showToast('Failed to delete education entry', 'error');
    }
  };

  const handleRequestEducationVerification = async (educationId) => {
    try {
      await api.post(`/education/${educationId}/request-verification`);
      showToast('Verification requested successfully', 'success');
      fetchEducation();
    } catch (error) {
      console.error('Failed to request verification:', error);
      showToast(error.response?.data?.message || 'Failed to request verification', 'error');
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      await api.delete(`/projects/${projectId}`);
      showToast('Project deleted successfully', 'success');
      fetchProjects();
    } catch (error) {
      console.error('Failed to delete project:', error);
      showToast('Failed to delete project', 'error');
    }
  };



  // Password change functions
  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showToast('New password must be at least 6 characters', 'error');
      return;
    }

    setPasswordLoading(true);
    try {
      await userAPI.changePassword(passwordData.currentPassword, passwordData.newPassword);
      showToast('Password changed successfully', 'success');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Failed to change password:', error);
      showToast(error.response?.data?.message || 'Failed to change password', 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Head>
        <title>Profile - TruePortMe</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
            <p className="text-gray-600">Manage your personal information, education, and projects</p>
          </div>

          {/* Navigation Tabs */}
          <div className="mb-8">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'profile'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Personal Info
              </button>
              <button
                onClick={() => setActiveTab('institution')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'institution'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Institution
              </button>
            
              <button
                onClick={() => {
                  setActiveTab('portfolio');
                  if (!portfolioItems?.experiences?.length && !portfolioItems?.education?.length && !portfolioItems?.projects?.length) {
                    fetchPortfolioItems();
                  }
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'portfolio'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Portfolio Visibility
              </button>
              <button
                onClick={() => {
                  setActiveTab('settings');
                 
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'settings'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Settings
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'profile' && (
            <>
              {/* WCard Preview */}
              <div className="mb-8">
                <WCard user={user} contactInfo={contactInfo} portfolioUrl={portfolioUrl} showToast={showToast} />
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      className="form-input mt-1"
                      placeholder="John Doe"
                      value={user.name}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      className="form-input mt-1"
                      value={user.email}
                      onChange={handleChange}
                    />
                  </div>



                  <div>
                    <label htmlFor="githubUsername" className="block text-sm font-medium text-gray-700">
                      GitHub Username
                    </label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                        github.com/
                      </span>
                      <input
                        type="text"
                        id="githubUsername"
                        name="githubUsername"
                        className="form-input rounded-l-none"
                        placeholder="username"
                        value={user.githubUsername}
                        onChange={handleChange}
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Your GitHub username will be displayed on your public portfolio
                    </p>
                  </div>

                  <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                      Bio
                    </label>
                    <textarea
                      id="bio"
                      name="bio"
                      rows={4}
                      className="form-textarea mt-1"
                      placeholder="Tell us about yourself..."
                      value={user.bio}
                      onChange={handleChange}
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      Brief description for your profile. This will be visible on your public portfolio.
                    </p>
                  </div>

                  <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={fetchUser}
                      className="btn-secondary"
                      disabled={saving}
                    >
                      Reset
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Contact Information */}
              <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200">
                <form onSubmit={handleContactInfoSubmit} className="p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
                    <p className="text-sm text-gray-600 mb-6">Manage your contact details and control their visibility on your public portfolio.</p>
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      className="form-input mt-1"
                      placeholder="+1-234-567-8900"
                      value={contactInfo.phone}
                      onChange={handleContactInfoChange}
                    />
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-sm text-gray-500">Your phone number for professional contacts</p>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={contactInfo.phoneVisible}
                          onChange={() => handleContactVisibilityToggle('phoneVisible')}
                          className="sr-only"
                          disabled={contactLoading}
                        />
                        <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          contactInfo.phoneVisible ? 'bg-primary-600' : 'bg-gray-200'
                        }`}>
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            contactInfo.phoneVisible ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </div>
                        <span className="ml-2 text-sm text-gray-700">
                          {contactInfo.phoneVisible ? 'Visible' : 'Hidden'}
                        </span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="linkedinUrl" className="block text-sm font-medium text-gray-700">
                      LinkedIn Profile
                    </label>
                    <input
                      type="url"
                      id="linkedinUrl"
                      name="linkedinUrl"
                      className="form-input mt-1"
                      placeholder="https://linkedin.com/in/username"
                      value={contactInfo.linkedinUrl}
                      onChange={handleContactInfoChange}
                    />
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-sm text-gray-500">Your LinkedIn profile URL</p>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={contactInfo.linkedinVisible}
                          onChange={() => handleContactVisibilityToggle('linkedinVisible')}
                          className="sr-only"
                          disabled={contactLoading}
                        />
                        <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          contactInfo.linkedinVisible ? 'bg-primary-600' : 'bg-gray-200'
                        }`}>
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            contactInfo.linkedinVisible ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </div>
                        <span className="ml-2 text-sm text-gray-700">
                          {contactInfo.linkedinVisible ? 'Visible' : 'Hidden'}
                        </span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Profile Visibility Settings</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">Email Address</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={contactInfo.emailVisible}
                            onChange={() => handleContactVisibilityToggle('emailVisible')}
                            className="sr-only"
                            disabled={contactLoading}
                          />
                          <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            contactInfo.emailVisible ? 'bg-primary-600' : 'bg-gray-200'
                          }`}>
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              contactInfo.emailVisible ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                          </div>
                          <span className="ml-2 text-sm text-gray-700">
                            {contactInfo.emailVisible ? 'Visible' : 'Hidden'}
                          </span>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">GitHub Profile</p>
                          <p className="text-sm text-gray-600">{user.githubUsername ? `github.com/${user.githubUsername}` : 'Not set'}</p>
                        </div>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={contactInfo.githubVisible}
                            onChange={() => handleContactVisibilityToggle('githubVisible')}
                            className="sr-only"
                            disabled={contactLoading || !user.githubUsername}
                          />
                          <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            contactInfo.githubVisible && user.githubUsername ? 'bg-primary-600' : 'bg-gray-200'
                          }`}>
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              contactInfo.githubVisible && user.githubUsername ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                          </div>
                          <span className="ml-2 text-sm text-gray-700">
                            {contactInfo.githubVisible && user.githubUsername ? 'Visible' : 'Hidden'}
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={fetchContactInfo}
                      className="btn-secondary"
                      disabled={contactLoading}
                    >
                      Reset
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={contactLoading}
                    >
                      {contactLoading ? 'Saving...' : 'Save Contact Info'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Portfolio Link */}
              <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Public Portfolio</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Share your public portfolio with employers and collaborators
                </p>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={`${process.env.NEXT_PUBLIC_FRONTEND_URL}/portfolio/${user._id}`}
                    className="form-input flex-1"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/portfolio/${user._id}`);
                      showToast('Portfolio link copied to clipboard!', 'success');
                    }}
                    className="btn-secondary"
                  >
                    Copy Link
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Institution Association Tab */}
          {activeTab === 'institution' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Institution Association</h3>
                  <p className="text-sm text-gray-600">
                    Associate yourself with an institution and set your role to connect with verifiers and showcase your credentials.
                  </p>
                </div>

                {/* Current Association Status */}
                {associationStatus !== 'NONE' && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900">Current Association Status</h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        associationStatus === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        associationStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {associationStatus === 'APPROVED' ? 'Approved' :
                         associationStatus === 'PENDING' ? 'Pending Approval' :
                         'Rejected'}
                      </span>
                    </div>
                    {institutionRequest && (
                      <div className="mt-3 p-4 bg-gray-50 rounded-md">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Institution:</span> {institutionRequest.institute}
                            </p>
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Role:</span> {institutionRequest.role}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              Requested on: {new Date(institutionRequest.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        {associationStatus === 'PENDING' && (
                          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                            <p className="text-sm text-yellow-800">
                              Your request is pending approval from a verifier at your institution. You'll be notified once it's reviewed.
                            </p>
                          </div>
                        )}
                        {associationStatus === 'REJECTED' && institutionRequest.rejectionReason && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm text-red-800">
                              <span className="font-medium">Rejection Reason:</span> {institutionRequest.rejectionReason}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Association Form */}
                {(associationStatus === 'NONE' || associationStatus === 'REJECTED') && (
                  <form onSubmit={handleInstitutionRequest} className="space-y-6">
                    <div>
                      <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                        Your Role
                      </label>
                      <select
                        id="role"
                        name="role"
                        className="form-input mt-1"
                        value={user.role || 'STUDENT'}
                        onChange={handleChange}
                        disabled={associationStatus === 'PENDING' || associationStatus === 'APPROVED'}
                      >
                        <option value="STUDENT">Student</option>
                        <option value="VERIFIER">Verifier/Faculty</option>
                      </select>
                      <p className="mt-2 text-sm text-gray-500">
                        {user.role === 'STUDENT' 
                          ? 'Students need approval from a verifier at their institution to complete association.'
                          : 'Verifiers can directly associate with their institution without approval.'
                        }
                      </p>
                    </div>

                    <div>
                      <label htmlFor="institute" className="block text-sm font-medium text-gray-700">
                        Institution/Organization
                      </label>
                      <select
                        id="institute"
                        name="institute"
                        className="form-input mt-1"
                        value={user.institute || ''}
                        onChange={handleChange}
                        disabled={associationStatus === 'PENDING' || associationStatus === 'APPROVED'}
                        required
                      >
                        <option value="">Select an institution...</option>
                        {institutions.map((institution) => (
                          <option key={institution._id || institution.id} value={institution.name || institution.displayName}>
                            {institution.displayName || institution.name}
                          </option>
                        ))}
                      </select>
                      <p className="mt-2 text-sm text-gray-500">
                        {associationStatus === 'APPROVED' 
                          ? 'Your institution association has been verified and cannot be changed. Contact support if changes are needed.'
                          : user.role === 'STUDENT' 
                          ? 'Select your institution from the list. A verifier from this institution will need to approve your request.'
                          : 'Select your institution to connect with students from the same organization.'
                        }
                      </p>
                    </div>

                    {user.role === 'STUDENT' && (
                      <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-amber-800">
                              Approval Required
                            </h3>
                            <div className="mt-2 text-sm text-amber-700">
                              <p>As a student, your institution association request will be sent to verifiers at your institution for approval. Make sure:</p>
                              <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>You enter the correct and complete institution name</li>
                                <li>There are verifiers from your institution registered on the platform</li>
                                <li>Your profile information is complete and accurate</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {user.role === 'VERIFIER' && (
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800">
                              Verifier Privileges
                            </h3>
                            <div className="mt-2 text-sm text-blue-700">
                              <p>As a verifier, you can:</p>
                              <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>Directly associate with your institution</li>
                                <li>Approve student association requests from your institution</li>
                                <li>Verify student credentials and achievements</li>
                                <li>Access the verifier dashboard to manage requests</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => {
                          fetchUser();
                          fetchAssociationStatus();
                        }}
                        className="btn-secondary"
                        disabled={saving}
                      >
                        Refresh
                      </button>
                      <button
                        type="submit"
                        className="btn-primary"
                        disabled={saving || !user.institute || associationStatus === 'PENDING'}
                      >
                        {saving ? 'Submitting...' : 
                         user.role === 'STUDENT' ? 'Submit Request' : 'Save Association'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Approved Association Info */}
                {associationStatus === 'APPROVED' && (
                  <div className="space-y-6">
                    <div className="bg-green-50 border border-green-200 rounded-md p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-green-800">
                            Institution Association Approved
                          </h3>
                          <div className="mt-2 text-sm text-green-700">
                            <p>You are now associated with <span className="font-medium">{user.institute}</span> as a {user.role.toLowerCase()}.</p>
                            {user.role === 'STUDENT' && (
                              <p className="mt-1">You can now request verifications from faculty at your institution and showcase your verified credentials.</p>
                            )}
                            {user.role === 'VERIFIER' && (
                              <p className="mt-1">You can now approve student requests and verify credentials from students at your institution.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {user.role === 'VERIFIER' && (
                      <div className="text-center">
                        <Link href="/verifier/requests" className="btn-primary">
                          Go to Verifier Dashboard
                        </Link>
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Update Profile Information
                        </label>
                        <p className="text-sm text-gray-500 mb-4">
                          You can still update your profile information while maintaining your institution association.
                        </p>
                      </div>

                      <div>
                        <label htmlFor="institute-display" className="block text-sm font-medium text-gray-700">
                          Current Institution
                        </label>
                        <input
                          type="text"
                          id="institute-display"
                          className="form-input mt-1 bg-gray-50"
                          value={user.institute || ''}
                          disabled
                        />
                        <p className="mt-2 text-sm text-gray-500">
                          To change your institution, you'll need to submit a new association request.
                        </p>
                      </div>

                      <div>
                        <label htmlFor="role-display" className="block text-sm font-medium text-gray-700">
                          Current Role
                        </label>
                        <input
                          type="text"
                          id="role-display"
                          className="form-input mt-1 bg-gray-50"
                          value={user.role || ''}
                          disabled
                        />
                      </div>

                      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                        <button
                          type="button"
                          onClick={() => {
                            const confirmed = confirm(
                              'Are you sure you want to request a new institution association? This will disconnect you from your current verified institution and you will need approval from a new institution. This action should only be used if you have genuinely changed institutions.'
                            );
                            if (confirmed) {
                              setAssociationStatus('NONE');
                              setInstitutionRequest(null);
                            }
                          }}
                          className="btn-secondary text-red-600 border-red-300 hover:bg-red-50"
                        >
                          Request New Association
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          )}

     
         
          {/* Portfolio Visibility Tab */}
          {activeTab === 'portfolio' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Portfolio Visibility</h2>
                <p className="text-gray-600">Control what appears on your public portfolio. Only verified items can be made visible.</p>
              </div>

              {portfolioLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Experiences Section */}
                  {portfolioItems?.experiences?.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h8zM8 14v.01M12 14v.01M16 14v.01" />
                        </svg>
                        Work Experiences ({portfolioItems?.experiences?.length || 0})
                      </h3>
                      <div className="space-y-4">
                        {(portfolioItems?.experiences || []).map((experience) => (
                          <div key={experience.id || experience._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{experience.role}</h4>
                              <p className="text-sm text-gray-600">{experience.title}</p>
                              <div className="flex items-center mt-1">
                                {experience.verified ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Verified
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                                    Pending Verification
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="ml-4">
                              {experience.verified ? (
                                <label className="flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={experience.isPublic || false}
                                    onChange={() => handleVisibilityToggle('experience', experience.id || experience._id, experience.isPublic || false)}
                                    className="sr-only"
                                  />
                                  <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    experience.isPublic ? 'bg-primary-600' : 'bg-gray-200'
                                  }`}>
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                      experience.isPublic ? 'translate-x-6' : 'translate-x-1'
                                    }`} />
                                  </div>
                                  <span className="ml-2 text-sm text-gray-700">
                                    {experience.isPublic ? 'Visible' : 'Hidden'}
                                  </span>
                                </label>
                              ) : (
                                <span className="text-sm text-gray-400">Only verified items can be shown</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education Section */}
                  {portfolioItems?.education?.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                        </svg>
                        Education ({portfolioItems?.education?.length || 0})
                      </h3>
                      <div className="space-y-4">
                        {(portfolioItems?.education || []).map((edu) => (
                          <div key={edu.id || edu._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{edu.courseName}</h4>
                              <p className="text-sm text-gray-600">{edu.schoolOrCollege}</p>
                              <p className="text-sm text-gray-500">{edu.courseType} • {edu.passingYear}</p>
                              <div className="flex items-center mt-1">
                                {edu.verified ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Verified
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                                    Pending Verification
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="ml-4">
                              {edu.verified ? (
                                <label className="flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={edu.isPublic || false}
                                    onChange={() => handleVisibilityToggle('education', edu.id || edu._id, edu.isPublic || false)}
                                    className="sr-only"
                                  />
                                  <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    edu.isPublic ? 'bg-primary-600' : 'bg-gray-200'
                                  }`}>
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                      edu.isPublic ? 'translate-x-6' : 'translate-x-1'
                                    }`} />
                                  </div>
                                  <span className="ml-2 text-sm text-gray-700">
                                    {edu.isPublic ? 'Visible' : 'Hidden'}
                                  </span>
                                </label>
                              ) : (
                                <span className="text-sm text-gray-400">Only verified items can be shown</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Projects Section */}
                  {portfolioItems?.projects?.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        Projects ({portfolioItems?.projects?.length || 0})
                      </h3>
                      <div className="space-y-4">
                        {(portfolioItems?.projects || []).map((project) => (
                          <div key={project.id || project._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{project.projectName || project.name}</h4>
                              <p className="text-sm text-gray-600">{project.description}</p>
                              <div className="flex items-center mt-1">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                  project.isPublic !== false ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {project.isPublic !== false ? 'Public' : 'Private'}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <label className="flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={project.isPublic !== false}
                                  onChange={() => handleVisibilityToggle('project', project.id || project._id, project.isPublic !== false)}
                                  className="sr-only"
                                />
                                <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  project.isPublic !== false ? 'bg-primary-600' : 'bg-gray-200'
                                }`}>
                                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    project.isPublic !== false ? 'translate-x-6' : 'translate-x-1'
                                  }`} />
                                </div>
                                <span className="ml-2 text-sm text-gray-700">
                                  {project.isPublic !== false ? 'Visible' : 'Hidden'}
                                </span>
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {(!portfolioItems?.experiences?.length && !portfolioItems?.education?.length && !portfolioItems?.projects?.length) && (
                    <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
                      <svg className="mx-auto h-24 w-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <h3 className="mt-4 text-lg font-medium text-gray-900">No items to display</h3>
                      <p className="mt-2 text-gray-600">Add some experiences, education, or projects first. Experiences and education require verification to be visible, while projects can be controlled directly.</p>
                      <div className="mt-6 flex justify-center space-x-4">
                        <Link href="/experiences/new" className="btn-primary">Add Experience</Link>
                        <Link href="/education/new" className="btn-secondary">Add Education</Link>
                        <Link href="/projects/new" className="btn-secondary">Add Project</Link>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Account Settings</h2>
                <p className="text-gray-600">Manage your account security and data</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Password Change Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        Current Password
                      </label>
                      <input
                        type="password"
                        id="currentPassword"
                        name="currentPassword"
                        required
                        className="form-input w-full"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                      />
                    </div>
                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        id="newPassword"
                        name="newPassword"
                        required
                        minLength={6}
                        className="form-input w-full"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                      />
                    </div>
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        required
                        minLength={6}
                        className="form-input w-full"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-colors"
                    >
                      {passwordLoading ? 'Changing Password...' : 'Change Password'}
                    </button>
                  </form>
                </div>

                {/* Data Export Section */}
              
              </div>

             
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}