import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Cookies from 'js-cookie';
import api from '../../../utils/api';
import Link from 'next/link';

export default function VerifierInvitePreview({ showToast }) {
  const router = useRouter();
  const { token } = router.query;

  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState('welcome'); // welcome, review, info, done, create-account
  const [invite, setInvite] = useState(null);
  const [verification, setVerification] = useState(null);
  const [verificationId, setVerificationId] = useState(null);
  const [actionToken, setActionToken] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [hasAccount, setHasAccount] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [decisionStatus, setDecisionStatus] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [requestedInfo, setRequestedInfo] = useState(null);

  // Step 1: Auto-claim invite on page load
  useEffect(() => {
    if (!token) return;
    const claimInvite = async () => {
      setLoading(true);
      try {
        // First preview to get invite ID
        const previewRes = await api.post('/verifier-invites/preview', { token });
        const inviteId = previewRes.data.invite.id;
        setInvite(previewRes.data.invite);
        setVerification(previewRes.data.verification);
        
        // Auto-claim the invite
        const claimRes = await api.post(`/verifier-invites/${inviteId}/claim`, { token });
        console.log('Claim response:', claimRes.data);
        
        setActionToken(claimRes.data.actionToken);
        setAuthToken(claimRes.data.token);
        setVerificationId(claimRes.data.verificationId || previewRes.data.verification.id);
        setHasAccount(claimRes.data.hasAccount || false);
        setUser(claimRes.data.user);
        
        if (claimRes.data.token) {
          Cookies.set('auth-token', claimRes.data.token, { expires: 7 });
        }
        
        setStep('welcome');
      } catch (err) {
        console.error('Claim error:', err);
        setError(err.response?.data?.message || 'Invalid or expired invite link');
      } finally {
        setLoading(false);
      }
    };
    claimInvite();
  }, [token]);

  // Step 2: View Request Details
  const handleViewRequest = async () => {
    setProcessing(true);
    try {
      const res = await api.post(`/verifications/${verificationId}/details`, {
        token: actionToken
      });
      console.log(res)
      setRequestedInfo(res.data?.request?.item);
      setStep('info');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch request details');
    } finally {
      setProcessing(false);
    }
  };

  // Step 3: Decision (approve/reject - works with actionToken, no account required)
  const handleDecision = async (decision) => {
    if (!verificationId || !actionToken) return;
    const comment = decision === 'DENY' ? prompt('Reason for denial (optional):') : '';
    setProcessing(true);
    try {
      await api.post(`/verifications/${verificationId}/decision`, {
        token: actionToken,
        decision,
        comment
      });
      setDecisionStatus(decision);
      setStep('done');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit decision');
    } finally {
      setProcessing(false);
    }
  };

  // Step 4: Create Account (optional, after verification)
  const handleCreateAccount = async () => {
    const name = prompt('Enter your full name:');
    const password = prompt('Create a password (min 6 characters):');
    
    if (!name || !password || password.length < 6) {
      showToast?.('Please provide valid name and password (min 6 characters)', 'error');
      return;
    }
    
    if (!invite || !actionToken) return;
    setProcessing(true);
    try {
      const res = await api.post(`/verifier-invites/${invite.id}/create-account`, {
        token: actionToken,
        password,
        name
      });
      setAuthToken(res.data.token);
      setUser(res.data.user);
      Cookies.set('auth-token', res.data.token, { expires: 7 });
      showToast?.('Account created successfully!', 'success');
      setStep('account-created');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create account');
      showToast?.('Failed to create account', 'error');
    } finally {
      setProcessing(false);
    }
  };

  // UI rendering
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div></div>;
  }
  if (error) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="text-center"><h3 className="text-lg font-medium text-red-600 mb-2">{error}</h3></div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head><title>Verification Invite - TruePortMe</title></Head>
      <div className="max-w-2xl mx-auto px-4 py-8">
        
        {/* Welcome Step */}
        {step === 'welcome' && invite && verification && (
          <div className="text-center">
            <div className="mb-8">
              <div className="mx-auto w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to TruePortMe!</h1>
              <p className="text-lg text-gray-600">You've been invited to verify a {verification.type === 'EXPERIENCE' ? 'professional experience' : 'educational qualification'}</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 text-left">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Verification Request Details</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Requested by:</span>
                  <span className="font-medium text-gray-900">{invite.name}</span>
                </div>
                {invite.organization && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Organization:</span>
                    <span className="font-medium text-gray-900">{invite.organization}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Your email:</span>
                  <span className="font-medium text-gray-900">{invite.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {verification.type}
                  </span>
                </div>
                {invite.message && (
                  <div className="pt-3 border-t border-gray-200">
                    <span className="text-gray-600 block mb-1">Message:</span>
                    <p className="text-gray-900 italic">"{invite.message}"</p>
                  </div>
                )}
              </div>
            </div>

            <button 
              className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors text-lg"
              onClick={() => setStep('review')}
            >
              Continue to Review Request
            </button>
            
            <p className="mt-4 text-sm text-gray-500">
              You can approve or deny this request without creating an account
            </p>
          </div>
        )}

        {/* Review Step */}
        {step === 'review' && verification && (
          <>
            <h2 className="text-xl font-semibold mb-2">Review Verification Request</h2>
            <div className="mb-2">Verification ID: <b>{verification.id}</b></div>
            <div className="mb-2">Item Type: <b>{verification.type}</b></div>
            <div className="mb-4">
              <button 
                className="btn-secondary w-full mb-4" 
                onClick={handleViewRequest} 
                disabled={processing}
              >
                {processing ? 'Loading...' : 'View Request Details'}
              </button>
            </div>
            <div className="flex gap-4 mt-6">
              <button className="btn-success" onClick={() => handleDecision('APPROVE')} disabled={processing}>Approve</button>
              <button className="btn-danger" onClick={() => handleDecision('DENY')} disabled={processing}>Reject</button>
            </div>
          </>
        )}
        {step === 'info' && requestedInfo && (
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <button 
                onClick={() => setStep('review')} 
                className="text-primary-600 hover:text-primary-800 flex items-center mb-2"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Review
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                {verification.type === 'EXPERIENCE' ? 'Experience' : 'Education'} Details
              </h1>
            </div>

            {/* Item Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {verification.type === 'EXPERIENCE' ? 'Experience' : 'Education'} Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Title</label>
                  <p className="mt-1 text-base text-gray-900">{requestedInfo.title || requestedInfo.courseName || 'N/A'}</p>
                </div>
                
                {verification.type === 'EXPERIENCE' && (
                  <>
                    {requestedInfo.role && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Role</label>
                        <p className="mt-1 text-sm text-gray-900">{requestedInfo.role}</p>
                      </div>
                    )}
                    {(requestedInfo.organization || requestedInfo.company) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Organization</label>
                        <p className="mt-1 text-sm text-gray-900">{requestedInfo.organization || requestedInfo.company}</p>
                      </div>
                    )}
                  </>
                )}

                {verification.type === 'EDUCATION' && (
                  <>
                    {requestedInfo.institution && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Institution</label>
                        <p className="mt-1 text-sm text-gray-900">{requestedInfo.institution}</p>
                      </div>
                    )}
                    {requestedInfo.degree && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Degree</label>
                        <p className="mt-1 text-sm text-gray-900">{requestedInfo.degree}</p>
                      </div>
                    )}
                    {requestedInfo.fieldOfStudy && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Field of Study</label>
                        <p className="mt-1 text-sm text-gray-900">{requestedInfo.fieldOfStudy}</p>
                      </div>
                    )}
                    {requestedInfo.grade && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Grade</label>
                        <p className="mt-1 text-sm text-gray-900">{requestedInfo.grade}</p>
                      </div>
                    )}
                  </>
                )}
                
                {requestedInfo.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Description</label>
                    <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{requestedInfo.description}</p>
                  </div>
                )}

                {(requestedInfo.startDate || requestedInfo.endDate) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {requestedInfo.startDate && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Start Date</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {new Date(requestedInfo.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                        </p>
                      </div>
                    )}
                    {requestedInfo.endDate && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500">End Date</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {new Date(requestedInfo.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                        </p>
                      </div>
                    )}
                    {!requestedInfo.endDate && requestedInfo.startDate && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Status</label>
                        <p className="mt-1 text-sm text-gray-900">Currently Active</p>
                      </div>
                    )}
                  </div>
                )}

                {requestedInfo.tags && requestedInfo.tags.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">
                      {verification.type === 'EXPERIENCE' ? 'Technologies/Skills' : 'Subjects'}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {requestedInfo.tags.map((tag, index) => (
                        <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {requestedInfo.githubLink && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">GitHub Link</label>
                    <Link
                      href={requestedInfo.githubLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="mt-1 text-sm text-primary-600 hover:text-primary-800"
                    >
                      {requestedInfo.githubLink}
                    </Link>
                  </div>
                )}

                {requestedInfo.liveLink && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Live Link</label>
                    <Link
                      href={requestedInfo.liveLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="mt-1 text-sm text-primary-600 hover:text-primary-800"
                    >
                      {requestedInfo.liveLink}
                    </Link>
                  </div>
                )}

                {requestedInfo.attachments && requestedInfo.attachments.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">Attachments</label>
                    <div className="space-y-2">
                      {requestedInfo.attachments.map((url, i) => (
                        <Link
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-primary-600 hover:text-primary-700 text-sm"
                        >
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 002 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                          </svg>
                          View Attachment {i + 1}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
              <div className="flex space-x-4">
                <button
                  onClick={() => handleDecision('APPROVE')}
                  disabled={processing}
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {processing ? 'Processing...' : 'Approve Verification'}
                </button>
                <button
                  onClick={() => handleDecision('DENY')}
                  disabled={processing}
                  className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {processing ? 'Processing...' : 'Reject Request'}
                </button>
              </div>
            </div>
          </div>
        )}
        {step === 'done' && (
          <div className="text-center">
            <div className={`inline-block p-6 rounded-lg mb-6 ${decisionStatus === 'APPROVE' ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
              <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${decisionStatus === 'APPROVE' ? 'bg-green-100' : 'bg-red-100'}`}>
                {decisionStatus === 'APPROVE' ? (
                  <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <h2 className="text-2xl font-bold mb-2 text-gray-900">
                Verification {decisionStatus === 'APPROVE' ? 'Approved' : 'Rejected'}!
              </h2>
              <p className="text-gray-700">
                {decisionStatus === 'APPROVE' 
                  ? 'Thank you for verifying this request. The student will be notified.'
                  : 'The verification has been rejected. The student will be notified.'}
              </p>
            </div>

            {/* Create Account CTA */}
            {!hasAccount && (
              <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg border-2 border-primary-200 p-6 mt-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="w-12 h-12 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <div className="ml-4 flex-1 text-left">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Want to manage more verification requests?</h3>
                    <p className="text-gray-700 mb-4">
                      Create a free TruePortMe verifier account to:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-2 mb-4">
                      <li className="flex items-start">
                        <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Access a centralized dashboard for all verification requests
                      </li>
                      <li className="flex items-start">
                        <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Track verification history and analytics
                      </li>
                      <li className="flex items-start">
                        <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Manage students from your institution
                      </li>
                      <li className="flex items-start">
                        <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Build your professional reputation
                      </li>
                    </ul>
                    <button 
                      className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors shadow-lg"
                      onClick={handleCreateAccount}
                      disabled={processing}
                    >
                      {processing ? 'Creating Account...' : 'Create Free Account'}
                    </button>
                    <p className="text-xs text-gray-500 mt-2">Takes less than 1 minute • No credit card required</p>
                  </div>
                </div>
              </div>
            )}

            {hasAccount && (
              <div className="mt-6">
                <Link
                  href="/verifier/dashboard" 
                  clas  sName="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                >
                  Go to Your Dashboard
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Account Created Success */}
        {step === 'account-created' && (
          <div className="text-center">
            <div className="inline-block p-6 rounded-lg mb-6 bg-green-50 border-2 border-green-200">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2 text-gray-900">Account Created Successfully!</h2>
              <p className="text-gray-700 mb-4">
                Welcome to TruePortMe! You can now access your verifier dashboard.
              </p>
              <Link
                href="/verifier/dashboard" 
                className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                Go to Dashboard
              </Link    >
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
