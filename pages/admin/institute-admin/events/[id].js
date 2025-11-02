import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import AdminProtectedRoute from '../../../../components/AdminProtectedRoute';
import AdminSidebarLayout from '../../../../components/AdminSidebarLayout';
import api from '../../../../utils/api';
import eventsAPI from '../../../../utils/eventsAPI';

export default function EventDetail({ showToast }) {
  const router = useRouter();
  const { id } = router.query;
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pushing, setPushing] = useState(false);
  const [showAddParticipants, setShowAddParticipants] = useState(false);
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [studentFilters, setStudentFilters] = useState({ classLevel: '', house: '', section: '' });
  const [currentUserRole, setCurrentUserRole] = useState(null); // 'admin', 'coordinator', 'inCharge', 'judge', or null
  // Role assignment UI state
  const [roleSearchQuery, setRoleSearchQuery] = useState({ coordinator: '', inCharge: '', judge: '' });
  const [roleSearchResults, setRoleSearchResults] = useState({ coordinator: [], inCharge: [], judge: [] });
  const [showRoleSearch, setShowRoleSearch] = useState({ coordinator: false, inCharge: false, judge: false });
  const [assigningRole, setAssigningRole] = useState(false);
  const [verifierNames, setVerifierNames] = useState({}); // Map of verifierId -> name
  // Award assignment state
  const [showAwardModal, setShowAwardModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [awardForm, setAwardForm] = useState({ rank: '', label: '' });
  const [assigningAward, setAssigningAward] = useState(false);
  const [participantAwards, setParticipantAwards] = useState({});

  useEffect(() => {
    if (id) {
      fetchEvent();
      fetchStudents(studentFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

const fetchEvent = async () => {
  try {
    setLoading(true);
    const response = await api.get(`/events/${id}`);
    const ev = response.data.event;
    setEvent(ev);

    // build verifier name map so UI shows names instead of IDs
    const nameMap = {};
    const pushEntry = (entry) => {
      if (!entry) return;
      // entry could be { userId: 'id', userName: 'Name' } or { userId: { _id, name } }
      const uid = entry.userId ? (typeof entry.userId === 'object' ? (entry.userId._id || entry.userId.id) : entry.userId) : null;
      const name = entry.userName || (entry.userId && entry.userId.name) || null;
      if (uid && name) nameMap[uid] = name; 
    };
    (ev.coordinators || []).forEach(pushEntry);
    (ev.inCharges || []).forEach(pushEntry);
    (ev.judges || []).forEach(pushEntry);

    setVerifierNames(prev => ({ ...prev, ...nameMap }));

    // Determine current user's role in this event
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const currentUserId = user._id || user.id;
      let role = null;

      if (user.role === 'admin') {
        role = 'admin'; // Institute admin has full access
      } else if (ev.coordinators?.some(c => (c.userId?._id || c.userId?.id || c.userId) === currentUserId)) {
        role = 'coordinator';
      } else if (ev.inCharges?.some(c => (c.userId?._id || c.userId?.id || c.userId) === currentUserId)) {
        role = 'inCharge';
      } else if (ev.judges?.some(c => (c.userId?._id || c.userId?.id || c.userId) === currentUserId)) {
        role = 'judge';
      }

      setCurrentUserRole(role);
    } catch (e) {
      console.error('Failed to determine user role:', e);
    }

    // Fetch rankings for participants
    try {
      const rankingsResponse = await eventsAPI.getRankings(id);
      const awardMap = {};
      (rankingsResponse.rankings || []).forEach(award => {
        awardMap[award.userId] = award;
      });
      setParticipantAwards(awardMap);
    } catch (err) {
      console.error('Failed to fetch rankings:', err);
    }
  } catch (error) {
    console.error('Failed to fetch event:', error);
    showToast('Failed to load event details', 'error');
    router.push('/admin/institute-admin/events');
  } finally {
    setLoading(false);
  }
};


  const fetchStudents = async (filters = {}) => {
    try {
      const params = { role: 'STUDENT' };
      if (filters.classLevel) params.classLevel = filters.classLevel;
      if (filters.house) params.house = filters.house;
      if (filters.section) params.section = filters.section;

      const response = await api.get('/institute-admin/users', { params });
      console.log(response.data.users);
      setStudents(response.data.users || []);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const newFilters = { ...studentFilters, [name]: value };
    setStudentFilters(newFilters);
    fetchStudents(newFilters);
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
      console.log(response);
      showToast(`Successfully created ${response.data.results.success} experiences!`, 'success');
      fetchEvent();
    } catch (error) {
      console.error('Failed to push experiences:', error);
      showToast(error.response?.data?.message || 'Failed to push experiences', 'error');
    } finally {
      setPushing(false);
    }
  };

  const searchVerifiersForRole = async (role, q) => {
    try {
      // fetch all institute verifiers when q is empty
      const params = q ? { search: q } : {};
      const resp = await api.get('/users/institute-verifiers', { params });
      console.log('Role search response for', role, ':', resp.data);
      // Backend returns { verifiers: [...] }, not { users: [...] }
      const verifiers = resp.data.verifiers || resp.data.users || [];
      console.log(`Found ${verifiers.length} verifiers for role ${role}`);
      setRoleSearchResults(prev => ({ ...prev, [role]: verifiers }));
    } catch (err) {
      console.error('Verifier search failed', err);
      setRoleSearchResults(prev => ({ ...prev, [role]: [] }));
    }
  };

  const handleAssignRole = async (role, userId, userName) => {
    if (!id) return;
    try {
      setAssigningRole(true);
      await eventsAPI.assignRole(id, role, userId);
      // Store the verifier name for display
      setVerifierNames(prev => ({ ...prev, [userId]: userName }));
      showToast(`${role} assigned`, 'success');
      setShowRoleSearch(prev => ({ ...prev, [role]: false }));
      // refresh event
      fetchEvent();
    } catch (err) {
      console.error('Failed to assign role', err);
      showToast(err.response?.data?.message || 'Failed to assign role', 'error');
    } finally {
      setAssigningRole(false);
    }
  };

  const handleUnassignRole = async (role, userId) => {
    if (!id) return;
    if (!confirm('Unassign this role?')) return;
    try {
      await eventsAPI.unassignRole(id, role, userId);
      showToast(`${role} unassigned`, 'success');
      fetchEvent();
    } catch (err) {
      console.error('Failed to unassign role', err);
      showToast(err.response?.data?.message || 'Failed to unassign role', 'error');
    }
  };

  const handleAssignPosition = async () => {
    if (!selectedParticipant || !awardForm.rank) {
      showToast('Please select participant and enter rank', 'error');
      return;
    }

    try {
      setAssigningAward(true);
      await eventsAPI.assignPosition(id, selectedParticipant, parseInt(awardForm.rank), awardForm.label);
      showToast('Award assigned successfully!', 'success');
      setShowAwardModal(false);
      setAwardForm({ rank: '', label: '' });
      setSelectedParticipant(null);
      fetchEvent();
    } catch (err) {
      console.error('Failed to assign award:', err);
      showToast(err.response?.data?.message || 'Failed to assign award', 'error');
    } finally {
      setAssigningAward(false);
    }
  };

  const handleRemovePosition = async (userId) => {
    if (!confirm('Remove this award?')) return;
    try {
      await eventsAPI.removePosition(id, userId);
      showToast('Award removed successfully!', 'success');
      fetchEvent();
    } catch (err) {
      console.error('Failed to remove award:', err);
      showToast(err.response?.data?.message || 'Failed to remove award', 'error');
    }
  };

  const openAwardModal = (userId) => {
    setSelectedParticipant(userId);
    setAwardForm({ rank: '', label: '' });
    setShowAwardModal(true);
  };

  if (loading) {
    return (
      <AdminProtectedRoute adminType="institute">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </AdminProtectedRoute>
    );
  }

  if (!event) return null;

  return (
    <AdminProtectedRoute adminType="institute">
      <Head>
        <title>{event.title} - Institute Admin - TruePortMe</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
                <p className="mt-1 text-sm text-gray-600">{event.eventType} • {new Date(event.startDate).toLocaleDateString()}</p>
              </div>
              {(currentUserRole === 'admin' || currentUserRole === 'coordinator') && (
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
              )}
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
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Select Students</h3>
                    
                    {/* Filter Section */}
                    <div className="mb-4 grid grid-cols-3 gap-3">
                      <div>
                        <label htmlFor="classLevel" className="block text-xs font-medium text-gray-700 mb-1">
                          Class/Grade
                        </label>
                        <input
                          type="text"
                          id="classLevel"
                          name="classLevel"
                          value={studentFilters.classLevel}
                          onChange={handleFilterChange}
                          placeholder="Filter by class..."
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="house" className="block text-xs font-medium text-gray-700 mb-1">
                          House
                        </label>
                        <input
                          type="text"
                          id="house"
                          name="house"
                          value={studentFilters.house}
                          onChange={handleFilterChange}
                          placeholder="Filter by house..."
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="section" className="block text-xs font-medium text-gray-700 mb-1">
                          Section
                        </label>
                        <input
                          type="text"
                          id="section"
                          name="section"
                          value={studentFilters.section}
                          onChange={handleFilterChange}
                          placeholder="Filter by section..."
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-primary-500"
                        />
                      </div>
                    </div>

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
                    {event.participants.map(participant => {
                      const award = participantAwards[participant.userId._id];
                      const canAssignAward = currentUserRole === 'admin' || currentUserRole === 'coordinator' || currentUserRole === 'judge' || currentUserRole === 'inCharge';
                      return (
                        <div key={participant._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-medium">
                              {participant.userId?.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{participant.userId?.name}</p>
                              <p className="text-sm text-gray-500">{participant.role}</p>
                              {award && (
                                <p className="text-sm text-yellow-600 font-medium">
                                  🏆 Rank #{award.rank} {award.label ? `- ${award.label}` : ''}
                                </p>
                              )}
                            </div>
                            {participant.experienceCreated && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                Experience Created
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            {canAssignAward && (
                              <>
                                <button
                                  onClick={() => openAwardModal(participant.userId._id)}
                                  className="text-blue-600 hover:text-blue-800 text-sm"
                                >
                                  {award ? 'Edit Award' : 'Assign Award'}
                                </button>
                                {award && (
                                  <button
                                    onClick={() => handleRemovePosition(participant.userId._id)}
                                    className="text-red-600 hover:text-red-800 text-sm"
                                  >
                                    Remove
                                  </button>
                                )}
                              </>
                            )}
                            <button
                              onClick={() => handleRemoveParticipant(participant.userId._id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              {/* Roles Overview */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Event Roles</h3>
                <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">Coordinators</div>
                        <button onClick={() => setShowRoleSearch(prev => ({ ...prev, coordinator: !prev.coordinator }))} className="text-xs text-primary-600">{showRoleSearch.coordinator ? 'Close' : 'Add'}</button>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 items-center">
                        {(event.coordinators || []).length === 0 ? <div className="text-xs text-gray-400">None assigned</div> : (event.coordinators || []).map(c => (
                          <div key={c.userId} className="flex items-center gap-2 px-2 py-1 bg-primary-50 text-primary-700 text-xs rounded">
                            <span>{verifierNames[c.userId] ||c.userName || c.userId}</span>
                            {currentUserRole === 'admin' && (
                              <button onClick={() => handleUnassignRole('coordinator', c.userId)} className="text-red-600 text-[10px]">Unassign</button>
                            )}
                          </div>
                        ))}
                      </div>

                      {showRoleSearch.coordinator && (
                        <div className="mt-2">
                          <input value={roleSearchQuery.coordinator} onChange={(e) => { setRoleSearchQuery(prev => ({ ...prev, coordinator: e.target.value })); searchVerifiersForRole('coordinator', e.target.value); }} placeholder="Search verifiers..." className="input w-full mb-2" />
                          <div className="max-h-40 overflow-y-auto space-y-1">
                            {(roleSearchResults.coordinator || []).map(v => (
                              <div key={v.id || v._id} className="flex items-center justify-between p-2 border rounded">
                                <div>
                                  <div className="font-medium text-sm">{v.name}</div>
                                  <div className="text-xs text-gray-500">{v.email}</div>
                                </div>
                                <button onClick={() => handleAssignRole('coordinator', v.id || v._id, v.name)} disabled={assigningRole} className="btn-primary btn-sm">Assign</button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">In-Charges</div>
                        <button onClick={() => setShowRoleSearch(prev => ({ ...prev, inCharge: !prev.inCharge }))} className="text-xs text-primary-600">{showRoleSearch.inCharge ? 'Close' : 'Add'}</button>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 items-center">
                        {(event.inCharges || []).length === 0 ? <div className="text-xs text-gray-400">None assigned</div> : (event.inCharges || []).map(c => (
                          <div key={c.userId} className="flex items-center gap-2 px-2 py-1 bg-amber-50 text-amber-700 text-xs rounded">
                            <span>{verifierNames[c.userId] || c.userName || c.userId}</span>
                            {(currentUserRole === 'admin' || currentUserRole === 'coordinator') && (
                              <button onClick={() => handleUnassignRole('inCharge', c.userId)} className="text-red-600 text-[10px]">Unassign</button>
                            )}
                          </div>
                        ))}
                      </div>

                      {showRoleSearch.inCharge && (
                        <div className="mt-2">
                          <input value={roleSearchQuery.inCharge} onChange={(e) => { setRoleSearchQuery(prev => ({ ...prev, inCharge: e.target.value })); searchVerifiersForRole('inCharge', e.target.value); }} placeholder="Search verifiers..." className="input w-full mb-2" />
                          <div className="max-h-40 overflow-y-auto space-y-1">
                            {(roleSearchResults.inCharge || []).map(v => (
                              <div key={v.id || v._id} className="flex items-center justify-between p-2 border rounded">
                                <div>
                                  <div className="font-medium text-sm">{v.name}</div>
                                  <div className="text-xs text-gray-500">{v.email}</div>
                                </div>
                                <button onClick={() => handleAssignRole('inCharge', v.id || v._id, v.name)} disabled={assigningRole} className="btn-primary btn-sm">Assign</button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">Judges</div>
                        <button onClick={() => setShowRoleSearch(prev => ({ ...prev, judge: !prev.judge }))} className="text-xs text-primary-600">{showRoleSearch.judge ? 'Close' : 'Add'}</button>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 items-center">
                        {(event.judges || []).length === 0 ? <div className="text-xs text-gray-400">None assigned</div> : (event.judges || []).map(c => (
                          <div key={c.userId} className="flex items-center gap-2 px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded">
                            <span>{verifierNames[c.userId] || c.userName || c.userId}</span>
                            {(currentUserRole === 'admin' || currentUserRole === 'coordinator') && (
                              <button onClick={() => handleUnassignRole('judge', c.userId)} className="text-red-600 text-[10px]">Unassign</button>
                            )}
                          </div>
                        ))}
                      </div>

                      {showRoleSearch.judge && (
                        <div className="mt-2">
                          <input value={roleSearchQuery.judge} onChange={(e) => { setRoleSearchQuery(prev => ({ ...prev, judge: e.target.value })); searchVerifiersForRole('judge', e.target.value); }} placeholder="Search verifiers..." className="input w-full mb-2" />
                          <div className="max-h-40 overflow-y-auto space-y-1">
                            {(roleSearchResults.judge || []).map(v => (
                              <div key={v.id || v._id} className="flex items-center justify-between p-2 border rounded">
                                <div>
                                  <div className="font-medium text-sm">{v.name}</div>
                                  <div className="text-xs text-gray-500">{v.email}</div>
                                </div>
                                <button onClick={() => handleAssignRole('judge', v.id || v._id, v.name)} disabled={assigningRole} className="btn-primary btn-sm">Assign</button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
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

        {/* Award Modal */}
        {showAwardModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Assign Award</h3>
                <button
                  onClick={() => setShowAwardModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rank</label>
                  <input
                    type="number"
                    value={awardForm.rank}
                    onChange={(e) => setAwardForm(prev => ({ ...prev, rank: e.target.value }))}
                    placeholder="e.g., 1 for First Place"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Label (Optional)</label>
                  <input
                    type="text"
                    value={awardForm.label}
                    onChange={(e) => setAwardForm(prev => ({ ...prev, label: e.target.value }))}
                    placeholder="e.g., First Place, Best Performance"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={handleAssignPosition}
                    disabled={assigningAward}
                    className="flex-1 btn-primary"
                  >
                    {assigningAward ? 'Assigning...' : 'Assign Award'}
                  </button>
                  <button
                    onClick={() => setShowAwardModal(false)}
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminProtectedRoute>
  );
}

EventDetail.getLayout = function getLayout(page) {
  return <AdminSidebarLayout>{page}</AdminSidebarLayout>;
};

