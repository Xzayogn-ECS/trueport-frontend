import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute';
import SidebarLayout from '../../components/SidebarLayout';
import api from '../../utils/api';

export default function MyCollaborations({ showToast }) {
  const [collaborations, setCollaborations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCollaborations();
  }, []);

  const fetchCollaborations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/collaborations/my-collaborations');
      setCollaborations(response.data.projects || []);
    } catch (error) {
      console.error('Failed to fetch collaborations:', error);
      showToast('Failed to load collaborations', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <Head>
        <title>My Collaborations - TruePortMe</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Collaborations</h1>
            <p className="text-gray-600">Manage your project collaborations and requests</p>
          </div>

          {/* Navigation Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <Link href="/collaborations/search" className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
                Search Collaborators
              </Link>
              <Link href="/collaborations/requests" className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
                Requests
              </Link>
              <Link href="/collaborations" className="border-primary-500 text-primary-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
                My Collaborations
              </Link>
            </nav>
          </div>

          {/* Collaborations Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
          ) : collaborations.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No collaborations yet</h3>
              <p className="text-gray-600">You're not collaborating on any projects yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {collaborations.map((project) => {
                const myCollaboration = project.linkedCollaborators?.find(
                  collab => collab.userId._id === JSON.parse(localStorage.getItem('user') || '{}')._id
                );
                
                return (
                  <div key={project._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="mb-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{project.title}</h3>
                        {project.category && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {project.category}
                          </span>
                        )}
                      </div>
                      {project.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
                      )}
                    </div>

                    {/* Project Owner */}
                    <div className="mb-4 pb-4 border-b border-gray-200">
                      <p className="text-xs font-medium text-gray-500 mb-2">Project Owner</p>
                      <div className="flex items-center space-x-2">
                        {project.userId?.profilePicture ? (
                          <img
                            src={project.userId.profilePicture}
                            alt={project.userId.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                            {project.userId?.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{project.userId?.name}</p>
                          <p className="text-xs text-gray-500">{project.userId?.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* My Role */}
                    {myCollaboration?.role && (
                      <div className="mb-4">
                        <p className="text-xs font-medium text-gray-500 mb-1">Your Role</p>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          {myCollaboration.role}
                        </span>
                      </div>
                    )}

                    {/* All Collaborators */}
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-500 mb-2">
                        All Collaborators ({project.linkedCollaborators?.length || 0})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {project.linkedCollaborators?.map((collab) => (
                          <div key={collab._id} className="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2">
                            {collab.userId?.profilePicture ? (
                              <img
                                src={collab.userId.profilePicture}
                                alt={collab.userId.name}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold text-xs">
                                {collab.userId?.name?.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="text-xs font-medium text-gray-900">{collab.userId?.name}</p>
                              {collab.role && (
                                <p className="text-xs text-gray-500">{collab.role}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Project Details */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Added {new Date(myCollaboration?.addedAt || project.createdAt).toLocaleDateString()}</span>
                      <Link
                        href={`/projects/${project._id}`}
                        className="text-primary-600 hover:text-primary-800 font-medium"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

MyCollaborations.getLayout = function getLayout(page) {
  return <SidebarLayout title="My Collaborations">{page}</SidebarLayout>;
};
