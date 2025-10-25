import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { removeAuthToken } from '../utils/auth';

const Icon = ({ name, className = 'w-5 h-5' }) => {
  const cn = `${className}`;
  switch (name) {
    case 'dashboard':
      return <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 13h6V4H4v9zm0 7h6v-5H4v5zm10 0h6V11h-6v9zm0-17v5h6V3h-6z"/></svg>;
    case 'users':
      return <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M17 20v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M23 20v-2a4 4 0 00-3-3.87"/></svg>;
    case 'requests':
      return <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h18M3 17h18"/></svg>;
    case 'institutions':
      return <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 10l9-7 9 7v10a2 2 0 01-2 2H5a2 2 0 01-2-2V10z"/></svg>;
    case 'admins':
      return <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 12c2.21 0 4-1.79 4-4S14.21 4 12 4s-4 1.79-4 4 1.79 4 4 4zm0 2c-3.31 0-6 1.79-6 4v2h12v-2c0-2.21-2.69-4-6-4z"/></svg>;
    case 'events':
      return <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>;
    case 'settings':
      return <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317a1 1 0 011.35-.936l1.93.644a1 1 0 00.945-.192l1.52-1.216a1 1 0 011.414.09l1.414 1.414a1 1 0 01.09 1.414l-1.216 1.52a1 1 0 00-.192.945l.644 1.93a1 1 0 01-.936 1.35l-2.02.29a1 1 0 00-.8.6l-.78 1.86a1 1 0 01-1.83 0l-.78-1.86a1 1 0 00-.8-.6l-2.02-.29a1 1 0 01-.936-1.35l.644-1.93a1 1 0 00-.192-.945l-1.216-1.52a1 1 0 01.09-1.414l1.414-1.414a1 1 0 011.414-.09l1.52 1.216a1 1 0 00.945.192l1.93-.644z"/><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>;
    case 'logout':
      return <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="21" y1="12" x2="9" y2="12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
    default:
      return null;
  }
};

