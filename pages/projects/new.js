import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import ProtectedRoute from '../../components/ProtectedRoute';
import api from '../../utils/api';
import CreatableSelect from 'react-select/creatable';

const PROJECT_CATEGORIES = {
  // Tech Projects
  'SOFTWARE_DEVELOPMENT': 'Software Development',
  'WEB_APPLICATION': 'Web Application',
  'MOBILE_APP': 'Mobile App',
  'DATA_SCIENCE': 'Data Science',
  'AI_ML_PROJECT': 'AI/ML Project',
  
  // Design Projects
  'UI_UX_DESIGN': 'UI/UX Design',
  'GRAPHIC_DESIGN': 'Graphic Design',
  'PRODUCT_DESIGN': 'Product Design',
  'BRAND_IDENTITY': 'Brand Identity',
  'DIGITAL_ART': 'Digital Art',
  
  // Business Projects
  'BUSINESS_PLAN': 'Business Plan',
  'MARKET_RESEARCH': 'Market Research',
  'STARTUP_PITCH': 'Startup Pitch',
  'MARKETING_CAMPAIGN': 'Marketing Campaign',
  'FINANCIAL_ANALYSIS': 'Financial Analysis',
  
  // Academic Projects
  'RESEARCH_PAPER': 'Research Paper',
  'THESIS_PROJECT': 'Thesis Project',
  'CASE_STUDY': 'Case Study',
  'LAB_EXPERIMENT': 'Lab Experiment',
  'SURVEY_STUDY': 'Survey Study',
  
  // Creative Projects
  'CREATIVE_WRITING': 'Creative Writing',
  'PHOTOGRAPHY': 'Photography',
  'VIDEO_PRODUCTION': 'Video Production',
  'MUSIC_COMPOSITION': 'Music Composition',
  'ART_PROJECT': 'Art Project',
  
  // Other
  'COMMUNITY_SERVICE': 'Community Service',
  'INTERNSHIP_PROJECT': 'Internship Project',
  'FREELANCE_WORK': 'Freelance Work',
  'COMPETITION_ENTRY': 'Competition Entry',
  'OTHER': 'Other'
};

const TECH_CATEGORIES = ['SOFTWARE_DEVELOPMENT', 'WEB_APPLICATION', 'MOBILE_APP', 'DATA_SCIENCE', 'AI_ML_PROJECT'];
const DESIGN_CATEGORIES = ['UI_UX_DESIGN', 'GRAPHIC_DESIGN', 'PRODUCT_DESIGN', 'BRAND_IDENTITY', 'DIGITAL_ART'];
const BUSINESS_CATEGORIES = ['BUSINESS_PLAN', 'MARKET_RESEARCH', 'STARTUP_PITCH', 'MARKETING_CAMPAIGN', 'FINANCIAL_ANALYSIS'];
const ACADEMIC_CATEGORIES = ['RESEARCH_PAPER', 'THESIS_PROJECT', 'CASE_STUDY', 'LAB_EXPERIMENT', 'SURVEY_STUDY'];

