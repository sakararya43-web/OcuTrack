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
import { formatShortDate } from '../../lib/formatters';

export interface LongitudinalDataPoint {
  assessmentDate: string;
  latencyMs?: number | null;
  velocityMmS?: number | null;
  trackingGain?: number | null;
  isBaseline?: boolean;
}

interface LongitudinalTrendChartProps {
  data: LongitudinalDataPoint[];
  metric?: 'latency' | 'velocity' | 'gain';
  className?: string;
}

export const LongitudinalTrendChart: React.FC<LongitudinalTrendChartProps> = ({
  data = [],
  metric = 'latency',
  className = '',
}) => {
  if (!data || data.length < 2) {
    return (
      <div className={`p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500 ${className}`}>
        <p className="font-semibold text-slate-700">Longitudinal History Building</p>
        <p className="mt-1">
          At least two accepted assessments are required to plot longitudinal change across visits.
        </p>
      </div>
    );
  }

  const metricConfigs = {
    latency: {
      key: 'latencyMs',
      title: 'Pupil Constriction Latency Trend',
      unit: 'ms',
      color: '#0284c7',
      description: 'Time from light stimulus onset to start of pupil constriction',
    },
    velocity: {
      key: 'velocityMmS',
      title: 'Maximum Constriction Velocity Trend',
      unit: 'mm/s',
      color: '#0d9488',
      description: 'Peak constriction rate during reflexive response',
    },
    gain: {
      key: 'trackingGain',
      title: 'Smooth Pursuit Tracking Gain Trend',
      unit: '',
      color: '#4f46e5',
      description: 'Ratio of eye velocity to target velocity (unity = 1.0)',
    },
  };

  const currentConfig = metricConfigs[metric];

  const chartData = data.map((d) => ({
    displayDate: formatShortDate(d.assessmentDate),
    value: (d as any)[currentConfig.key] ?? null,
    isBaseline: Boolean(d.isBaseline),
  }));

  const validDataPoints = chartData.filter(
    (d) => d.value !== null && d.value !== undefined
  );

  if (validDataPoints.length < 2) {
    return (
      <div className={`p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500 ${className}`}>
        <p className="font-semibold text-slate-700">Longitudinal History Building</p>
        <p className="mt-1">
          At least two accepted assessments with measured biometrics are required to plot longitudinal trajectory across visits.
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">{currentConfig.title}</h4>
          <p className="text-xs text-slate-500">{currentConfig.description}</p>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
          Units: {currentConfig.unit || 'ratio'}
        </span>
      </div>

      <div className="w-full h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="displayDate"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
            />
            <YAxis
              unit={currentConfig.unit}
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              domain={['auto', 'auto']}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white p-2.5 rounded-lg text-xs shadow-lg space-y-1">
                      <p className="font-mono text-slate-300">Date: {item.displayDate}</p>
                      <p className="font-semibold text-sky-400">
                        {currentConfig.title}:{' '}
                        {item.value !== null ? `${item.value} ${currentConfig.unit}` : 'Not available'}
                      </p>
                      {item.isBaseline && (
                        <p className="text-[10px] text-indigo-300 font-semibold">
                          &bull; Selected Patient Baseline
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
              dataKey="value"
              stroke={currentConfig.color}
              strokeWidth={2.5}
              dot={{ r: 4, fill: currentConfig.color }}
              activeDot={{ r: 6 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
        <span>Non-diagnostic longitudinal trend line</span>
        <span>A stable trend does not establish absence of neurological change</span>
      </div>
    </div>
  );
};
