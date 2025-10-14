export function Badge({ children, className = '', variant = 'default' }) {
  const base =
    'inline-flex items-center rounded-full text-xs font-medium px-2 py-1 transition-all';
  const variants = {
    default: 'bg-indigo-100 text-indigo-700',
    outline: 'border border-slate-300 text-slate-700',
    secondary: 'bg-slate-100 text-slate-700',
  };
  return <span className={`${base} ${variants[variant] || ''} ${className}`}>{children}</span>;
}
