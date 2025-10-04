import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import ProtectedRoute from '../components/ProtectedRoute';
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

  const handleRequestVerification = async (experienceId) => {
    const email = prompt('Verifier email:');
    if (!email) return;
    try {
      const response = await api.post(`/verify/request/${experienceId}`, { email });
      showToast?.('Verification request sent', 'success');
      if (response.data?.link) console.log('verification link:', response.data.link);
    } catch (err) {
      console.error(err);
      showToast?.(err.response?.data?.message || 'Failed to send request', 'error');
    }
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
    <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-100 shadow-sm flex items-center gap-3 sm:gap-4">
      <div className="p-2 rounded-lg bg-gray-50 flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs sm:text-sm font-medium text-gray-700 truncate">{title}</div>
          <div className="text-xs text-gray-400">Total</div>
        </div>
        <div className="mt-1 sm:mt-2 flex items-end gap-2 sm:gap-4">
          <div className="text-xl sm:text-2xl font-semibold text-gray-900">{totals.total}</div>
          <div className="text-xs sm:text-sm text-green-600">{totals.verified} ✓</div>
          <div className="text-xs sm:text-sm text-yellow-600">{totals.pending} •</div>
        </div>
      </div>
    </div>
  );

  return (
    <ProtectedRoute>
      <Head>
        <title>Dashboard - TruePortMe</title>
      </Head>

      <main className="min-h-screen bg-gray-50 pb-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Welcome back, {user?.name || user?.firstName || 'User'}</h1>
              <p className="text-xs sm:text-sm text-gray-500">Manage your portfolio & verifications</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link href="/profile" className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-white border border-gray-200 shadow-sm text-xs sm:text-sm"> 
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A11.955 11.955 0 0112 15c2.485 0 4.78.76 6.879 2.044M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="hidden sm:inline">Profile</span>
              </Link>
              <Link href={`/portfolio/${user?._id || user?.id}`} className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-indigo-600 text-white text-xs sm:text-sm">
                <span className="hidden sm:inline">View</span> Portfolio
              </Link>
            </div>
          </div>

          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <Stat title="Experiences" totals={stats.experiences} icon={(
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            )} />

            <Stat title="Education" totals={stats.education} icon={(
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422A12.083 12.083 0 0118 20.082V22l-6-3-6 3v-1.918a12.083 12.083 0 01-.16-9.504L12 14z"/></svg>
            )} />

            <Stat title="Projects" totals={stats.projects} icon={(
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7 7h10v10H7z"/></svg>
            )} />
          </section>

          <section className="mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
              <Link href="/experiences/new" className="flex items-center justify-center gap-1 sm:gap-2 py-2 px-2 sm:px-3 bg-white border border-gray-100 rounded-lg shadow-sm text-xs sm:text-sm hover:bg-gray-50">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                <span className="hidden sm:inline">Add</span> Exp.
              </Link>

              <Link href="/education/new" className="flex items-center justify-center gap-1 sm:gap-2 py-2 px-2 sm:px-3 bg-white border border-gray-100 rounded-lg shadow-sm text-xs sm:text-sm hover:bg-gray-50">
                <span className="hidden sm:inline">Add</span> Edu.
              </Link>

              <Link href="/projects/new" className="flex items-center justify-center gap-1 sm:gap-2 py-2 px-2 sm:px-3 bg-white border border-gray-100 rounded-lg shadow-sm text-xs sm:text-sm hover:bg-gray-50">
                <span className="hidden sm:inline">Add</span> Proj.
              </Link>

              <Link href="/experiences" className="flex items-center justify-center gap-1 sm:gap-2 py-2 px-2 sm:px-3 bg-white border border-gray-100 rounded-lg shadow-sm text-xs sm:text-sm hover:bg-gray-50">
                <span className="hidden lg:inline">Manage</span> Exp.
              </Link>

              <Link href="/education" className="flex items-center justify-center gap-1 sm:gap-2 py-2 px-2 sm:px-3 bg-white border border-gray-100 rounded-lg shadow-sm text-xs sm:text-sm hover:bg-gray-50">
                <span className="hidden lg:inline">Manage</span> Edu.
              </Link>

              <Link href="/projects" className="flex items-center justify-center gap-1 sm:gap-2 py-2 px-2 sm:px-3 bg-white border border-gray-100 rounded-lg shadow-sm text-xs sm:text-sm hover:bg-gray-50">
                <span className="hidden lg:inline">Manage</span> Proj.
              </Link>
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">Recent Experiences</h3>
                <Link href="/experiences" className="text-xs sm:text-sm text-indigo-600">View all</Link>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {experiences.length > 0 ? (
                  experiences.slice(0, 3).map((exp) => (
                    <ExperienceCard key={exp._id} experience={exp} showActions onRequestVerification={handleRequestVerification} />
                  ))
                ) : (
                  <div className="py-8 text-center text-gray-500 bg-white rounded-lg border border-gray-100 text-sm">No experiences yet. <Link href="/experiences/new" className="text-indigo-600">Add one</Link></div>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">Recent Education</h3>
                <Link href="/education" className="text-xs sm:text-sm text-indigo-600">View all</Link>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {education.length > 0 ? (
                  education.slice(0, 3).map((edu) => (
                    <EducationCard key={edu.id || edu._id} education={edu} showActions={false} />
                  ))
                ) : (
                  <div className="py-8 text-center text-gray-500 bg-white rounded-lg border border-gray-100 text-sm">No education yet. <Link href="/education/new" className="text-indigo-600">Add one</Link></div>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">Recent Projects</h3>
                <Link href="/projects" className="text-xs sm:text-sm text-indigo-600">View all</Link>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {projects.length > 0 ? (
                  projects.slice(0, 3).map((p) => (
                    <ProjectCard key={p.id || p._id} project={p} showActions={false} />
                  ))
                ) : (
                  <div className="py-8 text-center text-gray-500 bg-white rounded-lg border border-gray-100 text-sm">No projects yet. <Link href="/projects/new" className="text-indigo-600">Add one</Link></div>
                )}
              </div>
            </div>
          </section>

          <footer className="mt-6 sm:mt-8 text-center text-xs text-gray-400">© {new Date().getFullYear()} TruePortMe</footer>
        </div>
      </main>
    </ProtectedRoute>
  );
}
