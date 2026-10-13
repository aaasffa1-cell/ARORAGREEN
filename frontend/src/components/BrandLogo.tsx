import React from 'react';
import { Link } from 'react-router-dom';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 'md',
  showWordmark = true,
}) => {
  const iconSize = size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-12 h-12' : 'w-8 h-8';
  const textSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-3xl' : 'text-xl';

  return (
    <Link to="/" className={`inline-flex items-center gap-3 group select-none ${className}`}>
      {/* Angular Emblem */}
      <div className={`relative ${iconSize} flex-shrink-0 transition-transform duration-300 group-hover:scale-105`}>
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full drop-shadow-[0_0_8px_rgba(0,245,160,0.4)]">
          <polygon points="50,6 92,24 82,78 50,96 18,78 8,24" fill="#071A20" stroke="#18333A" strokeWidth="3" />
          <path d="M50 18 L76 72 L62 72 L50 46 L38 72 L24 72 Z" fill="url(#brandGrad)" />
          <polygon points="50,32 58,56 42,56" fill="#050B10" />
          <polygon points="50,44 54,58 46,58" fill="#00F5A0" />
          <defs>
            <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00F5A0" />
              <stop offset="100%" stopColor="#00D9FF" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {showWordmark && (
        <div className="flex flex-col">
          <span className={`font-heading font-extrabold tracking-wider ${textSize} leading-none text-icewhite flex items-center gap-1.5`}>
            ARORA <span className="text-neongreen font-normal tracking-widest text-xs uppercase px-1.5 py-0.5 rounded bg-deepteal border border-aroraborder">ESPORTS</span>
          </span>
          <span className="text-[10px] tracking-[0.2em] uppercase text-subtext font-mono">
            FREE FIRE TOURNAMENTS
          </span>
        </div>
      )}
    </Link>
  );
};
