import React from 'react';
import { QualityStatus, AssessmentStatus } from '../../types/api';
import { formatStatusLabel } from '../../lib/formatters';

interface StatusBadgeProps {
  type: 'quality' | 'assessment' | 'consent' | 'change';
  status?: QualityStatus | AssessmentStatus | 'granted' | 'denied' | boolean | null;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, status, className = '' }) => {
  if (status === null || status === undefined) {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 ${className}`}>
        Not available
      </span>
    );
  }

  // Quality Status: acceptable, insufficient, pending
  if (type === 'quality') {
    switch (status) {
      case 'acceptable':
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-teal-50 text-teal-800 border border-teal-200 ${className}`}>
            Quality Acceptable
          </span>
        );
      case 'insufficient':
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 ${className}`}>
            Quality Insufficient
          </span>
        );
      case 'pending':
      default:
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 ${className}`}>
            Quality Pending
          </span>
        );
    }
  }

  // Assessment Status: created, uploaded, processing, complete, failed
  if (type === 'assessment') {
    switch (status) {
      case 'complete':
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 border border-slate-300 ${className}`}>
            Completed
          </span>
        );
      case 'processing':
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-sky-50 text-sky-800 border border-sky-200 animate-pulse ${className}`}>
            Processing
          </span>
        );
      case 'uploaded':
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-800 border border-indigo-200 ${className}`}>
            Uploaded
          </span>
        );
      case 'failed':
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-800 border border-rose-200 ${className}`}>
            Failed
          </span>
        );
      case 'created':
      default:
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 ${className}`}>
            Created
          </span>
        );
    }
  }

  // Consent Status: granted, denied
  if (type === 'consent') {
    if (status === 'granted') {
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 ${className}`}>
          Consent Confirmed
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-800 border border-rose-200 ${className}`}>
        Consent Pending
      </span>
    );
  }

  // Change detected: boolean
  if (type === 'change') {
    if (status === true) {
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-900 border border-amber-300 ${className}`}>
          Delta Flagged
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200 ${className}`}>
        No Notable Delta
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 ${className}`}>
      {formatStatusLabel(String(status))}
    </span>
  );
};
