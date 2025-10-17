import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import ProtectedRoute from '../../../components/ProtectedRoute';
import SidebarLayout from '../../../components/SidebarLayout';
import api from '../../../utils/api';

export default function CreateEvent({ showToast }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventType: 'WORKSHOP',
    status: 'PUBLISHED',
    startDate: '',
    endDate: '',
    location: '',
    isPublic: false,
    organizer: {
      name: '',
      email: ''
    },
    tags: '',
    awards: '',
    attachments: ''
  });

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (!userData || userData.role !== 'VERIFIER') {
      window.location.href = '/dashboard';
      return;
    }
    setUser(userData);
    // Pre-fill organizer info
    setFormData(prev => ({
      ...prev,
      organizer: {
        name: userData.name || '',
        email: userData.email || ''
      }
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.startDate) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    try {
      setLoading(true);
      
      // Transform tags and awards from strings to arrays
      const eventData = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        awards: formData.awards ? formData.awards.split('\n').map(award => award.trim()).filter(Boolean) : [],
        attachments: formData.attachments ? formData.attachments.split('\n').map(url => url.trim()).filter(Boolean) : []
      };

      const response = await api.post('/events', eventData);
      showToast('Event created successfully!', 'success');
      router.push(`/verifier/events/${response.data.event._id}`);
    } catch (error) {
      console.error('Failed to create event:', error);
      showToast(error.response?.data?.message || 'Failed to create event', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Head>
        <title>Create Event - Verifier - TruePortMe</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/verifier/events"
              className="text-primary-600 hover:text-primary-800 flex items-center mb-2"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Events
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Create New Event</h1>
            <p className="mt-1 text-sm text-gray-600">Create an institutional event and manage participants</p>
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
                    className="input-primary w-full"
                    placeholder="e.g., Annual Tech Hackathon 2025"
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
                    className="input-primary w-full"
                    placeholder="Describe the event, its objectives, and key highlights..."
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
                      className="input-primary w-full"
                    >
                      <option value="COMPETITION">Competition</option>
                      <option value="WORKSHOP">Workshop</option>
                      <option value="HACKATHON">Hackathon</option>
                      <option value="SEMINAR">Seminar</option>
                      <option value="CONFERENCE">Conference</option>
                      <option value="CULTURAL">Cultural</option>
                      <option value="SPORTS">Sports</option>
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
                      disabled
                      className="input-primary w-full bg-gray-100 cursor-not-allowed"
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Published</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPublic"
                    name="isPublic"
                    checked={formData.isPublic}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 mr-2"
                  />
                  <label htmlFor="isPublic" className="text-sm text-gray-700">
                    Make this event publicly visible
                  </label>
                </div>
              </div>
            </div>

            {/* Date and Location */}
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
                      className="input-primary w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      className="input-primary w-full"
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
                    className="input-primary w-full"
                    placeholder="e.g., Main Auditorium, Virtual Event, etc."
                  />
                </div>
              </div>
            </div>

            {/* Organizer Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Organizer Information</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Organizer Name
                    </label>
                    <input
                      type="text"
                      name="organizer.name"
                      value={formData.organizer.name}
                      onChange={handleChange}
                      className="input-primary w-full"
                      placeholder="Your name"
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
                      className="input-primary w-full"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags
                  </label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    className="input-primary w-full"
                    placeholder="technology, innovation, coding (comma-separated)"
                  />
                  <p className="mt-1 text-xs text-gray-500">Separate multiple tags with commas</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Awards/Prizes
                  </label>
                  <textarea
                    name="awards"
                    value={formData.awards}
                    onChange={handleChange}
                    rows={3}
                    className="input-primary w-full"
                    placeholder="First Prize: $1000&#10;Second Prize: $500&#10;Third Prize: $250"
                  />
                  <p className="mt-1 text-xs text-gray-500">Enter each award on a new line</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Attachments (URLs)
                  </label>
                  <textarea
                    name="attachments"
                    value={formData.attachments}
                    onChange={handleChange}
                    rows={3}
                    className="input-primary w-full"
                    placeholder="https://example.com/brochure.pdf&#10;https://example.com/schedule.pdf"
                  />
                  <p className="mt-1 text-xs text-gray-500">Enter each URL on a new line</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Link href="/verifier/events" className="btn-secondary">
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
    </ProtectedRoute>
  );
}

CreateEvent.getLayout = function getLayout(page) {
  return <SidebarLayout title="Create Event">{page}</SidebarLayout>;
};
