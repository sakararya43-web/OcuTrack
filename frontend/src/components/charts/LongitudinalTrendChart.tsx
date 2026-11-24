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
import { useTranslation } from '../../i18n';

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
  const { t } = useTranslation();

  if (!data || data.length < 2) {
    return (
      <div className={`p-8 bg-white rounded-xl border border-[#E2E8F0] text-center text-xs text-[#475569] ${className}`}>
        <p className="font-semibold text-[#0F172A] font-mono text-sm">{t('charts.longitudinal.buildingTitle')}</p>
        <p className="mt-1 font-sans font-normal max-w-sm mx-auto">
          {t('charts.longitudinal.buildingDesc')}
        </p>
      </div>
    );
  }

  const metricConfigs = {
    latency: {
      key: 'latencyMs',
      title: t('charts.longitudinal.metrics.latency.title'),
      unit: 'ms',
      color: '#0F172A',
      description: t('charts.longitudinal.metrics.latency.desc'),
    },
    velocity: {
      key: 'velocityMmS',
      title: t('charts.longitudinal.metrics.velocity.title'),
      unit: 'mm/s',
      color: '#0F172A',
      description: t('charts.longitudinal.metrics.velocity.desc'),
    },
    gain: {
      key: 'trackingGain',
      title: t('charts.longitudinal.metrics.gain.title'),
      unit: 'ratio',
      color: '#0F172A',
      description: t('charts.longitudinal.metrics.gain.desc'),
    },
  };

  const currentConfig = metricConfigs[metric];

  const chartData = data.map((d) => ({
    dateStr: formatShortDate(d.assessmentDate),
    val: d[currentConfig.key as keyof LongitudinalDataPoint] as number | null,
    isBaseline: d.isBaseline,
  }));

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E2E8F0] pb-3 gap-2">
        <div>
          <h4 className="font-sans text-sm font-semibold text-[#0F172A]">{currentConfig.title}</h4>
          <p className="text-xs text-[#475569] font-sans font-normal">{currentConfig.description}</p>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="flex items-center gap-1.5 text-[#0F172A] font-medium text-[11px]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0F172A] inline-block" />
            {t('charts.longitudinal.measuredValue', { unit: currentConfig.unit })}
          </span>
        </div>
      </div>

      <div className="w-full h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ECEBE5" />
            <XAxis
              dataKey="dateStr"
              stroke="#64748B"
              fontSize={10}
              tickLine={false}
              fontFamily="monospace"
            />
            <YAxis
              unit={` ${currentConfig.unit}`}
              stroke="#64748B"
              fontSize={10}
              tickLine={false}
              domain={['auto', 'auto']}
              fontFamily="monospace"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const pt = payload[0].payload;
                  return (
                    <div className="bg-white border border-[#E2E8F0] text-[#0F172A] p-2.5 rounded-lg text-xs shadow-ramp-card space-y-1 font-mono">
                      <p className="text-[#475569]">{t('charts.longitudinal.dateLabel')} {pt.dateStr}</p>
                      <p className="font-semibold text-[#0F172A]">
                        {currentConfig.title}: {pt.val !== null ? `${pt.val} ${currentConfig.unit}` : t('charts.longitudinal.notAvailable')}
                      </p>
                      {pt.isBaseline && (
                        <p className="text-[10px] text-[#0F766E] font-semibold">{t('charts.longitudinal.acceptedBaseline')}</p>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="val"
              stroke="#0F172A"
              strokeWidth={2}
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                if (!cx || !cy) return null;
                return (
                  <circle
                    key={`dot-${cx}-${cy}`}
                    cx={cx}
                    cy={cy}
                    r={payload.isBaseline ? 5 : 3.5}
                    fill={payload.isBaseline ? '#0F766E' : '#0F172A'}
                    stroke="#FFFFFF"
                    strokeWidth={1.5}
                  />
                );
              }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
