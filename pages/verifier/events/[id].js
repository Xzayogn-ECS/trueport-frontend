import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import ProtectedRoute from '../../../components/ProtectedRoute';
import SidebarLayout from '../../../components/SidebarLayout';
import api from '../../../utils/api';

export default function EventDetail({ showToast }) {
  const router = useRouter();
  const { id } = router.query;
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pushing, setPushing] = useState(false);
  const [showAddParticipants, setShowAddParticipants] = useState(false);
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (!userData || userData.role !== 'VERIFIER') {
      window.location.href = '/dashboard';
      return;
    }
    setUser(userData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (id && user) {
      fetchEvent();
      fetchStudents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/events/${id}`);
      setEvent(response.data.event);
    } catch (error) {
      console.error('Failed to fetch event:', error);
      showToast('Failed to load event details', 'error');
      router.push('/verifier/events');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await api.get('/verifier/institute-students');
      console.log(response)
      setStudents(response.data.students || []);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    }
  };

  const handleAddParticipants = async () => {
    if (selectedStudents.length === 0) {
      showToast('Please select at least one student', 'error');
      return;
    }

    try {
      const participants = selectedStudents.map(studentId => ({
        userId: studentId,
        role: 'Participant'
      }));

      await api.post(`/events/${id}/participants`, { participants });
      showToast('Participants added successfully!', 'success');
      setSelectedStudents([]);
      setShowAddParticipants(false);
      fetchEvent();
    } catch (error) {
      console.error('Failed to add participants:', error);
      showToast(error.response?.data?.message || 'Failed to add participants', 'error');
    }
  };

  const handleRemoveParticipant = async (userId) => {
    if (!confirm('Are you sure you want to remove this participant?')) return;

    try {
      await api.delete(`/events/${id}/participants/${userId}`);
      showToast('Participant removed successfully', 'success');
      fetchEvent();
    } catch (error) {
      console.error('Failed to remove participant:', error);
      showToast('Failed to remove participant', 'error');
    }
  };

  const handlePushExperiences = async () => {
    if (!confirm(`Are you sure you want to push verified experiences to all ${event.participants.length} participants? This will create experience entries in their portfolios.`)) {
      return;
    }

    try {
      setPushing(true);
      const response = await api.post(`/events/${id}/push-experiences`);
      showToast(`Successfully created ${response.data.results.success} experiences!`, 'success');
      fetchEvent();
    } catch (error) {
      console.error('Failed to push experiences:', error);
      showToast(error.response?.data?.message || 'Failed to push experiences', 'error');
    } finally {
      setPushing(false);
    }
  };

  if (!user || loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!event) return null;

  return (
    <ProtectedRoute>
      <Head>
        <title>{event.title} - Verifier - TruePortMe</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
                <p className="mt-1 text-sm text-gray-600">{event.eventType} • {new Date(event.startDate).toLocaleDateString()}</p>
              </div>
              <button
                onClick={handlePushExperiences}
                disabled={pushing || event.participants.length === 0}
                className="btn-success flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {pushing ? 'Pushing...' : 'Push Experiences to All'}
              </button>
            </div>
          </div>

          {/* Event Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
              </div>

              {/* Participants */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Participants ({event.participants.length})
                  </h2>
                  <button
                    onClick={() => setShowAddParticipants(!showAddParticipants)}
                    className="btn-primary text-sm"
                  >
                    Add Participants
                  </button>
                </div>

                {showAddParticipants && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Select Students</h3>
                    <div className="max-h-60 overflow-y-auto space-y-2 mb-3">
                      {students.map(student => (
                        <label key={student._id} className="flex items-center p-2 hover:bg-gray-100 rounded">
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(student._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedStudents([...selectedStudents, student._id]);
                              } else {
                                setSelectedStudents(selectedStudents.filter(id => id !== student._id));
                              }
                            }}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 mr-2"
                          />
                          <span className="text-sm">{student.name} ({student.email})</span>
                        </label>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleAddParticipants} className="btn-primary text-sm">
                        Add Selected ({selectedStudents.length})
                      </button>
                      <button onClick={() => setShowAddParticipants(false)} className="btn-secondary text-sm">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {event.participants.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No participants added yet</p>
                ) : (
                  <div className="space-y-3">
                    {event.participants.map(participant => (
                      <div key={participant._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-medium">
                            {participant.userId?.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{participant.userId?.name}</p>
                            <p className="text-sm text-gray-500">{participant.role}</p>
                          </div>
                          {participant.experienceCreated && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              Experience Created
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveParticipant(participant.userId._id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Info Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Event Information</h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Status</label>
                    <p className="mt-1 text-sm text-gray-900">{event.status}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Location</label>
                    <p className="mt-1 text-sm text-gray-900">{event.location || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Start Date</label>
                    <p className="mt-1 text-sm text-gray-900">{new Date(event.startDate).toLocaleDateString()}</p>
                  </div>
                  {event.endDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">End Date</label>
                      <p className="mt-1 text-sm text-gray-900">{new Date(event.endDate).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              {event.tags && event.tags.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Tags</h2>
                  <div className="flex flex-wrap gap-2">
                    {event.tags.map((tag, index) => (
                      <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Awards */}
              {event.awards && event.awards.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Awards</h2>
                  <ul className="space-y-2">
                    {event.awards.map((award, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start">
                        <svg className="w-5 h-5 mr-2 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {award}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Statistics */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Statistics</h2>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Participants</span>
                    <span className="text-sm font-medium text-gray-900">{event.participants.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Experiences Pushed</span>
                    <span className="text-sm font-medium text-gray-900">{event.experiencesPushedCount || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

EventDetail.getLayout = function getLayout(page) {
  return <SidebarLayout title="Event Details">{page}</SidebarLayout>;
};
