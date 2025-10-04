import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import api from '../utils/api';
import { setAuthToken, getAuthToken } from '../utils/auth';
import Link from 'next/link';


const AuthForm = ({ type = 'login' }) => {
  const popupRef = useRef(null);
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isLogin = type === 'login';

  // Listen for messages from Google OAuth popup
useEffect(() => {
  // The message will come from the SAME frontend origin (popup -> parent)
  const allowedOrigin = process.env.NEXT_PUBLIC_FRONTEND_URL
    ? new URL(process.env.NEXT_PUBLIC_FRONTEND_URL).origin
    : window.location.origin;

  const handler = async (event) => {
    console.log('Message received:', event.origin, event.data);

    if (event.origin !== allowedOrigin) {
      console.warn('Message from untrusted origin:', event.origin);
      return;
    }

    // Success payload might include token OR just user (cookie auth)
    if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
      setLoading(false);

      const { token, user, cookieAuth } = event.data;

      if (token) {
        // token-in-body flow (same as before)
        try { setAuthToken(token); } catch (e) { console.warn(e); }
        if (user) localStorage.setItem('user', JSON.stringify(user));
        if (popupRef.current && !popupRef.current.closed) popupRef.current.close();
        router.push('/dashboard');
        return;
      }

      // cookie-based flow: validate session by calling backend validate endpoint (send cookies)
      try {
        const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/$/, '');
        const resp = await fetch(`${API_BASE}/auth/validate`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        const data = await resp.json();
        if (resp.ok && data.valid) {
          localStorage.setItem('user', JSON.stringify(data.user));
          if (popupRef.current && !popupRef.current.closed) popupRef.current.close();
          router.push('/dashboard');
          return;
        } else {
          throw new Error(data.message || 'Session validation failed');
        }
      } catch (err) {
        console.error('Failed to validate cookie session after popup auth:', err);
        setError(err.message || 'Google sign-in failed');
        if (popupRef.current && !popupRef.current.closed) popupRef.current.close();
      }
    }

    if (event.data?.type === 'GOOGLE_AUTH_ERROR') {
      console.error('Google auth error:', event.data.error);
      setError(event.data.error || 'Google sign-in failed');
      setLoading(false);
      if (popupRef.current && !popupRef.current.closed) popupRef.current.close();
    }
  };

  window.addEventListener('message', handler);
  return () => window.removeEventListener('message', handler);
}, [router]);

  // Component mount log
  useEffect(() => {
    console.log('=== AUTH FORM COMPONENT MOUNTED ===');
    console.log('Form type:', type);
    console.log('Is login:', isLogin);
    console.log('Current auth token on mount:', getAuthToken());
    console.log('API_BASE_URL:', process.env.NEXT_PUBLIC_API_URL);
  }, [type, isLogin]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    const endpoint = isLogin ? '/auth/login' : '/auth/register';
    const payload = isLogin
      ? { email: formData.email, password: formData.password }
      : { name: formData.name, email: formData.email, password: formData.password };

    const response = await api.post(endpoint, payload);
    const { token, user } = response.data;

    console.log('Regular auth success');

    // Save token in cookie and user in localStorage
    setAuthToken(token);
    localStorage.setItem('user', JSON.stringify(user));

    router.push('/dashboard');
  } catch (err) {
    setError(err.response?.data?.message || 'Something went wrong');
  } finally {
    setLoading(false);
  }
};

  
const handleGoogleAuth = () => {
  setLoading(true);
  setError('');

  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/$/, '');
  const googleAuthUrl = `${API_BASE}/auth/google`;

  console.log('Redirecting to Google auth:', googleAuthUrl);

  // Simple redirect - cookie will be set by backend
  window.location.href = googleAuthUrl;
};

// For regular login, also set cookie instead of localStorage

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="max-w-md w-full space-y-6 sm:space-y-8">
        <div>
          <h2 className="mt-4 sm:mt-6 text-center text-2xl sm:text-3xl font-extrabold text-gray-900">
            {isLogin ? 'Sign in to your account' : 'Create your account'}
          </h2>
        </div>
        <form className="mt-6 sm:mt-8 space-y-4 sm:space-y-6 bg-white p-6 sm:p-8 rounded-lg shadow-sm" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="form-input mt-1"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="form-input mt-1"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                required
                className="form-input mt-1"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="group relative w-full flex justify-center py-2.5 sm:py-3 px-4 mb-3 sm:mb-4 border border-gray-300 text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {loading ? 'Connecting...' : 'Continue with Google'}
            </button>

            <div className="relative mb-3 sm:mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs sm:text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with email</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2.5 sm:py-3 px-4 border border-transparent text-xs sm:text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {loading ? 'Processing...' : (isLogin ? 'Sign in' : 'Sign up')}
            </button>
          </div>

          <div className="text-center space-y-2">
            <span className="text-xs sm:text-sm text-gray-600">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <Link
                href={isLogin ? '/auth/register' : '/auth/login'}
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </Link>
            </span>
            
           {isLogin && (
  <div className="pt-3 sm:pt-4 border-t border-gray-200">
    <p className="text-xs text-gray-500 mb-2">Admin Access</p>
    <div className="flex space-x-3 sm:space-x-4 justify-center flex-wrap gap-2">
      <Link 
        href="/admin/super-admin/login"
        className="text-xs text-blue-600 hover:text-blue-500"
      >
        Super Admin
      </Link>
      <span className="text-gray-300 hidden sm:inline">|</span>
      <Link 
        href="/admin/institute-admin/login"
        className="text-xs text-green-600 hover:text-green-500"
      >
        Institute Admin
      </Link>
    </div>
  </div>
)}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthForm;
