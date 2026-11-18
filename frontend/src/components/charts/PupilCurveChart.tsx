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
      <div
        className={`flex flex-col items-center justify-center p-8 bg-slate-50 border border-slate-200 rounded-md text-center ${className}`}
      >
        <p className="text-xs font-semibold text-slate-800">Pupil Time-Series Data Unavailable</p>
        <p className="text-[11px] text-slate-600 mt-1">
          Raw pupil diameter series was not returned by the analysis pipeline or quality was
          insufficient to track boundaries.
        </p>
      </div>
    );
  }

  const chartData = series.map((pt) => ({
    timeSec: Number((pt.t_ms / 1000).toFixed(2)),
    diameter: pt.value !== null ? Number(pt.value.toFixed(2)) : null,
    valid: pt.valid,
  }));

  const stimulusStartSec = Number((stimulusOnsetMs / 1000).toFixed(2));
  const stimulusEndSec = Number(((stimulusOnsetMs + stimulusDurationMs) / 1000).toFixed(2));

  return (
    <div className={`bg-white border border-slate-200 rounded-md p-5 shadow-sm space-y-3 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">Pupil Constriction Curve</h4>
          <p className="text-xs text-slate-500">
            Estimated pupil diameter over 15-second recording window
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-sky-800 font-medium">
            <span className="w-3 h-0.5 bg-sky-700 inline-block"></span>
            Pupil Diameter (mm)
          </span>
          <span className="flex items-center gap-1.5 text-teal-800 font-medium">
            <span className="w-2.5 h-2.5 bg-teal-100 border border-teal-500 inline-block rounded-sm"></span>
            Light Stimulus Window
          </span>
        </div>
      </div>

      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="timeSec" unit="s" stroke="#64748b" fontSize={11} tickLine={false} />
            <YAxis
              unit="mm"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              domain={['auto', 'auto']}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as {
                    timeSec: number;
                    diameter: number | null;
                    valid: boolean;
                  };
                  return (
                    <div className="bg-slate-900 text-white p-2.5 rounded-md text-xs shadow-lg space-y-1 border border-slate-700">
                      <p className="font-mono text-slate-300">Time: {data.timeSec}s</p>
                      <p className="font-semibold text-sky-300">
                        Diameter:{' '}
                        {data.diameter !== null ? `${data.diameter} mm` : 'Not available'}
                      </p>
                      <p className="text-[11px] text-slate-300">
                        Quality: {data.valid ? 'Valid Frame' : 'Occluded / Blink'}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceArea
              x1={stimulusStartSec}
              x2={stimulusEndSec}
              fill="#ccfbf1"
              fillOpacity={0.6}
            />
            <ReferenceLine
              x={stimulusStartSec}
              stroke="#0f766e"
              strokeDasharray="2 2"
              label={{ value: 'Flash Onset', position: 'top', fill: '#0f766e', fontSize: 10 }}
            />
            <Line
              type="monotone"
              dataKey="diameter"
              stroke="#0369a1"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: '#075985' }}
              connectNulls={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[11px] text-slate-500">
        Data points during blinks or eyelid occlusions are excluded to avoid spurious latency
        readings.
      </p>
    </div>
  );
};
