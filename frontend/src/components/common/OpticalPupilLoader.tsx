import React from 'react';
import { cn } from '../../lib/utils';

export interface OpticalPupilLoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
  sublabel?: string;
  className?: string;
}

const sizeMap = {
  sm: { container: 'w-10 h-10', svg: 40 },
  md: { container: 'w-16 h-16', svg: 64 },
  lg: { container: 'w-24 h-24', svg: 96 },
  xl: { container: 'w-32 h-32', svg: 128 },
};

export const OpticalPupilLoader: React.FC<OpticalPupilLoaderProps> = ({
  size = 'md',
  label,
  sublabel,
  className,
}) => {
  const { container } = sizeMap[size];

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('flex flex-col items-center justify-center text-center p-4 gap-3', className)}
    >
      <div className={cn('relative flex items-center justify-center', container)}>
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full text-slate-800 select-none pointer-events-none"
          aria-hidden="true"
        >
          {/* Calibrated Outer Ring with Graticule Tick Marks */}
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-slate-300"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="2 4"
            className="text-slate-300"
          />

          {/* Cardinal Optical Alignment Ticks */}
          <line x1="50" y1="2" x2="50" y2="8" stroke="currentColor" strokeWidth="1.5" className="text-teal-700" />
          <line x1="50" y1="92" x2="50" y2="98" stroke="currentColor" strokeWidth="1.5" className="text-teal-700" />
          <line x1="2" y1="50" x2="8" y2="50" stroke="currentColor" strokeWidth="1.5" className="text-teal-700" />
          <line x1="92" y1="50" x2="98" y2="50" stroke="currentColor" strokeWidth="1.5" className="text-teal-700" />

          {/* Intermediate Diagonal Ticks */}
          <line x1="18" y1="18" x2="22" y2="22" stroke="currentColor" strokeWidth="1" className="text-slate-300" />
          <line x1="82" y1="18" x2="78" y2="22" stroke="currentColor" strokeWidth="1" className="text-slate-300" />
          <line x1="18" y1="82" x2="22" y2="78" stroke="currentColor" strokeWidth="1" className="text-slate-300" />
          <line x1="82" y1="82" x2="78" y2="78" stroke="currentColor" strokeWidth="1" className="text-slate-300" />

          {/* Middle Iris Aperture Guide Ring */}
          <circle
            cx="50"
            cy="50"
            r="32"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-sky-700/40"
          />

          {/* Contracting and Expanding Pupil Core (Pupillary Light Reflex) */}
          <g className="origin-center motion-safe:animate-pupil-constrict">
            <circle
              cx="50"
              cy="50"
              r="22"
              fill="#0f172a"
              className="text-slate-900"
            />
            {/* Corneal Light Reflection Highlight */}
            <circle
              cx="43"
              cy="43"
              r="3.5"
              fill="#ffffff"
              opacity="0.85"
            />
          </g>

          {/* Micro Measurement Crosshairs */}
          <line x1="48" y1="50" x2="52" y2="50" stroke="#ffffff" strokeWidth="1" opacity="0.6" />
          <line x1="50" y1="48" x2="50" y2="52" stroke="#ffffff" strokeWidth="1" opacity="0.6" />
        </svg>
      </div>

      {(label || sublabel) && (
        <div className="space-y-1">
          {label && <p className="text-sm font-semibold text-slate-900 tracking-tight">{label}</p>}
          {sublabel && <p className="text-xs text-slate-500 font-mono">{sublabel}</p>}
        </div>
      )}
    </div>
  );
};
