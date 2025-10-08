import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import ProtectedRoute from '../../../components/ProtectedRoute';
import SidebarLayout from '../../../components/SidebarLayout';
import api from '../../../utils/api';

export default function VerificationRequestDetail({ showToast }) {
  const router = useRouter();
  const { id } = router.query;
  const [user, setUser] = useState(null);
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (userData.role !== 'VERIFIER') {
      router.push('/dashboard');
      return;
    }
    setUser(userData);
    
    if (id) {
      fetchRequest();
    }
  }, [router, id]);

  const fetchRequest = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/verifier/request/${id}`);
      const requestData = response.data.request;
      console.log('API Response:', response.data);
      setRequest(requestData);
    } catch (error) {
      console.error('Failed to fetch request:', error);
      showToast?.('Failed to load request details', 'error');
      router.push('/verifier/requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      await api.post(`/verifier/approve/${id}`);
      showToast?.('Verification approved successfully', 'success');
      router.push('/verifier/requests');
    } catch (error) {
      console.error('Failed to approve verification:', error);
      showToast?.('Failed to approve verification', 'error');
    }
  };

  const handleReject = async () => {
    const reason = prompt('Please provide a reason for rejection (optional):');
    try {
      await api.post(`/verifier/reject/${id}`, { reason: reason || '' });
      showToast?.('Request rejected', 'success');
      router.push('/verifier/requests');
    } catch (error) {
      console.error('Failed to reject request:', error);
      showToast?.('Failed to reject request', 'error');
    }
  };

  const getTypeBadge = (type) => {
    const styles = {
      EXPERIENCE: 'bg-blue-100 text-blue-800',
      EDUCATION: 'bg-purple-100 text-purple-800',
      PROJECT: 'bg-green-100 text-green-800'
    };

    const safeType = typeof type === 'string' && type.length 
      ? type.toUpperCase() 
      : 'EXPERIENCE';
    
    const display = safeType.charAt(0) + safeType.slice(1).toLowerCase();

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[safeType] || 'bg-gray-100 text-gray-800'}`}>
        {display}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!request) {
    return null;
  }

  return (
    <ProtectedRoute>
      <Head>
        <title>Verification Request - TruePortMe</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <Link 
                  href="/verifier/requests" 
                  className="text-primary-600 hover:text-primary-800 flex items-center mb-2"
                >
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Requests
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Verification Request Details</h1>
              </div>
              <div className="flex space-x-2">
                {getTypeBadge(request.item?.type)}
                {getStatusBadge(request.status)}
              </div>
            </div>
          </div>

          {/* Student Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Student Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Name</label>
                <p className="mt-1 text-sm text-gray-900">{request.student?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Email</label>
                <p className="mt-1 text-sm text-gray-900">{request.student?.email || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Institute</label>
                <p className="mt-1 text-sm text-gray-900">{request.student?.institute || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Requested On</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(request.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Expires At</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(request.expiresAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Item Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {(request.item?.type || 'EXPERIENCE').charAt(0) + (request.item?.type || 'experience').slice(1).toLowerCase()} Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Title</label>
                <p className="mt-1 text-base text-gray-900">{request.item?.title || 'N/A'}</p>
              </div>
              
              {request.item?.role && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Role</label>
                  <p className="mt-1 text-sm text-gray-900">{request.item.role}</p>
                </div>
              )}
              
              {request.item?.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Description</label>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{request.item.description}</p>
                </div>
              )}

              {request.item?.company && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Company</label>
                  <p className="mt-1 text-sm text-gray-900">{request.item.company}</p>
                </div>
              )}

              {request.item?.institute && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Institute</label>
                  <p className="mt-1 text-sm text-gray-900">{request.item.institute}</p>
                </div>
              )}

              {request.item?.degree && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Degree</label>
                  <p className="mt-1 text-sm text-gray-900">{request.item.degree}</p>
                </div>
              )}

              {(request.item?.startDate || request.item?.endDate) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {request.item.startDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Start Date</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {new Date(request.item.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                      </p>
                    </div>
                  )}
                  {request.item.endDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">End Date</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {new Date(request.item.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                      </p>
                    </div>
                  )}
                  {!request.item.endDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Status</label>
                      <p className="mt-1 text-sm text-gray-900">Currently Active</p>
                    </div>
                  )}
                </div>
              )}

              {request.item?.tags && request.item.tags.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">Technologies/Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {request.item.tags.map((tag, index) => (
                      <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {request.item?.githubLink && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">GitHub Link</label>
                  <a 
                    href={request.item.githubLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-1 text-sm text-primary-600 hover:text-primary-800"
                  >
                    {request.item.githubLink}
                  </a>
                </div>
              )}

              {request.item?.liveLink && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Live Link</label>
                  <a 
                    href={request.item.liveLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-1 text-sm text-primary-600 hover:text-primary-800"
                  >
                    {request.item.liveLink}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {request.status === 'PENDING' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
              <div className="flex space-x-4">
                <button
                  onClick={handleApprove}
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  Approve Verification
                </button>
                <button
                  onClick={handleReject}
                  className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  Reject Request
                </button>
              </div>
            </div>
          )}

          {request.status !== 'PENDING' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-center">
                <p className="text-gray-600">
                  This request has been <span className="font-semibold">{request.status}</span>.
                </p>
                {request.rejectionReason && (
                  <div className="mt-4 p-4 bg-red-50 rounded-lg">
                    <p className="text-sm font-medium text-red-800">Rejection Reason:</p>
                    <p className="mt-1 text-sm text-red-700">{request.rejectionReason}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

VerificationRequestDetail.getLayout = function getLayout(page) {
  return <SidebarLayout title="Request Details">{page}</SidebarLayout>;
};
