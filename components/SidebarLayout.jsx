import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { isAuthenticated, logout } from '../utils/auth';

// Minimal icon set to keep markup small and consistent
const Icon = ({ name, className = 'w-5 h-5' }) => {
  const cn = `${className}`;
  switch (name) {
    case 'dashboard':
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 13h6V4H4v9zm0 7h6v-5H4v5zm10 0h6V11h-6v9zm0-17v5h6V3h-6z"/></svg>
      );
    case 'experience':
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M6 3h12M6 21h12M9 7v14M15 7v14"/></svg>
      );
    case 'education':
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z"/><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 14l6 3v4l-6-3-6 3v-4l6-3z"/></svg>
      );
    case 'projects':
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M7 7h10v10H7z"/><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 3h18v6H3zM3 15h18v6H3z"/></svg>
      );
    case 'verifier':
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0z"/><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
      );
    case 'requests':
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4"/></svg>
      );
    case 'students':
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
      );
    case 'events':
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
      );
    case 'collaboration':
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
      );
    case 'settings':
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317a1 1 0 011.35-.936l1.93.644a1 1 0 00.945-.192l1.52-1.216a1 1 0 011.414.09l1.414 1.414a1 1 0 01.09 1.414l-1.216 1.52a1 1 0 00-.192.945l.644 1.93a1 1 0 01-.936 1.35l-2.02.29a1 1 0 00-.8.6l-.78 1.86a1 1 0 01-1.83 0l-.78-1.86a1 1 0 00-.8-.6l-2.02-.29a1 1 0 01-.936-1.35l.644-1.93a1 1 0 00-.192-.945l-1.216-1.52a1 1 0 01.09-1.414l1.414-1.414a1 1 0 011.414-.09l1.52 1.216a1 1 0 00.945.192l1.93-.644z"/><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
      );
    case 'logout':
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7"/><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M7 16v1a3 3 0 003 3h4a3 3 0 003-3V7a3 3 0 00-3-3h-4a3 3 0 00-3 3v1"/></svg>
      );
    case 'search':
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"/></svg>
      );
    default:
      return null;
  }
};

