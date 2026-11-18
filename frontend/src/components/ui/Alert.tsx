import React from 'react';
import { cn } from '../../lib/utils';

export type AlertVariant = 'clinical' | 'info' | 'teal' | 'destructive';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  icon?: React.ReactNode;
}

const variantClasses: Record<AlertVariant, string> = {
  clinical: 'bg-slate-100 border-slate-300 text-slate-900',
  info: 'bg-sky-50 border-sky-200 text-sky-950',
  teal: 'bg-teal-50 border-teal-200 text-teal-950',
  destructive: 'bg-rose-50 border-rose-200 text-rose-950',
};

export const Alert: React.FC<AlertProps> = ({
  variant = 'clinical',
  title,
  icon,
  children,
  className,
  role,
  ...props
}) => {
  const computedRole = role ?? (variant === 'destructive' ? 'alert' : 'status');

  return (
    <div
      role={computedRole}
      className={cn('rounded-md border p-4 text-xs', variantClasses[variant], className)}
      {...props}
    >
      <div className="flex items-start gap-3">
        {icon && <div className="flex-shrink-0 mt-0.5">{icon}</div>}
        <div className="flex-1 space-y-1">
          {title && <h4 className="text-sm font-semibold leading-snug">{title}</h4>}
          <div className="leading-relaxed">{children}</div>
        </div>
      </div>
    </div>
  );
};
