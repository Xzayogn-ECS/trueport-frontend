import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import AdminProtectedRoute from '../../../components/AdminProtectedRoute';
import AdminSidebarLayout from '../../../components/AdminSidebarLayout';
import { instituteAdminAPI } from '../../../utils/adminAPI';

function InstituteAdminStudents({ showToast }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [toast, setToast] = useState(null);

  // Profile requests state
  const [profileRequests, setProfileRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestsCurrentPage, setRequestsCurrentPage] = useState(1);
  const [requestsTotalPages, setRequestsTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState('students'); // students or requests

  // Edit modal state
  const [editingStudent, setEditingStudent] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editData, setEditData] = useState({
    dob: '',
    classLevel: '',
    section: '',
    house: '',
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  // Request decision modal state
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState(null); // APPROVE or REJECT
  const [decisionComment, setDecisionComment] = useState('');
  const [processingRequestId, setProcessingRequestId] = useState(null);

  useEffect(() => {
    fetchStudents();
    fetchProfileRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, search, currentPage, requestsCurrentPage]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 12,
      };
      if (search) {
        params.search = search;
      }

      const response = await instituteAdminAPI.getUsers(params);
      const allUsers = response.users || [];
      // Filter to only STUDENT role
      const filteredStudents = allUsers.filter(u => u.role === 'STUDENT');
      setStudents(filteredStudents);
      setTotalPages(response.pagination?.pages || 1);
    } catch (error) {
      console.error('Failed to fetch students:', error);
      const errorMsg = error?.response?.data?.message || 'Failed to load students';
      showToast?.(errorMsg, 'error');
      setToast({ type: 'error', message: errorMsg });
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchStudents();
  };

  const handleOpenEditModal = (student) => {
    setEditingStudent(student);
    setEditModalOpen(true);
    setEditLoading(true);
    try {
      (async () => {
        try {
          const res = await instituteAdminAPI.getStudentProfile(student._id);
          const profile = res.profile || res.data || res;
          setEditData({
            dob: profile?.dob ? profile.dob.split('T')[0] : (student.dob ? student.dob.split('T')[0] : ''),
            classLevel: profile?.classLevel ?? student.classLevel ?? '',
            section: profile?.section ?? student.section ?? '',
            house: profile?.house ?? student.house ?? '',
          });
        } catch (err) {
          console.error('Failed to fetch student profile:', err);
          const toastMsg = 'Failed to load student profile for editing';
          showToast?.(toastMsg, 'error');
          setToast({ type: 'error', message: toastMsg });
          setEditData({
            dob: student.dob ? student.dob.split('T')[0] : '',
            classLevel: student.classLevel || '',
            section: student.section || '',
            house: student.house || '',
          });
        } finally {
          setEditLoading(false);
        }
      })();
    } catch (e) {
      setEditLoading(false);
    }
  };

  const handleEditFieldChange = (field, value) => {
    setEditData({
      ...editData,
      [field]: value,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingStudent) return;

    try {
      setSavingEdit(true);
      const payload = {};
      if (editData.dob) payload.dob = editData.dob;
      if (editData.classLevel) payload.classLevel = editData.classLevel;
      if (editData.section) payload.section = editData.section;
      if (editData.house) payload.house = editData.house;

      await instituteAdminAPI.updateStudentProfile(editingStudent._id, payload);

      const successMsg = `${editingStudent.name}'s profile updated successfully`;
      showToast?.(successMsg, 'success');
      setToast({
        type: 'success',
        message: successMsg,
      });

      setEditModalOpen(false);
      setEditingStudent(null);
      setEditData({ dob: '', classLevel: '', section: '', house: '' });
      fetchStudents();
    } catch (error) {
      console.error('Failed to update student profile:', error);
      const errorMsg = error?.response?.data?.message || 'Failed to update profile';
      showToast?.(errorMsg, 'error');
      setToast({
        type: 'error',
        message: errorMsg,
      });
    } finally {
      setSavingEdit(false);
    }
  };

  // Profile Requests Functions
  const fetchProfileRequests = async () => {
    try {
      setRequestsLoading(true);
      const params = {
        page: requestsCurrentPage,
        limit: 10,
        status: 'PENDING',
      };

      const response = await instituteAdminAPI.listProfileUpdateRequests(params);
      setProfileRequests(response.requests || []);
      setRequestsTotalPages(response.pagination?.pages || 1);
    } catch (error) {
      console.error('Failed to fetch profile requests:', error);
      const errorMsg = error?.response?.data?.message || 'Failed to load profile requests';
      showToast?.(errorMsg, 'error');
      setToast({
        type: 'error',
        message: errorMsg,
      });
      setProfileRequests([]);
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleOpenDecisionModal = (request, action) => {
    setSelectedRequest(request);
    setActionType(action);
    setDecisionComment('');
    setActionModalOpen(true);
  };

  const handleDecisionSubmit = async () => {
    if (!selectedRequest || !actionType) return;

    try {
      setProcessingRequestId(selectedRequest._id);
      await instituteAdminAPI.decideProfileUpdateRequest(
        selectedRequest._id,
        actionType,
        decisionComment
      );

      const action = actionType === 'APPROVE' ? 'approved' : 'rejected';
      const successMsg = `Profile update request ${action}${decisionComment ? ' with comment' : ''}`;
      showToast?.(successMsg, 'success');
      setToast({
        type: 'success',
        message: successMsg,
      });

      setActionModalOpen(false);
      setSelectedRequest(null);
      setActionType(null);
      setDecisionComment('');
      fetchProfileRequests();
    } catch (error) {
      console.error('Failed to process request:', error);
      const errorMsg = error?.response?.data?.message || 'Failed to process request';
      showToast?.(errorMsg, 'error');
      setToast({
        type: 'error',
        message: errorMsg,
      });
    } finally {
      setProcessingRequestId(null);
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AdminProtectedRoute adminType="institute">
      <Head>
        <title>Students - Institute Admin</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Toast */}
          {toast && (
            <div
              className={`mb-4 p-4 rounded-lg ${
                toast.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {toast.message}
            </div>
          )}

          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Students</h1>
                <p className="text-gray-600">Manage and view student profiles</p>
              </div>
              <Link href="/admin/institute-admin/dashboard" className="btn-secondary">
                Back to Dashboard
              </Link>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setActiveTab('students');
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-md font-medium text-sm ${
                  activeTab === 'students'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Students
              </button>
              <button
                onClick={() => {
                  setActiveTab('requests');
                  setRequestsCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-md font-medium text-sm ${
                  activeTab === 'requests'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Profile Requests
                {profileRequests.length > 0 && (
                  <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-yellow-200 text-yellow-800">
                    {profileRequests.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Search - Only shown on Students tab */}
          {activeTab === 'students' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
              <form onSubmit={handleSearch} className="flex space-x-4">
                <div className="flex-1">
                  <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                    Search Students
                  </label>
                  <input
                    type="text"
                    id="search"
                    className="form-input"
                    placeholder="Search by name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <button type="submit" className="btn-primary">
                    Search
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Students Tab Content */}
          {activeTab === 'students' && (
            <>
              {/* Students Grid */}
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                </div>
              ) : students.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {students.map((student) => (
                      <div
                        key={student._id}
                        className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <div className="p-6">
                          <div className="flex items-center mb-4">
                            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                              <span className="text-primary-600 font-semibold text-lg">
                                {student.name?.charAt(0)?.toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <h3 className="text-lg font-semibold text-gray-900">{student.name}</h3>
                              <p className="text-sm text-gray-600">{student.email}</p>
                            </div>
                          </div>

                          {/* Student Details */}
                          <div className="mb-4 p-4 bg-gray-50 rounded-md text-sm space-y-2">
                            {student.dob && (
                              <div>
                                <span className="text-gray-600">DOB:</span>
                                <span className="font-medium ml-2">
                                  {new Date(student.dob).toLocaleDateString('en-IN')}
                                </span>
                              </div>
                            )}
                            {student.classLevel && (
                              <div>
                                <span className="text-gray-600">Class:</span>
                                <span className="font-medium ml-2">{student.classLevel}</span>
                              </div>
                            )}
                            {student.section && (
                              <div>
                                <span className="text-gray-600">Section:</span>
                                <span className="font-medium ml-2">{student.section}</span>
                              </div>
                            )}
                            {student.house && (
                              <div>
                                <span className="text-gray-600">House:</span>
                                <span className="font-medium ml-2">{student.house}</span>
                              </div>
                            )}
                            {!student.dob && !student.classLevel && !student.section && !student.house && (
                              <div className="text-gray-500 italic">No profile details yet</div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex space-x-3">
                            <button
                              onClick={() => handleOpenEditModal(student)}
                              className="flex-1 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md transition-colors text-sm"
                            >
                          Edit Profile
                        </button>
                        <Link
                          href={`/portfolio/${student._id}`}
                          target="_blank"
                          className="flex-1 px-3 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-md transition-colors text-sm text-center"
                        >
                          View Portfolio
                        </Link>
                      </div>

                      {/* Join Date */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                          Joined {new Date(student.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center">
                  <nav className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-2 text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {search ? 'No students match your search criteria.' : 'No students from your institution yet.'}
              </p>
            </div>
          )}
            </>
          )}

          {/* Profile Requests Tab Content */}
          {activeTab === 'requests' && (
            <>
              {requestsLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                </div>
              ) : profileRequests.length > 0 ? (
                <>
                  <div className="space-y-4 mb-8">
                    {profileRequests.map((request) => (
                      <div
                        key={request._id}
                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                      >
                        {/* Request Header */}
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {request.userId?.name || 'Unknown Student'}
                            </h3>
                            <p className="text-sm text-gray-600">{request.userId?.email}</p>
                          </div>
                          <div className="text-right">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
                                request.status
                              )}`}
                            >
                              {request.status}
                            </span>
                            <p className="text-xs text-gray-500 mt-2">
                              {formatDate(request.createdAt)}
                            </p>
                          </div>
                        </div>

                        {/* Requested Changes */}
                        <div className="mb-4 p-4 bg-gray-50 rounded-md">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Requested Changes:</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {request.changes?.dob && (
                              <div>
                                <p className="text-xs text-gray-500">Date of Birth</p>
                                <p className="text-sm font-medium text-gray-900">
                                  {new Date(request.changes.dob).toLocaleDateString('en-IN')}
                                </p>
                              </div>
                            )}
                            {request.changes?.classLevel && (
                              <div>
                                <p className="text-xs text-gray-500">Class/Grade</p>
                                <p className="text-sm font-medium text-gray-900">{request.changes.classLevel}</p>
                              </div>
                            )}
                            {request.changes?.section && (
                              <div>
                                <p className="text-xs text-gray-500">Section</p>
                                <p className="text-sm font-medium text-gray-900">{request.changes.section}</p>
                              </div>
                            )}
                            {request.changes?.house && (
                              <div>
                                <p className="text-xs text-gray-500">House</p>
                                <p className="text-sm font-medium text-gray-900">{request.changes.house}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Decision Info (if already processed) */}
                        {request.status !== 'PENDING' && (
                          <div className="mb-4 p-4 bg-blue-50 rounded-md border border-blue-200">
                            <p className="text-sm text-blue-900">
                              <span className="font-medium">Decision:</span>{' '}
                              {request.status === 'APPROVED' ? 'Approved' : 'Rejected'} on{' '}
                              {formatDate(request.decidedAt)}
                            </p>
                            {request.decisionComment && (
                              <p className="text-sm text-blue-800 mt-1">
                                <span className="font-medium">Comment:</span> {request.decisionComment}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Actions (only for PENDING requests) */}
                        {request.status === 'PENDING' && (
                          <div className="flex space-x-3">
                            <button
                              onClick={() => handleOpenDecisionModal(request, 'APPROVE')}
                              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleOpenDecisionModal(request, 'REJECT')}
                              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {requestsTotalPages > 1 && (
                    <div className="flex justify-center">
                      <nav className="flex space-x-2">
                        <button
                          onClick={() => setRequestsCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={requestsCurrentPage === 1}
                          className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          Previous
                        </button>
                        <span className="px-3 py-2 text-sm">
                          Page {requestsCurrentPage} of {requestsTotalPages}
                        </span>
                        <button
                          onClick={() => setRequestsCurrentPage(prev => Math.min(prev + 1, requestsTotalPages))}
                          disabled={requestsCurrentPage === requestsTotalPages}
                          className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          Next
                        </button>
                      </nav>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No requests</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No pending profile update requests at the moment.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {editModalOpen && editingStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Edit Profile: {editingStudent.name}
            </h3>

            {editLoading ? (
              <div className="py-12 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveEdit();
                }}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="dob" className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    id="dob"
                    value={editData.dob}
                    onChange={(e) => handleEditFieldChange('dob', e.target.value)}
                    className="form-input w-full"
                  />
                </div>

                <div>
                  <label htmlFor="classLevel" className="block text-sm font-medium text-gray-700 mb-1">
                    Class / Grade
                  </label>
                  <input
                    type="text"
                    id="classLevel"
                    value={editData.classLevel}
                    onChange={(e) => handleEditFieldChange('classLevel', e.target.value)}
                    placeholder="e.g. 10, 11, FY BSc"
                    className="form-input w-full"
                  />
                </div>

                <div>
                  <label htmlFor="section" className="block text-sm font-medium text-gray-700 mb-1">
                    Section
                  </label>
                  <input
                    type="text"
                    id="section"
                    value={editData.section}
                    onChange={(e) => handleEditFieldChange('section', e.target.value)}
                    placeholder="e.g. A, B, C"
                    className="form-input w-full"
                  />
                </div>

                <div>
                  <label htmlFor="house" className="block text-sm font-medium text-gray-700 mb-1">
                    House
                  </label>
                  <input
                    type="text"
                    id="house"
                    value={editData.house}
                    onChange={(e) => handleEditFieldChange('house', e.target.value)}
                    placeholder="e.g. Red, Blue"
                    className="form-input w-full"
                  />
                </div>

                <div className="flex space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setEditModalOpen(false);
                      setEditingStudent(null);
                      setEditData({ dob: '', classLevel: '', section: '', house: '' });
                    }}
                    disabled={savingEdit}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingEdit ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Decision Modal */}
      {actionModalOpen && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {actionType === 'APPROVE' ? 'Approve' : 'Reject'} Profile Update Request
            </h3>

            <div className="mb-4">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Student:</span> {selectedRequest.userId?.name}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-medium">Email:</span> {selectedRequest.userId?.email}
              </p>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <p className="text-xs text-gray-500 mb-2">Changes Requested:</p>
              <ul className="text-sm text-gray-900 space-y-1">
                {selectedRequest.changes?.dob && (
                  <li>• DOB: {new Date(selectedRequest.changes.dob).toLocaleDateString('en-IN')}</li>
                )}
                {selectedRequest.changes?.classLevel && <li>• Class: {selectedRequest.changes.classLevel}</li>}
                {selectedRequest.changes?.section && <li>• Section: {selectedRequest.changes.section}</li>}
                {selectedRequest.changes?.house && <li>• House: {selectedRequest.changes.house}</li>}
              </ul>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {actionType === 'APPROVE' ? 'Approval' : 'Rejection'} Comment (Optional)
              </label>
              <textarea
                value={decisionComment}
                onChange={(e) => setDecisionComment(e.target.value)}
                placeholder={
                  actionType === 'APPROVE'
                    ? 'Any notes about the approval...'
                    : 'Please explain why you are rejecting this request.'
                }
                rows={3}
                className="form-textarea w-full"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setActionModalOpen(false);
                  setSelectedRequest(null);
                  setActionType(null);
                  setDecisionComment('');
                }}
                disabled={processingRequestId !== null}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDecisionSubmit}
                disabled={processingRequestId !== null}
                className={`flex-1 px-4 py-2 rounded-md text-white font-medium transition-colors ${
                  actionType === 'APPROVE'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {processingRequestId === selectedRequest._id ? 'Processing...' : actionType === 'APPROVE' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminProtectedRoute>
  );
}

InstituteAdminStudents.getLayout = function getLayout(page) {
  return <AdminSidebarLayout title="Students">{page}</AdminSidebarLayout>;
};

export default InstituteAdminStudents;
