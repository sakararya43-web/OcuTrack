import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  titleId?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  maxWidthClassName?: string;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  titleId = 'dialog-title',
  icon,
  children,
  maxWidthClassName = 'max-w-lg',
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-4"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'bg-white rounded-md shadow-xl w-full border border-slate-200 overflow-hidden',
          maxWidthClassName
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2 text-slate-900">
            {icon}
            <h2 id={titleId} className="font-semibold text-base">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="text-slate-500 hover:text-slate-900 p-1 rounded-md hover:bg-slate-200/70 transition-colors duration-150"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};
