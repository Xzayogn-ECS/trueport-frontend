import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import AdminProtectedRoute from '../../../../components/AdminProtectedRoute';
import AdminSidebarLayout from '../../../../components/AdminSidebarLayout';
import api from '../../../../utils/api';

export default function CreateEvent({ showToast }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventType: 'COMPETITION',
    organizer: { name: '', email: '' },
    startDate: '',
    endDate: '',
    location: '',
    tags: '',
    attachments: '',
    awards: '',
    status: 'DRAFT',
    isPublic: true
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
        attachments: formData.attachments ? formData.attachments.split('\n').map(a => a.trim()).filter(Boolean) : [],
        awards: formData.awards ? formData.awards.split('\n').map(a => a.trim()).filter(Boolean) : []
      };

      const response = await api.post('/events', payload);
      showToast('Event created successfully!', 'success');
      router.push(`/admin/institute-admin/events/${response.data.event._id}`);
    } catch (error) {
      console.error('Failed to create event:', error);
      showToast(error.response?.data?.message || 'Failed to create event', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  return (
    <AdminProtectedRoute adminType="institute">
      <Head>
        <title>Create Event - Institute Admin - TruePortMe</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/admin/institute-admin/events"
              className="text-primary-600 hover:text-primary-800 flex items-center mb-2"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Events
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Create New Event</h1>
            <p className="mt-1 text-sm text-gray-600">
              Fill in the details below to create a new institutional event
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="input"
                    placeholder="e.g., Annual Tech Symposium 2025"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="input"
                    placeholder="Describe the event, its purpose, and what participants will gain..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Event Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="eventType"
                      value={formData.eventType}
                      onChange={handleChange}
                      required
                      className="input"
                    >
                      <option value="COMPETITION">Competition</option>
                      <option value="WORKSHOP">Workshop</option>
                      <option value="HACKATHON">Hackathon</option>
                      <option value="SEMINAR">Seminar</option>
                      <option value="CONFERENCE">Conference</option>
                      <option value="CERTIFICATION">Certification</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      required
                      className="input"
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Published</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isPublic"
                      checked={formData.isPublic}
                      onChange={handleChange}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Make this event public to all students</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Date & Location */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Date & Location</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      required
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date (Optional)
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      className="input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="input"
                    placeholder="e.g., Auditorium A, Campus"
                  />
                </div>
              </div>
            </div>

            {/* Organizer Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Organizer Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organizer Name
                  </label>
                  <input
                    type="text"
                    name="organizer.name"
                    value={formData.organizer.name}
                    onChange={handleChange}
                    className="input"
                    placeholder="e.g., Computer Science Department"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organizer Email
                  </label>
                  <input
                    type="email"
                    name="organizer.email"
                    value={formData.organizer.email}
                    onChange={handleChange}
                    className="input"
                    placeholder="e.g., cs@institute.edu"
                  />
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    className="input"
                    placeholder="e.g., Technology, Innovation, Coding"
                  />
                  <p className="mt-1 text-xs text-gray-500">Separate tags with commas</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Awards/Prizes (one per line)
                  </label>
                  <textarea
                    name="awards"
                    value={formData.awards}
                    onChange={handleChange}
                    rows={3}
                    className="input"
                    placeholder="e.g., First Prize: $1000&#10;Second Prize: $500&#10;Best Innovation Award"
                  />
                  <p className="mt-1 text-xs text-gray-500">Enter each award on a new line</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Attachments/Links (one per line)
                  </label>
                  <textarea
                    name="attachments"
                    value={formData.attachments}
                    onChange={handleChange}
                    rows={3}
                    className="input"
                    placeholder="https://example.com/brochure.pdf&#10;https://example.com/poster.jpg"
                  />
                  <p className="mt-1 text-xs text-gray-500">Enter URLs, one per line</p>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4">
              <Link
                href="/admin/institute-admin/events"
                className="btn-secondary"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminProtectedRoute>
  );
}

CreateEvent.getLayout = function getLayout(page) {
  return <AdminSidebarLayout>{page}</AdminSidebarLayout>;
};
