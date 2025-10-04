import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { isAuthenticated, logout } from '../utils/auth';

const Navbar = () => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const auth = isAuthenticated();
    if (auth) {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      setUser(userData);
    } else {
      setUser(null);
    }
  }, [router.pathname]);

  // Check if current route is admin route
  const isAdminRoute = router.pathname.startsWith('/admin/');
  
  // Don't show navbar on admin routes
  if (isAdminRoute) {
    return null;
  }

  const handleLogout = () => {
    logout();
    setOpen(false);
    router.push('/');
  };

  const NavLink = ({ href, children, exact = false }) => {
    const active = exact ? router.pathname === href : router.pathname.startsWith(href);
    return (
      <Link
        href={href}
        onClick={() => setOpen(false)}
        className={`block px-3 py-2 rounded-md text-sm font-medium ${
          active ? 'text-primary-600 bg-primary-50' : 'text-gray-700 hover:text-primary-600'
        }`}
      >
        {children}
      </Link>
    );
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Brand */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/" className="text-lg sm:text-xl font-bold text-primary-600 truncate">TruePortMe</Link>
            <span className="hidden md:inline-block text-xs text-gray-500">Portfolio & verifications</span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center space-x-2">
            {user ? (
              <>
                {user.role === 'VERIFIER' ? (
                  <>
                    <NavLink href="/verifier/dashboard">Dashboard</NavLink>
                    <NavLink href="/verifier/requests">Requests</NavLink>
                    <NavLink href="/verifier/students">Students</NavLink>
                  </>
                ) : (
                  <>
                    <NavLink href="/dashboard">Dashboard</NavLink>
                    <NavLink href="/experiences">Experiences</NavLink>
                    <NavLink href="/education">Education</NavLink>
                    <NavLink href="/projects">Projects</NavLink>
                  </>
                )}
                <NavLink href="/profile" exact>Profile</NavLink>
                <button
                  onClick={handleLogout}
                  className="ml-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-red-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600">Login</Link>
                <Link href="/auth/register" className="ml-2 inline-flex items-center px-3 py-2 rounded-md text-sm font-medium btn-primary">Sign Up</Link>
              </>
            )}
          </nav>

          {/* Mobile controls */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setOpen((s) => !s)}
              aria-label="Toggle menu"
              aria-expanded={open}
              className="p-2 rounded-md inline-flex items-center justify-center text-gray-700 hover:bg-gray-100"
            >
              {!open ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu panel */}
      <div className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${open ? 'max-h-[80vh] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-3 pt-2 pb-3 space-y-1 bg-white border-t border-gray-100 shadow-lg">
          {user ? (
            <>
              {user.role === 'VERIFIER' ? (
                <>
                  <NavLink href="/verifier/dashboard">Dashboard</NavLink>
                  <NavLink href="/verifier/requests">Requests</NavLink>
                  <NavLink href="/verifier/students">Students</NavLink>
                </>
              ) : (
                <>
                  <NavLink href="/dashboard">Dashboard</NavLink>
                  <NavLink href="/experiences">Experiences</NavLink>
                  <NavLink href="/education">Education</NavLink>
                  <NavLink href="/projects">Projects</NavLink>
                </>
              )}

              <NavLink href="/profile" exact>Profile</NavLink>

              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-3 rounded-md text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" onClick={() => setOpen(false)} className="block px-3 py-3 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50">Login</Link>
              <Link href="/auth/register" onClick={() => setOpen(false)} className="block px-3 py-3 rounded-md text-sm font-medium text-center bg-primary-600 text-white hover:bg-primary-700">Sign Up</Link>
            </>
          )}
        </div>

        <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
          <div className="flex items-center justify-center sm:justify-between flex-wrap gap-2">
            <span>© {new Date().getFullYear()} TruePortMe</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
