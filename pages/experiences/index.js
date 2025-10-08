import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute';
import SidebarLayout from '../../components/SidebarLayout';
import ExperienceCard from '../../components/ExperienceCard';
import Pagination from '../../components/Pagination';
import VerifierSelectionModal from '../../components/VerifierSelectionModal';
import api from '../../utils/api';

export default function Experiences({ showToast }) {
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    verified: '',
    tags: '',
    search: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [verifierModal, setVerifierModal] = useState({ isOpen: false, experienceId: null });

  const itemsPerPage = 10;

  useEffect(() => {
    fetchExperiences();
  }, [currentPage, filters]);

  const fetchExperiences = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });

      if (filters.verified) params.append('verified', filters.verified);
      if (filters.tags) params.append('tags', filters.tags);
      if (filters.search) params.append('search', filters.search);

      const response = await api.get(`/experiences?${params}`);
      const data = response.data;

      const experiencesData = Array.isArray(data?.experiences) 
        ? data.experiences 
        : Array.isArray(data) 
        ? data 
        : [];
      
      setExperiences(experiencesData);
      setTotalPages(data?.totalPages || Math.ceil((data?.total || experiencesData.length) / itemsPerPage));
      setTotalCount(data?.total || experiencesData.length);
    } catch (error) {
      console.error('Failed to fetch experiences:', error);
      showToast('Failed to load experiences', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
    setCurrentPage(1);
  };

  const handleRequestVerification = (experienceId) => {
    setVerifierModal({ isOpen: true, experienceId });
  };

  const handleVerifierModalClose = () => {
    setVerifierModal({ isOpen: false, experienceId: null });
  };

  const handleVerifierSelected = () => {
    // Refresh experiences to update status
    fetchExperiences();
  };

  const handleEdit = (experienceId) => {
    window.location.href = `/experiences/edit/${experienceId}`;
  };

  const handleDelete = async (experienceId) => {
    if (!confirm('Are you sure you want to delete this experience?')) return;

    try {
      await api.delete(`/experiences/${experienceId}`);
      showToast('Experience deleted successfully', 'success');
      fetchExperiences();
    } catch (error) {
      console.error('Failed to delete experience:', error);
      showToast('Failed to delete experience', 'error');
    }
  };

  return (
    <ProtectedRoute>
      <Head>
        <title>My Experiences - TruePortMe</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Experiences</h1>
                <p className="text-sm text-gray-500">{totalCount} experience{totalCount !== 1 ? 's' : ''} total</p>
              </div>
              <Link href="/experiences/new" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white bg-brand-grad shadow-sm hover:opacity-95 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v12M6 12h12"/></svg>
                Add Experience
              </Link>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              {/* Verified segmented */}
              <div className="inline-flex rounded-xl border border-gray-200 p-0.5 bg-gray-50">
                {[
                  { key: '', label: 'All' },
                  { key: 'true', label: 'Verified' },
                  { key: 'false', label: 'Unverified' },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => handleFilterChange('verified', opt.key)}
                    className={`px-3 sm:px-4 py-2 rounded-lg text-sm transition ${
                      filters.verified === opt.key ? 'bg-white shadow-sm text-primary-800' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="flex-1 flex items-center bg-gray-50 rounded-xl px-3 py-2 border border-gray-200">
                <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"/></svg>
                <input
                  type="text"
                  placeholder="Search experiences..."
                  className="bg-transparent outline-none text-sm ml-2 flex-1"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>

              {/* Tags */}
              <input
                type="text"
                placeholder="Tags (comma separated)"
                className="form-input md:w-64"
                value={filters.tags}
                onChange={(e) => handleFilterChange('tags', e.target.value)}
              />
              
              <button
                onClick={() => { setFilters({ verified: '', tags: '', search: '' }); setCurrentPage(1); }}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Experiences List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : experiences.length > 0 ? (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {experiences.map((experience, idx) => (
                  <div key={experience._id} className="animate-fade-up" style={{ animationDelay: `${idx * 50}ms` }}>
                    <ExperienceCard
                      experience={experience}
                      showActions={true}
                      onEdit={() => handleEdit(experience._id)}
                      onDelete={() => handleDelete(experience._id)}
                      onRequestVerification={() => handleRequestVerification(experience._id)}
                      showToast={showToast}
                    />
                  </div>
                ))}
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                hasNext={currentPage < totalPages}
                hasPrev={currentPage > 1}
              />
            </>
          ) : (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No experiences found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {Object.values(filters).some(f => f) 
                  ? 'Try adjusting your filters or search terms.'
                  : 'Get started by adding your first experience.'
                }
              </p>
              <div className="mt-6">
                <Link href="/experiences/new" className="btn-primary">
                  Add Experience
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Verifier Selection Modal */}
        <VerifierSelectionModal
          isOpen={verifierModal.isOpen}
          onClose={handleVerifierModalClose}
          onSelectVerifier={handleVerifierSelected}
          itemType="EXPERIENCE"
          itemId={verifierModal.experienceId}
          showToast={showToast}
        />
      </div>
    </ProtectedRoute>
  );
}

Experiences.getLayout = function getLayout(page) {
  return <SidebarLayout title="Experiences">{page}</SidebarLayout>;
};