import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute';
import SidebarLayout from '../../components/SidebarLayout';
import { instituteAdminAPI } from '../../utils/adminAPI';

export default function VerifierProfileRequests({ showToast }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState('PENDING'); // PENDING, APPROVED, REJECTED, or ALL

  // Modal state for approve/reject
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState(null); // APPROVE or REJECT
  const [decisionComment, setDecisionComment] = useState('');
  const [processingRequestId, setProcessingRequestId] = useState(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (userData.role !== 'VERIFIER') {
      router.push('/dashboard');
      return;
    }
    setUser(userData);
    fetchRequests();
  }, [router, filterStatus, currentPage]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
      };
      if (filterStatus !== 'ALL') {
        params.status = filterStatus;
      }

      const response = await instituteAdminAPI.listProfileUpdateRequests(params);
      setRequests(response.requests || []);
      setTotalPages(response.pagination?.pages || 1);
    } catch (error) {
      console.error('Failed to fetch profile requests:', error);
      showToast?.('Failed to load profile requests', 'error');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDecisionModal = (request, action) => {
    setSelectedRequest(request);
    setActionType(action);
    setDecisionComment('');
    setActionModalOpen(true);
  };

  const handleDecisionSubmit = async () => {
    if (!selectedRequest || !actionType) return;

    try {
      setProcessingRequestId(selectedRequest._id);
      await instituteAdminAPI.decideProfileUpdateRequest(
        selectedRequest._id,
        actionType,
        decisionComment
      );

      const action = actionType === 'APPROVE' ? 'approved' : 'rejected';
      showToast?.(
        `Profile update request ${action}${decisionComment ? ' with comment' : ''}`,
        'success'
      );

      // Close modal and refresh requests
      setActionModalOpen(false);
      setSelectedRequest(null);
      setActionType(null);
      setDecisionComment('');
      fetchRequests();
    } catch (error) {
      console.error('Failed to process request:', error);
      showToast?.(
        error?.response?.data?.message || 'Failed to process request',
        'error'
      );
    } finally {
      setProcessingRequestId(null);
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <ProtectedRoute>
      <Head>
        <title>Profile Update Requests - TruePortMe</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Profile Update Requests</h1>
                <p className="text-gray-600">Review and approve/reject student profile update requests</p>
              </div>
              <Link href="/verifier/dashboard" className="btn-secondary">
                Back to Dashboard
              </Link>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex space-x-4">
              {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setFilterStatus(status);
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 rounded-md font-medium text-sm ${
                    filterStatus === status
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'ALL' ? 'All Requests' : status}
                </button>
              ))}
            </div>
          </div>

          {/* Requests List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
          ) : requests.length > 0 ? (
            <>
              <div className="space-y-4 mb-8">
                {requests.map((request) => (
                  <div
                    key={request._id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    {/* Request Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {request.userId?.name || 'Unknown Student'}
                        </h3>
                        <p className="text-sm text-gray-600">{request.userId?.email}</p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
                            request.status
                          )}`}
                        >
                          {request.status}
                        </span>
                        <p className="text-xs text-gray-500 mt-2">
                          {formatDate(request.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Requested Changes */}
                    <div className="mb-4 p-4 bg-gray-50 rounded-md">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Requested Changes:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {request.changes?.dob && (
                          <div>
                            <p className="text-xs text-gray-500">Date of Birth</p>
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(request.changes.dob).toLocaleDateString('en-IN')}
                            </p>
                          </div>
                        )}
                        {request.changes?.classLevel && (
                          <div>
                            <p className="text-xs text-gray-500">Class/Grade</p>
                            <p className="text-sm font-medium text-gray-900">{request.changes.classLevel}</p>
                          </div>
                        )}
                        {request.changes?.section && (
                          <div>
                            <p className="text-xs text-gray-500">Section</p>
                            <p className="text-sm font-medium text-gray-900">{request.changes.section}</p>
                          </div>
                        )}
                        {request.changes?.house && (
                          <div>
                            <p className="text-xs text-gray-500">House</p>
                            <p className="text-sm font-medium text-gray-900">{request.changes.house}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Decision Info (if already processed) */}
                    {request.status !== 'PENDING' && (
                      <div className="mb-4 p-4 bg-blue-50 rounded-md border border-blue-200">
                        <p className="text-sm text-blue-900">
                          <span className="font-medium">Decision:</span>{' '}
                          {request.status === 'APPROVED' ? 'Approved' : 'Rejected'} on{' '}
                          {formatDate(request.decidedAt)}
                        </p>
                        {request.decisionComment && (
                          <p className="text-sm text-blue-800 mt-1">
                            <span className="font-medium">Comment:</span> {request.decisionComment}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Actions (only for PENDING requests) */}
                    {request.status === 'PENDING' && (
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleOpenDecisionModal(request, 'APPROVE')}
                          className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleOpenDecisionModal(request, 'REJECT')}
                          className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center">
                  <nav className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-2 text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No requests</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filterStatus === 'PENDING'
                  ? 'No pending profile update requests at the moment.'
                  : `No ${filterStatus.toLowerCase()} requests found.`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Decision Modal */}
      {actionModalOpen && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {actionType === 'APPROVE' ? 'Approve' : 'Reject'} Profile Update Request
            </h3>

            <div className="mb-4">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Student:</span> {selectedRequest.userId?.name}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-medium">Email:</span> {selectedRequest.userId?.email}
              </p>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <p className="text-xs text-gray-500 mb-2">Changes Requested:</p>
              <ul className="text-sm text-gray-900 space-y-1">
                {selectedRequest.changes?.dob && (
                  <li>• DOB: {new Date(selectedRequest.changes.dob).toLocaleDateString('en-IN')}</li>
                )}
                {selectedRequest.changes?.classLevel && <li>• Class: {selectedRequest.changes.classLevel}</li>}
                {selectedRequest.changes?.section && <li>• Section: {selectedRequest.changes.section}</li>}
                {selectedRequest.changes?.house && <li>• House: {selectedRequest.changes.house}</li>}
              </ul>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {actionType === 'APPROVE' ? 'Approval' : 'Rejection'} Comment (Optional)
              </label>
              <textarea
                value={decisionComment}
                onChange={(e) => setDecisionComment(e.target.value)}
                placeholder={
                  actionType === 'APPROVE'
                    ? 'Any notes about the approval...'
                    : 'Please explain why you are rejecting this request.'
                }
                rows={3}
                className="form-textarea w-full"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setActionModalOpen(false);
                  setSelectedRequest(null);
                  setActionType(null);
                  setDecisionComment('');
                }}
                disabled={processingRequestId !== null}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDecisionSubmit}
                disabled={processingRequestId !== null}
                className={`flex-1 px-4 py-2 rounded-md text-white font-medium transition-colors ${
                  actionType === 'APPROVE'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {processingRequestId === selectedRequest._id ? 'Processing...' : actionType === 'APPROVE' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}

VerifierProfileRequests.getLayout = function getLayout(page) {
  return <SidebarLayout title="Profile Requests">{page}</SidebarLayout>;
};
