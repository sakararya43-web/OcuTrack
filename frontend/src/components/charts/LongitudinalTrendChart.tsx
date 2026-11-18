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

type MetricKey = 'latency' | 'velocity' | 'gain';

interface MetricConfig {
  title: string;
  unit: string;
  color: string;
  description: string;
  extract: (point: LongitudinalDataPoint) => number | null;
}

const METRIC_CONFIGS: Record<MetricKey, MetricConfig> = {
  latency: {
    title: 'Pupil Constriction Latency Trend',
    unit: 'ms',
    color: '#0369a1',
    description: 'Time from light stimulus onset to start of pupil constriction',
    extract: (d) => d.latencyMs ?? null,
  },
  velocity: {
    title: 'Maximum Constriction Velocity Trend',
    unit: 'mm/s',
    color: '#0f766e',
    description: 'Peak constriction rate during reflexive response',
    extract: (d) => d.velocityMmS ?? null,
  },
  gain: {
    title: 'Smooth Pursuit Tracking Gain Trend',
    unit: '',
    color: '#1e293b',
    description: 'Ratio of eye velocity to target velocity (unity = 1.0)',
    extract: (d) => d.trackingGain ?? null,
  },
};

export const LongitudinalTrendChart: React.FC<LongitudinalTrendChartProps> = ({
  data = [],
  metric = 'latency',
  className = '',
}) => {
  if (!data || data.length < 2) {
    return (
      <div
        className={`p-6 bg-slate-50 border border-slate-200 rounded-md text-center text-xs text-slate-600 ${className}`}
      >
        <p className="font-semibold text-slate-800">Longitudinal History Building</p>
        <p className="mt-1">
          At least two accepted assessments are required to plot longitudinal change across visits.
        </p>
      </div>
    );
  }

  const currentConfig = METRIC_CONFIGS[metric];

  const chartData = data.map((d) => ({
    displayDate: formatShortDate(d.assessmentDate),
    value: currentConfig.extract(d),
    isBaseline: Boolean(d.isBaseline),
  }));

  const validDataPoints = chartData.filter((d) => d.value !== null && d.value !== undefined);

  if (validDataPoints.length < 2) {
    return (
      <div
        className={`p-6 bg-slate-50 border border-slate-200 rounded-md text-center text-xs text-slate-600 ${className}`}
      >
        <p className="font-semibold text-slate-800">Longitudinal History Building</p>
        <p className="mt-1">
          At least two accepted assessments with measured biometrics are required to plot
          longitudinal trajectory across visits.
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-slate-200 rounded-md p-5 shadow-sm space-y-3 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
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
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="displayDate" stroke="#64748b" fontSize={11} tickLine={false} />
            <YAxis
              unit={currentConfig.unit}
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              domain={['auto', 'auto']}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as {
                    displayDate: string;
                    value: number | null;
                    isBaseline: boolean;
                  };
                  return (
                    <div className="bg-slate-900 text-white p-2.5 rounded-md text-xs shadow-lg space-y-1 border border-slate-700">
                      <p className="font-mono text-slate-300">Date: {item.displayDate}</p>
                      <p className="font-semibold text-sky-300">
                        {currentConfig.title}:{' '}
                        {item.value !== null ? `${item.value} ${currentConfig.unit}`.trim() : 'Not available'}
                      </p>
                      {item.isBaseline && (
                        <p className="text-[11px] text-teal-300 font-medium">
                          Selected Patient Baseline
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
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
        <span>Non-diagnostic longitudinal trend line</span>
        <span>A stable trend does not establish absence of neurological change</span>
      </div>
    </div>
  );
};
