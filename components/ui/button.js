export function Button({ children, onClick, className = '', variant = 'default', asChild = false, ...props }) {
  const base =
    'inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2';
  const variants = {
    default: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
    outline: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-400',
    secondary: 'bg-white text-indigo-600 hover:bg-indigo-50 focus:ring-indigo-400',
    link: 'text-indigo-600 hover:text-indigo-800',
  };
  const cls = `${base} ${variants[variant] || ''} ${className}`;

  if (asChild) {
    const Comp = props.as || 'a';
    return (
      <Comp {...props} className={cls}>
        {children}
      </Comp>
    );
  }

  return (
    <button onClick={onClick} {...props} className={cls}>
      {children}
    </button>
  );
}
