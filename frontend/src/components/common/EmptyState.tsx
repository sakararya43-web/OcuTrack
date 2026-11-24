import React from 'react';
import { FolderOpen } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center bg-white rounded-lg border border-dashed border-slate-200 ${className}`}>
      <div className="w-12 h-12 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center text-[#475569] mb-4">
        {icon || <FolderOpen className="w-5 h-5" />}
      </div>
      <h3 className="text-sm font-semibold text-[#0F172A] tracking-tight mb-1">{title}</h3>
      <p className="text-xs text-[#475569] max-w-sm mb-5 leading-relaxed font-sans">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};
