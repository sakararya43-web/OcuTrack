import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface TactileButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'navy' | 'teal' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  asChild?: boolean;
}

const variantClasses: Record<string, string> = {
  primary: 'bg-sky-700 text-white hover:bg-sky-800 border border-sky-700 hover:border-sky-800 shadow-sm',
  navy: 'bg-slate-900 text-white hover:bg-slate-800 border border-slate-900 hover:border-slate-800 shadow-sm',
  teal: 'bg-teal-700 text-white hover:bg-teal-800 border border-teal-700 hover:border-teal-800 shadow-sm',
  secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 border border-slate-200 hover:border-slate-300',
  outline: 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 hover:border-slate-400 shadow-sm',
  ghost: 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent',
  destructive: 'bg-rose-700 text-white hover:bg-rose-800 border border-rose-700 hover:border-rose-800 shadow-sm',
};

const sizeClasses: Record<string, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-sm',
};

export const TactileButton = React.forwardRef<HTMLButtonElement, TactileButtonProps>(
  ({ className, variant = 'primary', size = 'md', type = 'button', children, disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        type={type}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-md font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer transition-colors duration-150',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        {...(props as object)}
      >
        {children}
      </motion.button>
    );
  }
);

TactileButton.displayName = 'TactileButton';
