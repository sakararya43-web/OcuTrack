import React from 'react';
import { QualityStatus, AssessmentStatus, ConsentStatus } from '../../types/api';
import { formatStatusLabel } from '../../lib/formatters';
import { Badge } from '../ui/Badge';

interface StatusBadgeProps {
  type: 'quality' | 'assessment' | 'consent' | 'change';
  status?: QualityStatus | AssessmentStatus | ConsentStatus | boolean | null;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, status, className = '' }) => {
  if (status === null || status === undefined) {
    return (
      <Badge variant="default" className={className}>
        Not available
      </Badge>
    );
  }

  if (type === 'quality') {
    switch (status) {
      case 'acceptable':
        return (
          <Badge variant="teal" className={className}>
            Quality Acceptable
          </Badge>
        );
      case 'insufficient':
        return (
          <Badge variant="destructive" className={className}>
            Quality Insufficient
          </Badge>
        );
      case 'pending':
      default:
        return (
          <Badge variant="default" className={className}>
            Quality Pending
          </Badge>
        );
    }
  }

  if (type === 'assessment') {
    switch (status) {
      case 'complete':
        return (
          <Badge variant="teal" className={className}>
            Completed
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="medical" className={className}>
            Processing
          </Badge>
        );
      case 'uploaded':
        return (
          <Badge variant="medical" className={className}>
            Uploaded
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive" className={className}>
            Failed
          </Badge>
        );
      case 'created':
      default:
        return (
          <Badge variant="default" className={className}>
            Created
          </Badge>
        );
    }
  }

  if (type === 'consent') {
    if (status === 'granted') {
      return (
        <Badge variant="teal" className={className}>
          Consent Confirmed
        </Badge>
      );
    }
    if (status === 'withdrawn') {
      return (
        <Badge variant="destructive" className={className}>
          Consent Withdrawn
        </Badge>
      );
    }
    if (status === 'denied') {
      return (
        <Badge variant="destructive" className={className}>
          Consent Denied
        </Badge>
      );
    }
    return (
      <Badge variant="default" className={className}>
        Consent Pending
      </Badge>
    );
  }

  if (type === 'change') {
    if (status === true) {
      return (
        <Badge variant="medical" className={className}>
          Delta Flagged
        </Badge>
      );
    }
    return (
      <Badge variant="default" className={className}>
        No Notable Delta
      </Badge>
    );
  }

  return (
    <Badge variant="default" className={className}>
      {formatStatusLabel(String(status))}
    </Badge>
  );
};
