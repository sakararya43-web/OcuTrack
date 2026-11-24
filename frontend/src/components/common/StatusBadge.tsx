import React from 'react';
import { QualityStatus, AssessmentStatus } from '../../types/api';
import { formatStatusLabel } from '../../lib/formatters';
import { useTranslation } from '../../i18n';

interface StatusBadgeProps {
  type: 'quality' | 'assessment' | 'consent' | 'change';
  status?: QualityStatus | AssessmentStatus | 'granted' | 'denied' | boolean | null;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, status, className = '' }) => {
  const { t } = useTranslation();

  if (status === null || status === undefined) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0] ${className}`}>
        {t('status.unavailable')}
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
            {t('status.acceptable')}
          </span>
        );
      case 'insufficient':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA] ${className}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#B91C1C]" />
            {t('status.insufficient')}
          </span>
        );
      case 'pending':
      default:
        return (
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0] ${className}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#64748B]" />
            {t('status.pending')}
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
            {t('status.complete')}
          </span>
        );
      case 'processing':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] ${className}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#B45309] animate-pulse" />
            {t('status.processing')}
          </span>
        );
      case 'uploaded':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] ${className}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#1D4ED8]" />
            {t('status.uploaded')}
          </span>
        );
      case 'failed':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA] ${className}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#B91C1C]" />
            {t('status.failed')}
          </span>
        );
      case 'created':
      default:
        return (
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0] ${className}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#64748B]" />
            {t('status.created')}
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
          {t('status.consentVerified')}
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA] ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-[#B91C1C]" />
        {t('status.consentDenied')}
      </span>
    );
  }

  // Feature Delta Change Status: boolean
  if (type === 'change') {
    if (status === true) {
      return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#B45309]" />
          {t('status.deltaObserved')}
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0] ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-[#64748B]" />
        {t('status.stableNoDrift')}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0] ${className}`}>
      {formatStatusLabel(String(status))}
    </span>
  );
};