const NavItem = ({ href, icon, label, active, onClick }) => {
  const handleClick = (e) => {
    if (onClick) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      aria-current={active ? 'page' : undefined}
      className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
        active ? 'bg-primary-50 text-primary-800 font-semibold' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
      }`}
    >
      <span className={`inline-flex items-center justify-center rounded-lg bg-white border p-2 ${
        active ? 'border-primary-200 text-primary-700' : 'border-gray-200 text-gray-600 group-hover:border-gray-300'
      }`}>
        <Icon name={icon} className="w-4 h-4" />
      </span>
      <span className="flex-1 truncate">{label}</span>
    </Link>
  );
};

export default function AdminSidebarLayout({ children, title = '' }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [currentHash, setCurrentHash] = useState('');

  useEffect(() => {
    try { setUser(JSON.parse(localStorage.getItem('user') || '{}')); } catch {}
  }, [router.pathname]);

  useEffect(() => {
    // Update current hash on mount and when hash changes
    const updateHash = () => {
      setCurrentHash(window.location.hash.replace('#', ''));
    };
    
    updateHash();
    window.addEventListener('hashchange', updateHash);
    return () => window.removeEventListener('hashchange', updateHash);
  }, []);

  const handleLogout = () => {
    removeAuthToken();
    const loginPath = adminType === 'SUPER' ? '/admin/super-admin/login' : '/admin/institute-admin/login';
    router.push(loginPath);
  };

  const adminType = useMemo(() => {
    if (router.pathname.startsWith('/admin/institute-admin')) return 'INSTITUTE';
    if (router.pathname.startsWith('/admin/super-admin')) return 'SUPER';
    return 'UNKNOWN';
  }, [router.pathname]);

  const items = useMemo(() => {
    if (adminType === 'INSTITUTE') {
      return [
        { href: '/admin/institute-admin/dashboard', icon: 'dashboard', label: 'Dashboard', hash: '' },
        { href: '/admin/institute-admin/dashboard#users', icon: 'users', label: 'Users', hash: 'users' },
        // Direct pages for student management and profile requests
        { href: '/admin/institute-admin/students', icon: 'users', label: 'Students' },
        { href: '/admin/institute-admin/profile-requests', icon: 'requests', label: 'Profile Requests' },
        { href: '/admin/institute-admin/dashboard#requests', icon: 'requests', label: 'Requests', hash: 'requests' },
        { href: '/admin/institute-admin/events', icon: 'events', label: 'Events' },
        { href: '/admin/institute-admin/dashboard#settings', icon: 'settings', label: 'Settings', hash: 'settings' },
      ];
    }
    if (adminType === 'SUPER') {
      return [
        { href: '/admin/super-admin/dashboard', icon: 'dashboard', label: 'Overview', hash: '' },
        { href: '/admin/super-admin/dashboard#institutions', icon: 'institutions', label: 'Institutions', hash: 'institutions' },
        { href: '/admin/super-admin/dashboard#admins', icon: 'admins', label: 'Institute Admins', hash: 'admins' },
        { href: '/admin/super-admin/dashboard#settings', icon: 'settings', label: 'Settings', hash: 'settings' },
      ];
    }
    return [];
  }, [adminType]);

  useEffect(() => {
    document.body.classList.add('with-sidebar');
    return () => document.body.classList.remove('with-sidebar');
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-gray-100 shadow-sm hidden md:block">
        <div className="h-16 flex items-center gap-2 px-4 border-b border-gray-100">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 text-white flex items-center justify-center font-bold">TP</div>
          <div className="font-semibold text-gray-900">{adminType === 'SUPER' ? 'Super Admin' : 'Institute Admin'}</div>
        </div>
        <nav className="px-3 py-4 space-y-1 overflow-y-auto h-[calc(100vh-4rem)] flex flex-col">
          <div>
            <div className="text-xs text-gray-400 font-medium px-3 mb-2">Menu</div>
            {items.map((it) => {
              // Check if it's a hash-based nav item or a regular link
              const isHashNav = it.hash !== undefined;
              const isActive = isHashNav 
                ? it.hash === currentHash
                : router.pathname === it.href || router.pathname.startsWith(`${it.href}/`);
              
              const handleNavClick = () => {
                if (!isHashNav) {
                  // Regular navigation - let Link handle it
                  return;
                }

                // For hash-based dashboard sections, ensure we navigate to the dashboard route
                const dashboardBase = '/admin/institute-admin/dashboard';
                if (router.pathname !== dashboardBase) {
                  // Navigate to the dashboard page with hash via router to ensure route change
                  router.push(it.href);
                  return;
                }

                // We're already on the dashboard; update hash in-place
                if (it.hash) {
                  window.location.hash = it.hash;
                } else {
                  // Remove hash for overview/dashboard
                  const url = window.location.pathname + window.location.search;
                  history.replaceState(null, '', url);
                  setCurrentHash('');
                  // Trigger hashchange for the dashboard to update
                  window.dispatchEvent(new HashChangeEvent('hashchange'));
                }
              };

              return (
                <NavItem
                  key={it.href}
                  href={it.href}
                  icon={it.icon}
                  label={it.label}
                  active={isActive}
                  onClick={isHashNav ? handleNavClick : undefined}
                />
              );
            })}
          </div>
          
          <div className="mt-auto pt-4 border-t border-gray-100">
            <button
              onClick={handleLogout}
              className="group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 text-red-600 hover:text-red-700 hover:bg-red-50 w-full"
            >
              <span className="inline-flex items-center justify-center rounded-lg bg-white border border-red-200 p-2 text-red-600 group-hover:border-red-300">
                <Icon name="logout" className="w-4 h-4" />
              </span>
              <span className="flex-1 truncate text-left">Logout</span>
            </button>
          </div>
        </nav>
      </aside>

      <div className="flex-1 md:pl-72 w-full">
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-gray-100">
          <div className="h-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <div className="font-semibold text-gray-900 truncate">{title}</div>
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-brand-grad text-white flex items-center justify-center text-xs font-bold">{(user?.name || 'A')?.[0] || 'A'}</div>
              <div className="hidden sm:block leading-tight">
                <div className="text-sm font-semibold text-gray-900 truncate">{(user?.name || 'Admin').split(' ')[0]}</div>
                <div className="text-xs text-gray-500 truncate max-w-[180px]">{user?.email || ''}</div>
              </div>
            </div>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">{children}</main>
      </div>
    </div>
  );
}
