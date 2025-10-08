import { useState, useEffect } from 'react';
import api from '../utils/api';

const VerifierSelectionModal = ({ isOpen, onClose, onSelectVerifier, itemType, itemId, showToast }) => {
  const [verifiers, setVerifiers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedVerifier, setSelectedVerifier] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchVerifiers();
    }
  }, [isOpen]);

  useEffect(() => {
    console.log('Selected verifier changed:', selectedVerifier);
  }, [selectedVerifier]);

  const fetchVerifiers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/institute-verifiers');
      const verifierData = response.data.verifiers || response.data || [];
      console.log('Fetched verifiers:', verifierData);
      setVerifiers(verifierData);
      setSelectedVerifier(null); // Reset selection when fetching new verifiers
    } catch (error) {
      console.error('Failed to fetch verifiers:', error);
      showToast?.('Failed to load verifiers from your institute', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async () => {
    console.log('=== handleSubmitRequest called ===');
    console.log('selectedVerifier:', selectedVerifier);
    console.log('itemType:', itemType, 'itemId:', itemId);
    
    if (!selectedVerifier) {
      console.log('No verifier selected');
      showToast?.('Please select a verifier', 'error');
      return;
    }

    if (!itemType || !itemId) {
      console.log('Missing itemType or itemId');
      showToast?.('Invalid item information', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const endpoint = `/verify/request/${itemType}/${itemId}`;
      const payload = { verifierEmail: selectedVerifier.email };
      
      console.log('Sending API request to:', endpoint);
      console.log('Request payload:', payload);
      
      const response = await api.post(endpoint, payload);

      console.log('API response:', response.data);
      showToast?.('Verification request sent successfully!', 'success');
      
      if (response.data.link) {
        console.log('Verification link:', response.data.link);
      }

      onSelectVerifier?.(selectedVerifier);
      setSelectedVerifier(null);
      onClose();
    } catch (error) {
      console.error('Failed to send verification request:', error);
      console.error('Error response:', error.response?.data);
      showToast?.(error.response?.data?.message || 'Failed to send verification request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              Select Verifier from Your Institute
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          ) : verifiers.length > 0 ? (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Choose a verifier from your institution to review and verify your submission.
              </p>
              
              <div className="max-h-96 overflow-y-auto space-y-3">
                {verifiers.map((verifier, index) => {
                  const verifierId = verifier._id || verifier.id;
                  const selectedId = selectedVerifier?._id || selectedVerifier?.id;
                  const isSelected = selectedId === verifierId;
                  
                  return (
                    <label
                      key={verifierId || `verifier-${index}`}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all flex items-start ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        console.log('Clicking verifier:', verifier);
                        setSelectedVerifier(verifier);
                      }}
                    >
                      <input
                        type="radio"
                        name="verifier"
                        checked={isSelected}
                        onChange={() => {
                          console.log('Radio onChange - selecting verifier:', verifier);
                          setSelectedVerifier(verifier);
                        }}
                        className="mt-1 h-5 w-5 text-primary-600 border-gray-300 focus:ring-primary-500 cursor-pointer flex-shrink-0"
                      />
                      <div className="ml-4 flex-1">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-primary-600 font-semibold">
                              {verifier.name?.charAt(0)?.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900">
                              {verifier.name}
                            </h4>
                            <p className="text-sm text-gray-600">{verifier.email}</p>
                            {verifier.profileJson?.bio && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {verifier.profileJson.bio}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No verifiers found</h3>
              <p className="mt-1 text-sm text-gray-500">
                No verifiers from your institution are currently available.
              </p>
            </div>
          )}

          {/* Actions */}
          {verifiers.length > 0 && (
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={onClose}
                className="btn-secondary"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  console.log('Button clicked!');
                  console.log('selectedVerifier:', selectedVerifier);
                  console.log('submitting:', submitting);
                  console.log('Button disabled?', !selectedVerifier || submitting);
                  handleSubmitRequest();
                }}
                className="btn-primary"
                disabled={!selectedVerifier || submitting}
              >
                {submitting ? 'Sending Request...' : 'Send Verification Request'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifierSelectionModal;