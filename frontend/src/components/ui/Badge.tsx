import React from 'react';

interface BadgeProps {
  status: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, className = '' }) => {
  let colorClasses = 'bg-gray-800 text-gray-300 border-gray-700';

  const normalized = status.toLowerCase();

  if (
    normalized.includes('open') ||
    normalized.includes('confirmed') ||
    normalized.includes('verified') ||
    normalized.includes('published')
  ) {
    colorClasses = 'bg-emerald-950/80 text-neongreen border-neongreen/40 shadow-[0_0_10px_rgba(0,245,160,0.15)]';
  } else if (
    normalized.includes('pending') ||
    normalized.includes('submitted') ||
    normalized.includes('draft')
  ) {
    colorClasses = 'bg-amber-950/80 text-amber-300 border-amber-500/40';
  } else if (
    normalized.includes('live')
  ) {
    colorClasses = 'bg-red-950/80 text-red-400 border-red-500/50 animate-pulse';
  } else if (
    normalized.includes('closed') ||
    normalized.includes('completed')
  ) {
    colorClasses = 'bg-cyan-950/80 text-cyan border-cyan/40';
  } else if (
    normalized.includes('rejected') ||
    normalized.includes('cancelled') ||
    normalized.includes('suspended')
  ) {
    colorClasses = 'bg-rose-950/80 text-rose-400 border-rose-500/40';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-heading font-semibold uppercase tracking-wider border ${colorClasses} ${className}`}
    >
      {status}
    </span>
  );
};
