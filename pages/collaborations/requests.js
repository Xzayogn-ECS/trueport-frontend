import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute';
import SidebarLayout from '../../components/SidebarLayout';
import api from '../../utils/api';

export default function CollaborationRequests({ showToast }) {
  const [activeTab, setActiveTab] = useState('incoming');
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const [incomingRes, outgoingRes] = await Promise.all([
        api.get('/collaborations/requests/incoming'),
        api.get('/collaborations/requests/outgoing')
      ]);
      setIncomingRequests(incomingRes.data.requests || []);
      setOutgoingRequests(outgoingRes.data.requests || []);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
      showToast('Failed to load collaboration requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId) => {
    try {
      setResponding(requestId);
      await api.post(`/collaborations/requests/${requestId}/accept`);
      showToast('Collaboration request accepted!', 'success');
      fetchRequests();
    } catch (error) {
      console.error('Failed to accept request:', error);
      showToast(error.response?.data?.message || 'Failed to accept request', 'error');
    } finally {
      setResponding(null);
    }
  };

  const handleReject = async (requestId, reason = '') => {
    if (!confirm('Are you sure you want to reject this collaboration request?')) return;

    try {
      setResponding(requestId);
      await api.post(`/collaborations/requests/${requestId}/reject`, { reason });
      showToast('Collaboration request rejected', 'success');
      fetchRequests();
    } catch (error) {
      console.error('Failed to reject request:', error);
      showToast(error.response?.data?.message || 'Failed to reject request', 'error');
    } finally {
      setResponding(null);
    }
  };

  const handleCancel = async (requestId) => {
    if (!confirm('Are you sure you want to cancel this request?')) return;

    try {
      setResponding(requestId);
      await api.delete(`/collaborations/requests/${requestId}`);
      showToast('Request cancelled successfully', 'success');
      fetchRequests();
    } catch (error) {
      console.error('Failed to cancel request:', error);
      showToast(error.response?.data?.message || 'Failed to cancel request', 'error');
    } finally {
      setResponding(null);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      ACCEPTED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800'
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[status] || badges.PENDING}`}>
        {status}
      </span>
    );
  };

  const renderIncomingRequests = () => {
    const pendingRequests = incomingRequests.filter(req => req.status === 'PENDING');
    const processedRequests = incomingRequests.filter(req => req.status !== 'PENDING');

    return (
      <div className="space-y-6">
        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div>
            <h3 className="text-md font-semibold text-gray-900 mb-3">Pending Requests</h3>
            <div className="space-y-3">
              {pendingRequests.map(request => (
                <div key={request._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3">
                      {request.projectOwnerId?.profilePicture ? (
                        <img
                          src={request.projectOwnerId.profilePicture}
                          alt={request.projectOwnerId.name}
                          className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                          {request.projectOwnerId?.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{request.projectOwnerId?.name}</p>
                        <p className="text-sm text-gray-500">{request.projectOwnerId?.email}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>

                  <div className="ml-15 space-y-2">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-sm font-medium text-blue-900">Project: {request.projectId?.title}</p>
                      {request.projectId?.description && (
                        <p className="text-xs text-blue-700 mt-1">{request.projectId.description}</p>
                      )}
                      {request.projectId?.category && (
                        <span className="inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium bg-blue-200 text-blue-800">
                          {request.projectId.category}
                        </span>
                      )}
                    </div>

                    {request.role && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Role: </span>
                        <span className="text-sm text-gray-600">{request.role}</span>
                      </div>
                    )}

                    {request.message && (
                      <div className="bg-gray-50 rounded p-3">
                        <p className="text-xs font-medium text-gray-700 mb-1">Message:</p>
                        <p className="text-sm text-gray-600">{request.message}</p>
                      </div>
                    )}

                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => handleAccept(request._id)}
                        disabled={responding === request._id}
                        className="btn-success flex-1 text-sm"
                      >
                        {responding === request._id ? 'Accepting...' : 'Accept'}
                      </button>
                      <button
                        onClick={() => handleReject(request._id)}
                        disabled={responding === request._id}
                        className="btn-secondary flex-1 text-sm"
                      >
                        {responding === request._id ? 'Rejecting...' : 'Reject'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Processed Requests */}
        {processedRequests.length > 0 && (
          <div>
            <h3 className="text-md font-semibold text-gray-900 mb-3">Previous Requests</h3>
            <div className="space-y-3">
              {processedRequests.map(request => (
                <div key={request._id} className="bg-gray-50 rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {request.projectOwnerId?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{request.projectOwnerId?.name}</p>
                        <p className="text-xs text-gray-500">{request.projectId?.title}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(request.status)}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(request.respondedAt || request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {incomingRequests.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No incoming requests</h3>
            <p className="text-gray-600">You haven't received any collaboration requests yet</p>
          </div>
        )}
      </div>
    );
  };

  const renderOutgoingRequests = () => {
    return (
      <div className="space-y-3">
        {outgoingRequests.map(request => (
          <div key={request._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start space-x-3">
                {request.requestedUserId?.profilePicture ? (
                  <img
                    src={request.requestedUserId.profilePicture}
                    alt={request.requestedUserId.name}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                    {request.requestedUserId?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900">{request.requestedUserId?.name}</p>
                  <p className="text-sm text-gray-500">{request.requestedUserId?.email}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Sent on {new Date(request.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {getStatusBadge(request.status)}
            </div>

            <div className="ml-15 space-y-2">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-900">Project: {request.projectId?.title}</p>
                {request.role && (
                  <p className="text-xs text-gray-600 mt-1">Role: {request.role}</p>
                )}
              </div>

              {request.status === 'PENDING' && (
                <button
                  onClick={() => handleCancel(request._id)}
                  disabled={responding === request._id}
                  className="btn-secondary text-sm mt-3"
                >
                  {responding === request._id ? 'Cancelling...' : 'Cancel Request'}
                </button>
              )}
            </div>
          </div>
        ))}

        {outgoingRequests.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No outgoing requests</h3>
            <p className="text-gray-600 mb-4">You haven't sent any collaboration requests yet</p>
            <Link href="/collaborations/search" className="btn-primary inline-flex items-center">
              Search Collaborators
            </Link>
          </div>
        )}
      </div>
    );
  };

  return (
    <ProtectedRoute>
      <Head>
        <title>Collaboration Requests - TruePortMe</title>
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
              <Link href="/collaborations/search" className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
                Search Collaborators
              </Link>
              <Link href="/collaborations/requests" className="border-primary-500 text-primary-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
                Requests
              </Link>
              <Link href="/collaborations" className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
                My Collaborations
              </Link>
            </nav>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('incoming')}
                  className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'incoming'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Incoming Requests
                  {incomingRequests.filter(r => r.status === 'PENDING').length > 0 && (
                    <span className="ml-2 bg-primary-100 text-primary-600 py-0.5 px-2 rounded-full text-xs">
                      {incomingRequests.filter(r => r.status === 'PENDING').length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('outgoing')}
                  className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'outgoing'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Outgoing Requests
                  {outgoingRequests.filter(r => r.status === 'PENDING').length > 0 && (
                    <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                      {outgoingRequests.filter(r => r.status === 'PENDING').length}
                    </span>
                  )}
                </button>
              </nav>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
          ) : (
            <div>
              {activeTab === 'incoming' ? renderIncomingRequests() : renderOutgoingRequests()}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

CollaborationRequests.getLayout = function getLayout(page) {
  return <SidebarLayout title="Collaboration Requests">{page}</SidebarLayout>;
};
