import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 bg-deepteal/30 border border-aroraborder rounded-xl ${className}`}
    >
      <div className="w-14 h-14 rounded-full bg-deepteal border border-aroraborder flex items-center justify-center mb-4 text-cyan shadow-sm">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="font-heading text-xl font-bold uppercase tracking-wider text-icewhite mb-2">
        {title}
      </h3>
      <p className="text-sm text-subtext max-w-md leading-relaxed mb-6">
        {description}
      </p>
      {actionText && onAction && (
        <Button variant="secondary" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};
