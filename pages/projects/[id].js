import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute';
import SidebarLayout from '../../components/SidebarLayout';
import api from '../../utils/api';
import { showToast } from '../../components/Toast';

export default function ProjectDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [project, setProject] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [collaboratorRole, setCollaboratorRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchProject();
    }
  }, [id]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      // Try collaboration endpoint first (for collaborators)
      const response = await api.get(`/collaborations/projects/${id}`);
      setProject(response.data.project);
      setUserRole(response.data.userRole);
      setCollaboratorRole(response.data.collaboratorRole);
    } catch (error) {
      // If collaboration endpoint fails, try regular project endpoint
      try {
        const response = await api.get(`/projects/${id}`);
        setProject(response.data.project);
        setUserRole('OWNER'); // Assume owner if regular endpoint works
      } catch (err) {
        console.error('Failed to fetch project:', err);
        showToast('Failed to load project details', 'error');
        router.push('/projects');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading project details...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!project) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Project not found</h2>
            <Link href="/projects" className="mt-4 inline-block text-primary-600 hover:text-primary-800">
              Go back to projects
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Head>
        <title>{project.title} - TruePortMe</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
            {userRole === 'OWNER' && (
              <Link
                href={`/projects/edit/${id}`}
                className="btn-primary text-sm"
              >
                Edit Project
              </Link>
            )}
          </div>

          {/* Role Badge */}
          {userRole && (
            <div className="mb-6">
              <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                userRole === 'OWNER' 
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {userRole === 'OWNER' ? '👑 Project Owner' : `🤝 Collaborator${collaboratorRole ? ` - ${collaboratorRole}` : ''}`}
              </span>
            </div>
          )}

          {/* Main Content */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Project Header */}
            <div className="p-8 border-b border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.title}</h1>
                  {project.category && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {project.category.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
              </div>
              {project.description && (
                <p className="text-gray-700 text-lg leading-relaxed">{project.description}</p>
              )}
            </div>

            {/* Project Owner */}
            <div className="p-8 bg-gray-50 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Project Owner</h3>
              <div className="flex items-center space-x-4">
                {project.userId?.profilePicture ? (
                  <img
                    src={project.userId.profilePicture}
                    alt={project.userId.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {project.userId?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900">{project.userId?.name}</p>
                  <p className="text-sm text-gray-500">{project.userId?.email}</p>
                  {project.userId?.githubUsername && (
                    <a
                      href={`https://github.com/${project.userId.githubUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary-600 hover:text-primary-800"
                    >
                      @{project.userId.githubUsername}
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Collaborators */}
            {project.linkedCollaborators && project.linkedCollaborators.length > 0 && (
              <div className="p-8 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                  Collaborators ({project.linkedCollaborators.length}/5)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {project.linkedCollaborators.map((collab) => (
                    <div key={collab._id} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                      {collab.userId?.profilePicture ? (
                        <img
                          src={collab.userId.profilePicture}
                          alt={collab.userId.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold">
                          {collab.userId?.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{collab.userId?.name}</p>
                        {collab.role && (
                          <p className="text-sm text-gray-500">{collab.role}</p>
                        )}
                        {collab.userId?.email && (
                          <p className="text-xs text-gray-400">{collab.userId.email}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Project Details */}
            <div className="p-8">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-6">Project Details</h3>
              
              <div className="space-y-6">
                {/* Duration */}
                {(project.duration?.startDate || project.duration?.endDate) && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Duration</h4>
                    <p className="text-gray-900">
                      {formatDate(project.duration.startDate)} - {formatDate(project.duration.endDate)}
                    </p>
                  </div>
                )}

                {/* Skills Used */}
                {project.skillsUsed && project.skillsUsed.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Skills Used</h4>
                    <div className="flex flex-wrap gap-2">
                      {project.skillsUsed.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Links */}
                {project.links && Object.keys(project.links).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Project Links</h4>
                    <div className="space-y-2">
                      {project.links.githubUrl && (
                        <a
                          href={project.links.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-primary-600 hover:text-primary-800"
                        >
                          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                          </svg>
                          Repository
                        </a>
                      )}
                      {project.links.liveUrl && (
                        <a
                          href={project.links.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-primary-600 hover:text-primary-800"
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                          </svg>
                          Live Demo
                        </a>
                      )}
                      {project.links.portfolioUrl && (
                        <a
                          href={project.links.portfolioUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-primary-600 hover:text-primary-800"
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Portfolio
                        </a>
                      )}
                      {project.links.documentUrl && (
                        <a
                          href={project.links.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-primary-600 hover:text-primary-800"
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Document
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Academic Fields */}
                {(project.course || project.supervisor) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {project.course && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Course/Subject</h4>
                        <p className="text-gray-900">{project.course}</p>
                      </div>
                    )}
                    {project.supervisor && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Supervisor/Advisor</h4>
                        <p className="text-gray-900">{project.supervisor}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Legacy Collaborators */}
                {project.collaborators && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Team Members</h4>
                    <p className="text-gray-900">{project.collaborators}</p>
                  </div>
                )}

                {/* Learnings */}
                {project.learnings && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Key Learnings & Insights</h4>
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-900 whitespace-pre-line">{project.learnings}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
              <span>Created {formatDate(project.createdAt)}</span>
              {project.updatedAt && project.updatedAt !== project.createdAt && (
                <span>Last updated {formatDate(project.updatedAt)}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

ProjectDetail.getLayout = function getLayout(page) {
  return <SidebarLayout title="Project Details">{page}</SidebarLayout>;
};
