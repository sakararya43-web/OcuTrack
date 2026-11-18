import React from 'react';
import { cn } from '../../lib/utils';

export type BadgeVariant =
  | 'default'
  | 'navy'
  | 'medical'
  | 'teal'
  | 'destructive'
  | 'outline';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-700 border border-slate-200',
  navy: 'bg-slate-900 text-white border border-slate-900',
  medical: 'bg-sky-50 text-sky-900 border border-sky-200',
  teal: 'bg-teal-50 text-teal-900 border border-teal-200',
  destructive: 'bg-rose-50 text-rose-800 border border-rose-200',
  outline: 'bg-white text-slate-700 border border-slate-300',
};

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  ...props
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap',
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
};
