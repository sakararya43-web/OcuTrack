import React, { useEffect, useRef, useState } from 'react';

export interface TargetCoordinate {
  t_ms: number;
  x: number; // normalized [0.0 - 1.0]
  y: number; // normalized [0.0 - 1.0]
}

export interface TargetTrajectoryMetadata {
  path_version: string;
  duration_ms: number;
  coordinates_normalized: TargetCoordinate[];
}

export const PURSUIT_PATH_VERSION = 'horizontal-sweep-v1';
export const PURSUIT_DURATION_MS = 10000;

/**
 * Deterministic formula for target position at elapsed time t_ms:
 * Oscillates horizontally centered at x=0.5 between 0.14 and 0.86 at 0.3 Hz (3 cycles in 10s).
 */
export function calculateTargetPosition(
  t_ms: number,
  totalDurationMs: number = PURSUIT_DURATION_MS
): { x: number; y: number } {
  const clampedT = Math.min(Math.max(0, t_ms), totalDurationMs);
  const frequency = 0.3;
  const x = 0.5 + 0.36 * Math.sin((2 * Math.PI * frequency * clampedT) / 1000);
  const y = 0.5;
  return {
    x: Number(x.toFixed(4)),
    y: Number(y.toFixed(4)),
  };
}

/**
 * Pre-generates the ground-truth trajectory sampled every sampleIntervalMs (50ms).
 */
export function generateFullTrajectory(
  durationMs: number = PURSUIT_DURATION_MS,
  sampleIntervalMs: number = 50
): TargetTrajectoryMetadata {
  const coords: TargetCoordinate[] = [];
  for (let t = 0; t <= durationMs; t += sampleIntervalMs) {
    const pos = calculateTargetPosition(t, durationMs);
    coords.push({
      t_ms: t,
      x: pos.x,
      y: pos.y,
    });
  }
  return {
    path_version: PURSUIT_PATH_VERSION,
    duration_ms: durationMs,
    coordinates_normalized: coords,
  };
}

interface SmoothPursuitTargetProps {
  isActive: boolean;
  onComplete?: (trajectory: TargetTrajectoryMetadata) => void;
  className?: string;
}

export const SmoothPursuitTarget: React.FC<SmoothPursuitTargetProps> = ({
  isActive,
  onComplete,
  className = '',
}) => {
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number }>({ x: 0.5, y: 0.5 });
  const [elapsedMs, setElapsedMs] = useState<number>(0);

  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const recordedCoordsRef = useRef<TargetCoordinate[]>([]);
  const hasCompletedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isActive) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      startTimeRef.current = null;
      hasCompletedRef.current = false;
      setCurrentPos({ x: 0.5, y: 0.5 });
      setElapsedMs(0);
      return;
    }

    startTimeRef.current = performance.now();
    recordedCoordsRef.current = [];
    hasCompletedRef.current = false;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      setElapsedMs(Math.min(elapsed, PURSUIT_DURATION_MS));

      const pos = calculateTargetPosition(elapsed, PURSUIT_DURATION_MS);
      setCurrentPos(pos);

      const lastRecorded = recordedCoordsRef.current[recordedCoordsRef.current.length - 1];
      if (!lastRecorded || elapsed - lastRecorded.t_ms >= 45) {
        recordedCoordsRef.current.push({
          t_ms: Math.round(elapsed),
          x: pos.x,
          y: pos.y,
        });
      }

      if (elapsed < PURSUIT_DURATION_MS) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else if (!hasCompletedRef.current) {
        hasCompletedRef.current = true;
        recordedCoordsRef.current.push({
          t_ms: PURSUIT_DURATION_MS,
          x: pos.x,
          y: pos.y,
        });

        if (onComplete) {
          onComplete({
            path_version: PURSUIT_PATH_VERSION,
            duration_ms: PURSUIT_DURATION_MS,
            coordinates_normalized: recordedCoordsRef.current,
          });
        }
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, onComplete]);

  const progressPercent = Math.min(100, (elapsedMs / PURSUIT_DURATION_MS) * 100);

  return (
    <div
      className={`relative w-full h-64 sm:h-80 bg-slate-950 rounded-md border border-slate-700 overflow-hidden flex flex-col justify-between p-4 ${className}`}
    >
      {/* Top status bar */}
      <div className="flex items-center justify-between z-10 text-xs">
        <span className="font-mono text-sky-300 font-semibold bg-slate-900 px-2.5 py-1 rounded border border-slate-700">
          Target: {PURSUIT_PATH_VERSION} (10.0s)
        </span>
        <span className="text-slate-200 font-mono">
          {(elapsedMs / 1000).toFixed(1)}s / {(PURSUIT_DURATION_MS / 1000).toFixed(0)}s
        </span>
      </div>

      {/* Target sweep arena */}
      <div className="relative w-full flex-1" aria-label="Smooth pursuit stimulus field">
        <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-700 -translate-y-1/2 pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 w-2.5 h-2.5 border border-slate-600 -translate-x-1/2 -translate-y-1/2 rounded-sm pointer-events-none"></div>

        {/* High-contrast deterministic clinical fixation target (no cosmetic pulsing) */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
          style={{
            left: `${currentPos.x * 100}%`,
          }}
        >
          <div className="relative flex items-center justify-center">
            <div className="w-9 h-9 rounded-full bg-sky-400 border-2 border-white flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-950"></div>
            </div>
            <div className="absolute w-14 h-px bg-sky-300/60 pointer-events-none"></div>
            <div className="absolute h-14 w-px bg-sky-300/60 pointer-events-none"></div>
          </div>
        </div>
      </div>

      {/* Progress Bar & Instructions */}
      <div className="space-y-2 z-10">
        <div className="w-full bg-slate-800 h-1.5 rounded-sm overflow-hidden">
          <div
            className="bg-sky-400 h-full"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
        <p className="text-center text-xs text-slate-300 font-medium">
          Follow the high-contrast target smoothly with your eyes while keeping your head still.
        </p>
      </div>
    </div>
  );
};
