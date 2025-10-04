import Link from 'next/link';

const PROJECT_CATEGORIES = {
  'SOFTWARE_DEVELOPMENT': 'Software Development',
  'WEB_APPLICATION': 'Web Application',
  'MOBILE_APP': 'Mobile App',
  'DATA_SCIENCE': 'Data Science',
  'AI_ML_PROJECT': 'AI/ML Project',
  'UI_UX_DESIGN': 'UI/UX Design',
  'GRAPHIC_DESIGN': 'Graphic Design',
  'PRODUCT_DESIGN': 'Product Design',
  'BRAND_IDENTITY': 'Brand Identity',
  'DIGITAL_ART': 'Digital Art',
  'BUSINESS_PLAN': 'Business Plan',
  'MARKET_RESEARCH': 'Market Research',
  'STARTUP_PITCH': 'Startup Pitch',
  'MARKETING_CAMPAIGN': 'Marketing Campaign',
  'FINANCIAL_ANALYSIS': 'Financial Analysis',
  'RESEARCH_PAPER': 'Research Paper',
  'THESIS_PROJECT': 'Thesis Project',
  'CASE_STUDY': 'Case Study',
  'LAB_EXPERIMENT': 'Lab Experiment',
  'SURVEY_STUDY': 'Survey Study',
  'CREATIVE_WRITING': 'Creative Writing',
  'PHOTOGRAPHY': 'Photography',
  'VIDEO_PRODUCTION': 'Video Production',
  'MUSIC_COMPOSITION': 'Music Composition',
  'ART_PROJECT': 'Art Project',
  'COMMUNITY_SERVICE': 'Community Service',
  'INTERNSHIP_PROJECT': 'Internship Project',
  'FREELANCE_WORK': 'Freelance Work',
  'COMPETITION_ENTRY': 'Competition Entry',
  'OTHER': 'Other'
};

const ProjectCard = ({ project, showActions = false, onEdit, onDelete, showToast }) => {
  const {
    _id,
    title,
    projectName,
    category,
    description,
    learnings,
    skillsUsed = [],
    technologies = [],
    links = {},
    duration,
    course,
    supervisor,
    collaborators,
    isPublic,
    createdAt,
    // Legacy fields for backward compatibility
    repositoryUrl,
    liveUrl,
    projectType
  } = project;

  // Use new title field or fall back to legacy projectName
  const displayTitle = title || projectName;
  // Use new skillsUsed or fall back to legacy technologies
  const displaySkills = skillsUsed.length > 0 ? skillsUsed : technologies;

  const getCategoryLabel = (cat) => {
    return PROJECT_CATEGORIES[cat] || cat || 'Other';
  };

  const getCategoryColor = (cat) => {
    const techCategories = ['SOFTWARE_DEVELOPMENT', 'WEB_APPLICATION', 'MOBILE_APP', 'DATA_SCIENCE', 'AI_ML_PROJECT'];
    const designCategories = ['UI_UX_DESIGN', 'GRAPHIC_DESIGN', 'PRODUCT_DESIGN', 'BRAND_IDENTITY', 'DIGITAL_ART'];
    const businessCategories = ['BUSINESS_PLAN', 'MARKET_RESEARCH', 'STARTUP_PITCH', 'MARKETING_CAMPAIGN', 'FINANCIAL_ANALYSIS'];
    const academicCategories = ['RESEARCH_PAPER', 'THESIS_PROJECT', 'CASE_STUDY', 'LAB_EXPERIMENT', 'SURVEY_STUDY'];
    const creativeCategories = ['CREATIVE_WRITING', 'PHOTOGRAPHY', 'VIDEO_PRODUCTION', 'MUSIC_COMPOSITION', 'ART_PROJECT'];
    
    if (techCategories.includes(cat)) return 'bg-blue-100 text-blue-800';
    if (designCategories.includes(cat)) return 'bg-purple-100 text-purple-800';
    if (businessCategories.includes(cat)) return 'bg-green-100 text-green-800';
    if (academicCategories.includes(cat)) return 'bg-orange-100 text-orange-800';
    if (creativeCategories.includes(cat)) return 'bg-pink-100 text-pink-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getVisibilityBadge = () => {
    if (isPublic === false) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
          </svg>
          Private
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        Public
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4 sm:p-6">
        {/* Header with title and visibility badge */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3 sm:mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 break-words">{displayTitle}</h3>
            {(category || projectType) && (
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                getCategoryColor(category || projectType)
              }`}>
                {getCategoryLabel(category || projectType)}
              </span>
            )}
          </div>
          <div className="flex-shrink-0">
            {getVisibilityBadge()}
          </div>
        </div>

        {/* Description */}
        {description && (
          <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-3 break-words">
            {description}
          </p>
        )}

        {/* Skills */}
        {displaySkills.length > 0 && (
          <div className="mb-3 sm:mb-4">
            <div className="flex flex-wrap gap-1 sm:gap-1.5">
              {displaySkills.slice(0, 4).map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
                >
                  {skill}
                </span>
              ))}
              {displaySkills.length > 4 && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                  +{displaySkills.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Learnings */}
        {learnings && (
          <div className="mb-3 sm:mb-4">
            <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 break-words">
              <span className="font-medium">Key Learnings:</span> {learnings}
            </p>
          </div>
        )}

        {/* Links */}
        <div className="flex gap-1.5 sm:gap-2 mb-3 sm:mb-4 flex-wrap">
          {(links.githubUrl || repositoryUrl) && (
            <a
              href={links.githubUrl || repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
              </svg>
              Repository
            </a>
          )}
          {(links.liveUrl || liveUrl) && (
            <a
              href={links.liveUrl || liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-2 sm:px-3 py-1.5 border border-gray-300 text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Live Demo
            </a>
          )}
          {links.portfolioUrl && (
            <a
              href={links.portfolioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-2 sm:px-3 py-1.5 border border-gray-300 text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Portfolio
            </a>
          )}
          {links.documentUrl && (
            <a
              href={links.documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-2 sm:px-3 py-1.5 border border-gray-300 text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Document
            </a>
          )}
        </div>

        {/* Actions */}
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
    </div>
  );
};

export default ProjectCard;
