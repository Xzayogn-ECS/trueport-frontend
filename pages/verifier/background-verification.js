import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute';
import SidebarLayout from '../../components/SidebarLayout';
import api from '../../utils/api';

export default function BackgroundVerification({ showToast }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('SUBMITTED');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 0 });
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, page]);

  // If a request id is provided in the query (e.g. ?open=<id>), open the details modal
  useEffect(() => {
    const openId = router?.query?.open;
    if (!openId) return;
    // If requests already loaded, try to find the request and open
    const found = requests.find(r => String(r.id) === String(openId));
    if (found) {
      setSelectedRequest(found);
      setShowDetails(true);
      return;
    }
    // If not found, attempt to fetch a single request by filtering ALL statuses
    (async () => {
      try {
        const res = await api.get('/background-verification/requests', { params: { status: 'ALL', page: 1, limit: 50 } });
        const all = res.data.requests || [];
        const match = all.find(r => String(r.id) === String(openId));
        if (match) {
          setSelectedRequest(match);
          setShowDetails(true);
        } else {
          // If still not found, clear query
          // keep it silent
        }
      } catch (err) {
        console.error('Failed to fetch request for open query:', err);
      }
    })();
  }, [router?.query?.open, requests]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/background-verification/requests', {
        params: {
          status: statusFilter,
          page,
          limit: 10
        }
      });
      setRequests(res.data.requests || []);
      setPagination(res.data.pagination || {});
    } catch (error) {
      console.error('Failed to fetch background verification requests:', error);
      showToast?.('Failed to load requests', 'error');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      SUBMITTED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Submitted' },
      IN_REVIEW: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'In Review' },
      COMPLETED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' },
      REJECTED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' }
    };
    const badge = badges[status] || badges.PENDING;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <svg className="animate-spin w-16 h-16 text-primary-600" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" strokeWidth="4" stroke="currentColor" strokeOpacity="0.25" fill="none" />
            <path d="M22 12a10 10 0 00-10-10" strokeWidth="4" stroke="currentColor" strokeLinecap="round" fill="none" />
          </svg>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Head>
        <title>Background Verification - Verifier Dashboard</title>
      </Head>

      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Background Verification Requests</h1>
              <p className="text-sm text-gray-600 mt-1">Manage and track background verification requests from students</p>
            </div>
            <Link href="/verifier/dashboard" className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-white border border-gray-200 shadow-sm text-sm">
              ← Back to Dashboard
            </Link>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-wrap gap-2">
              {['SUBMITTED', 'PENDING', 'IN_REVIEW', 'COMPLETED', 'ALL'].map((status) => (
                <button
                  key={status}
                  onClick={() => { setStatusFilter(status === 'ALL' ? 'ALL' : status); setPage(1); }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    statusFilter === status
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'ALL' ? 'All Statuses' : status}
                </button>
              ))}
            </div>
          </div>

          {/* Requests Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {requests.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Student</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Institute</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Referees</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Requested</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {requests.map((req) => (
                      <tr key={req.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-700">
                              {(req.student.name || 'S').charAt(0)}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{req.student.name}</div>
                              <div className="text-xs text-gray-600">{req.student.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{req.student.institute}</td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-1">
                            <span className="font-medium text-gray-900">{req.refereeContactsSubmitted || 0}</span>
                            <span className="text-gray-500">/ {req.refereeContactsRequested}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(req.status)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {req.requestedAt ? new Date(req.requestedAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => {
                              setSelectedRequest(req);
                              setShowDetails(true);
                            }}
                            className="text-primary-600 hover:underline font-medium"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>No background verification requests found.</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <div className="text-sm text-gray-600">
                Page <span className="font-medium">{page}</span> of <span className="font-medium">{pagination.pages}</span>
              </div>
              <button
                onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                disabled={page === pagination.pages}
                className="px-4 py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Details Modal */}
        {showDetails && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-96 overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Request Details</h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Student Information</h3>
                  <div className="bg-gray-50 p-3 rounded-md space-y-1">
                    <div className="text-sm"><span className="font-medium text-gray-700">Name:</span> {selectedRequest.student.name}</div>
                    <div className="text-sm"><span className="font-medium text-gray-700">Email:</span> {selectedRequest.student.email}</div>
                    <div className="text-sm"><span className="font-medium text-gray-700">Institute:</span> {selectedRequest.student.institute}</div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Request Status</h3>
                  <div className="bg-gray-50 p-3 rounded-md space-y-1">
                    <div className="text-sm"><span className="font-medium text-gray-700">Status:</span> {getStatusBadge(selectedRequest.status)}</div>
                    <div className="text-sm"><span className="font-medium text-gray-700">Requested:</span> {selectedRequest.requestedAt ? new Date(selectedRequest.requestedAt).toLocaleDateString() : '—'}</div>
                    <div className="text-sm"><span className="font-medium text-gray-700">Submitted:</span> {selectedRequest.submittedAt ? new Date(selectedRequest.submittedAt).toLocaleDateString() : 'Not yet'}</div>
                  </div>
                </div>

                {selectedRequest.refereeContacts && selectedRequest.refereeContacts.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Referee Contacts ({selectedRequest.refereeContacts.length})</h3>
                    <div className="space-y-2">
                            {selectedRequest.refereeContacts.map((ref, idx) => (
                              <div key={idx} className="bg-gray-50 p-3 rounded-md flex items-start justify-between">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{ref.name}</div>
                                  <div className="text-xs text-gray-600">{ref.role || 'Reference'}</div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    <div>📧 {ref.email}</div>
                                    <div>📱 {ref.phone}</div>
                                  </div>
                                </div>
                                <div className="ml-4 flex-shrink-0">
                                  {/* Try to find a platform user id for this shared contact */}
                                  {(
                                    ref.userId || ref._id || ref.id || ref.sharedContactId || ref.sharedUserId
                                  ) ? (
                                    <button
                                      onClick={async () => {
                                        try {
                                          const sharedContactId = ref.userId || ref._id || ref.id || ref.sharedContactId || ref.sharedUserId;
                                          const requestId = selectedRequest.id || selectedRequest._id;
                                          const res = await api.post(`/background-verification/requests/${requestId}/start-chat`, { sharedContactId });
                                          const chatId = res.data?.chatId;
                                          if (chatId) {
                                            router.push(`/verifier/chats?open=${chatId}`);
                                          } else {
                                            showToast?.('Chat started but server did not return chat id', 'warning');
                                          }
                                        } catch (err) {
                                          console.error('Failed to start chat (requester):', err);
                                          showToast?.(err?.response?.data?.message || 'Failed to start chat', 'error');
                                        }
                                      }}
                                      className="px-3 py-1.5 bg-primary-600 text-white rounded text-sm"
                                    >
                                      Start Chat
                                    </button>
                                  ) : (
                                    <div className="text-xs text-gray-500">No platform user</div>
                                  )}
                                </div>
                              </div>
                            ))}
                    </div>
                  </div>
                )}

                {selectedRequest.notes && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Notes</h3>
                    <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-700">{selectedRequest.notes}</div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}

BackgroundVerification.getLayout = function getLayout(page) {
  return <SidebarLayout title="Background Verification">{page}</SidebarLayout>;
};
