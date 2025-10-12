import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../components/ProtectedRoute';
import SidebarLayout from '../../components/SidebarLayout';
import api from '../../utils/api';

export default function SearchCollaborators({ showToast }) {
  const router = useRouter();
  const { projectId } = router.query;
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [requestData, setRequestData] = useState({
    role: '',
    message: ''
  });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchMyProjects();
    if (projectId) {
      setSelectedProject(projectId);
    }
  }, [projectId]);

  const fetchMyProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data.projects || []);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      showToast('Please enter at least 2 characters to search', 'error');
      return;
    }

    try {
      setSearching(true);
      const response = await api.get('/collaborations/search-users', {
        params: { query: searchQuery, limit: 20 }
      });
      setSearchResults(response.data.users || []);
    } catch (error) {
      console.error('Search failed:', error);
      showToast(error.response?.data?.message || 'Failed to search users', 'error');
    } finally {
      setSearching(false);
    }
  };

  const openRequestModal = (user) => {
    setSelectedUser(user);
    setShowRequestModal(true);
    setRequestData({ role: '', message: '' });
  };

  const closeRequestModal = () => {
    setShowRequestModal(false);
    setSelectedUser(null);
    setRequestData({ role: '', message: '' });
  };

  const handleSendRequest = async () => {
    if (!selectedProject) {
      showToast('Please select a project', 'error');
      return;
    }

    if (!selectedUser) {
      showToast('Please select a user', 'error');
      return;
    }

    try {
      setSending(true);
      await api.post('/collaborations/request', {
        projectId: selectedProject,
        requestedUserId: selectedUser._id,
        role: requestData.role,
        message: requestData.message
      });
      showToast('Collaboration request sent successfully!', 'success');
      closeRequestModal();
    } catch (error) {
      console.error('Failed to send request:', error);
      showToast(error.response?.data?.message || 'Failed to send request', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <ProtectedRoute>
      <Head>
        <title>Search Collaborators - TruePortMe</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Collaborations</h1>
            <p className="text-gray-600">Manage your project collaborations and requests</p>
          </div>

          {/* Navigation Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <Link href="/collaborations/search" className="border-primary-500 text-primary-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
                Search Collaborators
              </Link>
              <Link href="/collaborations/requests" className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
                Requests
              </Link>
              <Link href="/collaborations" className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
                My Collaborations
              </Link>
            </nav>
          </div>

          {/* Project Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Project <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="input-primary w-full"
            >
              <option value="">Choose a project...</option>
              {projects.map(project => (
                <option key={project._id} value={project._id}>
                  {project.title} ({project.linkedCollaborators?.length || 0}/5 collaborators)
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-gray-500">Select which project you want to add collaborators to</p>
          </div>

          {/* Search Box */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Users
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search by name or email..."
                className="input-primary flex-1"
              />
              <button
                onClick={handleSearch}
                disabled={searching || !searchQuery.trim()}
                className="btn-primary px-6"
              >
                {searching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Search Results ({searchResults.length})
              </h2>
              <div className="space-y-3">
                {searchResults.map(user => (
                  <div key={user._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-4">
                      {user.profilePicture ? (
                        <img
                          src={user.profilePicture}
                          alt={user.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        {user.role && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                            {user.role}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => openRequestModal(user)}
                      disabled={!selectedProject}
                      className="btn-primary text-sm"
                    >
                      Send Request
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchResults.length === 0 && searchQuery && !searching && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-600">Try a different search term</p>
            </div>
          )}
        </div>
      </div>

      {/* Send Request Modal */}
      {showRequestModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Send Collaboration Request</h3>
              <button onClick={closeRequestModal} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Sending request to:</p>
              <p className="font-medium text-gray-900">{selectedUser.name}</p>
              <p className="text-sm text-gray-500">{selectedUser.email}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role/Position (Optional)
                </label>
                <input
                  type="text"
                  value={requestData.role}
                  onChange={(e) => setRequestData({ ...requestData, role: e.target.value })}
                  placeholder="e.g., Frontend Developer, Designer"
                  maxLength={100}
                  className="input-primary w-full"
                />
                <p className="mt-1 text-xs text-gray-500">What role will they have in the project?</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message (Optional)
                </label>
                <textarea
                  value={requestData.message}
                  onChange={(e) => setRequestData({ ...requestData, message: e.target.value })}
                  placeholder="Add a personal message..."
                  rows={3}
                  className="input-primary w-full"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={closeRequestModal} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={handleSendRequest}
                disabled={sending}
                className="btn-primary flex-1"
              >
                {sending ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}

SearchCollaborators.getLayout = function getLayout(page) {
  return <SidebarLayout title="Search Collaborators">{page}</SidebarLayout>;
};
