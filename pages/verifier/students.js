import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute';
import SidebarLayout from '../../components/SidebarLayout';
import api from '../../utils/api';
import { instituteAdminAPI } from '../../utils/adminAPI';

export default function VerifierStudents({ showToast }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Profile Requests state
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsPage, setRequestsPage] = useState(1);
  const [requestsTotalPages, setRequestsTotalPages] = useState(1);

  // Decision modal state (for requests)
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState(null); // 'APPROVE' or 'REJECT'
  const [decisionComment, setDecisionComment] = useState('');
  const [processingRequestId, setProcessingRequestId] = useState(null);

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

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (userData.role !== 'VERIFIER') {
      router.push('/dashboard');
      return;
    }
    setUser(userData);
    fetchStudents();
    fetchRequests(); // fetch pending requests on page load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, search, currentPage]);

  // FETCH STUDENTS
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
      });

      if (search) params.append('search', search);

      const response = await api.get(`/verifier/institute-students?${params}`);
      setStudents(response.data.students || []);
      setTotalPages(response.data.pagination?.pages || 1);
    } catch (error) {
      console.error('Failed to fetch students:', error);
      showToast?.('Failed to load students', 'error');
    } finally {
      setLoading(false);
    }
  };

  // FETCH PENDING PROFILE REQUESTS
  const fetchRequests = async (page = 1) => {
    try {
      setRequestsLoading(true);
      const params = { page, limit: 10, status: 'PENDING' };
      const resp = await instituteAdminAPI.listProfileUpdateRequests(params);
      setRequests(resp.requests || []);
      setRequestsPage(page);
      setRequestsTotalPages(resp.pagination?.pages || 1);
    } catch (err) {
      console.error('Failed to fetch requests:', err);
      showToast?.('Failed to load profile requests', 'error');
      setRequests([]);
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
      await instituteAdminAPI.decideProfileUpdateRequest(selectedRequest._id, actionType, decisionComment);

      const action = actionType === 'APPROVE' ? 'approved' : 'rejected';
      showToast?.(`Profile update request ${action}${decisionComment ? ' with comment' : ''}`, 'success');

      setActionModalOpen(false);
      setSelectedRequest(null);
      setActionType(null);
      setDecisionComment('');
      fetchRequests(requestsPage);
      fetchStudents(); // refresh students so approved changes reflect
    } catch (err) {
      console.error('Failed to process request:', err);
      showToast?.(err?.response?.data?.message || 'Failed to process request', 'error');
    } finally {
      setProcessingRequestId(null);
    }
  };

  // Search submit
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchStudents();
  };

  // Edit modal helpers unchanged
  const handleOpenEditModal = async (student) => {
    setEditingStudent(student);
    setEditModalOpen(true);
    setEditLoading(true);
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
      showToast?.('Failed to load student profile for editing', 'error');
      setEditData({
        dob: student.dob ? student.dob.split('T')[0] : '',
        classLevel: student.classLevel || '',
        section: student.section || '',
        house: student.house || '',
      });
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditFieldChange = (field, value) => {
    setEditData({ ...editData, [field]: value });
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
      showToast?.(`${editingStudent.name}'s profile updated successfully`, 'success');

      setEditModalOpen(false);
      setEditingStudent(null);
      setEditData({ dob: '', classLevel: '', section: '', house: '' });
      fetchStudents();
    } catch (error) {
      console.error('Failed to update student profile:', error);
      showToast?.(error?.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <ProtectedRoute>
      <Head>
        <title>Institute Students - TruePortMe</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Students from {user?.institute}</h1>
                <p className="text-gray-600">Browse and review student portfolios from your institution</p>
              </div>
              <Link href="/verifier/dashboard" className="btn-secondary">Back to Dashboard</Link>
            </div>
          </div>

          {/* Search */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <form onSubmit={handleSearch} className="flex space-x-4">
              <div className="flex-1">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search Students</label>
                <input type="text" id="search" className="form-input" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="flex items-end">
                <button type="submit" className="btn-primary">Search</button>
              </div>
            </form>
          </div>

          {/* Pending Profile Requests (MAIN PAGE) */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Pending Profile Update Requests</h2>
              <div>
                <button onClick={() => fetchRequests(1)} className="px-3 py-1 text-sm border rounded mr-2">Refresh</button>
                <button onClick={() => fetchRequests(Math.max(1, requestsPage - 1))} disabled={requestsPage === 1} className="px-3 py-1 text-sm border rounded mr-1">Prev</button>
                <button onClick={() => fetchRequests(Math.min(requestsTotalPages, requestsPage + 1))} disabled={requestsPage === requestsTotalPages} className="px-3 py-1 text-sm border rounded">Next</button>
              </div>
            </div>

            {requestsLoading ? (
              <div className="py-6 flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
              </div>
            ) : requests.length === 0 ? (
              <div className="p-4 bg-white rounded-lg border text-sm text-gray-600">No pending requests.</div>
            ) : (
              <div className="space-y-4 mb-6">
                {requests.map(req => (
                  <div key={req._id} className="bg-white rounded-lg shadow-sm border p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{req.userId?.name || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">{req.userId?.email}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {req.changes?.classLevel && <span>Class: {req.changes.classLevel} </span>}
                        {req.changes?.section && <span>| Section: {req.changes.section} </span>}
                        {req.changes?.house && <span>| House: {req.changes.house} </span>}
                        {req.changes?.dob && <span>| DOB: {new Date(req.changes.dob).toLocaleDateString()}</span>}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button onClick={() => handleOpenDecisionModal(req, 'APPROVE')} className="px-3 py-1 bg-green-600 text-white rounded text-sm">Approve</button>
                      <button onClick={() => handleOpenDecisionModal(req, 'REJECT')} className="px-3 py-1 bg-red-600 text-white rounded text-sm">Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>



          {/* Students Grid */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
          ) : students.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {students.map((student) => (
                  <div key={student._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-6">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 font-semibold text-lg">{student.name?.charAt(0)?.toUpperCase()}</span>
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-semibold text-gray-900">{student.name}</h3>
                          <p className="text-sm text-gray-600">{student.email}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                        <div>
                          <div className="text-lg font-bold text-gray-900">{student.stats?.experiences || 0}</div>
                          <div className="text-xs text-gray-600">Experiences</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-gray-900">{student.stats?.education || 0}</div>
                          <div className="text-xs text-gray-600">Education</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-gray-900">{student.stats?.projects || 0}</div>
                          <div className="text-xs text-gray-600">Projects</div>
                        </div>
                      </div>

                      <div className="mb-4 p-3 bg-gray-50 rounded-md text-sm space-y-1">
                        {student.dob && <div><span className="text-gray-600">DOB:</span><span className="font-medium ml-2">{new Date(student.dob).toLocaleDateString('en-IN')}</span></div>}
                        {student.classLevel && <div><span className="text-gray-600">Class:</span><span className="font-medium ml-2">{student.classLevel}</span></div>}
                        {student.section && <div><span className="text-gray-600">Section:</span><span className="font-medium ml-2">{student.section}</span></div>}
                        {student.house && <div><span className="text-gray-600">House:</span><span className="font-medium ml-2">{student.house}</span></div>}
                      </div>

                      <div className="mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Verification Progress</span>
                          <span className="text-gray-900 font-medium">{student.stats?.verified || 0}/{student.stats?.total || 0}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div className="bg-primary-600 h-2 rounded-full" style={{ width: `${student.stats?.total > 0 ? ((student.stats?.verified || 0) / student.stats.total) * 100 : 0}%` }}></div>
                        </div>
                      </div>

                      <div className="flex space-x-2 mb-4">
                        <button onClick={() => handleOpenEditModal(student)} className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors text-sm">Edit Profile</button>
                        <Link href={`/portfolio/${student._id}`} target="_blank" className="flex-1 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md transition-colors text-sm text-center">View Portfolio</Link>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500">Joined {new Date(student.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center">
                  <nav className="flex space-x-2">
                    <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">Previous</button>
                    <span className="px-3 py-2 text-sm">Page {currentPage} of {totalPages}</span>
                    <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">Next</button>
                  </nav>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
              <p className="mt-1 text-sm text-gray-500">{search ? 'No students match your search criteria.' : 'No students from your institution have joined yet.'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Decision Modal (approve/reject request) */}
      {actionModalOpen && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{actionType === 'APPROVE' ? 'Approve' : 'Reject'} Profile Update Request</h3>

            <div className="mb-4">
              <p className="text-sm text-gray-600"><span className="font-medium">Student:</span> {selectedRequest.userId?.name}</p>
              <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Email:</span> {selectedRequest.userId?.email}</p>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <p className="text-xs text-gray-500 mb-2">Changes Requested:</p>
              <ul className="text-sm text-gray-900 space-y-1">
                {selectedRequest.changes?.dob && <li>• DOB: {new Date(selectedRequest.changes.dob).toLocaleDateString('en-IN')}</li>}
                {selectedRequest.changes?.classLevel && <li>• Class: {selectedRequest.changes.classLevel}</li>}
                {selectedRequest.changes?.section && <li>• Section: {selectedRequest.changes.section}</li>}
                {selectedRequest.changes?.house && <li>• House: {selectedRequest.changes.house}</li>}
              </ul>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">{actionType === 'APPROVE' ? 'Approval' : 'Rejection'} Comment (Optional)</label>
              <textarea value={decisionComment} onChange={(e) => setDecisionComment(e.target.value)} placeholder={actionType === 'APPROVE' ? 'Any notes about the approval...' : 'Please explain why you are rejecting this request.'} rows={3} className="form-textarea w-full" />
            </div>

            <div className="flex space-x-3">
              <button onClick={() => { setActionModalOpen(false); setSelectedRequest(null); setActionType(null); setDecisionComment(''); }} disabled={processingRequestId !== null} className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50">Cancel</button>
              <button onClick={handleDecisionSubmit} disabled={processingRequestId !== null} className={`flex-1 px-4 py-2 rounded-md text-white font-medium transition-colors ${actionType === 'APPROVE' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} disabled:opacity-50 disabled:cursor-not-allowed`}>{processingRequestId === selectedRequest._id ? 'Processing...' : actionType === 'APPROVE' ? 'Approve' : 'Reject'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {editModalOpen && editingStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Profile: {editingStudent.name}</h3>

            {editLoading ? (
              <div className="py-12 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }} className="space-y-4">
                <div>
                  <label htmlFor="dob" className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input type="date" id="dob" value={editData.dob} onChange={(e) => handleEditFieldChange('dob', e.target.value)} className="form-input w-full" />
                </div>

                <div>
                  <label htmlFor="classLevel" className="block text-sm font-medium text-gray-700 mb-1">Class / Grade</label>
                  <input type="text" id="classLevel" value={editData.classLevel} onChange={(e) => handleEditFieldChange('classLevel', e.target.value)} placeholder="e.g. 10, 11, FY BSc" className="form-input w-full" />
                </div>

                <div>
                  <label htmlFor="section" className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                  <input type="text" id="section" value={editData.section} onChange={(e) => handleEditFieldChange('section', e.target.value)} placeholder="e.g. A, B, C" className="form-input w-full" />
                </div>

                <div>
                  <label htmlFor="house" className="block text-sm font-medium text-gray-700 mb-1">House</label>
                  <input type="text" id="house" value={editData.house} onChange={(e) => handleEditFieldChange('house', e.target.value)} placeholder="e.g. Red, Blue" className="form-input w-full" />
                </div>

                <div className="flex space-x-3 pt-4 border-t border-gray-200">
                  <button type="button" onClick={() => { setEditModalOpen(false); setEditingStudent(null); setEditData({ dob: '', classLevel: '', section: '', house: '' }); }} disabled={savingEdit} className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50">Cancel</button>
                  <button type="submit" disabled={savingEdit} className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed">{savingEdit ? 'Saving...' : 'Save'}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}

VerifierStudents.getLayout = function getLayout(page) {
  return <SidebarLayout title="Students">{page}</SidebarLayout>;
};
