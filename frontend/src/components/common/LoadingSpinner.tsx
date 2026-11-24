import React from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '../../i18n';

interface LoadingSpinnerProps {
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  label,
  className = '',
  size = 'md',
}) => {
  const { t } = useTranslation();
  const displayLabel = label ?? t('errors.loadingData');
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
  };

  return (
    <div className={`flex flex-col items-center justify-center p-8 gap-2.5 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-[#121316]`} />
      {displayLabel && <p className="text-xs font-mono text-[#575965] font-medium tracking-normal">{displayLabel}</p>}
    </div>
  );
};
