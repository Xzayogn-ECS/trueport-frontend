import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute';
import SidebarLayout from '../../components/SidebarLayout';
import ProjectCard from '../../components/ProjectCard';
import Pagination from '../../components/Pagination';

import api from '../../utils/api';

export default function Projects({ showToast }) {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    public: 0,
    private: 0,
    recent: 0
  });


  useEffect(() => {
    fetchProjects();
  }, [currentPage, filter, search]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      
      // Build query string to match backend expectations
      let queryString = `page=${currentPage}&limit=6`;
      
      if (filter !== 'all') {
        if (filter === 'public') {
          queryString += '&isPublic=true';
        } else if (filter === 'private') {
          queryString += '&isPublic=false';
        } else if (filter === 'recent') {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          queryString += `&createdAfter=${thirtyDaysAgo.toISOString()}`;
        }
      }
      
      if (search) {
        queryString += `&search=${encodeURIComponent(search)}`;
      }

      console.log('Fetching projects:', `/projects?${queryString}`);
      
      const response = await api.get(`/projects?${queryString}`);
      console.log('Full API response:', response.data);

      // Extract data from backend response structure
      const projectsData = response.data.projects || response.data.githubProjects || [];
      const pagination = response.data.pagination || {};
      
      console.log('Projects data:', projectsData);
      console.log('Pagination:', pagination);

      // Calculate stats from the projects
      const calculatedStats = {
        total: pagination.total || projectsData.length,
        public: projectsData.filter(p => p.isPublic !== false).length,
        private: projectsData.filter(p => p.isPublic === false).length,
        recent: projectsData.filter(p => {
          if (!p.createdAt) return false;
          const created = new Date(p.createdAt);
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return created > monthAgo;
        }).length
      };

      setProjects(projectsData);
      setTotalPages(pagination.pages || 1);
      setStats(calculatedStats);

    } catch (error) {
      console.error('Failed to fetch projects:', error);
      console.error('Error details:', error.response?.data);
      
      // Reset to empty state on error
      setProjects([]);
      setTotalPages(1);
      setStats({ total: 0, public: 0, private: 0, recent: 0 });
      
      showToast('Failed to load projects', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (projectId) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      await api.delete(`/projects/${projectId}`);
      showToast('Project deleted successfully', 'success');
      fetchProjects();
    } catch (error) {
      console.error('Failed to delete project:', error);
      showToast('Failed to delete project', 'error');
    }
  };



  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProjects();
  };

  return (
    <ProtectedRoute>
      <Head>
        <title>Projects - TruePortMe</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8 sticky top-0 z-10 bg-gray-50 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
                <p className="text-sm text-gray-500">Curate, categorize and share your best work.</p>
              </div>
              <Link href="/projects/new" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white bg-primary-600 hover:bg-primary-700 shadow-lg font-medium transition-all transform hover:scale-105">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12M6 12h12"/></svg>
                New Project
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6 mb-8">
            {[
              { label: 'Total', value: stats.total, icon: (
                <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h10v10H7z"/></svg>
              ) },
              { label: 'Public', value: stats.public, icon: (
                <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
              ) },
              { label: 'Private', value: stats.private, icon: (
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029"/></svg>
              ) },
              { label: 'Recent', value: stats.recent, icon: (
                <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              ) },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl p-4 bg-white border border-gray-100 shadow-sm flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary-50">{s.icon}</div>
                <div>
                  <div className="text-xs text-gray-500">{s.label}</div>
                  <div className="text-xl font-semibold text-gray-900">{s.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Filters and Search */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              {/* Segmented filter */}
              <div className="inline-flex rounded-xl border border-gray-200 p-0.5 bg-gray-50">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'public', label: 'Public' },
                  { key: 'private', label: 'Private' },
                  { key: 'recent', label: 'Recent' },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => { setFilter(opt.key); setCurrentPage(1); }}
                    className={`px-3 sm:px-4 py-2 rounded-lg text-sm transition ${
                      filter === opt.key ? 'bg-white shadow-sm text-primary-800' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Search */}
              <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2">
                <div className="flex-1 flex items-center bg-gray-50 rounded-xl px-3 py-2 border border-gray-200">
                  <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"/></svg>
                  <input
                    type="text"
                    placeholder="Search projects by name, technology, or description..."
                    className="bg-transparent outline-none text-sm ml-2 flex-1"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn-primary">Search</button>
              </form>
            </div>
          </div>

          {/* Projects Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-24 w-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No projects found</h3>
              <p className="mt-2 text-gray-600">
                Get started by creating your first project.
              </p>
              <Link
                href="/projects/new"
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                New Project
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {projects.map((project, idx) => (
                  <div key={project._id} className="animate-fade-up" style={{ animationDelay: `${idx * 40}ms` }}>
                    <ProjectCard
                      project={project}
                      showActions={true}
                      onEdit={() => router.push(`/projects/edit/${project._id}`)}
                      onDelete={() => handleDelete(project._id)}
                      showToast={showToast}
                    />
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              )}
            </>
          )}
        </div>


      </div>
    </ProtectedRoute>
  );
}

Projects.getLayout = function getLayout(page) {
  return <SidebarLayout title="Projects">{page}</SidebarLayout>;
};