import React from 'react';
import { cn } from '../../lib/utils';

export interface TelemetryWaveformProps {
  className?: string;
  height?: string | number;
  showGrid?: boolean;
  label?: string;
  variant?: 'reflex' | 'pursuit';
}

export const TelemetryWaveform: React.FC<TelemetryWaveformProps> = ({
  className,
  height = 96,
  showGrid = true,
  label = 'Ocular Telemetry Response',
  variant = 'reflex',
}) => {
  // Pupillary light reflex curve: baseline -> latency -> constriction drop -> nadir -> recovery redilation
  const reflexPath =
    'M 10,25 L 60,25 C 75,25 80,27 92,48 C 104,74 122,82 145,82 C 175,82 205,62 250,50 C 290,40 330,34 390,32';

  // Smooth-pursuit tracking wave: smooth sinusoidal wave tracking target kinematics
  const pursuitPath =
    'M 10,50 C 40,20 70,20 100,50 C 130,80 160,80 190,50 C 220,20 250,20 280,50 C 310,80 340,80 370,50 L 390,50';

  const selectedPath = variant === 'reflex' ? reflexPath : pursuitPath;

  return (
    <div
      className={cn(
        'relative rounded-md border border-slate-200 bg-slate-950 p-3 overflow-hidden text-slate-200',
        className
      )}
    >
      <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px] font-mono">
        <span className="text-slate-400 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-sm bg-teal-500 motion-safe:animate-calm-pulse" aria-hidden="true" />
          {label}
        </span>
        <span className="text-slate-500">
          {variant === 'reflex' ? 'PLR Dynamics (mm / ms)' : 'Target Velocity Gain (x/t)'}
        </span>
      </div>

      <div className="relative mt-2" style={{ height }}>
        <svg
          viewBox="0 0 400 100"
          preserveAspectRatio="none"
          className="w-full h-full"
          aria-hidden="true"
        >
          {showGrid && (
            <g className="text-slate-800 stroke-current" strokeWidth="0.5" strokeDasharray="3 3">
              <line x1="0" y1="25" x2="400" y2="25" />
              <line x1="0" y1="50" x2="400" y2="50" />
              <line x1="0" y1="75" x2="400" y2="75" />
              <line x1="100" y1="0" x2="100" y2="100" />
              <line x1="200" y1="0" x2="200" y2="100" />
              <line x1="300" y1="0" x2="300" y2="100" />
            </g>
          )}

          {/* Reference baseline trace (static) */}
          <path
            d={selectedPath}
            fill="none"
            stroke="#1e293b"
            strokeWidth="2"
          />

          {/* Active drawing telemetry trace */}
          <path
            d={selectedPath}
            fill="none"
            stroke="#0ea5e9"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="400"
            className="motion-safe:animate-telemetry-draw"
          />
        </svg>

        {variant === 'reflex' && (
          <div className="absolute inset-x-0 bottom-0 flex justify-between px-2 text-[9px] font-mono text-slate-500">
            <span>T=0s (Baseline)</span>
            <span>T=5s (Flash)</span>
            <span>T=7s (Nadir)</span>
            <span>T=15s (Recovery)</span>
          </div>
        )}
      </div>
    </div>
  );
};
