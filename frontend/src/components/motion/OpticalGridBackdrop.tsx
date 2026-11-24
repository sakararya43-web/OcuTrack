import React from 'react';
import { motion } from 'framer-motion';

interface OpticalGridBackdropProps {
  className?: string;
}

export const OpticalGridBackdrop: React.FC<OpticalGridBackdropProps> = ({ className }) => {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
      aria-hidden="true"
    >
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        style={{ pointerEvents: 'none' }}
      >
        <defs>
          <pattern id="clinical-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
          <pattern id="clinical-grid-major" width="200" height="200" patternUnits="userSpaceOnUse">
            <rect width="200" height="200" fill="url(#clinical-grid)" />
            <path d="M 200 0 L 0 0 0 200" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#clinical-grid-major)" className="text-slate-200" />
      </svg>
    </motion.div>
  );
};
