import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { PursuitSeriesPoint } from '../../types/api';

interface SmoothPursuitChartProps {
  series?: PursuitSeriesPoint[] | null;
  className?: string;
}

export const SmoothPursuitChart: React.FC<SmoothPursuitChartProps> = ({
  series = [],
  className = '',
}) => {
  if (!series || series.length === 0) {
    return (
      <div
        className={`flex flex-col items-center justify-center p-8 bg-slate-50 border border-slate-200 rounded-md text-center ${className}`}
      >
        <p className="text-xs font-semibold text-slate-800">Pursuit Kinematic Series Unavailable</p>
        <p className="text-[11px] text-slate-600 mt-1">
          Eye horizontal displacement series was not returned by the pursuit tracking module.
        </p>
      </div>
    );
  }

  const chartData = series.map((pt) => ({
    timeSec: Number((pt.t_ms / 1000).toFixed(2)),
    targetX: pt.target_x !== null ? Number((pt.target_x * 100).toFixed(1)) : null,
    eyeX: pt.eye_x !== null ? Number((pt.eye_x * 100).toFixed(1)) : null,
    valid: pt.valid,
  }));

  return (
    <div className={`bg-white border border-slate-200 rounded-md p-5 shadow-sm space-y-3 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">
            Target vs. Eye Horizontal Trajectory
          </h4>
          <p className="text-xs text-slate-500">
            Harmonic target trajectory (medical blue) vs. tracked gaze displacement (navy)
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-sky-700 font-medium">
            <span className="w-3 h-0.5 bg-sky-600 inline-block"></span>
            Stimulus Target
          </span>
          <span className="flex items-center gap-1.5 text-slate-800 font-medium">
            <span className="w-3 h-0.5 bg-slate-900 inline-block"></span>
            Eye Gaze Position
          </span>
        </div>
      </div>

      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="timeSec" unit="s" stroke="#64748b" fontSize={11} tickLine={false} />
            <YAxis
              unit="%"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              domain={[0, 100]}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as {
                    timeSec: number;
                    targetX: number | null;
                    eyeX: number | null;
                  };
                  return (
                    <div className="bg-slate-900 text-white p-2.5 rounded-md text-xs shadow-lg space-y-1 border border-slate-700">
                      <p className="font-mono text-slate-300">Time: {data.timeSec}s</p>
                      <p className="text-sky-300">
                        Target X: {data.targetX !== null ? `${data.targetX}%` : 'Not available'}
                      </p>
                      <p className="text-slate-100">
                        Eye Gaze X: {data.eyeX !== null ? `${data.eyeX}%` : 'Not available'}
                      </p>
                      {data.targetX !== null && data.eyeX !== null && (
                        <p className="text-[11px] text-teal-300 pt-1 border-t border-slate-700">
                          Tracking Error: {Math.abs(data.targetX - data.eyeX).toFixed(1)}%
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="targetX"
              stroke="#0284c7"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
              name="Stimulus Target"
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="eyeX"
              stroke="#0f172a"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: '#0f172a' }}
              connectNulls={false}
              name="Eye Position"
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[11px] text-slate-500">
        Deviations between target and eye displacement reflect smooth pursuit latency, phase lag, or
        corrective catch-up saccades.
      </p>
    </div>
  );
};
