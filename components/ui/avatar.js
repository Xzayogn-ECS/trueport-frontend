export function Avatar({ children, className = '' }) {
  return (
    <div className={`relative inline-flex h-10 w-10 overflow-hidden rounded-full bg-slate-200 ${className}`}>
      {children}
    </div>
  );
}

export function AvatarImage({ src, alt = '', className = '' }) {
  if (!src) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={`h-full w-full object-cover ${className}`} />;
}

export function AvatarFallback({ children, className = '' }) {
  return (
    <div className={`flex h-full w-full items-center justify-center text-sm font-medium text-slate-600 ${className}`}>
      {children}
    </div>
  );
}
