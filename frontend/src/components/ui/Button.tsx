import React from 'react';
import { motion, MotionProps } from 'framer-motion';
import { cn } from '../../lib/utils';

export type ButtonVariant =
  | 'primary'
  | 'navy'
  | 'teal'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'destructive';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof MotionProps>,
    MotionProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-sky-700 text-white hover:bg-sky-800 border border-sky-700 hover:border-sky-800 shadow-sm',
  navy: 'bg-slate-900 text-white hover:bg-slate-800 border border-slate-900 hover:border-slate-800 shadow-sm',
  teal: 'bg-teal-700 text-white hover:bg-teal-800 border border-teal-700 hover:border-teal-800 shadow-sm',
  secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 border border-slate-200 hover:border-slate-300',
  outline: 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 hover:border-slate-400 shadow-sm',
  ghost: 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent',
  destructive: 'bg-rose-700 text-white hover:bg-rose-800 border border-rose-700 hover:border-rose-800 shadow-sm',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-sm',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', type = 'button', ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        type={type}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={cn(
          'group inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
