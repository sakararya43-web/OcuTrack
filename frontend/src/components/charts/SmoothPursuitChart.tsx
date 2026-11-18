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
      <div className={`flex flex-col items-center justify-center p-8 bg-slate-50 border border-slate-200 rounded-xl text-center ${className}`}>
        <p className="text-xs font-semibold text-slate-700">Pursuit Kinematic Series Unavailable</p>
        <p className="text-[11px] text-slate-500 mt-1">
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
    <div className={`bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">Target vs. Eye Horizontal Trajectory</h4>
          <p className="text-xs text-slate-500">
            Harmonic target trajectory (cyan) vs. tracked gaze displacement (slate)
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-cyan-600 font-medium">
            <span className="w-3 h-0.5 bg-cyan-500 inline-block"></span>
            Stimulus Target
          </span>
          <span className="flex items-center gap-1.5 text-slate-700 font-medium">
            <span className="w-3 h-0.5 bg-slate-800 inline-block"></span>
            Eye Gaze Position
          </span>
        </div>
      </div>

      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="timeSec"
              unit="s"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
            />
            <YAxis
              unit="%"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              domain={[0, 100]}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white p-2.5 rounded-lg text-xs shadow-lg space-y-1">
                      <p className="font-mono text-slate-300">Time: {data.timeSec}s</p>
                      <p className="text-cyan-400">
                        Target X: {data.targetX !== null ? `${data.targetX}%` : 'Not available'}
                      </p>
                      <p className="text-slate-200">
                        Eye Gaze X: {data.eyeX !== null ? `${data.eyeX}%` : 'Not available'}
                      </p>
                      {data.targetX !== null && data.eyeX !== null && (
                        <p className="text-[10px] text-amber-300 pt-0.5 border-t border-slate-700">
                          Tracking Error: {Math.abs(data.targetX - data.eyeX).toFixed(1)}%
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            {/* Target Trajectory Line */}
            <Line
              type="monotone"
              dataKey="targetX"
              stroke="#06b6d4"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
              name="Stimulus Target"
            />
            {/* Eye Movement Track Line */}
            <Line
              type="monotone"
              dataKey="eyeX"
              stroke="#0f172a"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: '#0f172a' }}
              connectNulls={false}
              name="Eye Position"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[11px] text-slate-400 italic">
        Deviations between target and eye displacement reflect smooth pursuit latency, phase lag, or corrective catch-up saccades.
      </p>
    </div>
  );
};
