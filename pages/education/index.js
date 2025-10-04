import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute';
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
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Education</h1>
              <p className="text-gray-600">
                {totalCount} education entr{totalCount !== 1 ? 'ies' : 'y'} total
              </p>
            </div>
            <Link href="/education/new" className="btn-primary">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Education
            </Link>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="courseType" className="block text-sm font-medium text-gray-700 mb-1">
                  Course Type
                </label>
                <select
                  id="courseType"
                  className="form-input"
                  value={filters.courseType}
                  onChange={(e) => handleFilterChange('courseType', e.target.value)}
                >
                  <option value="">All Types</option>
                  <option value="10TH">10th Grade</option>
                  <option value="12TH">12th Grade</option>
                  <option value="DIPLOMA">Diploma</option>
                  <option value="BACHELORS">Bachelor's</option>
                  <option value="MASTERS">Master's</option>
                  <option value="PHD">PhD</option>
                  <option value="CERTIFICATE">Certificate</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="verified" className="block text-sm font-medium text-gray-700 mb-1">
                  Verification Status
                </label>
                <select
                  id="verified"
                  className="form-input"
                  value={filters.verified}
                  onChange={(e) => handleFilterChange('verified', e.target.value)}
                >
                  <option value="">All</option>
                  <option value="true">Verified</option>
                  <option value="false">Not Verified</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setFilters({ verified: '', courseType: '', search: '' });
                    setCurrentPage(1);
                  }}
                  className="btn-secondary w-full"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Education List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
          ) : education.length > 0 ? (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {education.map((edu) => (
                  <EducationCard
                    key={edu._id}
                    education={edu}
                    showActions={true}
                    onEdit={() => handleEdit(edu._id)}
                    onDelete={() => handleDelete(edu._id)}
                    onRequestVerification={() => handleRequestVerification(edu._id)}
                    showToast={showToast}
                  />
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