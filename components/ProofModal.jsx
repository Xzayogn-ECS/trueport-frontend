import React from 'react';

export default function ProofModal({ isOpen, onClose, item, request }) {
  if (!isOpen) return null;

  const verifierName = item?.verifierName || request?.verifierName || request?.verification?.verifierName;
  const verifierOrg = item?.verifierOrganization || request?.verifierOrganization || request?.verification?.verifierOrganization;
  const verifierEmail = request?.verifierEmail || '';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold">Verification Proof</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-700">Verifier:</p>
            <p className="font-medium">{verifierName || 'Not available'}</p>
            {verifierOrg && <p className="text-sm text-gray-600">{verifierOrg}</p>}
            {verifierEmail && <p className="text-xs text-gray-500 mt-1">Contact: {verifierEmail}</p>}
          </div>

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
