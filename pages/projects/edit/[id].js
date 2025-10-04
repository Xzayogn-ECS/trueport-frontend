import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import ProtectedRoute from '../../../components/ProtectedRoute';
import api from '../../../utils/api';

import CreatableSelect from 'react-select/creatable';
const SKILL_OPTIONS = [
  'React','React Native','Next.js','Node.js','Express','MongoDB','Postgres','TypeScript',
  'JavaScript','Python','Django','Flask','Java','Spring Boot','C++','C#','Go','Rust',
  'HTML','CSS','Tailwind CSS','Bootstrap','Redux','MobX','GraphQL','Apollo','REST',
  'Docker','Kubernetes','AWS','GCP','Azure','Firebase','Redis','Postman','Jest','Cypress',
  'TensorFlow','PyTorch','Pandas','Numpy','SQL','NoSQL','Electron','Socket.IO','Three.js'
].map(s => ({ label: s, value: s }));

export default function EditProject({ showToast }) {
  const router = useRouter();
  const { id } = router.query;
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    repositoryUrl: '',
    liveUrl: '',
    technologies: [],
    learnings: '',
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [techInput, setTechInput] = useState('');

  useEffect(() => {
    if (id) {
      fetchProject();
    }
  }, [id]);

  const fetchProject = async () => {
    try {
      const response = await api.get(`/projects/${id}`);
   
      const project = response.data.project || response.data.githubProject;
      setFormData({
        name: project.projectName,
        description: project.description,
        repositoryUrl: project.repositoryUrl,
        liveUrl: project.liveUrl || '',
        technologies: project.technologies || [],
        learnings: project.learnings,
      });
    } catch (error) {
      console.error('Failed to fetch project:', error);
      showToast('Failed to load project details', 'error');
      router.push('/projects');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const addTechnology = (e) => {
    e.preventDefault();
    if (techInput.trim() && !formData.technologies.includes(techInput.trim())) {
      setFormData({
        ...formData,
        technologies: [...formData.technologies, techInput.trim()],
      });
      setTechInput('');
    }
  };

  const removeTechnology = (tech) => {
    setFormData({
      ...formData,
      technologies: formData.technologies.filter(t => t !== tech),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.put(`/projects/${id}`, formData);
      showToast('Project updated successfully!', 'success');
      router.push('/projects');
    } catch (error) {
      console.error('Failed to update project:', error);
      showToast(error.response?.data?.message || 'Failed to update project', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Loading project details...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Head>
        <title>Edit Project - TruePortMe</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Edit Project</h1>
            <p className="text-gray-600">Update your project details and learnings</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Project Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="form-input mt-1"
                  placeholder="e.g., E-commerce Website, Todo App"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

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
                  placeholder="Describe what your project does, its main features, and purpose..."
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="repositoryUrl" className="block text-sm font-medium text-gray-700">
                    Repository URL
                  </label>
                  <input
                    type="url"
                    id="repositoryUrl"
                    name="repositoryUrl"
                    className="form-input mt-1"
                    placeholder="https://github.com/username/repository (optional for non-tech projects)"
                    value={formData.repositoryUrl}
                    onChange={handleChange}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Optional: Add repository link if applicable
                  </p>
                </div>

                <div>
                  <label htmlFor="liveUrl" className="block text-sm font-medium text-gray-700">
                    Live Demo URL
                  </label>
                  <input
                    type="url"
                    id="liveUrl"
                    name="liveUrl"
                    className="form-input mt-1"
                    placeholder="https://your-project.vercel.app"
                    value={formData.liveUrl}
                    onChange={handleChange}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Optional: Link to deployed version
                  </p>
                </div>
              </div>

              <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">Technologies Used</label>

  <CreatableSelect
    isMulti
    options={SKILL_OPTIONS}
    // current value as array of {label,value}
    value={formData.technologies.map(t => ({ label: t, value: t }))}
    onChange={(selected) => {
      // selected can be null
      const arr = Array.isArray(selected) ? selected.map(s => s.value) : [];
      setFormData(prev => ({ ...prev, technologies: arr }));
    }}
    placeholder="Type or select technologies (press Enter to add)"
    className="react-select-container"
    classNamePrefix="react-select"
    formatCreateLabel={(input) => `Add "${input}"`}
  />

  <p className="mt-1 text-sm text-gray-500">Pick from common techs or type and press Enter to add custom ones.</p>
</div>

              <div>
                <label htmlFor="learnings" className="block text-sm font-medium text-gray-700">
                  Key Learnings *
                </label>
                <textarea
                  id="learnings"
                  name="learnings"
                  required
                  rows={6}
                  className="form-textarea mt-1"
                  placeholder="What did you learn while building this project? What challenges did you face and how did you solve them? What would you do differently next time?"
                  value={formData.learnings}
                  onChange={handleChange}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Share your genuine learning experience and what you gained from this project
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex">
                  <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Project Guidelines</h3>
                    <div className="mt-2 text-sm text-green-700">
                      <ul className="list-disc list-inside space-y-1">
                        <li>Share your authentic project experience</li>
                        <li>Include meaningful repository links if available</li>
                        <li>List technologies that were actually used</li>
                        <li>Describe what you learned and challenges faced</li>
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
                  {loading ? 'Updating...' : 'Update Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}