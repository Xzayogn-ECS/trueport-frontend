import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute';
import SidebarLayout from '../../components/SidebarLayout';
import EducationCard from '../../components/EducationCard';
import Pagination from '../../components/Pagination';
import VerifierSelectionModal from '../../components/VerifierSelectionModal';
import api from '../../utils/api';

export default function Education({ showToast }) {
  const [education, setEducation] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    verified: '',
    courseType: '',
    search: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [verifierModal, setVerifierModal] = useState({ isOpen: false, educationId: null });

  const itemsPerPage = 10;

  useEffect(() => {
    fetchEducation();
  }, [currentPage, filters]);

  const fetchEducation = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });

      if (filters.verified) params.append('verified', filters.verified);
      if (filters.courseType) params.append('courseType', filters.courseType);

      const response = await api.get(`/education?${params}`);
      console.log(response.data);
      const data = response.data;

      // Handle backend response structure: { educations: [...], pagination: {...} }
      setEducation(data.educations || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotalCount(data.pagination?.total || 0);
    } catch (error) {
      console.error('Failed to fetch education:', error);
      showToast('Failed to load education entries', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
    setCurrentPage(1);
  };

  const handleRequestVerification = (educationId) => {
    setVerifierModal({ isOpen: true, educationId });
  };

  const handleVerifierModalClose = () => {
    setVerifierModal({ isOpen: false, educationId: null });
  };

  const handleVerifierSelected = () => {
    // Refresh education to update status
    fetchEducation();
  };

  const handleEdit = (educationId) => {
    window.location.href = `/education/edit/${educationId}`;
  };

  const handleDelete = async (educationId) => {
    if (!confirm('Are you sure you want to delete this education entry?')) return;

    try {
      await api.delete(`/education/${educationId}`);
      showToast('Education entry deleted successfully', 'success');
      fetchEducation();
    } catch (error) {
      console.error('Failed to delete education entry:', error);
      showToast('Failed to delete education entry', 'error');
    }
  };

  return (
    <ProtectedRoute>
      <Head>
        <title>My Education - TruePortMe</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8 sticky top-0 z-10 bg-gray-50 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Education</h1>
                <p className="text-sm text-gray-500">{totalCount} education entr{totalCount !== 1 ? 'ies' : 'y'} total</p>
              </div>
              <Link href="/education/new" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white bg-primary-600 hover:bg-primary-700 shadow-lg font-medium transition-all transform hover:scale-105">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12M6 12h12"/></svg>
                Add Education
              </Link>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              {/* Course Type segmented */}
              <div className="inline-flex rounded-xl border border-gray-200 p-0.5 bg-gray-50 overflow-x-auto">
                {[
                  { key: '', label: 'All' },
                  { key: 'NUR', label: 'Nursery' },
                  { key: 'LKG', label: 'LKG' },
                  { key: 'UKG', label: 'UKG' },
                  { key: '1ST', label: '1st' },
                  { key: '2ND', label: '2nd' },
                  { key: '3RD', label: '3rd' },
                  { key: '4TH', label: '4th' },
                  { key: '5TH', label: '5th' },
                  { key: '6TH', label: '6th' },
                  { key: '7TH', label: '7th' },
                  { key: '8TH', label: '8th' },
                  { key: '9TH', label: '9th' },
                  { key: '10TH', label: '10th' },
                  { key: '11TH', label: '11th' },
                  { key: '12TH', label: '12th' },
                  { key: 'DIPLOMA', label: 'Diploma' },
                  { key: 'BACHELORS', label: 'Bachelors' },
                  { key: 'MASTERS', label: 'Masters' },
                  { key: 'PHD', label: 'PhD' },
                  { key: 'CERTIFICATE', label: 'Certificate' },
                  { key: 'OTHER', label: 'Other' },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => handleFilterChange('courseType', opt.key)}
                    className={`px-3 sm:px-4 py-2 rounded-lg text-sm whitespace-nowrap transition ${
                      filters.courseType === opt.key ? 'bg-white shadow-sm text-primary-800' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

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

              <button
                onClick={() => { setFilters({ verified: '', courseType: '', search: '' }); setCurrentPage(1); }}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Education List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : education.length > 0 ? (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {education.map((edu, idx) => (
                  <div key={edu._id} className="animate-fade-up" style={{ animationDelay: `${idx * 50}ms` }}>
                    <EducationCard
                      education={edu}
                      showActions={true}
                      onEdit={() => handleEdit(edu._id)}
                      onDelete={() => handleDelete(edu._id)}
                      onRequestVerification={() => handleRequestVerification(edu._id)}
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No education entries found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {Object.values(filters).some(f => f) 
                  ? 'Try adjusting your filters.'
                  : 'Get started by adding your first education entry.'
                }
              </p>
              <div className="mt-6">
                <Link href="/education/new" className="btn-primary">
                  Add Education
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
          itemType="EDUCATION"
          itemId={verifierModal.educationId}
          showToast={showToast}
        />
      </div>
    </ProtectedRoute>
  );
}

Education.getLayout = function getLayout(page) {
  return <SidebarLayout title="Education">{page}</SidebarLayout>;
};