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
  series?: PursuitSeriesPoint[];
  className?: string;
}

export const SmoothPursuitChart: React.FC<SmoothPursuitChartProps> = ({
  series = [],
  className = '',
}) => {
  if (!series || series.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 bg-white rounded-xl border border-[#E2E8F0] text-center ${className}`}>
        <p className="text-xs font-mono font-semibold text-[#0F172A]">Pursuit Kinematic Series Unavailable</p>
        <p className="text-[11px] text-[#475569] mt-1 font-normal font-sans max-w-sm">
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
    <div className={`panel-ramp p-6 space-y-4 shadow-sm ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3">
        <div>
          <h4 className="font-sans text-sm font-semibold text-[#0F172A]">Target vs. Eye Horizontal Trajectory</h4>
          <p className="text-xs text-[#475569] font-sans font-normal">
            Harmonic target trajectory (dashed) vs. tracked gaze displacement (solid)
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="flex items-center gap-1.5 text-[#475569] font-medium text-[11px]">
            <span className="w-3 h-0.5 border-t border-dashed border-[#475569] inline-block" />
            Stimulus Target
          </span>
          <span className="flex items-center gap-1.5 text-[#0F172A] font-medium text-[11px]">
            <span className="w-3 h-0.5 bg-[#0F172A] inline-block" />
            Eye Gaze Position
          </span>
        </div>
      </div>

      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ECEBE5" />
            <XAxis
              dataKey="timeSec"
              unit="s"
              stroke="#64748B"
              fontSize={10}
              tickLine={false}
              fontFamily="monospace"
            />
            <YAxis
              unit="%"
              stroke="#64748B"
              fontSize={10}
              tickLine={false}
              domain={[0, 100]}
              fontFamily="monospace"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white border border-[#E2E8F0] text-[#0F172A] p-2.5 rounded-lg text-xs shadow-ramp-card space-y-1 font-mono">
                      <p className="text-[#475569]">Time: {data.timeSec}s</p>
                      <p className="text-[#475569]">Target: {data.targetX}%</p>
                      <p className="font-semibold text-[#0F172A]">Gaze: {data.eyeX}%</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            {/* Target Trajectory (dashed line) */}
            <Line
              type="monotone"
              dataKey="targetX"
              stroke="#64748B"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
              isAnimationActive={false}
            />
            {/* Eye Tracking (solid line) */}
            <Line
              type="monotone"
              dataKey="eyeX"
              stroke="#0F172A"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
