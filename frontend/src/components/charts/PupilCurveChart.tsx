import React, { useMemo, useState } from 'react';
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
  ReferenceDot,
} from 'recharts';
import { TimeSeriesPoint } from '../../types/api';
import { useTranslation } from '../../i18n';

interface PupilCurveChartProps {
  series?: TimeSeriesPoint[];
  stimulusOnsetMs?: number;
  stimulusDurationMs?: number;
  unit?: string;
  className?: string;
}

type PhaseFilter = 'all' | 'baseline' | 'response' | 'recovery';

interface PupilChartPoint {
  timeSec: number;
  diameter: number | null;
  rawDiameter: number | null;
  smoothedDiameter: number | null;
  valid: boolean;
  pctChange: number | null;
  phaseLabel: string;
}

function medianOf(nums: number[]): number {
  const sorted = [...nums].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

/**
 * Computes an outlier-resistant smoothed diameter trajectory and linearly bridges short tracking gaps
 * so the smoothed curve renders continuously without distorting small (<10 point) discrete series.
 */
function buildSmoothedTrajectory(rawPoints: Array<{ timeSec: number; raw: number | null; valid: boolean }>): Array<number | null> {
  const validIndices = rawPoints
    .map((p, idx) => (p.valid && p.raw !== null ? idx : -1))
    .filter((idx) => idx >= 0);

  if (validIndices.length === 0) {
    return rawPoints.map(() => null);
  }

  // Keep sparse series (e.g. small synthetic/unit test arrays) exact
  if (validIndices.length < 10) {
    return rawPoints.map((p) => (p.valid && p.raw !== null ? Number(p.raw.toFixed(2)) : null));
  }

  // 1. Hampel / local-median outlier clamp across +/- 3 valid neighbors
  const validValues = validIndices.map((idx) => rawPoints[idx].raw as number);
  const declipped = validValues.map((val, pos) => {
    const start = Math.max(0, pos - 3);
    const end = Math.min(validValues.length, pos + 4);
    const localMed = medianOf(validValues.slice(start, end));
    if (localMed > 0 && Math.abs(val - localMed) / localMed > 0.28) {
      return localMed;
    }
    return val;
  });

  // 2. Triangular 5-point weighted smoothing over declipped valid values
  const weights = [1, 2, 3, 2, 1];
  const smoothedValid = declipped.map((_, pos) => {
    let sum = 0;
    let wSum = 0;
    for (let offset = -2; offset <= 2; offset++) {
      const k = pos + offset;
      if (k >= 0 && k < declipped.length) {
        const w = weights[offset + 2];
        sum += declipped[k] * w;
        wSum += w;
      }
    }
    return Number((sum / wSum).toFixed(2));
  });

  // Map back onto original timeline indices
  const result: Array<number | null> = rawPoints.map(() => null);
  validIndices.forEach((origIdx, pos) => {
    result[origIdx] = smoothedValid[pos];
  });

  // 3. Linearly bridge interior gaps so blink markers and continuous trend line render cleanly
  for (let p = 0; p < validIndices.length - 1; p++) {
    const leftIdx = validIndices[p];
    const rightIdx = validIndices[p + 1];
    const leftVal = result[leftIdx] as number;
    const rightVal = result[rightIdx] as number;
    const span = rightIdx - leftIdx;
    for (let j = leftIdx + 1; j < rightIdx; j++) {
      const frac = (j - leftIdx) / span;
      result[j] = Number((leftVal + frac * (rightVal - leftVal)).toFixed(2));
    }
  }

  return result;
}

export const PupilCurveChart: React.FC<PupilCurveChartProps> = ({
  series = [],
  stimulusOnsetMs = 5000,
  stimulusDurationMs = 1500,
  unit = 'mm',
  className = '',
}) => {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<PhaseFilter>('all');
  const [showBaseline, setShowBaseline] = useState<boolean>(true);
  const [highlightBlinks, setHighlightBlinks] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'smoothed' | 'raw'>('smoothed');
  const [inspectedPoint, setInspectedPoint] = useState<PupilChartPoint | null>(null);

  const stimulusStartSec = Number((stimulusOnsetMs / 1000).toFixed(2));
  const stimulusEndSec = Number(((stimulusOnsetMs + stimulusDurationMs) / 1000).toFixed(2));

  const { fullData, baselineMedian, peakDropPoint, validRatioPct } = useMemo(() => {
    if (!series || series.length === 0) {
      return {
        fullData: [] as PupilChartPoint[],
        baselineMedian: null as number | null,
        peakDropPoint: null as PupilChartPoint | null,
        validRatioPct: 100,
      };
    }

    const baseVals = series
      .filter((pt) => pt.valid && pt.t_ms <= stimulusOnsetMs)
      .map((pt) => pt.value ?? (pt as { diameter?: number | null }).diameter ?? null)
      .filter((v): v is number => typeof v === 'number' && Number.isFinite(v))
      .sort((a, b) => a - b);

    const med =
      baseVals.length > 0
        ? baseVals[Math.floor(baseVals.length / 2)]
        : null;

    const rawEntries = series.map((pt) => {
      const rawVal = pt.value ?? (pt as { diameter?: number | null }).diameter ?? null;
      const raw = rawVal !== null && Number.isFinite(rawVal) ? Number(rawVal.toFixed(2)) : null;
      return {
        t_ms: pt.t_ms,
        timeSec: Number((pt.t_ms / 1000).toFixed(2)),
        raw,
        valid: pt.valid,
      };
    });

    const smoothedSeries = buildSmoothedTrajectory(rawEntries);
    const validCount = rawEntries.filter((e) => e.valid && e.raw !== null).length;
    const validPct = Math.round((validCount / rawEntries.length) * 100);

    const mapped: PupilChartPoint[] = rawEntries.map((entry, idx) => {
      const activeDiam = smoothedSeries[idx] ?? entry.raw;
      const pctChange =
        med && med > 0 && activeDiam !== null
          ? Number((((activeDiam - med) / med) * 100).toFixed(1))
          : null;

      let phaseLabel = 'Recovery';
      if (entry.t_ms < stimulusOnsetMs) phaseLabel = 'Resting (Before Flash)';
      else if (entry.t_ms <= stimulusOnsetMs + 2500) phaseLabel = 'Light Flash Response';

      return {
        timeSec: entry.timeSec,
        diameter: activeDiam,
        rawDiameter: entry.raw,
        smoothedDiameter: smoothedSeries[idx],
        valid: entry.valid,
        pctChange,
        phaseLabel,
      };
    });

    const postFlashValid = mapped.filter(
      (p) => p.valid && p.diameter !== null && p.timeSec >= stimulusStartSec
    );
    const minPt =
      postFlashValid.length > 0
        ? postFlashValid.reduce((best, cur) =>
            (cur.diameter ?? Infinity) < (best.diameter ?? Infinity) ? cur : best
          )
        : null;

    return {
      fullData: mapped,
      baselineMedian: med ? Number(med.toFixed(2)) : null,
      peakDropPoint: minPt,
      validRatioPct: validPct,
    };
  }, [series, stimulusOnsetMs, stimulusStartSec]);

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

  const maxTimeSec = fullData[fullData.length - 1]?.timeSec ?? 15;
  const filteredData = fullData.filter((pt) => {
    if (phase === 'baseline') return pt.timeSec <= stimulusStartSec + 0.3;
    if (phase === 'response') return pt.timeSec >= Math.max(0, stimulusStartSec - 0.5) && pt.timeSec <= stimulusStartSec + 3.5;
    if (phase === 'recovery') return pt.timeSec >= stimulusStartSec + 2.0;
    return true;
  });

  const displayData = filteredData.length > 0 ? filteredData : fullData;
  const activePoint = inspectedPoint ?? peakDropPoint ?? displayData[0];

  const unitDisplay = unit === 'px_or_normalized' ? 'px' : unit;
  const lineDataKey = viewMode === 'smoothed' ? 'smoothedDiameter' : 'rawDiameter';

  return (
    <div className={`panel-ramp p-6 space-y-4 shadow-sm ${className}`}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-sans text-sm font-semibold text-[#0F172A]">{t('charts.pupil.title')}</h4>
            {peakDropPoint && peakDropPoint.pctChange !== null && (
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                  peakDropPoint.pctChange <= -15
                    ? 'bg-[#F0FDF4] text-[#0F766E] border-[#BBF7D0]'
                    : 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]'
                }`}
              >
                Peak drop: {peakDropPoint.pctChange}% at {peakDropPoint.timeSec}s
              </span>
            )}
          </div>
          <p className="text-xs text-[#475569] font-sans font-normal mt-0.5">
            {t('charts.pupil.subtitle')} — hover or click any point on the curve to inspect.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
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

      {/* Interactive Zoom & Overlay Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Zoom pupil phase">
          {(
            [
              { id: 'all', label: `Full Test (0–${Math.round(maxTimeSec)}s)` },
              { id: 'baseline', label: 'Before Flash' },
              { id: 'response', label: 'Flash Reaction' },
              { id: 'recovery', label: 'Recovery' },
            ] as const
          ).map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => setPhase(btn.id)}
              className={`px-2.5 py-1 rounded border transition-colors ${
                phase === btn.id
                  ? 'bg-[#0F172A] text-white border-[#0F172A] font-semibold'
                  : 'bg-[#F8FAFC] text-[#475569] border-[#E2E8F0] hover:border-[#94A3B8]'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded border border-[#E2E8F0] overflow-hidden" role="group" aria-label="Curve smoothing mode">
            <button
              type="button"
              onClick={() => setViewMode('smoothed')}
              className={`px-2.5 py-1 transition-colors ${
                viewMode === 'smoothed'
                  ? 'bg-[#0F172A] text-white font-semibold'
                  : 'bg-white text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              Smoothed
            </button>
            <button
              type="button"
              onClick={() => setViewMode('raw')}
              className={`px-2.5 py-1 border-l border-[#E2E8F0] transition-colors ${
                viewMode === 'raw'
                  ? 'bg-[#0F172A] text-white font-semibold'
                  : 'bg-white text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              Raw Frames
            </button>
          </div>
          <button
            type="button"
            onClick={() => setShowBaseline((v) => !v)}
            className={`px-2.5 py-1 rounded border transition-colors ${
              showBaseline
                ? 'bg-[#F0FDF4] text-[#0F766E] border-[#BBF7D0] font-semibold'
                : 'bg-white text-[#64748B] border-[#E2E8F0]'
            }`}
          >
            {showBaseline ? '✓ Baseline Line' : 'Baseline Line'}
          </button>
          <button
            type="button"
            onClick={() => setHighlightBlinks((v) => !v)}
            className={`px-2.5 py-1 rounded border transition-colors ${
              highlightBlinks
                ? 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA] font-semibold'
                : 'bg-white text-[#64748B] border-[#E2E8F0]'
            }`}
          >
            {highlightBlinks ? '✓ Mark Blinks' : 'Mark Blinks'}
          </button>
        </div>
      </div>

      {validRatioPct < 75 && (
        <div className="px-3 py-2 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] text-[11px] font-sans text-[#92400E]">
          Only <strong>{validRatioPct}%</strong> of frames had a clean pupil lock (blinks, lashes, or dim light caused frame-to-frame jitter).{' '}
          Showing outlier-smoothed trend by default — switch to <strong>Raw Frames</strong> to inspect unfiltered readings.
        </div>
      )}

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
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(v) => `${v}s`}
              stroke="#64748B"
              fontSize={10}
              tickLine={false}
              fontFamily="monospace"
            />
            <YAxis
              unit={unitDisplay ? ` ${unitDisplay}` : ''}
              stroke="#64748B"
              fontSize={10}
              tickLine={false}
              domain={['auto', 'auto']}
              fontFamily="monospace"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as PupilChartPoint;
                  const shown = viewMode === 'smoothed' ? data.smoothedDiameter : data.rawDiameter;
                  return (
                    <div className="bg-white border border-[#E2E8F0] text-[#0F172A] p-2.5 rounded-lg text-xs shadow-ramp-card space-y-1 font-mono">
                      <p className="text-[#475569]">{t('charts.pupil.timeLabel')} {data.timeSec}s ({data.phaseLabel})</p>
                      <p className="font-semibold text-[#0F172A]">
                        {t('charts.pupil.diameterLabel')}{' '}
                        {shown !== null ? `${shown} ${unitDisplay}` : t('charts.pupil.notAvailable')}
                      </p>
                      {viewMode === 'smoothed' && data.rawDiameter !== null && data.rawDiameter !== data.smoothedDiameter && (
                        <p className="text-[10px] text-[#64748B]">
                          Raw reading: {data.rawDiameter} {unitDisplay}
                        </p>
                      )}
                      {data.pctChange !== null && (
                        <p className="text-[11px] text-[#0F766E]">
                          Change vs baseline: {data.pctChange > 0 ? `+${data.pctChange}%` : `${data.pctChange}%`}
                        </p>
                      )}
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
              fillOpacity={0.65}
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
            {showBaseline && baselineMedian !== null && (
              <ReferenceLine
                y={baselineMedian}
                stroke="#0F766E"
                strokeDasharray="4 4"
                label={{
                  value: `Baseline ${baselineMedian}`,
                  position: 'insideBottomRight',
                  fill: '#0F766E',
                  fontSize: 10,
                  fontFamily: 'monospace',
                }}
              />
            )}
            <Line
              type="monotone"
              dataKey={lineDataKey}
              stroke="#0F172A"
              strokeWidth={2}
              isAnimationActive={false}
              connectNulls={viewMode === 'smoothed'}
              dot={(dotProps: any) => {
                const { cx, cy, payload } = dotProps;
                if (typeof cx !== 'number' || typeof cy !== 'number' || !payload) return null;
                if (highlightBlinks && !payload.valid) {
                  return (
                    <circle
                      key={`blink-${cx}-${cy}`}
                      cx={cx}
                      cy={cy}
                      r={3}
                      fill="#B91C1C"
                      stroke="#FFFFFF"
                      strokeWidth={1}
                    />
                  );
                }
                return null;
              }}
              activeDot={{ r: 5, fill: '#0F766E', stroke: '#FFFFFF', strokeWidth: 2 }}
            />
            {peakDropPoint && peakDropPoint.diameter !== null && (
              <ReferenceDot
                x={peakDropPoint.timeSec}
                y={peakDropPoint.diameter}
                r={5}
                fill="#0F766E"
                stroke="#FFFFFF"
                strokeWidth={2}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Live Interactive Readout Strip */}
      {activePoint && (
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-4">
            <span>
              <span className="text-[#64748B]">Selected Time:</span>{' '}
              <strong className="text-[#0F172A]">{activePoint.timeSec}s</strong>
            </span>
            <span>
              <span className="text-[#64748B]">Pupil Size:</span>{' '}
              <strong className="text-[#0F172A]">
                {activePoint.diameter !== null ? `${activePoint.diameter} ${unitDisplay}` : 'Blink / Gap'}
              </strong>
            </span>
            {activePoint.pctChange !== null && (
              <span>
                <span className="text-[#64748B]">vs Resting:</span>{' '}
                <strong className={activePoint.pctChange <= -10 ? 'text-[#0F766E]' : 'text-[#0F172A]'}>
                  {activePoint.pctChange > 0 ? `+${activePoint.pctChange}%` : `${activePoint.pctChange}%`}
                </strong>
              </span>
            )}
          </div>
          <span className="text-[11px] font-sans text-[#475569]">
            {activePoint.valid ? activePoint.phaseLabel : 'Eye blinked or moved briefly here'}
          </span>
        </div>
      )}
    </div>
  );
};
