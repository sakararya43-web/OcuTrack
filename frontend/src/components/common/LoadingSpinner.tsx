import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { OpticalPupilLoader } from './OpticalPupilLoader';

interface LoadingSpinnerProps {
  label?: string;
  sublabel?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'pupil';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  label = 'Loading data...',
  sublabel,
  className = '',
  size = 'md',
  variant = 'spinner',
}) => {
  if (variant === 'pupil') {
    return (
      <OpticalPupilLoader
        size={size}
        label={label}
        sublabel={sublabel}
        className={className}
      />
    );
  }

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10',
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('flex flex-col items-center justify-center p-8 text-slate-600 gap-3', className)}
    >
      <Loader2 className={cn(sizeClasses[size], 'animate-spin text-sky-700')} aria-hidden="true" />
      {label && <p className="text-sm font-medium text-slate-600">{label}</p>}
      {sublabel && <p className="text-xs text-slate-500 font-mono">{sublabel}</p>}
    </div>
  );
};
