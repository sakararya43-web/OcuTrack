import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { NON_DIAGNOSTIC_DISCLAIMER } from '../../lib/constants';

export const DisclaimerBanner: React.FC = () => {
  return (
    <div className="bg-amber-50 border-b border-amber-200/80 px-4 py-2 text-xs text-amber-900 flex items-center justify-center gap-2 font-medium">
      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
      <span>{NON_DIAGNOSTIC_DISCLAIMER}</span>
    </div>
  );
};
