import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import ProtectedRoute from '../../components/ProtectedRoute';
import Uploader from '../../components/Uploader';
import api from '../../utils/api';
import CreatableSelect from 'react-select/creatable';
const SKILL_OPTIONS = [
  'React','React Native','Next.js','Node.js','Express','MongoDB','Postgres','TypeScript',
  'JavaScript','Python','Django','Flask','Java','Spring Boot','C++','C#','Go','Rust',
  'HTML','CSS','Tailwind CSS','Bootstrap','Redux','MobX','GraphQL','Apollo','REST',
  'Docker','Kubernetes','AWS','GCP','Azure','Firebase','Redis','Postman','Jest','Cypress',
  'TensorFlow','PyTorch','Pandas','Numpy','SQL','NoSQL','Electron','Socket.IO','Three.js'
].map(s => ({ label: s, value: s }));

export default function NewExperience({ showToast }) {
  const router = useRouter();
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleTagsChange = (e) => {
    setFormData({
      ...formData,  
    });
  };

  const handleFileUpload = (urls) => {
    const attachmentUrls = Array.isArray(urls) ? urls : [urls];
    setFormData({
      ...formData,
      attachments: [...formData.attachments, ...attachmentUrls],
    });
  };

  const removeAttachment = (index) => {
    const newAttachments = formData.attachments.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      attachments: newAttachments,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
      };

      await api.post('/experiences', payload);
      showToast('Experience added successfully!', 'success');
      router.push('/experiences');
    } catch (error) {
      console.error('Failed to create experience:', error);
      showToast(error.response?.data?.message || 'Failed to create experience', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <Head>
        <title>Add New Experience - TruePortMe</title>
      </Head>

      <div className="min-h-screen bg-gray-50 pb-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Add New Experience</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Share details about your professional experience</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div>
                <label htmlFor="title" className="block text-xs sm:text-sm font-medium text-gray-700">
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
    value={formData.tags.map(t => ({ label: t, value: t }))}
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
                  {loading ? 'Creating...' : 'Create Experience'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}