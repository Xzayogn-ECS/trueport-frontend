import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { instituteAdminAPI } from '../../../utils/adminAPI';
import { setAuthToken } from '../../../utils/auth';
import SingleToast from '../../../components/SingleToast';

export default function InstituteAdminLogin() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setToast({ type: 'error', message: 'Please fill in all fields' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await instituteAdminAPI.login(formData);
      console.log('Institute login response:', response);

      // support multiple possible shapes
      const token =
        response?.token ||
        response?.data?.token ||
        response?.admin?.token ||
        response?.data?.admin?.token;

      const admin = response?.admin || response?.data?.admin || response?.user || response?.data?.user;

      if (token) {
        setAuthToken(token);
        if (admin) localStorage.setItem('user', JSON.stringify(admin));
        setToast({ type: 'success', message: 'Login successful! Redirecting...' });
        router.push('/admin/institute-admin/dashboard');
        return;
      }

      // fallback: some APIs return { success: true, token } or { success: false, message }
      if (response?.success && (response.token || (response.data && response.data.token))) {
        const fallbackToken = response.token || response.data?.token;
        setAuthToken(fallbackToken);
        if (response.data?.admin) localStorage.setItem('user', JSON.stringify(response.data.admin));
        setToast({ type: 'success', message: 'Login successful! Redirecting...' });
        router.push('/admin/institute-admin/dashboard');
        return;
      }

      setToast({ type: 'error', message: response?.message || 'Login failed - invalid credentials or missing token' });
    } catch (error) {
      console.error('Institute admin login error:', error);
      let msg = 'Login failed. Please try again.';
      if (error?.response) msg = error.response.data?.message || `Server error: ${error.response.status}`;
      else if (error?.request) msg = 'No response from server. Check if backend is running.';
      else msg = error.message || msg;
      setToast({ type: 'error', message: msg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="flex justify-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm sm:text-base">T</span>
            </div>
            <span className="text-xl sm:text-2xl font-bold text-gray-900">TruePortMe</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-2xl sm:text-3xl font-extrabold text-gray-900">Institute Admin Login</h2>
        <p className="mt-2 text-center text-xs sm:text-sm text-gray-600">Manage your institution's users and verifiers</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-6 sm:py-8 px-4 sm:px-10 shadow sm:rounded-lg">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
              <div className="mt-1">
                <input id="email" name="email" type="email" autoComplete="email" required value={formData.email} onChange={handleChange} className="form-input" placeholder="admin@university.edu" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1">
                <input id="password" name="password" type="password" autoComplete="current-password" required value={formData.password} onChange={handleChange} className="form-input" placeholder="Enter your password" />
              </div>
            </div>

            <div>
              <button type="submit" disabled={isLoading} className="bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md w-full flex justify-center transition-colors">
                {isLoading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /> : 'Sign in'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs sm:text-sm">
                <span className="px-2 bg-white text-gray-500">Other admin types</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
              <Link href="/admin/super-admin/login" className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-xs sm:text-sm font-medium text-gray-500 hover:bg-gray-50">
                <span>Super Admin Login</span>
              </Link>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link href="/auth/login" className="text-xs sm:text-sm text-primary-600 hover:text-primary-500">← Back to Student/Verifier Login</Link>
          </div>
        </div>
      </div>

      {toast && <SingleToast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}
