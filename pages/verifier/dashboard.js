import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute';
import SidebarLayout from '../../components/SidebarLayout';
import api from '../../utils/api';

export default function VerifierDashboard({ showToast }) {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    pendingVerifications: 0,
    studentsInInstitute: 0,
    completedVerifications: 0,
    totalRequests: 0,
  });
  const [pendingRequests, setPendingRequests] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search pane states
  const [searchTerm, setSearchTerm] = useState('');
  const [searchUserId, setSearchUserId] = useState('');
  const [searchInstitute, setSearchInstitute] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchPage, setSearchPage] = useState(1);
  const [searchPagination, setSearchPagination] = useState({ total: 0, pages: 0 });
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [refereeCount, setRefereeCount] = useState(3);
  const [requestNotes, setRequestNotes] = useState('');
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  
  // Background verification requests states
  const [bgVerificationRequests, setBgVerificationRequests] = useState([]);
  const [bgRequestsLoading, setBgRequestsLoading] = useState(false);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (!userData || userData.role !== 'VERIFIER') {
      window.location.href = '/dashboard';
      return;
    }
    setUser(userData);
    fetchVerifierData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchVerifierData = async () => {
    try {
      setLoading(true);
      const [statsRes, requestsRes, studentsRes, bgRequestsRes] = await Promise.all([
        api.get('/verifier/stats').catch(() => ({ data: stats })),
        api.get('/verifier/pending-requests').catch(() => ({ data: { requests: [] } })),
        api.get('/verifier/institute-students').catch(() => ({ data: { students: [] } })),
        api.get('/background-verification/requests?status=SUBMITTED&limit=10').catch(() => ({ data: { requests: [] } })),
      ]);

      setStats(statsRes.data || stats);
      setPendingRequests(requestsRes.data.requests || []);
      setStudents(studentsRes.data.students || []);
      setBgVerificationRequests(bgRequestsRes.data.requests || []);
    } catch (error) {
      console.error('Failed to fetch verifier data:', error);
      showToast?.('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveVerification = async (requestId) => {
    try {
      await api.post(`/verifier/approve/${requestId}`);
      showToast?.('Verification approved', 'success');
      fetchVerifierData();
    } catch (error) {
      console.error('Approve error', error);
      showToast?.('Failed to approve', 'error');
    }
  };

  const handleRejectVerification = async (requestId) => {
    const reason = prompt('Rejection reason (optional):');
    try {
      await api.post(`/verifier/reject/${requestId}`, { reason: reason || '' });
      showToast?.('Verification rejected', 'success');
      fetchVerifierData();
    } catch (error) {
      console.error('Reject error', error);
      showToast?.('Failed to reject', 'error');
    }
  };

  // Search students across platform for background verification
  const handleSearchStudents = async (page = 1) => {
    try {
      setSearchLoading(true);
      const params = new URLSearchParams({
        page,
        limit: 10,
        role: 'STUDENT'
      });
      if (searchTerm) params.append('name', searchTerm);
      if (searchInstitute) params.append('institute', searchInstitute);
      if (searchUserId) {
        // Support searching by Mongo/ObjectId; include common param names so backend can accept any
        params.append('userId', searchUserId);
        params.append('portfolioId', searchUserId);
        params.append('id', searchUserId);
      }

      const res = await api.get(`/background-verification/search?${params}`);
      setSearchResults(res.data.students || []);
      setSearchPagination(res.data.pagination || {});
      setSearchPage(page);
    } catch (error) {
      console.error('Search students error:', error);
      showToast?.('Failed to search students', 'error');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Send background verification request
  const handleSendVerificationRequest = async () => {
    if (!selectedStudent) return;
    try {
      setRequestSubmitting(true);
      await api.post('/background-verification/request', {
        studentId: selectedStudent.id,
        refereeContactsRequested: refereeCount,
        notes: requestNotes
      });
      showToast?.('Background verification request sent successfully', 'success');
      setShowRequestModal(false);
      setSelectedStudent(null);
      setRefereeCount(3);
      setRequestNotes('');
      // Refresh search results to update hasActiveRequest status
      await handleSearchStudents(searchPage);
    } catch (error) {
      console.error('Send request error:', error);
      showToast?.(error.response?.data?.message || 'Failed to send verification request', 'error');
    } finally {
      setRequestSubmitting(false);
    }
  };

  // small presentational components
  const StatCard = ({ title, value, children, accent = 'bg-indigo-50', color = 'text-indigo-600' }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
      <div className={`p-3 rounded-lg ${accent} shrink-0`}>
        <div className={`w-6 h-6 ${color}`}>{children}</div>
      </div>
      <div>
        <div className="text-2xl font-semibold text-gray-900">{value}</div>
        <div className="text-sm text-gray-500">{title}</div>
      </div>
    </div>
  );

  const RequestItem = ({ r }) => (
    <div className="flex items-center justify-between gap-4 p-3 bg-white border border-gray-100 rounded-lg">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-700">{(r.studentName || 'S').charAt(0)}</div>
          <div className="truncate">
            <div className="font-medium text-gray-900 truncate">{r.studentName}</div>
            <div className="text-xs text-gray-500 truncate">{r.type} • {r.title}</div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleApproveVerification(r._id)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-600 text-white text-sm hover:bg-emerald-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Approve
        </button>
        <button
          onClick={() => handleRejectVerification(r._id)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-red-600 text-white text-sm hover:bg-red-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Reject
        </button>
      </div>
    </div>
  );

  if (loading) return (
    <ProtectedRoute>
      <div className="min-h-screen flex items-center justify-center">
        <svg className="animate-spin w-16 h-16 text-primary-600" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" strokeWidth="4" stroke="currentColor" strokeOpacity="0.25" fill="none" />
          <path d="M22 12a10 10 0 00-10-10" strokeWidth="4" stroke="currentColor" strokeLinecap="round" fill="none" />
        </svg>
      </div>
    </ProtectedRoute>
  );

  return (
    <ProtectedRoute>
      <Head>
        <title>Verifier Dashboard - TruePortMe</title>
      </Head>

      <main className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Verifier Dashboard</h1>
              <p className="text-sm text-gray-500">{user?.name} • {user?.institute}</p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/verifier/requests" className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-white border border-gray-200 shadow-sm text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
                All requests
              </Link>
              <Link href="/verifier/students" className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-white border border-gray-200 shadow-sm text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A11.955 11.955 0 0112 15c2.485 0 4.78.76 6.879 2.044M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Students
              </Link>
            </div>
          </div>

          {/* stats */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard title="Pending Requests" value={stats.pendingVerifications} accent="bg-yellow-50" color="text-yellow-600">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6"><path fillRule="evenodd" d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 11h-2V7h2v6zm0 6h-2v-2h2v2z"/></svg>
            </StatCard>

            <StatCard title="Students in Institute" value={stats.studentsInInstitute} accent="bg-blue-50" color="text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
            </StatCard>

            <StatCard title="Completed" value={stats.completedVerifications} accent="bg-green-50" color="text-green-600">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6"><path d="M9 16.2l-3.5-3.5L4 14l5 5L20 8l-1.5-1.5z"/></svg>
            </StatCard>

            <StatCard title="Total Requests" value={stats.totalRequests} accent="bg-purple-50" color="text-purple-600">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6"><path d="M3 13h2v-2H3v2zm4 0h14v-2H7v2zM3 7h18V5H3v2zM3 19h18v-2H3v2z"/></svg>
            </StatCard>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* left: pending list */}
            <div className="lg:col-span-2 bg-transparent">
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-gray-900">Pending Verification Requests</h3>
                  <Link href="/verifier/requests" className="text-sm text-primary-600">View all</Link>
                </div>

                {pendingRequests.length ? (
                  <div className="space-y-3">
                    {pendingRequests.slice(0, 6).map((r) => <RequestItem key={r._id} r={r} />)}
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-500">No pending requests.</div>
                )}
              </div>

              {/* Background Verification Requests Section */}
              <div className="mt-4 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-gray-900">Background Verification Requests</h3>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{bgVerificationRequests.length}</span>
                </div>

                {bgVerificationRequests.length ? (
                  <div className="space-y-3">
                    {bgVerificationRequests.slice(0, 6).map((req) => (
                      <div key={req.id} className="flex items-center justify-between gap-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 text-sm">{req.student.name}</div>
                          <div className="text-xs text-gray-600">{req.student.institute}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {req.status === 'SUBMITTED' && `${req.refereeContactsSubmitted}/${req.refereeContactsRequested} referees submitted`}
                            {req.status === 'PENDING' && 'Awaiting referee submission'}
                            {req.status === 'IN_REVIEW' && 'Under review'}
                          </div>
                        </div>
                        <Link href={`/verifier/background-verification?open=${req.id}`} className="text-xs px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 whitespace-nowrap">
                              View
                            </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-gray-500 text-sm">No background verification requests yet.</div>
                )}

                {bgVerificationRequests.length > 0 && (
                  <div className="mt-3 text-center">
                    <Link href="/verifier/background-verification" className="text-sm text-primary-600 hover:underline">
                      View all background verifications →
                    </Link>
                  </div>
                )}
              </div>

              {/* quick actions / activity */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link href="/verifier/requests/new" className="block rounded-2xl bg-white p-4 border border-gray-100 shadow-sm hover:shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-indigo-600" viewBox="0 0 24 24"><path d="M12 5v14m7-7H5"/></svg>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Create manual request</div>
                      <div className="text-xs text-gray-500">Add request on behalf of a student</div>
                    </div>
                  </div>
                </Link>

                <Link href="/verifier/analytics" className="block rounded-2xl bg-white p-4 border border-gray-100 shadow-sm hover:shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-600" viewBox="0 0 24 24"><path d="M3 3v18h18"/></svg>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">View analytics</div>
                      <div className="text-xs text-gray-500">Trends & verification metrics</div>
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            {/* right: search pane */}
            <aside className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm h-fit">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Search Students</h3>
                <p className="text-xs text-gray-600 mb-3">Find and send background verification requests to students across the platform.</p>
                
                {/* Search Filters */}
                <div className="space-y-3">
                  <div>
                    <label htmlFor="search-name" className="block text-sm font-medium text-gray-700 mb-1">Name / Email</label>
                    <input
                      type="text"
                      id="search-name"
                      placeholder="Search by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSearchStudents(1); }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="search-userid" className="block text-sm font-medium text-gray-700 mb-1">User / Portfolio ID (Mongo)</label>
                    <input
                      type="text"
                      id="search-userid"
                      placeholder="Search by Mongo user id or portfolio id"
                      value={searchUserId}
                      onChange={(e) => setSearchUserId(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSearchStudents(1); }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <div className="text-xs text-gray-400 mt-1">If you have the user's Mongo id (also used in portfolio URLs), paste it here to search directly.</div>
                  </div>
                  
                  <div>
                    <label htmlFor="search-institute" className="block text-sm font-medium text-gray-700 mb-1">Institute</label>
                    <input
                      type="text"
                      id="search-institute"
                      placeholder="Search by institute..."
                      value={searchInstitute}
                      onChange={(e) => setSearchInstitute(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSearchStudents(1); }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  
                  <button
                    onClick={() => handleSearchStudents(1)}
                    disabled={searchLoading}
                    className="w-full px-3 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 disabled:bg-gray-400"
                  >
                    {searchLoading ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </div>

              {/* Search Results */}
              <div className="border-t border-gray-100 pt-4">
                <div className="text-sm font-medium text-gray-900 mb-2">
                  Results {searchResults.length > 0 && `(${searchPagination.total})`}
                </div>
                
                {searchLoading ? (
                  <div className="py-4 text-center text-gray-500">
                    <svg className="animate-spin w-5 h-5 mx-auto" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" strokeWidth="4" stroke="currentColor" strokeOpacity="0.25" fill="none" />
                      <path d="M22 12a10 10 0 00-10-10" strokeWidth="4" stroke="currentColor" strokeLinecap="round" fill="none" />
                    </svg>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {searchResults.map((student) => (
                      <div key={student.id} className="p-2 border border-gray-100 rounded-md hover:bg-gray-50">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-900 truncate">{student.name}</div>
                            <div className="text-xs text-gray-600 truncate">{student.email}</div>
                            <div className="text-xs text-gray-500">{student.institute}</div>
                            {student.hasActiveRequest && (
                              <div className="text-xs text-orange-600 font-medium mt-1">Pending request</div>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              setSelectedStudent(student);
                              setShowRequestModal(true);
                            }}
                            disabled={student.hasActiveRequest}
                            className="px-2 py-1 text-xs rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:bg-gray-400 whitespace-nowrap"
                          >
                            Send Request
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 text-center text-gray-500 text-sm">
                    {searchTerm || searchInstitute ? 'No students found' : 'Search to find students'}
                  </div>
                )}

                {/* Pagination */}
                {searchPagination.pages > 1 && (
                  <div className="mt-3 flex items-center justify-center gap-2 text-xs">
                    <button
                      onClick={() => handleSearchStudents(searchPage - 1)}
                      disabled={searchPage === 1 || searchLoading}
                      className="px-2 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                      Prev
                    </button>
                    <span className="text-gray-600">{searchPage} / {searchPagination.pages}</span>
                    <button
                      onClick={() => handleSearchStudents(searchPage + 1)}
                      disabled={searchPage === searchPagination.pages || searchLoading}
                      className="px-2 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </aside>
          </section>

          <footer className="mt-8 text-center text-xs text-gray-400">© {new Date().getFullYear()} TruePortMe — built for verifiers</footer>
        </div>

        {/* Background Verification Request Modal */}
        {showRequestModal && selectedStudent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-2">Send Verification Request</h2>
              <p className="text-sm text-gray-600 mb-4">
                Send a background verification request to <span className="font-medium">{selectedStudent.name}</span> from <span className="font-medium">{selectedStudent.institute}</span>
              </p>

              <div className="space-y-4">
                <div>
                  <label htmlFor="referee-count" className="block text-sm font-medium text-gray-700 mb-1">Number of Referees Required</label>
                  <select
                    id="referee-count"
                    value={refereeCount}
                    onChange={(e) => setRefereeCount(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value={1}>1 Referee</option>
                    <option value={2}>2 Referees</option>
                    <option value={3}>3 Referees</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="request-notes" className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                  <textarea
                    id="request-notes"
                    value={requestNotes}
                    onChange={(e) => setRequestNotes(e.target.value)}
                    placeholder="Add any additional context or instructions..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    setShowRequestModal(false);
                    setSelectedStudent(null);
                    setRefereeCount(3);
                    setRequestNotes('');
                  }}
                  disabled={requestSubmitting}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendVerificationRequest}
                  disabled={requestSubmitting}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 disabled:bg-gray-400"
                >
                  {requestSubmitting ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}

VerifierDashboard.getLayout = function getLayout(page) {
  return <SidebarLayout title="Verifier Dashboard">{page}</SidebarLayout>;
};
