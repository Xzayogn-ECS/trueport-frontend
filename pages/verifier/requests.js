import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute';
import api from '../../utils/api';

export default function VerifierRequests({ showToast }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestTypeFilter, setRequestTypeFilter] = useState('ALL');

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (userData.role !== 'VERIFIER') {
      router.push('/dashboard');
      return;
    }
    setUser(userData);
    fetchRequests();
  }, [router, requestTypeFilter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const [verificationResponse, institutionResponse] = await Promise.all([
        api.get('/verifier/requests'),
        api.get('/associations/pending')
      ]);
      
      const verificationRequests = (verificationResponse.data.requests || []).map(req => ({
        ...req,
        requestType: 'VERIFICATION'
      }));
      
      const institutionRequests = (institutionResponse.data.requests || institutionResponse.data || []).map(req => ({
        ...req,
        id: req._id || req.id,
        requestType: 'INSTITUTION',
        type: 'INSTITUTION',
        title: `Institution Association: ${req.institute}`,
        description: `Role: ${req.requestedRole}`,
        student: {
          name: req.studentName,
          email: req.studentEmail
        },
        requestedAt: req.createdAt
      }));
      console.log(institutionRequests)
      let allRequests = [...verificationRequests, ...institutionRequests];
      
      // Filter by request type if not 'ALL'
      if (requestTypeFilter !== 'ALL') {
        allRequests = allRequests.filter(req => req.requestType === requestTypeFilter);
      }
      
      // Sort by creation date, newest first
      allRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setRequests(allRequests);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
      showToast?.('Failed to load requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      await api.post(`/verifier/approve/${requestId}`);
      showToast?.('Verification approved successfully', 'success');
      fetchRequests();
    } catch (error) {
      console.error('Failed to approve verification:', error);
      showToast?.('Failed to approve verification', 'error');
    }
  };

  const handleReject = async (requestId) => {
    const reason = prompt('Please provide a reason for rejection (optional):');
    try {
      await api.post(`/verifier/reject/${requestId}`, { reason: reason || '' });
      showToast?.('Request rejected', 'success');
      fetchRequests();
    } catch (error) {
      console.error('Failed to reject request:', error);
      showToast?.('Failed to reject request', 'error');
    }
  };

  const handleApproveInstitution = async (requestId) => {
    try {
      await api.put(`/associations/${requestId}/respond`, {
        action: 'approve',
        response: ''
      });
      showToast?.('Institution association approved successfully', 'success');
      fetchRequests();
    } catch (error) {
      console.error('Failed to approve institution association:', error);
      showToast?.(error.response?.data?.message || 'Failed to approve institution association', 'error');
    }
  };

  const handleRejectInstitution = async (requestId) => {
    const reason = prompt('Please provide a reason for rejection (optional):');
    try {
      await api.put(`/associations/${requestId}/respond`, {
        action: 'reject',
        response: reason || ''
      });
      showToast?.('Institution association rejected', 'success');
      fetchRequests();
    } catch (error) {
      console.error('Failed to reject institution association:', error);
      showToast?.(error.response?.data?.message || 'Failed to reject institution association', 'error');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>

      </span>
    );
  };

 const getTypeBadge = (type) => {
  const styles = {
    EXPERIENCE: 'bg-blue-100 text-blue-800',
    EDUCATION: 'bg-purple-100 text-purple-800',
    PROJECT: 'bg-green-100 text-green-800',
    INSTITUTION: 'bg-indigo-100 text-indigo-800'
  };

  const safeType = typeof type === 'string' && type.length ? type : 'UNKNOWN';
  const display = safeType === 'INSTITUTION' ? 'Institution' : (safeType.charAt(0) + safeType.slice(1).toLowerCase());

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[safeType] || 'bg-gray-100 text-gray-800'}`}>
      {display}
    </span>
  );
};


  return (
    <ProtectedRoute>
      <Head>
        <title>Verification Requests - TruePortMe</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Verification & Association Requests</h1>
                <p className="text-gray-600">Review and manage student verification and institution association requests from {user?.institute}</p>
              </div>
              <Link href="/verifier/dashboard" className="btn-secondary">
                Back to Dashboard
              </Link>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex space-x-4">
              <div>
                <label htmlFor="requestType" className="block text-sm font-medium text-gray-700 mb-1">
                  Request Type
                </label>
                <select
                  id="requestType"
                  className="form-input"
                  value={requestTypeFilter}
                  onChange={(e) => setRequestTypeFilter(e.target.value)}
                >
                  <option value="ALL">All Requests</option>
                  <option value="VERIFICATION">Verification Only</option>
                  <option value="INSTITUTION">Institution Association Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Requests List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
          ) : requests.length > 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Requested
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {requests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {request.student?.name || request.studentName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {request.student?.email || request.studentEmail}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getTypeBadge(request.type)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {request.title || request.itemTitle}
                          </div>
                          {request.description && (
                            <div className="text-sm text-gray-500 max-w-xs truncate">
                              {request.description}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(request.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(request.requestedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {request.requestType === 'VERIFICATION' && (
                              <Link
                                href={`/verifier/request/${request.id}`}
                                className="text-primary-600 hover:text-primary-900"
                              >
                                View
                              </Link>
                            )}
                            {request.status === 'PENDING' && (
                              <>
                                {request.requestType === 'INSTITUTION' ? (
                                  <>
                                    <button
                                      onClick={() => handleApproveInstitution(request.id)}
                                      className="text-green-600 hover:text-green-900"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => handleRejectInstitution(request.id)}
                                      className="text-red-600 hover:text-red-900"
                                    >
                                      Reject
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => handleApprove(request.id)}
                                      className="text-green-600 hover:text-green-900"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => handleReject(request.id)}
                                      className="text-red-600 hover:text-red-900"
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}
                              </>
                            )}
                            {request.requestType === 'INSTITUTION' && request.status !== 'PENDING' && (
                              <span className="text-gray-400 text-xs">
                                {request.status === 'APPROVED' ? 'Association Approved' : 'Association Rejected'}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No {requestTypeFilter === 'ALL' ? 'requests' : 
                    requestTypeFilter === 'VERIFICATION' ? 'verification requests' : 
                    'institution association requests'} found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                No {requestTypeFilter === 'ALL' ? 'requests' : 
                    requestTypeFilter === 'VERIFICATION' ? 'verification requests' : 
                    'institution association requests'} at the moment.
              </p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}