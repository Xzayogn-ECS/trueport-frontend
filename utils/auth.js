import Cookies from 'js-cookie';

export const setAuthToken = (token) => {
  Cookies.set('auth-token', token, { expires: 7 }); // 7 days
};

export const getAuthToken = () => {
  return Cookies.get('auth-token');
};

export const removeAuthToken = () => {
  Cookies.remove('auth-token');
};

export const isAuthenticated = () => {
  const token = getAuthToken();
  return !!token;
};

export const logout = () => {
  removeAuthToken();
  localStorage.removeItem('user');
  
  // Check if current page is admin route
  const currentPath = window.location.pathname;
  if (currentPath.startsWith('/admin/super-admin')) {
    window.location.href = '/admin/super-admin/login';
  } else if (currentPath.startsWith('/admin/institute-admin')) {
    window.location.href = '/admin/institute-admin/login';
  } else {
    window.location.href = '/auth/login';
  }
};