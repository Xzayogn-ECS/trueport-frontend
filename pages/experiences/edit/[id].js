import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import ProtectedRoute from '../../../components/ProtectedRoute';
import Uploader from '../../../components/Uploader';
import api from '../../../utils/api';

// load react-select client-side only to avoid SSR/hydration issues
const CreatableSelect = dynamic(() => import('react-select/creatable'), { ssr: false });

const SKILL_OPTIONS = [
  'React','React Native','Next.js','Node.js','Express','MongoDB','Postgres','TypeScript',
  'JavaScript','Python','Django','Flask','Java','Spring Boot','C++','C#','Go','Rust',
  'HTML','CSS','Tailwind CSS','Bootstrap','Redux','MobX','GraphQL','Apollo','REST',
  'Docker','Kubernetes','AWS','GCP','Azure','Firebase','Redis','Postman','Jest','Cypress',
  'TensorFlow','PyTorch','Pandas','Numpy','SQL','NoSQL','Electron','Socket.IO','Three.js'
].map(s => ({ label: s, value: s }));

export default function EditExperience({ showToast }) {
  const router = useRouter();
  const { id } = router.query;
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    role: '',
    startDate: '',
    endDate: '',
    tags: [],
    attachments: [],
  });
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchExperience();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchExperience = async () => {
    try {
      setFetchLoading(true);
      const response = await api.get(`/experiences/${id}`);
      const experience = response.data.experience || response.data || {};

      // normalize tags to array
      const tagsArr = Array.isArray(experience.tags)
        ? experience.tags
        : (typeof experience.tags === 'string' && experience.tags.trim() !== '')
          ? experience.tags.split(',').map(t => t.trim()).filter(Boolean)
          : [];

      setFormData({
        title: experience.title || '',
        description: experience.description || '',
        role: experience.role || '',
        startDate: experience.startDate ? experience.startDate.split('T')[0] : '',
        endDate: experience.endDate ? experience.endDate.split('T')[0] : '',
        tags: tagsArr,
        attachments: Array.isArray(experience.attachments) ? experience.attachments : (experience.attachments ? [experience.attachments] : []),
      });
    } catch (error) {
      console.error('Failed to fetch experience:', error);
      showToast?.('Failed to load experience', 'error');
      router.push('/experiences');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileUpload = (urls) => {
    const attachmentUrls = Array.isArray(urls) ? urls : [urls];
    setFormData(prev => ({
      ...prev,
      attachments: [...(prev.attachments || []), ...attachmentUrls],
    }));
  };

  const removeAttachment = (index) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        // ensure tags is an array of strings for backend
        tags: Array.isArray(formData.tags)
          ? formData.tags
          : (formData.tags || '').toString().split(',').map(t => t.trim()).filter(Boolean),
      };

      await api.put(`/experiences/${id}`, payload);
      showToast?.('Experience updated successfully!', 'success');
      router.push('/experiences');
    } catch (error) {
      console.error('Failed to update experience:', error);
      showToast?.(error.response?.data?.message || 'Failed to update experience', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Head>
        <title>Edit Experience - TruePortMe</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Edit Experience</h1>
            <p className="text-gray-600">Update your professional experience details</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Experience Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  className="form-input mt-1"
                  placeholder="e.g., Software Engineer Intern at TechCorp"
                  value={formData.title}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Role/Position *
                </label>
                <input
                  type="text"
                  id="role"
                  name="role"
                  required
                  className="form-input mt-1"
                  placeholder="e.g., Software Engineer Intern"
                  value={formData.role}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    required
                    className="form-input mt-1"
                    value={formData.startDate}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    className="form-input mt-1"
                    value={formData.endDate}
                    onChange={handleChange}
                  />
                  <p className="mt-1 text-xs text-gray-500">Leave empty if currently ongoing</p>
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={5}
                  required
                  className="form-textarea mt-1"
                  placeholder="Describe your responsibilities, achievements, and key contributions..."
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
                  Tags
                </label>

                <CreatableSelect
                  isMulti
                  options={SKILL_OPTIONS}
                  // guard tags with Array.isArray
                  value={Array.isArray(formData.tags) ? formData.tags.map(t => ({ label: t, value: t })) : []}
                  onChange={(selected) => {
                    const arr = Array.isArray(selected) ? selected.map(s => s.value) : [];
                    setFormData(prev => ({ ...prev, tags: arr }));
                  }}
                  placeholder="Type or select tags (press Enter to add)"
                  className="react-select-container mt-1"
                  classNamePrefix="react-select"
                  formatCreateLabel={(input) => `Add "${input}"`}
                />
                <p className="mt-1 text-xs text-gray-500">Pick from common tags or type and press Enter to add custom ones.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attachments
                </label>
                <Uploader
                  onUpload={handleFileUpload}
                  multiple={true}
                  accept=".jpg,.jpeg,.png,.pdf"
                />

                {formData.attachments.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Files:</h4>
                    <div className="space-y-2">
                      {formData.attachments.map((url, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-700 text-sm truncate"
                          >
                            Attachment {index + 1}
                          </a>
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => router.push('/experiences')}
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
                  {loading ? 'Updating...' : 'Update Experience'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
