import { useState, useEffect } from 'react';
import api from '../utils/api';

export default function CustomUrlManager({ showToast }) {
  const [customUrls, setCustomUrls] = useState([]);
  const [isVisible, setIsVisible] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUrl, setEditingUrl] = useState(null);
  const [formData, setFormData] = useState({
    label: '',
    url: '',
    isVisible: true
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCustomUrls();
  }, []);

  const fetchCustomUrls = async () => {
    try {
      const response = await api.get('/users/me/custom-urls');
      setCustomUrls(response.data.customUrls || []);
      setIsVisible(response.data.isVisible);
    } catch (error) {
      console.error('Failed to fetch custom URLs:', error);
      showToast('Failed to load custom URLs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingUrl) {
        // Update existing URL
        await api.put(`/users/me/custom-urls/${editingUrl._id}`, formData);
        showToast('Custom URL updated successfully', 'success');
      } else {
        // Add new URL
        await api.post('/users/me/custom-urls', formData);
        showToast('Custom URL added successfully', 'success');
      }
      
      await fetchCustomUrls();
      closeModal();
    } catch (error) {
      console.error('Failed to save custom URL:', error);
      showToast(error.response?.data?.message || 'Failed to save custom URL', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (urlId) => {
    if (!confirm('Are you sure you want to delete this custom URL?')) return;

    try {
      await api.delete(`/users/me/custom-urls/${urlId}`);
      showToast('Custom URL deleted successfully', 'success');
      await fetchCustomUrls();
    } catch (error) {
      console.error('Failed to delete custom URL:', error);
      showToast('Failed to delete custom URL', 'error');
    }
  };

  const toggleSectionVisibility = async () => {
    try {
      await api.put('/users/me/custom-urls/visibility', { isVisible: !isVisible });
      setIsVisible(!isVisible);
      showToast('Visibility updated successfully', 'success');
    } catch (error) {
      console.error('Failed to update visibility:', error);
      showToast('Failed to update visibility', 'error');
    }
  };

  const openAddModal = () => {
    setFormData({
      label: '',
      url: '',
      isVisible: true
    });
    setEditingUrl(null);
    setShowAddModal(true);
  };

  const openEditModal = (url) => {
    setFormData({
      label: url.label,
      url: url.url,
      isVisible: url.isVisible
    });
    setEditingUrl(url);
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingUrl(null);
    setFormData({
      label: '',
      url: '',
      isVisible: true
    });
  };

  if (loading) {
    return <div className="text-center py-4">Loading custom URLs...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with visibility toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Custom URLs</h3>
          <p className="text-sm text-gray-600">Add custom links to your portfolio (Behance, Medium, LeetCode, etc.)</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={isVisible}
              onChange={toggleSectionVisibility}
              className="form-checkbox h-4 w-4 text-primary-600 rounded"
            />
            Visible in portfolio
          </label>
          <button
            type="button"
            onClick={openAddModal}
            className="btn-primary text-sm"
          >
            <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add URL
          </button>
        </div>
      </div>

      {/* Custom URLs List */}
      {customUrls.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <p className="mt-2 text-sm text-gray-600">No custom URLs added yet</p>
          <button
            type="button"
            onClick={openAddModal}
            className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Add your first custom URL
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {customUrls.map((url) => (
            <div
              key={url._id}
              className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900">{url.label}</h4>
                    {!url.isVisible && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        Hidden
                      </span>
                    )}
                  </div>
                  <a
                    href={url.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary-600 hover:text-primary-700 truncate block"
                  >
                    {url.url}
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  type="button"
                  onClick={() => openEditModal(url)}
                  className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded transition-colors"
                  title="Edit"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(url._id)}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Delete"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingUrl ? 'Edit Custom URL' : 'Add Custom URL'}
                </h3>
                <button
                  type="button"
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="label" className="block text-sm font-medium text-gray-700 mb-1">
                    Label *
                  </label>
                  <input
                    type="text"
                    id="label"
                    required
                    maxLength={50}
                    className="form-input"
                    placeholder="e.g., Behance, Medium, LeetCode"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  />
                  <p className="mt-1 text-xs text-gray-500">Max 50 characters</p>
                </div>

                <div>
                  <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
                    URL *
                  </label>
                  <input
                    type="url"
                    id="url"
                    required
                    className="form-input"
                    placeholder="https://behance.net/yourprofile"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  />
                  <p className="mt-1 text-xs text-gray-500">Must start with http:// or https://</p>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isVisible"
                    checked={formData.isVisible}
                    onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
                    className="form-checkbox h-4 w-4 text-primary-600 rounded"
                  />
                  <label htmlFor="isVisible" className="ml-2 text-sm text-gray-700">
                    Visible in portfolio
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="btn-secondary"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : editingUrl ? 'Update' : 'Add'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
