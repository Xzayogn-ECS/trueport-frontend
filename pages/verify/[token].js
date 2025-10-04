import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import api from '../../utils/api';

export default function VerifyToken({ showToast }) {
  const router = useRouter();
  const { token } = router.query;
  const [verification, setVerification] = useState(null);
  const [experience, setExperience] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (token) {
      fetchVerificationData();
    }
  }, [token]);

  const fetchVerificationData = async () => {
    try {
      const response = await api.get(`/verify/${token}`);
      setVerification(response.data.verification || response.data);
      setExperience(response.data.experience || response.data.verification?.experience);
    } catch (error) {
      console.error('Failed to fetch verification data:', error);
      showToast('Invalid or expired verification link', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setProcessing(true);
    try {
      await api.post(`/verify/${token}/approve`);
      showToast('Experience verified successfully!', 'success');
      setVerification({ ...verification, status: 'approved' });
    } catch (error) {
      console.error('Failed to approve verification:', error);
      showToast(error.response?.data?.message || 'Failed to approve verification', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt('Please provide a reason for rejection (optional):');
    
    setProcessing(true);
    try {
      await api.post(`/verify/${token}/reject`, { reason });
      showToast('Verification rejected', 'success');
      setVerification({ ...verification, status: 'rejected' });
    } catch (error) {
      console.error('Failed to reject verification:', error);
      showToast(error.response?.data?.message || 'Failed to reject verification', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!verification || !experience) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Invalid Link</h3>
          <p className="mt-1 text-sm text-gray-500">This verification link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  const isCompleted = verification.status === 'approved' || verification.status === 'rejected';

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Verify Experience - TruePortMe</title>
      </Head>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Experience Verification</h1>
          <p className="text-gray-600 mt-2">
            You've been asked to verify the following professional experience
          </p>
        </div>

        {/* Status Banner */}
        {isCompleted && (
          <div className={`mb-8 p-4 rounded-lg ${
            verification.status === 'approved' 
              ? 'bg-success-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            <div className="flex items-center">
              {verification.status === 'approved' ? (
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              )}
              <span className="font-medium">
                This experience has been {verification.status}
                {verification.verifiedAt && ` on ${formatDate(verification.verifiedAt)}`}
              </span>
            </div>
          </div>
        )}

        {/* Experience Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">{experience.title}</h2>
                <p className="text-gray-600 mb-1">{experience.role}</p>
                <p className="text-sm text-gray-500">
                  {formatDate(experience.startDate)} - {experience.endDate ? formatDate(experience.endDate) : 'Present'}
                </p>
              </div>
              {experience.verified && (
                <div className="verified-badge">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Verified
                </div>
              )}
            </div>

            <div className="prose max-w-none mb-6">
              <p className="text-gray-700 whitespace-pre-wrap">{experience.description}</p>
            </div>

            {experience.tags && experience.tags.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Skills & Technologies:</h4>
                <div className="flex flex-wrap gap-2">
                  {experience.tags.map((tag, index) => (
                    <span key={index} className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {experience.attachments && experience.attachments.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Attachments:</h4>
                <div className="space-y-2">
                  {experience.attachments.map((attachment, index) => (
                    <a
                      key={index}
                      href={attachment}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-primary-600 hover:text-primary-700 text-sm"
                    >
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 002 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                      </svg>
                      View Attachment {index + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Verification Actions */}
        {!isCompleted && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Verification Decision</h3>
              <p className="text-gray-600 mb-6">
                Please review the experience details above and decide whether to approve or reject this verification request.
              </p>
              
              <div className="flex space-x-4">
                <button
                  onClick={handleApprove}
                  disabled={processing}
                  className="btn-success flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {processing ? 'Processing...' : 'Approve & Verify'}
                </button>
                
                <button
                  onClick={handleReject}
                  disabled={processing}
                  className="btn-danger flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  {processing ? 'Processing...' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Verification Info */}
        <div className="mt-8 bg-gray-100 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">About This Verification</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Requested by:</strong> {verification.requesterEmail || 'User'}</p>
            <p><strong>Verifier:</strong> {verification.verifierEmail}</p>
            <p><strong>Requested on:</strong> {formatDate(verification.createdAt)}</p>
            {verification.verifiedAt && (
              <p><strong>Completed on:</strong> {formatDate(verification.verifiedAt)}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}