import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import ProtectedRoute from '../../components/ProtectedRoute';
import api from '../../utils/api';

export default function GitHubConnect({ showToast }) {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    try {
      const response = await api.get(`/github/public/${username.trim()}`);
      setRepos(response.data);
      showToast(`Found ${response.data.length} repositories!`, 'success');
    } catch (error) {
      console.error('Failed to fetch GitHub repos:', error);
      showToast(error.response?.data?.message || 'Failed to fetch repositories', 'error');
      setRepos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUsername = async () => {
    try {
      await api.put('/users/me', { githubUsername: username.trim() });
      showToast('GitHub username saved to profile!', 'success');
      router.push('/profile');
    } catch (error) {
      console.error('Failed to save GitHub username:', error);
      showToast('Failed to save GitHub username', 'error');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <ProtectedRoute>
      <Head>
        <title>Connect GitHub - TruePortMe</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Connect GitHub</h1>
            <p className="text-gray-600">Add your GitHub profile to showcase your repositories on your portfolio</p>
          </div>

          {/* GitHub Username Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                    GitHub Username
                  </label>
                  <div className="flex space-x-3">
                    <div className="flex-1 flex rounded-md shadow-sm">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                        github.com/
                      </span>
                      <input
                        type="text"
                        id="username"
                        className="form-input rounded-l-none"
                        placeholder="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading || !username.trim()}
                      className="btn-primary"
                    >
                      {loading ? 'Loading...' : 'Preview Repos'}
                    </button>
                  </div>
                </div>
              </form>

              {repos.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-sm text-gray-600">
                      Found {repos.length} public repositories
                    </p>
                    <button
                      onClick={handleSaveUsername}
                      className="btn-success"
                    >
                      Save to Profile
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Repository Preview */}
          {repos.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Repository Preview</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {repos.slice(0, 6).map((repo) => (
                    <div key={repo.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900 truncate">
                          <a
                            href={repo.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-primary-600"
                          >
                            {repo.name}
                          </a>
                        </h4>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          {repo.stargazers_count > 0 && (
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-1 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              {repo.stargazers_count}
                            </div>
                          )}
                          {repo.forks_count > 0 && (
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414L2.586 7a2 2 0 010-2.828l3.707-3.707a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              {repo.forks_count}
                            </div>
                          )}
                        </div>
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
                        <span>Updated {formatDate(repo.updated_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {repos.length > 6 && (
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-500">
                      ...and {repos.length - 6} more repositories
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Info Section */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-blue-800 mb-1">About GitHub Integration</h3>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>• Only public repositories will be displayed on your portfolio</p>
                  <p>• Your GitHub profile link will be visible to portfolio visitors</p>
                  <p>• Repository data is fetched in real-time when your portfolio is viewed</p>
                  <p>• You can update your GitHub username anytime from your profile settings</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}