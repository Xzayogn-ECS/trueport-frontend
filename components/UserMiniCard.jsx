export default function UserMiniCard({ user }) {
  const name = user?.name || user?.firstName || 'User';
  const email = user?.email || '';
  const initials = String(name).trim().split(/\s+/).map(p => p[0]).slice(0,2).join('').toUpperCase();

  return (
    <div className="group flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-2xl shadow-sm transition hover:shadow-md">
      <div className="h-12 w-12 rounded-xl bg-primary-600 text-white flex items-center justify-center font-semibold">
        {initials || 'U'}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-gray-900 truncate">{name.split(' ')[0]}</div>
        <div className="text-xs text-gray-500 truncate">{email}</div>
      </div>
    </div>
  );
}
