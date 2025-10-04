import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute';
import api from '../../utils/api';

export default function VerifierStudents({ showToast }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (userData.role !== 'VERIFIER') {
      router.push('/dashboard');
      return;
    }
    setUser(userData);
    fetchStudents();
  }, [router, search, currentPage]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
      });
      
      if (search) {
        params.append('search', search);
      }

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

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchStudents();
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
              <Link href="/verifier/dashboard" className="btn-secondary">
                Back to Dashboard
              </Link>
            </div>
          </div>

          {/* Search */}
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
                          <span className="text-primary-600 font-semibold text-lg">
                            {student.name?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-semibold text-gray-900">{student.name}</h3>
                          <p className="text-sm text-gray-600">{student.email}</p>
                        </div>
                      </div>

                      {/* Student Stats */}
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

                      {/* Verification Stats */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Verification Progress</span>
                          <span className="text-gray-900 font-medium">
                            {student.stats?.verified || 0}/{student.stats?.total || 0}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-primary-600 h-2 rounded-full" 
                            style={{ 
                              width: `${student.stats?.total > 0 
                                ? ((student.stats?.verified || 0) / student.stats.total) * 100 
                                : 0}%` 
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div>
                        <Link
                          href={`/portfolio/${student._id}`}
                          target="_blank"
                          className="w-full btn-primary text-center inline-block"
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
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {search 
                  ? 'No students match your search criteria.'
                  : 'No students from your institution have joined yet.'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}