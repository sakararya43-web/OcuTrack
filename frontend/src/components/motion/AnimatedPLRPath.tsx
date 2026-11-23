import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedPLRPathProps {
  variant?: 'reflex' | 'pursuit';
  className?: string;
  height?: number;
}

export const AnimatedPLRPath: React.FC<AnimatedPLRPathProps> = ({
  variant = 'reflex',
  className,
  height = 80,
}) => {
  const reflexPath = 'M 10,30 L 60,30 C 75,30 80,32 92,54 C 104,76 122,84 145,84 C 175,84 205,64 250,52 C 290,42 330,36 390,34';
  const pursuitPath = 'M 10,50 C 40,20 70,20 100,50 C 130,80 160,80 190,50 C 220,20 250,20 280,50 C 310,80 340,80 370,50 L 390,50';
  const selectedPath = variant === 'reflex' ? reflexPath : pursuitPath;

  return (
    <svg
      viewBox="0 0 400 100"
      preserveAspectRatio="none"
      className={className}
      style={{ height }}
      aria-hidden="true"
    >
      {/* Grid lines */}
      <line x1="0" y1="25" x2="400" y2="25" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3 4" opacity="0.3" />
      <line x1="0" y1="50" x2="400" y2="50" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3 4" opacity="0.3" />
      <line x1="0" y1="75" x2="400" y2="75" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3 4" opacity="0.3" />
      <line x1="100" y1="0" x2="100" y2="100" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3 4" opacity="0.2" />
      <line x1="200" y1="0" x2="200" y2="100" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3 4" opacity="0.2" />
      <line x1="300" y1="0" x2="300" y2="100" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3 4" opacity="0.2" />

      {/* Reference trace (static, dim) */}
      <path d={selectedPath} fill="none" stroke="#334155" strokeWidth="1.5" opacity="0.25" />

      {/* Animated active trace */}
      <motion.path
        d={selectedPath}
        fill="none"
        stroke="#0ea5e9"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 1.8, ease: 'easeOut' }}
      />
    </svg>
  );
};
