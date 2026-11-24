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
import { useTranslation } from '../../i18n';

interface PupilCurveChartProps {
  series?: TimeSeriesPoint[];
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
  const { t } = useTranslation();

  if (!series || series.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 bg-white rounded-xl border border-[#E2E8F0] text-center ${className}`}>
        <p className="text-xs font-mono font-semibold text-[#0F172A]">{t('charts.pupil.unavailableTitle')}</p>
        <p className="text-[11px] text-[#475569] mt-1 font-normal font-sans max-w-sm">
          {t('charts.pupil.unavailableDesc')}
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
    <div className={`panel-ramp p-6 space-y-4 shadow-sm ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3">
        <div>
          <h4 className="font-sans text-sm font-semibold text-[#0F172A]">{t('charts.pupil.title')}</h4>
          <p className="text-xs text-[#475569] font-sans font-normal">
            {t('charts.pupil.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="flex items-center gap-1.5 text-[#0F172A] font-medium text-[11px]">
            <span className="w-3 h-0.5 bg-[#0F172A] rounded-full inline-block" />
            {t('charts.pupil.diameterLegend')}
          </span>
          <span className="flex items-center gap-1.5 text-[#B45309] font-medium text-[11px]">
            <span className="w-2.5 h-2.5 bg-[#FEF3C7] border border-[#FDE68A] rounded inline-block" />
            {t('charts.pupil.stimulusWindow')}
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
              unit="mm"
              stroke="#64748B"
              fontSize={10}
              tickLine={false}
              domain={['auto', 'auto']}
              fontFamily="monospace"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white border border-[#E2E8F0] text-[#0F172A] p-2.5 rounded-lg text-xs shadow-ramp-card space-y-1 font-mono">
                      <p className="text-[#475569]">{t('charts.pupil.timeLabel')} {data.timeSec}s</p>
                      <p className="font-semibold text-[#0F172A]">
                        {t('charts.pupil.diameterLabel')}{' '}
                        {data.diameter !== null ? `${data.diameter} mm` : t('charts.pupil.notAvailable')}
                      </p>
                      {!data.valid && (
                        <p className="text-[10px] text-[#B91C1C]">{t('charts.pupil.motionWarning')}</p>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            {/* Shaded stimulus region */}
            <ReferenceArea
              x1={stimulusStartSec}
              x2={stimulusEndSec}
              fill="#FEF3C7"
              fillOpacity={0.6}
            />
            <ReferenceLine
              x={stimulusStartSec}
              stroke="#B45309"
              strokeDasharray="3 3"
              label={{
                value: t('charts.pupil.flashLabel'),
                position: 'insideTopLeft',
                fill: '#B45309',
                fontSize: 10,
                fontFamily: 'monospace',
                fontWeight: '600',
              }}
            />
            <Line
              type="monotone"
              dataKey="diameter"
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
