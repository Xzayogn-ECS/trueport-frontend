import Link from 'next/link';

const ExperienceCard = ({ experience, showActions = false, onEdit, onDelete, onRequestVerification, showToast }) => {
  const { 
    _id, 
    title, 
    description, 
    role, 
    startDate, 
    endDate, 
    tags = [], 
    attachments = [], 
    verified, 
    verifiedAt 
  } = experience;

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0 mb-3 sm:mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 break-words">{title}</h3>
          <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2 break-words">{role}</p>
          <p className="text-xs sm:text-sm text-gray-500">
            {formatDate(startDate)} - {endDate ? formatDate(endDate) : 'Present'}
          </p>
        </div>
        {verified && (
          <div className="verified-badge flex-shrink-0">
            <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path 
                fillRule="evenodd" 
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                clipRule="evenodd" 
              />
            </svg>
            <span className="hidden sm:inline">Verified</span>
            <span className="sm:hidden">✓</span>
            {verifiedAt && <span className="hidden md:inline"> {new Date(verifiedAt).toLocaleDateString()}</span>}
          </div>
        )}
      </div>

      <p className="text-sm sm:text-base text-gray-700 mb-3 sm:mb-4 line-clamp-3 break-words">{description}</p>

      {tags.length > 0 && (
        <div className="mb-3 sm:mb-4">
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {tags.map((tag, index) => (
              <span 
                key={index}
                className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {attachments.length > 0 && (
        <div className="mb-3 sm:mb-4">
          <p className="text-xs sm:text-sm text-gray-600 mb-2">Attachments:</p>
          <div className="space-y-1">
            {attachments.map((attachment, index) => (
              <a
                key={index}
                href={attachment}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 text-xs sm:text-sm flex items-center break-all"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path 
                    fillRule="evenodd" 
                    d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 002 0V7a3 3 0 00-3-3z" 
                    clipRule="evenodd" 
                  />
                </svg>
                Attachment {index + 1}
              </a>
            ))}
          </div>
        </div>
      )}

      {showActions && (
        <div className="flex flex-col sm:flex-row gap-2 pt-3 sm:pt-4 border-t border-gray-200">
          <button
            onClick={onEdit}
            className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-gray-300 text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
          
          {!verified && (
            <button
              onClick={onRequestVerification}
              className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="hidden sm:inline">Request Verification</span>
              <span className="sm:hidden">Verify</span>
            </button>
          )}
          
          <button
            onClick={onDelete}
            className="sm:flex-none inline-flex items-center justify-center px-3 py-2 border border-red-300 text-xs sm:text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
          >
            <svg className="w-4 h-4 sm:mr-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span className="ml-1 sm:hidden">Delete</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ExperienceCard;