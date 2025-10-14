import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import SidebarLayout from '../components/SidebarLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import VerifierSelectionModal from '../components/VerifierSelectionModal';
import ExperienceCard from '../components/ExperienceCard';
import EducationCard from '../components/EducationCard';
import ProjectCard from '../components/ProjectCard';
import api from '../utils/api';

export default function Dashboard({ showToast }) {
  const [user, setUser] = useState(null);
  const [experiences, setExperiences] = useState([]);
  const [education, setEducation] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showVerifierModal, setShowVerifierModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState({ id: null, type: null });
  const [stats, setStats] = useState({
    experiences: { total: 0, verified: 0, pending: 0 },
    education: { total: 0, verified: 0, pending: 0 },
    projects: { total: 0, public: 0, private: 0 },
  });

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (userData.role === 'VERIFIER') {
      window.location.href = '/verifier/dashboard';
      return;
    }
    setUser(userData);
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [userResponse, experiencesResponse, educationResponse, projectsResponse] = await Promise.all([
        api.get('/users/me'),
        api.get('/experiences?limit=4'),
        api.get('/education?limit=3'),
        api.get('/projects?limit=3'),
      ]);

      const userData = userResponse.data?.user || userResponse.data || {};
      setUser(userData);

      const experiencesData = Array.isArray(experiencesResponse.data?.experiences)
        ? experiencesResponse.data.experiences
        : Array.isArray(experiencesResponse.data)
        ? experiencesResponse.data
        : [];

      const educationData = Array.isArray(educationResponse.data?.educations)
        ? educationResponse.data.educations
        : Array.isArray(educationResponse.data)
        ? educationResponse.data
        : [];

      const projectsData = Array.isArray(projectsResponse.data?.projects)
        ? projectsResponse.data.projects
        : Array.isArray(projectsResponse.data?.githubProjects)
        ? projectsResponse.data.githubProjects
        : Array.isArray(projectsResponse.data)
        ? projectsResponse.data
        : [];

      setExperiences(experiencesData);
      setEducation(educationData);
      setProjects(projectsData);

      const calc = (arr) => ({
        total: arr.length,
        verified: arr.filter((i) => i?.verified).length,
        pending: arr.filter((i) => !i?.verified).length,
      });

      const calcProjects = (arr) => ({
        total: arr.length,
        public: arr.filter((i) => i?.isPublic !== false).length,
        private: arr.filter((i) => i?.isPublic === false).length,
      });

      setStats({
        experiences: calc(experiencesData),
        education: calc(educationData),
        projects: calcProjects(projectsData),
      });
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      showToast?.('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestVerification = async (itemId, itemType) => {
    setSelectedItem({ id: itemId, type: itemType });
    setShowVerifierModal(true);
  };

  const handleCloseVerifierModal = () => {
    setShowVerifierModal(false);
    setSelectedItem({ id: null, type: null });
  };

  const handleVerifierSelected = () => {
    // Refresh dashboard data after verification request is sent
    fetchDashboardData();
  };

  if (loading) return (
    <ProtectedRoute>
      <div className="min-h-screen flex items-center justify-center">
        <svg className="animate-spin w-12 h-12" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" strokeWidth="3" stroke="currentColor" strokeOpacity="0.15" fill="none" />
          <path d="M22 12a10 10 0 00-10-10" strokeWidth="3" stroke="currentColor" strokeLinecap="round" fill="none" />
        </svg>
      </div>
    </ProtectedRoute>
  );

  const Stat = ({ title, totals, icon }) => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-gray-50 border border-gray-100 flex-shrink-0">{icon}</div>
        <div className="text-sm font-medium text-gray-700">{title}</div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-2xl font-bold text-gray-900">{totals.total}</div>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-1 bg-green-50 text-green-700 rounded-full font-medium">{totals.verified} verified</span>
          <span className="px-2 py-1 bg-yellow-50 text-yellow-700 rounded-full font-medium">{totals.pending} pending</span>
        </div>
      </div>
    </div>
  );

  return (
    <ProtectedRoute>
      <Head>
        <title>Dashboard - TruePortMe</title>
      </Head>

      <main>
        <div className="">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
            <div className="sm:flex sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name || user?.firstName || 'User'}</h1>
                <p className="text-sm text-gray-500 mt-1">Manage your verified portfolio & credentials</p>
              </div>
              <div className="mt-4 sm:mt-0 flex items-center gap-3">
                <Link href="/profile" className="px-3 py-2 rounded-md border border-gray-200 text-sm hover:bg-gray-50">
                  Profile
                </Link>
                <Link href={`/portfolio/${user?._id || user?.id}`} className="px-3 py-2 rounded-md bg-primary-600 text-white text-sm hover:bg-primary-700">
                  View Portfolio
                </Link>
              </div>
            </div>
          </div>

          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Stat title="Experiences" totals={stats.experiences} icon={(
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            )} />

            <Stat title="Education" totals={stats.education} icon={(
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422A12.083 12.083 0 0118 20.082V22l-6-3-6 3v-1.918a12.083 12.083 0 01-.16-9.504L12 14z"/></svg>
            )} />

            <Stat title="Projects" totals={stats.projects} icon={(
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
            )} />
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Experiences</h2>
                <div className="flex items-center gap-2">
                  <Link href="/experiences" className="text-sm text-primary-600 hover:text-primary-700">View all</Link>
                  <Link href="/experiences/new" className="px-3 py-1.5 rounded-md bg-primary-600 text-white text-sm hover:bg-primary-700">
                    + Add
                  </Link>
                </div>
              </div>

              <div className="space-y-3">
                {experiences.length > 0 ? (
                  experiences.slice(0, 4).map((exp) => (
                    <div key={exp._id} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="font-semibold text-gray-900">{exp.role || exp.title || exp.position}</div>
                            <div className="text-sm text-gray-500">@ {exp.organization || exp.company}</div>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {exp.startDate ? new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''} 
                            {!exp.endDate ? ' — Present' : exp.endDate ? ` — ${new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : ''}
                          </div>
                          {exp.description && (
                            <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap line-clamp-2">{exp.description}</p>
                          )}
                          {exp.tags && exp.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {exp.tags.slice(0, 5).map((tag, idx) => (
                                <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="flex flex-col gap-1">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${exp.verified ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                              {exp.verified ? 'verified' : 'pending'}
                            </span>
                            <Link href={`/experiences/edit/${exp._id}`} className="text-xs text-primary-600 hover:text-primary-700 mt-2">
                              Edit
                            </Link>
                            {!exp.verified && (
                              <button
                                onClick={() => handleRequestVerification(exp._id, 'experience')}
                                className="text-xs text-green-600 hover:text-green-700 whitespace-nowrap"
                              >
                                Request Verify
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-gray-500 text-sm">
                    No experiences yet. <Link href="/experiences/new" className="text-primary-600 hover:text-primary-700 font-medium">Add your first experience</Link>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Education</h2>
                  <div className="flex items-center gap-2">
                    <Link href="/education" className="text-sm text-primary-600 hover:text-primary-700">View all</Link>
                    <Link href="/education/new" className="px-3 py-1.5 rounded-md bg-primary-600 text-white text-sm hover:bg-primary-700">
                      + Add
                    </Link>
                  </div>
                </div>

                <div className="space-y-3">
                  {education.length > 0 ? (
                    education.slice(0, 2).map((edu) => (
                      <div key={edu.id || edu._id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="font-medium text-gray-900 truncate">
                                {edu.courseName || edu.degree || edu.title}
                                {edu.courseType && ` (${edu.courseType})`}
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${edu.verified ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                                {edu.verified ? 'verified' : 'pending'}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500 truncate">
                              {edu.schoolOrCollege || edu.institution || edu.boardOrUniversity}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {edu.passingYear ? `Class of ${edu.passingYear}` : 
                                `${edu.startYear || ''} - ${edu.endYear || 'Present'}`}
                            </div>
                          </div>
                          <Link href={`/education/edit/${edu.id || edu._id}`} className="text-sm text-primary-600 hover:text-primary-700 flex-shrink-0">
                            Edit
                          </Link>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-gray-500 text-sm">
                      No education yet. <Link href="/education/new" className="text-primary-600 hover:text-primary-700 font-medium">Add your education</Link>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Projects</h2>
                  <div className="flex items-center gap-2">
                    <Link href="/projects" className="text-sm text-primary-600 hover:text-primary-700">View all</Link>
                    <Link href="/projects/new" className="px-3 py-1.5 rounded-md bg-primary-600 text-white text-sm hover:bg-primary-700">
                      + Add
                    </Link>
                  </div>
                </div>

                <div className="space-y-3">
                  {projects.length > 0 ? (
                    projects.slice(0, 2).map((p) => (
                      <div key={p.id || p._id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">{p.title || p.name}</div>
                            <div className="text-sm text-gray-600 mt-1 line-clamp-2">{p.description}</div>
                            {(p.repoUrl || p.demoUrl) && (
                              <div className="flex items-center gap-2 mt-2">
                                {p.repoUrl && <a href={p.repoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 hover:text-primary-700">Repo</a>}
                                {p.demoUrl && <a href={p.demoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-gray-700">Demo</a>}
                              </div>
                            )}
                          </div>
                          <Link href={`/projects/edit/${p.id || p._id}`} className="text-sm text-primary-600 hover:text-primary-700 flex-shrink-0">
                            Edit
                          </Link>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-gray-500 text-sm">
                      No projects yet. <Link href="/projects/new" className="text-primary-600 hover:text-primary-700 font-medium">Add your first project</Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <footer className="mt-8 text-center text-xs text-gray-400">
            © {new Date().getFullYear()} TruePortMe — Verified Digital Portfolios
          </footer>
        </div>
      </main>

      {/* Verifier Selection Modal */}
      <VerifierSelectionModal
        isOpen={showVerifierModal}
        onClose={handleCloseVerifierModal}
        onSelectVerifier={handleVerifierSelected}
        itemType={selectedItem.type}
        itemId={selectedItem.id}
        showToast={showToast}
      />
    </ProtectedRoute>
  );
}

// Attach layout
Dashboard.getLayout = function getLayout(page) {
  return <SidebarLayout title="Dashboard">{page}</SidebarLayout>;
};