const NavItem = ({ href, icon, label, badge, active }) => (
  <Link
    href={href}
    aria-current={active ? 'page' : undefined}
    className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
      active
        ? 'bg-primary-50 text-primary-800 font-semibold'
        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50 font-medium opacity-80 hover:opacity-100'
    }`}
  >
    <span className={`inline-flex items-center justify-center rounded-lg bg-white border p-2 ${
      active ? 'border-primary-200 text-primary-700' : 'border-gray-200 text-gray-600 group-hover:border-gray-300'
    }`}>
      <Icon name={icon} className="w-4 h-4" />
    </span>
    <span className="flex-1 truncate">{label}</span>
    {typeof badge === 'string' || typeof badge === 'number' ? (
      <span className="ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{badge}</span>
    ) : null}
  </Link>
);

export default function SidebarLayout({ children, title = '' }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      try {
        setUser(JSON.parse(localStorage.getItem('user') || '{}'));
      } catch {}
    }
  }, [router.pathname]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    const handleRouteChange = () => {
      setOpen(false);
    };

    router.events?.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events?.off('routeChangeComplete', handleRouteChange);
    };
  }, [router]);

  const isVerifier = user?.role === 'VERIFIER';

  const items = useMemo(() => {
    if (isVerifier) {
      // Verifiers only see verifier-specific pages and profile
      return [
        { href: '/verifier/dashboard', icon: 'verifier', label: 'Verifier Dashboard' },
        { href: '/verifier/requests', icon: 'requests', label: 'Verification Requests' },
        { href: '/verifier/students', icon: 'students', label: 'Institute Students' },
        { href: '/verifier/events', icon: 'events', label: 'Events' },
        { href: '/profile', icon: 'settings', label: 'Profile' },
      ];
    }
    // Regular users see their portfolio management pages
    return [
      { href: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
      { href: '/experiences', icon: 'experience', label: 'Experiences' },
      { href: '/education', icon: 'education', label: 'Education' },
      { href: '/projects', icon: 'projects', label: 'Projects' },
      { href: '/collaborations', icon: 'collaboration', label: 'Collaborations' },
      { href: '/profile', icon: 'settings', label: 'Profile' },
    ];
  }, [isVerifier]);

  useEffect(() => {
    // Mark that sidebar layout is active so _app can avoid rendering the top Navbar
    document.body.classList.add('with-sidebar');
    return () => document.body.classList.remove('with-sidebar');
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile backdrop overlay */}
      {open && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-gray-100 shadow-sm transform transition-transform duration-200 ease-out ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="h-16 flex items-center gap-2 px-4 border-b border-gray-100">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 text-white flex items-center justify-center font-bold">TP</div>
          <div className="font-semibold text-gray-900">TruePortMe</div>
        </div>

        <nav className="px-3 py-4 space-y-1 overflow-y-auto h-[calc(100vh-4rem)]">
          <div className="text-xs text-gray-400 font-medium px-3 mb-2">Menu</div>
          {items.map((it) => (
            <NavItem
              key={it.href}
              href={it.href}
              icon={it.icon}
              label={it.label}
              active={router.pathname === it.href || router.pathname.startsWith(`${it.href}/`)}
            />
          ))}

          <div className="mt-6 text-xs text-gray-400 font-medium px-3 mb-2">General</div>
          <Link href="/profile" className="group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50">
            <span className="inline-flex items-center justify-center rounded-lg bg-white border border-gray-200 p-2 text-gray-700 group-hover:border-gray-300">
              <Icon name="settings" className="w-4 h-4" />
            </span>
            Settings
          </Link>
          {/* Quick-jump anchors for Profile tabs to reduce scrolling */}
          {router.pathname === '/profile' && (
            <div className="mt-2 pl-12 space-y-1">
              <a href="#tab-profile" className="block text-xs text-gray-500 hover:text-gray-800">Personal Info</a>
              <a href="#tab-institution" className="block text-xs text-gray-500 hover:text-gray-800">Institution</a>
              <a href="#tab-portfolio" className="block text-xs text-gray-500 hover:text-gray-800">Portfolio Visibility</a>
              <a href="#tab-settings" className="block text-xs text-gray-500 hover:text-gray-800">Settings</a>
            </div>
          )}
          <button
            onClick={() => { logout(); router.push('/'); }}
            className="w-full text-left group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <span className="inline-flex items-center justify-center rounded-lg bg-white border border-red-200 p-2 text-red-600 group-hover:border-red-300">
              <Icon name="logout" className="w-4 h-4" />
            </span>
            Logout
          </button>

          {/* Share portfolio section - only for regular users, not verifiers */}
          {!isVerifier && (
            <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 text-white">
              <div className="text-sm font-medium">Share your portfolio</div>
              <p className="text-xs text-white/90 mt-1">Copy your public link from Profile and start sharing.</p>
              <Link href="/profile" className="inline-block mt-3 text-xs bg-white/10 hover:bg-white/20 transition-colors px-3 py-1.5 rounded-lg">Go to Profile</Link>
            </div>
          )}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 md:pl-72 w-full">
        {/* Topbar */}
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-gray-100">
          <div className="h-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-700 outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                aria-label="Toggle sidebar"
                aria-expanded={open}
                onClick={() => setOpen((s) => !s)}
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
              </button>
              <div className="font-semibold text-gray-900 truncate">{title}</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center bg-gray-50 rounded-xl px-3 py-2 border border-gray-200">
                <Icon name="search" className="w-4 h-4 text-gray-500" />
                <input
                  type="search"
                  placeholder="Search…"
                  className="bg-transparent outline-none text-sm ml-2 placeholder:text-gray-400"
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-brand-grad text-white flex items-center justify-center text-xs font-bold">
                  {(user?.name || user?.firstName || 'U')?.[0] || 'U'}
                </div>
                <div className="hidden sm:block leading-tight">
                  <div className="text-sm font-semibold text-gray-900 truncate">{(user?.name || user?.firstName || 'User').split(' ')[0]}</div>
                  <div className="text-xs text-gray-500 truncate max-w-[180px]">{user?.email || ''}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">{children}</main>
      </div>
    </div>
  );
}
