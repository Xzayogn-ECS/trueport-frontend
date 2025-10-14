import { useState } from 'react';

export function TooltipProvider({ children }) {
  return <>{children}</>;
}

export function Tooltip({ children }) {
  return <>{children}</>;
}

export function TooltipTrigger({ children, onMouseEnter, onMouseLeave, setOpen }) {
  return (
    <span
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      className="inline-block"
    >
      {children}
    </span>
  );
}

export function TooltipContent({ children, open }) {
  if (!open) return null;
  return (
    <div className="absolute z-50 mt-1 rounded-md bg-slate-800 px-2 py-1 text-xs text-white shadow-lg">
      {children}
    </div>
  );
}

// Wrapper for inline usage
export function SimpleTooltip({ label, children }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative">
      <TooltipTrigger setOpen={setOpen}>{children}</TooltipTrigger>
      <TooltipContent open={open}>{label}</TooltipContent>
    </span>
  );
}
