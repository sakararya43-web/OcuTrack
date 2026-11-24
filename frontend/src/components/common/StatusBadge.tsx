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
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0] ${className}`}>
        Unavailable
      </span>
    );
  }

  // Quality Status: acceptable, insufficient, pending
  if (type === 'quality') {
    switch (status) {
      case 'acceptable':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#F0FDF4] text-[#0F766E] border border-[#BBF7D0] ${className}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E]" />
            Acceptable
          </span>
        );
      case 'insufficient':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA] ${className}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#B91C1C]" />
            Insufficient
          </span>
        );
      case 'pending':
      default:
        return (
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0] ${className}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#64748B]" />
            Pending
          </span>
        );
    }
  }

  // Assessment Status: created, uploaded, processing, complete, failed
  if (type === 'assessment') {
    switch (status) {
      case 'complete':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#F0FDF4] text-[#0F766E] border border-[#BBF7D0] ${className}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E]" />
            Complete
          </span>
        );
      case 'processing':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] ${className}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#B45309] animate-pulse" />
            Processing
          </span>
        );
      case 'uploaded':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] ${className}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#1D4ED8]" />
            Uploaded
          </span>
        );
      case 'failed':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA] ${className}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#B91C1C]" />
            Failed
          </span>
        );
      case 'created':
      default:
        return (
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0] ${className}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#64748B]" />
            Created
          </span>
        );
    }
  }

  // Consent Status: granted, denied
  if (type === 'consent') {
    if (status === 'granted') {
      return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#F0FDF4] text-[#0F766E] border border-[#BBF7D0] ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E]" />
          Consent Verified
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA] ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-[#B91C1C]" />
        Consent Denied
      </span>
    );
  }

  // Feature Delta Change Status: boolean
  if (type === 'change') {
    if (status === true) {
      return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#B45309]" />
          Delta Observed
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0] ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-[#64748B]" />
        Stable (No Drift)
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0] ${className}`}>
      {formatStatusLabel(String(status))}
    </span>
  );
};
