import React from 'react';

export default function ProofModal({ isOpen, onClose, item, request }) {
  if (!isOpen) return null;

  const verifierName = item?.verifierName || request?.verifierName || request?.verification?.verifierName;
  const verifierOrg = item?.verifierOrganization || request?.verifierOrganization || request?.verification?.verifierOrganization;
  const verifierEmail = item?.verifiedBy || request?.verifierEmail || '';
  const verifierComment = item?.verifierComment || request?.verifierComment || '';
  const verifiedAt = item?.verifiedAt || request?.verifiedAt;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) + 
           ' ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Verification Proof</h3>
            <div className="flex items-center mt-2">
              <span className="inline-block bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                ✓ Verified
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg border-l-4 border-green-500">
          <div className="space-y-2">
            <div>
              <p className="text-xs text-gray-600 uppercase font-semibold">Verified by</p>
              <p className="font-medium text-sm">{verifierName || 'Not available'}</p>
            </div>
            {verifierEmail && (
              <div>
                <p className="text-xs text-gray-600">Email: <span className="text-gray-700">{verifierEmail}</span></p>
              </div>
            )}
            {verifierOrg && (
              <div>
                <p className="text-xs text-gray-600">Institute: <span className="text-gray-700">{verifierOrg}</span></p>
              </div>
            )}
            {verifiedAt && (
              <div>
                <p className="text-xs text-gray-600">Verified on: <span className="text-gray-700">{formatDate(verifiedAt)}</span></p>
              </div>
            )}
            {verifierComment && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-600">Verifier&apos;s Comment:</p>
                <p className="text-sm text-gray-700 mt-1">{verifierComment}</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-700">Item details:</p>
            <p className="text-sm text-gray-600">{item?.title || item?.courseName || '—'}</p>
          </div>

          <div>
            <p className="text-sm text-gray-700 mb-2">Attachments</p>
            {Array.isArray(item?.attachments) && item.attachments.length > 0 ? (
              <div className="space-y-2">
                {item.attachments.map((att, i) => (
                  <a key={i} href={att} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 block text-sm">
                    View attachment {i + 1}
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No proof attachments available.</p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="btn-secondary">Close</button>
        </div>
      </div>
    </div>
  );
}