const SKILL_OPTIONS = {
  tech: ['React', 'React Native', 'Next.js', 'Node.js', 'Express', 'MongoDB', 'PostgreSQL', 'TypeScript', 'JavaScript', 'Python', 'Django', 'Flask', 'Java', 'Spring Boot', 'C++', 'C#', 'Go', 'Rust', 'HTML', 'CSS', 'Tailwind CSS', 'Bootstrap', 'Redux', 'GraphQL', 'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'Firebase', 'TensorFlow', 'PyTorch', 'Machine Learning', 'Data Analysis'],
  design: ['Adobe Photoshop', 'Adobe Illustrator', 'Figma', 'Sketch', 'Adobe XD', 'InVision', 'Principle', 'Framer', 'Adobe After Effects', 'Adobe Premiere', 'Canva', 'Color Theory', 'Typography', 'User Research', 'Wireframing', 'Prototyping', 'Brand Strategy', 'Logo Design'],
  business: ['Market Research', 'Financial Modeling', 'Business Strategy', 'SWOT Analysis', 'Competitive Analysis', 'Excel', 'PowerPoint', 'Google Analytics', 'SEO', 'SEM', 'Social Media Marketing', 'Content Marketing', 'Email Marketing', 'CRM', 'Project Management', 'Leadership', 'Team Management'],
  academic: ['Research Methodology', 'Statistical Analysis', 'Data Collection', 'Literature Review', 'Academic Writing', 'SPSS', 'R', 'Matlab', 'LaTeX', 'Citation Management', 'Survey Design', 'Interview Techniques', 'Qualitative Analysis', 'Quantitative Analysis'],
  creative: ['Creative Writing', 'Storytelling', 'Photography', 'Video Editing', 'Audio Production', 'Music Theory', 'Composition', 'Adobe Creative Suite', 'Final Cut Pro', 'Logic Pro', 'ProTools', 'Lighting', 'Color Grading', 'Script Writing'],
  general: ['Communication', 'Problem Solving', 'Critical Thinking', 'Time Management', 'Collaboration', 'Presentation Skills', 'Microsoft Office', 'Google Workspace', 'Project Planning', 'Documentation']
};

export default function NewProject({ showToast }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    skillsUsed: [],
    learnings: '',
    links: {
      githubUrl: '',
      liveUrl: '',
      portfolioUrl: '',
      documentUrl: ''
    },
    duration: {
      startDate: '',
      endDate: ''
    },
    course: '',
    supervisor: '',
    collaborators: ''
  });
  const [loading, setLoading] = useState(false);
  const [techInput, setTechInput] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const getSkillOptions = () => {
    if (!formData.category) return SKILL_OPTIONS.general;
    
    if (TECH_CATEGORIES.includes(formData.category)) return [...SKILL_OPTIONS.tech, ...SKILL_OPTIONS.general];
    if (DESIGN_CATEGORIES.includes(formData.category)) return [...SKILL_OPTIONS.design, ...SKILL_OPTIONS.general];
    if (BUSINESS_CATEGORIES.includes(formData.category)) return [...SKILL_OPTIONS.business, ...SKILL_OPTIONS.general];
    if (ACADEMIC_CATEGORIES.includes(formData.category)) return [...SKILL_OPTIONS.academic, ...SKILL_OPTIONS.general];
    return [...SKILL_OPTIONS.creative, ...SKILL_OPTIONS.general];
  };

  const isTechProject = () => TECH_CATEGORIES.includes(formData.category);
  const isDesignProject = () => DESIGN_CATEGORIES.includes(formData.category);
  const isBusinessProject = () => BUSINESS_CATEGORIES.includes(formData.category);
  const isAcademicProject = () => ACADEMIC_CATEGORIES.includes(formData.category);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Clean up the data structure for API
      const submitData = {
        ...formData,
        // Remove empty links
        links: Object.fromEntries(
          Object.entries(formData.links).filter(([key, value]) => value.trim() !== '')
        ),
        // Remove empty duration if both dates are empty
        ...(formData.duration.startDate || formData.duration.endDate ? { duration: formData.duration } : {}),
        // Remove empty optional fields
        ...(formData.course ? { course: formData.course } : {}),
        ...(formData.supervisor ? { supervisor: formData.supervisor } : {}),
        ...(formData.collaborators ? { collaborators: formData.collaborators } : {})
      };

      await api.post('/projects', submitData);
      showToast('Project added successfully!', 'success');
      router.push('/projects');
    } catch (error) {
      console.error('Failed to create project:', error);
      showToast(error.response?.data?.message || 'Failed to create project', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <Head>
        <title>Add Project - TruePortMe</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Add Project</h1>
            <p className="text-gray-600">Share your projects across all domains and showcase your skills</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Project Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Project Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  className="form-input mt-1"
                  placeholder="e.g., E-commerce Website, Brand Identity Design, Market Research Study"
                  value={formData.title}
                  onChange={handleChange}
                />
              </div>

              {/* Project Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  Project Category *
                </label>
                <select
                  id="category"
                  name="category"
                  required
                  className="form-input mt-1"
                  value={formData.category}
                  onChange={handleChange}
                >
                  <option value="">Select a category</option>
                  <optgroup label="Tech Projects">
                    {TECH_CATEGORIES.map(key => (
                      <option key={key} value={key}>{PROJECT_CATEGORIES[key]}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Design Projects">
                    {DESIGN_CATEGORIES.map(key => (
                      <option key={key} value={key}>{PROJECT_CATEGORIES[key]}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Business Projects">
                    {BUSINESS_CATEGORIES.map(key => (
                      <option key={key} value={key}>{PROJECT_CATEGORIES[key]}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Academic Projects">
                    {ACADEMIC_CATEGORIES.map(key => (
                      <option key={key} value={key}>{PROJECT_CATEGORIES[key]}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Creative Projects">
                    {Object.entries(PROJECT_CATEGORIES)
                      .filter(([key]) => ['CREATIVE_WRITING', 'PHOTOGRAPHY', 'VIDEO_PRODUCTION', 'MUSIC_COMPOSITION', 'ART_PROJECT'].includes(key))
                      .map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                  </optgroup>
                  <optgroup label="Other">
                    {['COMMUNITY_SERVICE', 'INTERNSHIP_PROJECT', 'FREELANCE_WORK', 'COMPETITION_ENTRY', 'OTHER'].map(key => (
                      <option key={key} value={key}>{PROJECT_CATEGORIES[key]}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Project Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Project Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  rows={4}
                  className="form-textarea mt-1"
                  placeholder="Describe your project, its objectives, and key outcomes..."
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              {/* Duration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="duration.startDate" className="block text-sm font-medium text-gray-700">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="duration.startDate"
                    name="duration.startDate"
                    className="form-input mt-1"
                    value={formData.duration.startDate}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label htmlFor="duration.endDate" className="block text-sm font-medium text-gray-700">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="duration.endDate"
                    name="duration.endDate"
                    className="form-input mt-1"
                    value={formData.duration.endDate}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Links Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Project Links</h3>
                
                {/* Tech Project Links */}
                {isTechProject() && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="links.githubUrl" className="block text-sm font-medium text-gray-700">
                        Repository URL
                      </label>
                      <input
                        type="url"
                        id="links.githubUrl"
                        name="links.githubUrl"
                        className="form-input mt-1"
                        placeholder="https://github.com/username/repository"
                        value={formData.links.githubUrl}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <label htmlFor="links.liveUrl" className="block text-sm font-medium text-gray-700">
                        Live Demo URL
                      </label>
                      <input
                        type="url"
                        id="links.liveUrl"
                        name="links.liveUrl"
                        className="form-input mt-1"
                        placeholder="https://your-project.vercel.app"
                        value={formData.links.liveUrl}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                )}

                {/* Design Project Links */}
                {isDesignProject() && (
                  <div>
                    <label htmlFor="links.portfolioUrl" className="block text-sm font-medium text-gray-700">
                      Portfolio URL
                    </label>
                    <input
                      type="url"
                      id="links.portfolioUrl"
                      name="links.portfolioUrl"
                      className="form-input mt-1"
                      placeholder="https://behance.net/gallery/123456/project or https://dribbble.com/shots/123456"
                      value={formData.links.portfolioUrl}
                      onChange={handleChange}
                    />
                  </div>
                )}

                {/* Business/Academic Project Links */}
                {(isBusinessProject() || isAcademicProject()) && (
                  <div>
                    <label htmlFor="links.documentUrl" className="block text-sm font-medium text-gray-700">
                      Document URL
                    </label>
                    <input
                      type="url"
                      id="links.documentUrl"
                      name="links.documentUrl"
                      className="form-input mt-1"
                      placeholder="https://drive.google.com/document/123 or https://dropbox.com/s/file.pdf"
                      value={formData.links.documentUrl}
                      onChange={handleChange}
                    />
                  </div>
                )}
              </div>

              {/* Academic Fields */}
              {isAcademicProject() && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="course" className="block text-sm font-medium text-gray-700">
                      Course/Subject
                    </label>
                    <input
                      type="text"
                      id="course"
                      name="course"
                      className="form-input mt-1"
                      placeholder="e.g., Business Strategy 101, Research Methods"
                      value={formData.course}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label htmlFor="supervisor" className="block text-sm font-medium text-gray-700">
                      Supervisor/Advisor
                    </label>
                    <input
                      type="text"
                      id="supervisor"
                      name="supervisor"
                      className="form-input mt-1"
                      placeholder="e.g., Prof. Smith, Dr. Johnson"
                      value={formData.supervisor}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              )}

              {/* Collaborators */}
              <div>
                <label htmlFor="collaborators" className="block text-sm font-medium text-gray-700">
                  Collaborators
                </label>
                <input
                  type="text"
                  id="collaborators"
                  name="collaborators"
                  className="form-input mt-1"
                  placeholder="Names of team members or collaborators (optional)"
                  value={formData.collaborators}
                  onChange={handleChange}
                />
              </div>

              {/* Skills Used */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skills Used *
                </label>
                <CreatableSelect
                  isMulti
                  options={getSkillOptions().map(skill => ({ label: skill, value: skill }))}
                  value={formData.skillsUsed.map(skill => ({ label: skill, value: skill }))}
                  onChange={(selected) => {
                    const skills = Array.isArray(selected) ? selected.map(s => s.value) : [];
                    setFormData(prev => ({ ...prev, skillsUsed: skills }));
                  }}
                  placeholder="Type or select skills (press Enter to add custom ones)"
                  className="react-select-container"
                  classNamePrefix="react-select"
                  formatCreateLabel={(input) => `Add "${input}"`}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Select relevant skills or add custom ones. Skills will be suggested based on your project category.
                </p>
              </div>

              {/* Key Learnings */}
              <div>
                <label htmlFor="learnings" className="block text-sm font-medium text-gray-700">
                  Key Learnings & Insights *
                </label>
                <textarea
                  id="learnings"
                  name="learnings"
                  required
                  rows={6}
                  className="form-textarea mt-1"
                  placeholder="What did you learn from this project? What challenges did you face and how did you overcome them? What insights did you gain?"
                  value={formData.learnings}
                  onChange={handleChange}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Share your genuine learning experience and key takeaways from this project.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Portfolio Guidelines</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <ul className="list-disc list-inside space-y-1">
                        <li>Projects showcase your individual work and creativity</li>
                        <li>Provide relevant links (repository, portfolio, documents) to demonstrate your work</li>
                        <li>Skills listed should genuinely reflect those used in the project</li>
                        <li>Learning insights help others understand your growth and development</li>
                        <li>Projects are displayed based on your privacy settings</li>
                        <li>No verification required - your work speaks for itself!</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="btn-secondary"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Adding...' : 'Add Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}