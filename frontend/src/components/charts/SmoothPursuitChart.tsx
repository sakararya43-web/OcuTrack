import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { PursuitSeriesPoint } from '../../types/api';
import { useTranslation } from '../../i18n';

interface SmoothPursuitChartProps {
  series?: PursuitSeriesPoint[];
  className?: string;
}

type ViewMode = 'trajectory' | 'error';
type SweepWindow = 'all' | 'first_half' | 'second_half';

interface PursuitChartPoint {
  timeSec: number;
  targetX: number | null;
  eyeX: number | null;
  gapPct: number | null;
  valid: boolean;
  statusLabel: string;
}

export const SmoothPursuitChart: React.FC<SmoothPursuitChartProps> = ({
  series = [],
  className = '',
}) => {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<ViewMode>('trajectory');
  const [sweepWindow, setSweepWindow] = useState<SweepWindow>('all');
  const [highlightSlips, setHighlightSlips] = useState<boolean>(true);
  const [inspectedPoint, setInspectedPoint] = useState<PursuitChartPoint | null>(null);

  const { fullData, matchScorePct, maxGapPoint } = useMemo(() => {
    if (!series || series.length === 0) {
      return {
        fullData: [] as PursuitChartPoint[],
        matchScorePct: null as number | null,
        maxGapPoint: null as PursuitChartPoint | null,
      };
    }

    const mapped: PursuitChartPoint[] = series.map((pt) => {
      const timeSec = Number((pt.t_ms / 1000).toFixed(2));
      const targetX = pt.target_x !== null ? Number((pt.target_x * 100).toFixed(1)) : null;
      const eyeX = pt.eye_x !== null ? Number((pt.eye_x * 100).toFixed(1)) : null;
      const gapPct =
        pt.valid && targetX !== null && eyeX !== null
          ? Number(Math.abs(eyeX - targetX).toFixed(1))
          : null;

      let statusLabel = 'Blink / Missing Frame';
      if (pt.valid && gapPct !== null) {
        if (gapPct <= 10) statusLabel = 'On Target (Smooth)';
        else if (gapPct <= 20) statusLabel = 'Slight Lag';
        else statusLabel = 'Off Target / Catch-Up Jump';
      } else if (pt.valid) {
        statusLabel = 'Tracked';
      }

      return {
        timeSec,
        targetX,
        eyeX,
        gapPct,
        valid: pt.valid,
        statusLabel,
      };
    });

    const validGaps = mapped.map((p) => p.gapPct).filter((g): g is number => g !== null);
    const meanGap = validGaps.length > 0 ? validGaps.reduce((a, b) => a + b, 0) / validGaps.length : null;
    const matchPct = meanGap !== null ? Math.max(0, Math.min(100, Math.round(100 - meanGap))) : null;

    const worstPt =
      mapped.filter((p) => p.gapPct !== null).length > 0
        ? mapped
            .filter((p) => p.gapPct !== null)
            .reduce((worst, cur) => ((cur.gapPct ?? 0) > (worst.gapPct ?? 0) ? cur : worst))
        : mapped[0] ?? null;

    return { fullData: mapped, matchScorePct: matchPct, maxGapPoint: worstPt };
  }, [series]);

  if (!series || series.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 bg-white rounded-xl border border-[#E2E8F0] text-center ${className}`}>
        <p className="text-xs font-mono font-semibold text-[#0F172A]">{t('charts.pursuit.unavailableTitle')}</p>
        <p className="text-[11px] text-[#475569] mt-1 font-normal font-sans max-w-sm">
          {t('charts.pursuit.unavailableDesc')}
        </p>
      </div>
    );
  }

  const maxTimeSec = fullData[fullData.length - 1]?.timeSec ?? 10;
  const midTimeSec = maxTimeSec / 2;
  const displayData = fullData.filter((pt) => {
    if (sweepWindow === 'first_half') return pt.timeSec <= midTimeSec;
    if (sweepWindow === 'second_half') return pt.timeSec >= midTimeSec;
    return true;
  });

  const activePoint = inspectedPoint ?? maxGapPoint ?? displayData[0];

  return (
    <div className={`panel-ramp p-6 space-y-4 shadow-sm ${className}`}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-sans text-sm font-semibold text-[#0F172A]">{t('charts.pursuit.title')}</h4>
            {matchScorePct !== null && (
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                  matchScorePct >= 85
                    ? 'bg-[#F0FDF4] text-[#0F766E] border-[#BBF7D0]'
                    : matchScorePct >= 70
                    ? 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]'
                    : 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]'
                }`}
              >
                Tracking Match: {matchScorePct}%
              </span>
            )}
          </div>
          <p className="text-xs text-[#475569] font-sans font-normal mt-0.5">
            {t('charts.pursuit.subtitle')} — hover or click to inspect alignment, or switch to Gap View.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          {viewMode === 'trajectory' ? (
            <>
              <span className="flex items-center gap-1.5 text-[#475569] font-medium text-[11px]">
                <span className="w-3 h-0.5 border-t border-dashed border-[#475569] inline-block" />
                {t('charts.pursuit.targetLegend')}
              </span>
              <span className="flex items-center gap-1.5 text-[#0F172A] font-medium text-[11px]">
                <span className="w-3 h-0.5 bg-[#0F172A] inline-block" />
                {t('charts.pursuit.gazeLegend')}
              </span>
            </>
          ) : (
            <span className="flex items-center gap-1.5 text-[#B45309] font-medium text-[11px]">
              <span className="w-3 h-0.5 bg-[#B45309] inline-block" />
              Gaze Offset from Dot (%)
            </span>
          )}
        </div>
      </div>

      {/* Interactive View & Window Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setViewMode('trajectory')}
            className={`px-2.5 py-1 rounded border transition-colors ${
              viewMode === 'trajectory'
                ? 'bg-[#0F172A] text-white border-[#0F172A] font-semibold'
                : 'bg-[#F8FAFC] text-[#475569] border-[#E2E8F0] hover:border-[#94A3B8]'
            }`}
          >
            Eye vs Target Path
          </button>
          <button
            type="button"
            onClick={() => setViewMode('error')}
            className={`px-2.5 py-1 rounded border transition-colors ${
              viewMode === 'error'
                ? 'bg-[#0F172A] text-white border-[#0F172A] font-semibold'
                : 'bg-[#F8FAFC] text-[#475569] border-[#E2E8F0] hover:border-[#94A3B8]'
            }`}
          >
            Tracking Gap (%)
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'all', label: 'Full Sweep' },
              { id: 'first_half', label: '1st Half' },
              { id: 'second_half', label: '2nd Half' },
            ] as const
          ).map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => setSweepWindow(btn.id)}
              className={`px-2 py-1 rounded border transition-colors ${
                sweepWindow === btn.id
                  ? 'bg-[#F1F5F9] text-[#0F172A] border-[#0F172A] font-semibold'
                  : 'bg-white text-[#64748B] border-[#E2E8F0]'
              }`}
            >
              {btn.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setHighlightSlips((v) => !v)}
            className={`px-2 py-1 rounded border transition-colors ${
              highlightSlips
                ? 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A] font-semibold'
                : 'bg-white text-[#64748B] border-[#E2E8F0]'
            }`}
          >
            {highlightSlips ? '✓ Highlight Slips' : 'Highlight Slips'}
          </button>
        </div>
      </div>

      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={displayData}
            margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
            onMouseMove={(state) => {
              const idx = typeof state?.activeTooltipIndex === 'number' ? state.activeTooltipIndex : -1;
              if (idx >= 0 && displayData[idx]) setInspectedPoint(displayData[idx]);
            }}
            onClick={(state) => {
              const idx = typeof state?.activeTooltipIndex === 'number' ? state.activeTooltipIndex : -1;
              if (idx >= 0 && displayData[idx]) setInspectedPoint(displayData[idx]);
            }}
          >
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
              domain={viewMode === 'trajectory' ? [0, 100] : [0, 'auto']}
              fontFamily="monospace"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as PursuitChartPoint;
                  return (
                    <div className="bg-white border border-[#E2E8F0] text-[#0F172A] p-2.5 rounded-lg text-xs shadow-ramp-card space-y-1 font-mono">
                      <p className="text-[#475569]">{t('charts.pursuit.timeLabel')} {data.timeSec}s</p>
                      <p className="text-[#475569]">{t('charts.pursuit.targetLabel')} {data.targetX ?? '—'}%</p>
                      <p className="font-semibold text-[#0F172A]">{t('charts.pursuit.gazeLabel')} {data.eyeX ?? '—'}%</p>
                      {data.gapPct !== null && (
                        <p className={data.gapPct > 15 ? 'text-[#B91C1C] font-semibold' : 'text-[#0F766E]'}>
                          Offset: {data.gapPct}% ({data.statusLabel})
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            {viewMode === 'trajectory' ? (
              <>
                <Line
                  type="monotone"
                  dataKey="targetX"
                  stroke="#64748B"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="eyeX"
                  stroke="#0F172A"
                  strokeWidth={2}
                  isAnimationActive={false}
                  connectNulls={false}
                  dot={(dotProps: any) => {
                    const { cx, cy, payload } = dotProps;
                    if (!cx || !cy || !payload || !highlightSlips) return null;
                    if (payload.gapPct !== null && payload.gapPct > 15) {
                      return (
                        <circle
                          key={`slip-${cx}-${cy}`}
                          cx={cx}
                          cy={cy}
                          r={3.5}
                          fill={payload.gapPct > 25 ? '#B91C1C' : '#D97706'}
                          stroke="#FFFFFF"
                          strokeWidth={1}
                        />
                      );
                    }
                    return null;
                  }}
                  activeDot={{ r: 5, fill: '#0F766E', stroke: '#FFFFFF', strokeWidth: 2 }}
                />
              </>
            ) : (
              <>
                <ReferenceLine
                  y={15}
                  stroke="#D97706"
                  strokeDasharray="4 4"
                  label={{
                    value: '15% drift threshold',
                    position: 'insideTopRight',
                    fill: '#B45309',
                    fontSize: 10,
                    fontFamily: 'monospace',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="gapPct"
                  stroke="#B45309"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                  connectNulls={false}
                  activeDot={{ r: 5, fill: '#B91C1C', stroke: '#FFFFFF', strokeWidth: 2 }}
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Live Interactive Readout Strip */}
      {activePoint && (
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-4">
            <span>
              <span className="text-[#64748B]">Time:</span>{' '}
              <strong className="text-[#0F172A]">{activePoint.timeSec}s</strong>
            </span>
            <span>
              <span className="text-[#64748B]">Dot:</span>{' '}
              <strong className="text-[#0F172A]">{activePoint.targetX ?? '—'}%</strong>
            </span>
            <span>
              <span className="text-[#64748B]">Eye:</span>{' '}
              <strong className="text-[#0F172A]">{activePoint.eyeX ?? '—'}%</strong>
            </span>
            <span>
              <span className="text-[#64748B]">Gap:</span>{' '}
              <strong className={activePoint.gapPct !== null && activePoint.gapPct > 15 ? 'text-[#B91C1C]' : 'text-[#0F766E]'}>
                {activePoint.gapPct !== null ? `${activePoint.gapPct}%` : '—'}
              </strong>
            </span>
          </div>
          <span className="text-[11px] font-sans text-[#475569]">{activePoint.statusLabel}</span>
        </div>
      )}
    </div>
  );
};
