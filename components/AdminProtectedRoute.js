import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getAuthToken } from '../utils/auth';
import { superAdminAPI, instituteAdminAPI, adminAuth } from '../utils/adminAPI';

const AdminProtectedRoute = ({ children, adminType }) => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        console.log(`=== ADMIN PROTECTED ROUTE (${adminType}) ===`);
        const token = getAuthToken();
        console.log('Token in protected route:', token);
        
        if (!token) {
          console.log('No token found in protected route');
          throw new Error('No authentication token');
        }

        let profileResponse;
        console.log(`Calling ${adminType} admin API getProfile()`);
        if (adminType === 'super') {
          profileResponse = await superAdminAPI.getProfile();
        } else if (adminType === 'institute') {
          profileResponse = await instituteAdminAPI.getProfile();
        }
        
        console.log('Protected route profile response:', profileResponse);

        // Handle backend response format
        const userData = profileResponse.admin || profileResponse.user || profileResponse;
        
        if (!userData) {
          throw new Error('Failed to get profile - no user data');
        }

        // Verify user has correct admin role
        if (adminType === 'super' && !adminAuth.isSuperAdmin(userData) && userData.role !== 'SUPER_ADMIN') {
          throw new Error('Unauthorized: Not a super admin');
        }

        if (adminType === 'institute' && !adminAuth.isInstituteAdmin(userData) && userData.role !== 'INSTITUTE_ADMIN') {
          throw new Error('Unauthorized: Not an institute admin');
        }

        console.log('Protected route auth successful:', userData);
        setUser(userData);
        setLoading(false);

      } catch (error) {
        console.error('Admin auth check failed:', error);
        console.error('Protected route error details:', error.response);
        setError(error.message);
        setLoading(false);
        
        // Redirect to appropriate login page
        const loginPath = adminType === 'super' 
          ? '/admin/super-admin/login' 
          : '/admin/institute-admin/login';
        
        console.log('Redirecting to login:', loginPath);
        router.push(loginPath);
      }
    };

    checkAdminAuth();
  }, [adminType, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => {
              const loginPath = adminType === 'super' 
                ? '/admin/super-admin/login' 
                : '/admin/institute-admin/login';
              router.push(loginPath);
            }}
            className="btn-primary"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default AdminProtectedRoute;