import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import WCard from '../../components/WCard';
import api from '../../utils/api';
import { getDisplayName } from '../../utils/nameUtils';

export default function PublicPortfolio() {
  const router = useRouter();
  const { userId } = router.query;
  const [user, setUser] = useState(null);
  const [experiences, setExperiences] = useState([]);
  const [education, setEducation] = useState([]);
  const [projects, setProjects] = useState([]);
  const [githubRepos, setGithubRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [githubLoading, setGithubLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchPortfolioData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchPortfolioData = async () => {
    try {
      const response = await api.get(`/portfolio/${userId}`);
      console.log('Fetched portfolio data:', response.data);
  
      setUser(response.data.user);
      setExperiences(Array.isArray(response.data.experiences) ? response.data.experiences : []);
      setEducation(Array.isArray(response.data.education) ? response.data.education : []);
      setProjects(Array.isArray(response.data.projects) ? response.data.projects : Array.isArray(response.data.githubProjects) ? response.data.githubProjects : []);

      // Fetch GitHub repos if a username exists (from contactInfo or user)
      const ghUser = response.data.user?.contactInfo?.githubUsername || response.data.user?.githubUsername;
      if (ghUser) {
        fetchGithubRepos(ghUser);
      }
    } catch (error) {
      console.error('Failed to fetch portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGithubRepos = async (username) => {
    setGithubLoading(true);
    try {
      const response = await api.get(`/github/public/${username}`);
      const reposData = Array.isArray(response.data) ? response.data : [];
      setGithubRepos(reposData.slice(0, 6)); // Show top 6 repos
    } catch (error) {
      console.error('Failed to fetch GitHub repos:', error);
    } finally {
      setGithubLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Portfolio Not Found</h3>
          <p className="mt-1 text-sm text-gray-500">This portfolio doesn't exist or is not public.</p>
          <div className="mt-6">
            <Link href="/" className="btn-primary">
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const verifiedExperiences = Array.isArray(experiences) ? experiences.filter(exp => exp?.verified) : [];
  const verifiedEducation = Array.isArray(education) ? education.filter(edu => edu?.verified) : [];
  const publicProjects = Array.isArray(projects) ? projects.filter(proj => proj?.isPublic !== false) : [];

  // Sort education by passing year (latest first)
  const sortedEducation = verifiedEducation.length > 0 ? [...verifiedEducation].sort((a, b) => (b?.passingYear || 0) - (a?.passingYear || 0)) : [];

  // Sort projects by creation date (latest first) 
  const sortedProjects = [...publicProjects].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Stats for the top card middle section
  const stats = {
    verifiedEducation: verifiedEducation.length,
    publicProjects: publicProjects.length,
    verifiedExperiences: verifiedExperiences.length,
  };

  // Build contactInfo mapping compatible with WCard
  // Per request: GitHub and email should always be visible when values exist
  const publicContactInfo = {
    emailVisible: user?.contactVisibility?.email !== false,
    phoneVisible: user?.contactVisibility?.phone !== false,
    linkedinVisible: user?.contactVisibility?.linkedinUrl !== false,
    githubVisible: true,
    email: user?.contactInfo?.email || '',
    phone: user?.contactInfo?.phone || '',
    linkedinUrl: user?.contactInfo?.linkedinUrl || '',
    githubUsername: user?.contactInfo?.githubUsername || user?.githubUsername || ''
  };

  const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || (typeof window !== 'undefined' ? window.location.origin : '');
  const portfolioUrl = `${baseUrl}/portfolio/${userId || user?._id || user?.id || ''}`;

  // Aggregate skills from public projects and verified experiences
  const skillCounts = {};
  try {
    (publicProjects || []).forEach(p => {
      const skills = Array.isArray(p.skillsUsed) ? p.skillsUsed : (Array.isArray(p.technologies) ? p.technologies : []);
      skills.forEach(s => {
        const key = (s && s.label) ? s.label : s; // CreatableSelect options or plain strings
        if (!key) return;
        const k = String(key).trim();
        if (!k) return;
        skillCounts[k] = (skillCounts[k] || 0) + 1;
      });
    });
    (verifiedExperiences || []).forEach(exp => {
      const tags = Array.isArray(exp.tags) ? exp.tags : [];
      tags.forEach(t => {
        const k = String(t).trim();
        if (!k) return;
        skillCounts[k] = (skillCounts[k] || 0) + 1;
      });
    });
  } catch (e) {
    // noop
  }
  const skillsTop = Object.entries(skillCounts)
    .sort((a,b) => b[1]-a[1])
    .slice(0, 12);

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <Head>
        <title>{getDisplayName(user)} - TruePortMe Portfolio</title>
        <meta name="description" content={`Professional portfolio of ${getDisplayName(user)}${user.bio ? ` - ${user.bio}` : ''}`} />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Top Card: Left identity + contacts, Middle stats, Right QR */}
        <div className="mb-6 sm:mb-8">
          <WCard
            user={user}
            contactInfo={publicContactInfo}
            portfolioUrl={portfolioUrl}
            compact={false}
            showControls={false}
            stats={stats}
          />
        </div>

        {/* Skills */}
        {skillsTop.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Skills</h2>
              <span className="text-xs sm:text-sm text-gray-500">Top {skillsTop.length}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {skillsTop.map(([name, count]) => (
                <span key={name} className="inline-flex items-center px-2 sm:px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {name}
                  <span className="ml-1 text-[10px] text-gray-500">×{count}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* Verified Experiences */}
            {verifiedExperiences.length > 0 && (
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Experiences</h2>
                  <div className="flex items-center text-xs text-gray-600">
                    <svg className="w-4 h-4 mr-1 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Verified
                  </div>
                </div>

                <div className="space-y-3">
                  {verifiedExperiences.map((experience) => (
                    <div key={experience._id} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="font-semibold text-gray-900">{experience.role || experience.title}</div>
                            <div className="text-sm text-gray-500">@ {experience.company}</div>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {experience.startDate && formatDate(experience.startDate)}
                            {experience.endDate && ` — ${formatDate(experience.endDate)}`}
                            {!experience.endDate && ' — Present'}
                          </div>
                          {experience.description && (
                            <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap line-clamp-3">{experience.description}</p>
                          )}
                          {experience.tags && experience.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {experience.tags.slice(0, 5).map((tag, idx) => (
                                <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div className="text-xs font-medium text-green-600">verified</div>
                          {experience.verifiedBy && (
                            <div className="mt-2 text-xs text-primary-600">
                              View proof
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Projects */}
            {sortedProjects.length > 0 && (
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Projects</h2>
                </div>

                <div className="space-y-3">
                  {sortedProjects.slice(0, 6).map((project) => (
                    <div key={project.id} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{project.title}</h3>
                          {project.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{project.description}</p>
                          )}
                          {project.tags && project.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {project.tags.slice(0, 5).map((tag, idx) => (
                                <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 text-xs">
                          {project.githubLink && (
                            <a 
                              href={project.githubLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary-600 hover:text-primary-700"
                            >
                              Repo
                            </a>
                          )}
                          {project.liveLink && (
                            <a 
                              href={project.liveLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-gray-500 hover:text-gray-700"
                            >
                              Demo
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - 1/3 width */}
          <aside className="space-y-6">
            {/* Education */}
            {sortedEducation.length > 0 && (
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Education</h3>
                <div className="space-y-2">
                  {sortedEducation.slice(0, 3).map((edu) => (
                    <div key={edu._id || edu.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="font-medium text-sm text-gray-900">
                        {edu.courseName || edu.degree || edu.title}
                        {edu.courseType && ` (${edu.courseType})`}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {edu.schoolOrCollege || edu.institute || edu.boardOrUniversity}
                        {edu.passingYear && ` • Class of ${edu.passingYear}`}
                      </div>
                      {edu.verified && edu.verifiedBy && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <div className="text-xs text-green-600 font-medium">✓ Verified</div>
                          <div className="text-xs text-gray-500 mt-0.5">by {edu.verifiedBy}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>

        {/* GitHub Repositories */}
        {(() => {
          const ghUsername = user?.contactInfo?.githubUsername || user?.githubUsername;
          return ghUsername && !githubLoading && githubRepos.length > 0;
        })() && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">GitHub Repositories</h2>
              <a
                href={`https://github.com/${user?.contactInfo?.githubUsername || user?.githubUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                View on GitHub →
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {githubRepos.map((repo) => (
                <div key={repo.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 truncate">
                      <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary-600"
                      >
                        {repo.name}
                      </a>
                    </h3>
                    {repo.stargazers_count > 0 && (
                      <div className="flex items-center text-yellow-500 text-sm">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {repo.stargazers_count}
                      </div>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {repo.description || 'No description available'}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    {repo.language && (
                      <span className="flex items-center">
                        <span className="w-3 h-3 rounded-full bg-primary-500 mr-1"></span>
                        {repo.language}
                      </span>
                    )}
                    <span>{formatDate(repo.updated_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-12 mb-8">
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl shadow-lg p-6 sm:p-8 text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">
              Create Your Own Verified Portfolio
            </h2>
            <p className="text-primary-100 text-sm sm:text-base mb-5 max-w-2xl mx-auto">
              Showcase your achievements with verified credentials. Build trust with employers and clients.
            </p>
            <Link 
              href="/auth/register" 
              className="inline-flex items-center px-6 py-2.5 rounded-lg bg-white text-primary-600 font-semibold hover:bg-gray-50 transition-colors shadow-md text-sm"
            >
              Get Started Free
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-8 border-t border-gray-200 text-center">
          <p className="text-gray-500 text-sm">
            Powered by{' '}
            <Link href="/" className="text-primary-600 hover:text-primary-700 font-medium">
              TruePortMe
            </Link>
            {' '}— Verified Digital Portfolios
          </p>
        </div>
      </div>
    </div>
  );
}

// Custom layout to hide navbar
PublicPortfolio.getLayout = function getLayout(page) {
  return page;
};