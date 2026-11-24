import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface PulseIndicatorProps {
  status: 'active' | 'inactive' | 'warning';
  label?: string;
  className?: string;
}

const statusColors = {
  active: 'bg-teal-500',
  inactive: 'bg-slate-400',
  warning: 'bg-rose-500',
};

const ringColors = {
  active: 'bg-teal-400',
  inactive: 'bg-slate-300',
  warning: 'bg-rose-400',
};

export const PulseIndicator: React.FC<PulseIndicatorProps> = ({ status, label, className }) => {
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span className="relative flex h-2 w-2">
        {status === 'active' && (
          <motion.span
            className={cn('absolute inline-flex h-full w-full rounded-sm opacity-75', ringColors[status])}
            animate={{ scale: [1, 1.8, 1], opacity: [0.75, 0, 0.75] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        <span className={cn('relative inline-flex rounded-sm h-2 w-2', statusColors[status])} />
      </span>
      {label && <span className="text-xs">{label}</span>}
    </span>
  );
};
