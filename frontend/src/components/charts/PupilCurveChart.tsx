import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ReferenceLine,
} from 'recharts';
import { TimeSeriesPoint } from '../../types/api';

interface PupilCurveChartProps {
  series?: TimeSeriesPoint[] | null;
  stimulusOnsetMs?: number;
  stimulusDurationMs?: number;
  className?: string;
}

export const PupilCurveChart: React.FC<PupilCurveChartProps> = ({
  series = [],
  stimulusOnsetMs = 5000,
  stimulusDurationMs = 1500,
  className = '',
}) => {
  if (!series || series.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 bg-slate-50 border border-slate-200 rounded-xl text-center ${className}`}>
        <p className="text-xs font-semibold text-slate-700">Pupil Time-Series Data Unavailable</p>
        <p className="text-[11px] text-slate-500 mt-1">
          Raw pupil diameter series was not returned by the analysis pipeline or quality was insufficient to track boundaries.
        </p>
      </div>
    );
  }

  // Format data for Recharts, converting ms to seconds for clean X-axis readability
  const chartData = series.map((pt) => ({
    timeSec: Number((pt.t_ms / 1000).toFixed(2)),
    diameter: pt.value !== null ? Number(pt.value.toFixed(2)) : null,
    valid: pt.valid,
  }));

  const stimulusStartSec = Number((stimulusOnsetMs / 1000).toFixed(2));
  const stimulusEndSec = Number(((stimulusOnsetMs + stimulusDurationMs) / 1000).toFixed(2));

  return (
    <div className={`bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">Pupil Constriction Curve</h4>
          <p className="text-xs text-slate-500">
            Normalized pupil diameter over 15-second recording window
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-sky-700 font-medium">
            <span className="w-3 h-0.5 bg-sky-600 inline-block"></span>
            Pupil Diameter (mm)
          </span>
          <span className="flex items-center gap-1.5 text-amber-700 font-medium">
            <span className="w-2.5 h-2.5 bg-amber-100 border border-amber-400 inline-block rounded-sm"></span>
            Light Stimulus Window
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
              unit="mm"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              domain={['auto', 'auto']}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white p-2.5 rounded-lg text-xs shadow-lg space-y-1">
                      <p className="font-mono text-slate-300">Time: {data.timeSec}s</p>
                      <p className="font-semibold text-sky-400">
                        Diameter:{' '}
                        {data.diameter !== null ? `${data.diameter} mm` : 'Not available'}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Quality: {data.valid ? 'Valid Frame' : 'Occluded / Blink'}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            {/* Highlight stimulus window */}
            <ReferenceArea
              x1={stimulusStartSec}
              x2={stimulusEndSec}
              fill="#fef3c7"
              fillOpacity={0.6}
            />
            <ReferenceLine
              x={stimulusStartSec}
              stroke="#f59e0b"
              strokeDasharray="2 2"
              label={{ value: 'Flash Onset', position: 'top', fill: '#b45309', fontSize: 10 }}
            />
            <Line
              type="monotone"
              dataKey="diameter"
              stroke="#0284c7"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: '#0369a1' }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[11px] text-slate-400 italic">
        Data points during blinks or eyelid occlusions are excluded to avoid spurious latency readings.
      </p>
    </div>
  );
};
