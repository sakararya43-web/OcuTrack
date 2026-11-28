/**
 * ClinicalHandoffTemplate.tsx
 *
 * Off-screen, print-optimised React component rendered at exactly 794 px wide
 * (A4 at 96 DPI) for high-fidelity html2canvas capture.
 *
 * Visual & Layout Rules:
 *  - Explicit hex colors only (#FFFFFF, #000000, #111827, #4B5563, #6B7280, #D1D5DB).
 *  - Zero Tailwind oklch() utilities inside this component.
 *  - Zero gradients, pill badges, emoji icons, or em dashes.
 *  - Fixed-width monochrome Recharts with animations disabled for deterministic capture.
 */

import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Legend,
} from 'recharts';
import type { AssessmentDetail, AssessmentSummary, FeatureValue } from '../../types/api';

interface ClinicalHandoffTemplateProps {
  assessment: AssessmentDetail;
  patientCode: string;
  ageBand?: string;
  facilityId?: string;
  staffId?: string;
  patientVisits?: AssessmentSummary[];
}

interface ComparisonRow {
  metric: string;
  baseline: string;
  current: string;
  delta: string;
  status: string;
}

const CORE_METRIC_DEFINITIONS: Array<{
  keys: string[];
  label: string;
  fallbackUnit: string;
}> = [
  { keys: ['baseline_diameter'], label: 'Baseline Diameter', fallbackUnit: 'mm' },
  { keys: ['minimum_diameter'], label: 'Minimum Diameter', fallbackUnit: 'mm' },
  { keys: ['constriction_velocity'], label: 'Constriction Velocity', fallbackUnit: 'mm/s' },
  {
    keys: ['constriction_latency', 'response_latency_seconds'],
    label: 'Constriction Latency',
    fallbackUnit: 'ms',
  },
  { keys: ['constriction_amplitude'], label: 'Constriction Amplitude', fallbackUnit: '%' },
  { keys: ['tracking_gain'], label: 'Smooth Pursuit Gain', fallbackUnit: 'ratio' },
  { keys: ['tracking_continuity'], label: 'Pursuit Stability / Continuity', fallbackUnit: 'ratio' },
  { keys: ['mean_tracking_error', 'rmse_error'], label: 'Tracking Error', fallbackUnit: 'norm' },
];

const CHART_WIDTH = 714; // 794px sheet width minus 40px left + 40px right padding
const CHART_HEIGHT = 180;

function formatUtcIso(iso: string | undefined): string {
  if (!iso) return 'N/A';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
}

function formatLocal(iso: string | undefined): string {
  if (!iso) return 'N/A';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleString();
}

function formatNumber(val: number, decimals = 2): string {
  return Number.isInteger(val) ? String(val) : val.toFixed(decimals);
}

function normalizeStatusText(raw: string | undefined): string {
  if (!raw) return 'No review finding recorded.';
  return raw.replace(/—/g, ' - ').replace(/–/g, '-');
}

function getDeltaStatusString(
  direction: string | undefined,
  isInsufficient: boolean,
  hasComparison: boolean
): string {
  if (isInsufficient) {
    return 'Unvalidated - repeat capture required';
  }
  if (!hasComparison) {
    return 'Initial personal baseline measurement';
  }
  if (direction === 'stable') {
    return 'No notable change detected';
  }
  if (direction === 'increased' || direction === 'decreased') {
    return 'Change detected - consider repeat measurement and clinical review';
  }
  return 'Not comparable';
}

const SectionHeader: React.FC<{ label: string }> = ({ label }) => (
  <div
    style={{
      borderBottom: '2px solid #000000',
      marginBottom: 10,
      paddingBottom: 4,
    }}
  >
    <span
      style={{
        fontFamily: 'monospace',
        fontSize: 11,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: '#000000',
      }}
    >
      {label}
    </span>
  </div>
);

const MetaRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <tr>
    <td
      style={{
        padding: '4px 12px 4px 0',
        fontFamily: 'monospace',
        fontSize: 10,
        color: '#4B5563',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        whiteSpace: 'nowrap',
        verticalAlign: 'top',
        width: 200,
        borderBottom: '1px solid #E5E7EB',
      }}
    >
      {label}
    </td>
    <td
      style={{
        padding: '4px 0',
        fontFamily: 'monospace',
        fontSize: 11,
        color: '#111827',
        fontWeight: 500,
        verticalAlign: 'top',
        borderBottom: '1px solid #E5E7EB',
      }}
    >
      {value}
    </td>
  </tr>
);

export const ClinicalHandoffTemplate = React.forwardRef<
  HTMLDivElement,
  ClinicalHandoffTemplateProps
>(({ assessment, patientCode, ageBand, facilityId, staffId, patientVisits = [] }, ref) => {
  const generatedIso = useMemo(() => new Date().toISOString(), []);

  const pupilFeatures: Record<string, FeatureValue> = assessment.pupil?.features ?? {};
  const pursuitFeatures: Record<string, FeatureValue> = assessment.pursuit?.features ?? {};
  const allCurrentFeatures: Record<string, FeatureValue> = {
    ...pupilFeatures,
    ...pursuitFeatures,
  };
  const comparison = assessment.longitudinal_comparison;

  const isInsufficient =
    assessment.quality_status === 'insufficient' ||
    assessment.quality?.status === 'insufficient' ||
    assessment.pupil?.status === 'insufficient_quality' ||
    assessment.pursuit?.status === 'insufficient_quality';

  const usablePct =
    assessment.quality?.usable_frame_ratio != null
      ? `${(assessment.quality.usable_frame_ratio * 100).toFixed(1)}%`
      : isInsufficient
      ? 'Not usable'
      : 'Acceptable';

  const fpsStr =
    assessment.quality?.fps_estimate != null
      ? `${Number(assessment.quality.fps_estimate).toFixed(1)} FPS`
      : 'Adaptive (8-30 FPS)';

  const captureQualityLabel = isInsufficient
    ? `Insufficient (${usablePct} usable frames, ${fpsStr})`
    : `Acceptable (${usablePct} usable frames, ${fpsStr})`;

  const testType =
    assessment.test_type === 'smooth_pursuit'
      ? 'Smooth-Pursuit'
      : assessment.test_type === 'pupil_reflex'
      ? 'Pupil-Response'
      : 'Pupil-Response + Smooth-Pursuit';

  const baselineVisit = useMemo(() => {
    if (!comparison?.baseline_id) return undefined;
    return patientVisits.find((v) => v.assessment_id === comparison.baseline_id);
  }, [comparison?.baseline_id, patientVisits]);

  // Build Neutral Longitudinal Baseline Comparison rows using real metric values & deltas
  const comparisonRows: ComparisonRow[] = useMemo(() => {
    const rows: ComparisonRow[] = [];
    const deltasMap = comparison?.feature_deltas ?? {};
    const hasComparableDeltas =
      comparison?.status === 'comparable' && Object.keys(deltasMap).length > 0;
    const usedKeys = new Set<string>();

    for (const def of CORE_METRIC_DEFINITIONS) {
      const matchedKey = def.keys.find(
        (k) => allCurrentFeatures[k] !== undefined || deltasMap[k] !== undefined
      );
      if (!matchedKey) continue;
      usedKeys.add(matchedKey);

      const feat = allCurrentFeatures[matchedKey];
      const deltaObj = deltasMap[matchedKey];
      const unit = feat?.unit || deltaObj?.unit || def.fallbackUnit;

      let currentNumeric = feat?.value ?? null;
      let deltaNumeric = deltaObj?.delta ?? null;
      let displayUnit = unit;

      if (matchedKey === 'response_latency_seconds' && unit === 's') {
        if (currentNumeric !== null) currentNumeric = Number((currentNumeric * 1000).toFixed(1));
        if (deltaNumeric !== null) deltaNumeric = Number((deltaNumeric * 1000).toFixed(1));
        displayUnit = 'ms';
      }

      const baselineFromVisit =
        baselineVisit?.features && typeof baselineVisit.features[matchedKey] === 'number'
          ? (baselineVisit.features[matchedKey] as number)
          : null;

      const computedBaseline =
        baselineFromVisit !== null
          ? baselineFromVisit
          : currentNumeric !== null && deltaNumeric !== null
          ? Number((currentNumeric - deltaNumeric).toFixed(3))
          : null;

      let deltaDisplay = 'N/A';
      if (!isInsufficient && deltaNumeric !== null) {
        const sign = deltaNumeric > 0 ? '+' : '';
        const pct =
          deltaObj?.percentage_delta != null
            ? deltaObj.percentage_delta
            : computedBaseline !== null && computedBaseline !== 0
            ? (deltaNumeric / Math.abs(computedBaseline)) * 100
            : null;
        const pctPart = pct !== null ? ` (${sign}${pct.toFixed(1)}%)` : '';
        deltaDisplay = `${sign}${formatNumber(deltaNumeric)} ${displayUnit}${pctPart}`;
      }

      rows.push({
        metric: def.label,
        baseline:
          computedBaseline !== null
            ? `${formatNumber(computedBaseline)} ${displayUnit}`
            : comparison?.status === 'not_available'
            ? 'Baseline Visit'
            : 'N/A',
        current: isInsufficient
          ? 'Unvalidated'
          : currentNumeric !== null
          ? `${formatNumber(currentNumeric)} ${displayUnit}`
          : 'N/A',
        delta: deltaDisplay,
        status: getDeltaStatusString(deltaObj?.direction, isInsufficient, hasComparableDeltas),
      });
    }

    // Append any remaining feature_deltas keys not covered in core list
    for (const [key, deltaObj] of Object.entries(deltasMap)) {
      if (usedKeys.has(key)) continue;
      const feat = allCurrentFeatures[key];
      const currentNumeric = feat?.value ?? null;
      const unit = deltaObj.unit || feat?.unit || '';
      const computedBaseline =
        currentNumeric !== null && deltaObj.delta !== null
          ? Number((currentNumeric - deltaObj.delta).toFixed(3))
          : null;

      let deltaDisplay = 'N/A';
      if (!isInsufficient && deltaObj.delta !== null) {
        const sign = deltaObj.delta > 0 ? '+' : '';
        const pct =
          deltaObj.percentage_delta != null
            ? deltaObj.percentage_delta
            : computedBaseline !== null && computedBaseline !== 0
            ? (deltaObj.delta / Math.abs(computedBaseline)) * 100
            : null;
        const pctPart = pct !== null ? ` (${sign}${pct.toFixed(1)}%)` : '';
        deltaDisplay = `${sign}${formatNumber(deltaObj.delta)} ${unit}${pctPart}`;
      }

      rows.push({
        metric: key.replace(/_/g, ' '),
        baseline:
          computedBaseline !== null
            ? `${formatNumber(computedBaseline)} ${unit}`.trim()
            : 'N/A',
        current: isInsufficient
          ? 'Unvalidated'
          : currentNumeric !== null
          ? `${formatNumber(currentNumeric)} ${unit}`.trim()
          : 'N/A',
        delta: deltaDisplay,
        status: getDeltaStatusString(deltaObj.direction, isInsufficient, hasComparableDeltas),
      });
    }

    return rows;
  }, [allCurrentFeatures, baselineVisit, comparison, isInsufficient]);

  const statusText = useMemo(() => {
    if (isInsufficient) {
      return 'Insufficient recording quality - repeat test before clinical comparison.';
    }
    if (comparison?.status === 'not_available') {
      return normalizeStatusText(
        assessment.review_message ||
          'Initial baseline established. Future visits will compare against this session.'
      );
    }
    if (comparison?.status === 'not_comparable') {
      return normalizeStatusText(
        comparison.comparability_reason ||
          'Assessments not directly comparable due to protocol or capture conditions.'
      );
    }
    return normalizeStatusText(
      assessment.review_message || 'No notable change detected in measured features.'
    );
  }, [assessment.review_message, comparison, isInsufficient]);

  // PLR chart numeric time series
  const plrData = useMemo(() => {
    const series = assessment.pupil?.series ?? [];
    return series
      .filter((pt) => pt.valid && pt.value !== null)
      .map((pt) => ({
        timeSec: Number((pt.t_ms / 1000).toFixed(2)),
        diameter: Number(Number(pt.value).toFixed(3)),
      }));
  }, [assessment.pupil?.series]);

  const plrBaselineRef = useMemo(() => {
    const featVal = pupilFeatures.baseline_diameter?.value;
    if (typeof featVal === 'number' && Number.isFinite(featVal)) {
      return featVal;
    }
    return null;
  }, [pupilFeatures.baseline_diameter?.value]);

  const plrStimulusOnsetSec = useMemo(() => {
    if (plrData.length === 0) return 5;
    const maxSec = plrData[plrData.length - 1].timeSec;
    return maxSec <= 6 ? 2 : 5;
  }, [plrData]);

  // Smooth pursuit numeric time series
  const pursuitData = useMemo(() => {
    const series = assessment.pursuit?.series ?? [];
    return series
      .filter((pt) => pt.target_x !== null || pt.eye_x !== null)
      .map((pt) => ({
        timeSec: Number((pt.t_ms / 1000).toFixed(2)),
        target: pt.target_x !== null ? Number(Number(pt.target_x).toFixed(3)) : null,
        gaze: pt.valid && pt.eye_x !== null ? Number(Number(pt.eye_x).toFixed(3)) : null,
      }));
  }, [assessment.pursuit?.series]);

  // Longitudinal latency trend across acceptable visits (if >= 2 visits exist)
  const longitudinalTrend = useMemo(() => {
    const accepted = [...patientVisits]
      .filter(
        (v) =>
          v.status === 'complete' &&
          v.quality_status === 'acceptable' &&
          typeof v.features?.latency_ms === 'number'
      )
      .sort(
        (a, b) =>
          new Date(a.assessment_at).getTime() - new Date(b.assessment_at).getTime()
      );
    if (accepted.length < 2) return { points: [], baselineVal: null as number | null };
    const baselineEntry = accepted.find((v) => v.is_baseline) || accepted[0];
    const baselineVal = (baselineEntry.features?.latency_ms as number) ?? null;
    const points = accepted.map((v, idx) => ({
      visit: `V${idx + 1}`,
      latencyMs: v.features?.latency_ms as number,
      baselineMs: baselineVal,
    }));
    return { points, baselineVal };
  }, [patientVisits]);

  return (
    <div
      ref={ref}
      data-testid="clinical-handoff-template"
      style={{
        width: 794,
        backgroundColor: '#FFFFFF',
        padding: 40,
        fontFamily: 'Georgia, "Times New Roman", serif',
        color: '#111827',
        boxSizing: 'border-box',
        lineHeight: 1.45,
      }}
    >
      {/* 1. Clinical Header Bar */}
      <div
        style={{
          borderBottom: '3px solid #000000',
          paddingBottom: 14,
          marginBottom: 18,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 16,
            marginBottom: 10,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'monospace',
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: '#000000',
              }}
            >
              OcuTrack
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#4B5563', marginTop: 2 }}>
              Clinical Ocular Measurement Referral Summary
            </div>
          </div>

          <div
            style={{
              textAlign: 'right',
              fontFamily: 'monospace',
              fontSize: 10,
              color: '#4B5563',
              lineHeight: 1.5,
            }}
          >
            <div>Protocol Version: {assessment.protocol_version || 'ocutrack-protocol-0.1'}</div>
            <div>Generated (Local): {formatLocal(generatedIso)}</div>
            <div>Generated (UTC): {formatUtcIso(generatedIso)}</div>
            {(facilityId || staffId) && (
              <div style={{ color: '#111827', fontWeight: 600 }}>
                {facilityId ? `Facility/Ward: ${facilityId}` : ''}
                {facilityId && staffId ? ' | ' : ''}
                {staffId ? `Staff ID: ${staffId}` : ''}
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            border: '2px solid #000000',
            padding: '8px 12px',
            backgroundColor: '#FFFFFF',
          }}
        >
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              color: '#000000',
              textAlign: 'center',
            }}
          >
            NON-DIAGNOSTIC SCREENING SUMMARY - FOR CLINICAL REVIEW ONLY
          </div>
          <div
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: 9,
              color: '#4B5563',
              textAlign: 'center',
              marginTop: 3,
            }}
          >
            Quantitative measurement summary only. All diagnostic evaluations and referral decisions must be made by a licensed clinician.
          </div>
        </div>
      </div>

      {/* 2. Pseudonymous Patient & Session Metadata Table */}
      <div style={{ marginBottom: 20 }}>
        <SectionHeader label="1. Pseudonymous Patient & Session Metadata" />
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <MetaRow label="Pseudonymous Patient ID" value={patientCode} />
            <MetaRow label="Age Band" value={ageBand || 'Not recorded'} />
            <MetaRow label="Visit Date / Time" value={formatLocal(assessment.assessment_at)} />
            <MetaRow label="Test Type" value={testType} />
            <MetaRow label="Capture Quality Score" value={captureQualityLabel} />
            <MetaRow label="Assessment Session ID" value={assessment.assessment_id} />
          </tbody>
        </table>
      </div>

      {/* 3. Neutral Longitudinal Baseline Comparison Table */}
      <div style={{ marginBottom: 20 }}>
        <SectionHeader label="2. Neutral Longitudinal Baseline Comparison" />

        {comparisonRows.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 10 }}>
            <thead>
              <tr style={{ backgroundColor: '#F3F4F6' }}>
                {['Metric', 'Personal Baseline', 'Current Visit', 'Delta (%)', 'Status'].map(
                  (heading) => (
                    <th
                      key={heading}
                      style={{
                        padding: '6px 8px',
                        fontFamily: 'monospace',
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        color: '#000000',
                        textAlign: 'left',
                        border: '1px solid #D1D5DB',
                      }}
                    >
                      {heading}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row, idx) => (
                <tr
                  key={row.metric + idx}
                  style={{ backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB' }}
                >
                  <td
                    style={{
                      padding: '5px 8px',
                      fontFamily: 'monospace',
                      fontSize: 10,
                      fontWeight: 600,
                      color: '#111827',
                      border: '1px solid #D1D5DB',
                      textTransform: 'capitalize',
                    }}
                  >
                    {row.metric}
                  </td>
                  <td
                    style={{
                      padding: '5px 8px',
                      fontFamily: 'monospace',
                      fontSize: 10,
                      color: '#111827',
                      border: '1px solid #D1D5DB',
                    }}
                  >
                    {row.baseline}
                  </td>
                  <td
                    style={{
                      padding: '5px 8px',
                      fontFamily: 'monospace',
                      fontSize: 10,
                      fontWeight: 600,
                      color: '#000000',
                      border: '1px solid #D1D5DB',
                    }}
                  >
                    {row.current}
                  </td>
                  <td
                    style={{
                      padding: '5px 8px',
                      fontFamily: 'monospace',
                      fontSize: 10,
                      color: '#111827',
                      border: '1px solid #D1D5DB',
                    }}
                  >
                    {row.delta}
                  </td>
                  <td
                    style={{
                      padding: '5px 8px',
                      fontFamily: 'Georgia, serif',
                      fontSize: 9,
                      color: '#4B5563',
                      border: '1px solid #D1D5DB',
                    }}
                  >
                    {row.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: 10,
              color: '#4B5563',
              margin: '0 0 8px 0',
            }}
          >
            No biometric features recorded yet for this session.
          </p>
        )}

        <div
          style={{
            border: '1px solid #D1D5DB',
            padding: '7px 10px',
            backgroundColor: '#F9FAFB',
          }}
        >
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: 10,
              fontWeight: 700,
              color: '#000000',
            }}
          >
            Report Status Summary:
          </span>{' '}
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 10, color: '#111827' }}>
            {statusText}
          </span>
        </div>
      </div>

      {/* 4. Monochrome Longitudinal & Time-Series Charts */}
      {plrData.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <SectionHeader label="3a. Pupillary Light Reflex (PLR) Curve" />
          <div style={{ border: '1px solid #D1D5DB', padding: '10px 8px 4px 4px', backgroundColor: '#FFFFFF' }}>
            <LineChart
              width={CHART_WIDTH}
              height={CHART_HEIGHT}
              data={plrData}
              margin={{ top: 8, right: 20, left: 6, bottom: 14 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#D1D5DB" />
              <XAxis
                dataKey="timeSec"
                type="number"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(v) => `${v}s`}
                tick={{ fontFamily: 'monospace', fontSize: 9, fill: '#4B5563' }}
                stroke="#4B5563"
              />
              <YAxis
                tick={{ fontFamily: 'monospace', fontSize: 9, fill: '#4B5563' }}
                domain={['auto', 'auto']}
                stroke="#4B5563"
                width={42}
              />
              <Legend
                wrapperStyle={{ fontFamily: 'monospace', fontSize: 9, paddingTop: 4 }}
                iconType="line"
              />
              <ReferenceLine
                x={plrStimulusOnsetSec}
                stroke="#000000"
                strokeDasharray="3 3"
                label={{
                  value: `Flash (${plrStimulusOnsetSec}s)`,
                  position: 'insideTopRight',
                  fontFamily: 'monospace',
                  fontSize: 8,
                  fill: '#000000',
                }}
              />
              {plrBaselineRef !== null && (
                <ReferenceLine
                  y={plrBaselineRef}
                  stroke="#6B7280"
                  strokeDasharray="6 3"
                  label={{
                    value: `Baseline (${formatNumber(plrBaselineRef)})`,
                    position: 'insideBottomRight',
                    fontFamily: 'monospace',
                    fontSize: 8,
                    fill: '#4B5563',
                  }}
                />
              )}
              <Line
                type="monotone"
                dataKey="diameter"
                name="Current Visit PLR"
                stroke="#000000"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </div>
        </div>
      )}

      {pursuitData.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <SectionHeader label="3b. Smooth-Pursuit Kinematics (Target vs. Gaze)" />
          <div style={{ border: '1px solid #D1D5DB', padding: '10px 8px 4px 4px', backgroundColor: '#FFFFFF' }}>
            <LineChart
              width={CHART_WIDTH}
              height={CHART_HEIGHT}
              data={pursuitData}
              margin={{ top: 8, right: 20, left: 6, bottom: 14 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#D1D5DB" />
              <XAxis
                dataKey="timeSec"
                type="number"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(v) => `${v}s`}
                tick={{ fontFamily: 'monospace', fontSize: 9, fill: '#4B5563' }}
                stroke="#4B5563"
              />
              <YAxis
                tick={{ fontFamily: 'monospace', fontSize: 9, fill: '#4B5563' }}
                domain={[0, 1]}
                stroke="#4B5563"
                width={42}
              />
              <Legend
                wrapperStyle={{ fontFamily: 'monospace', fontSize: 9, paddingTop: 4 }}
                iconType="line"
              />
              <Line
                type="monotone"
                dataKey="target"
                name="Stimulus Target"
                stroke="#6B7280"
                strokeWidth={1.5}
                strokeDasharray="6 3"
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="gaze"
                name="Current Visit Gaze"
                stroke="#000000"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </div>
        </div>
      )}

      {longitudinalTrend.points.length >= 2 && (
        <div style={{ marginBottom: 20 }}>
          <SectionHeader label="3c. Longitudinal Baseline vs. Visit Latency Trend (ms)" />
          <div style={{ border: '1px solid #D1D5DB', padding: '10px 8px 4px 4px', backgroundColor: '#FFFFFF' }}>
            <LineChart
              width={CHART_WIDTH}
              height={160}
              data={longitudinalTrend.points}
              margin={{ top: 8, right: 20, left: 6, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#D1D5DB" />
              <XAxis
                dataKey="visit"
                tick={{ fontFamily: 'monospace', fontSize: 9, fill: '#4B5563' }}
                stroke="#4B5563"
              />
              <YAxis
                tick={{ fontFamily: 'monospace', fontSize: 9, fill: '#4B5563' }}
                domain={['auto', 'auto']}
                stroke="#4B5563"
                width={42}
              />
              <Legend
                wrapperStyle={{ fontFamily: 'monospace', fontSize: 9, paddingTop: 4 }}
                iconType="line"
              />
              <Line
                type="monotone"
                dataKey="baselineMs"
                name="Personal Baseline"
                stroke="#6B7280"
                strokeWidth={1.5}
                strokeDasharray="6 3"
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="latencyMs"
                name="Visit Latency (ms)"
                stroke="#000000"
                strokeWidth={2}
                dot={{ r: 3, fill: '#000000' }}
                isAnimationActive={false}
              />
            </LineChart>
          </div>
        </div>
      )}

      {/* 5. Clinician Handoff & Sign-Off Footer */}
      <div style={{ marginBottom: 16 }}>
        <SectionHeader label="4. Clinician Handoff & Sign-Off" />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div>
            <div
              style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 600, color: '#4B5563', marginBottom: 4 }}
            >
              Referring Health Worker Notes:
            </div>
            <div style={{ borderBottom: '1px solid #000000', height: 22, marginBottom: 8 }} />
            <div style={{ borderBottom: '1px solid #000000', height: 22, marginBottom: 8 }} />
            <div style={{ borderBottom: '1px solid #000000', height: 22 }} />
          </div>
          <div>
            <div
              style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 600, color: '#4B5563', marginBottom: 4 }}
            >
              Receiving Specialist Review:
            </div>
            <div style={{ borderBottom: '1px solid #000000', height: 22, marginBottom: 8 }} />
            <div style={{ borderBottom: '1px solid #000000', height: 22, marginBottom: 8 }} />
            <div style={{ borderBottom: '1px solid #000000', height: 22 }} />
          </div>
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 40 }}>
          <div>
            <div
              style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 600, color: '#4B5563', marginBottom: 2 }}
            >
              Date:
            </div>
            <div style={{ borderBottom: '1px solid #000000', width: 180, height: 22 }} />
          </div>
          <div>
            <div
              style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 600, color: '#4B5563', marginBottom: 2 }}
            >
              Date / Signature:
            </div>
            <div style={{ borderBottom: '1px solid #000000', width: 260, height: 22 }} />
          </div>
        </div>
      </div>

      {/* Footer Disclaimer */}
      <div
        style={{
          borderTop: '2px solid #000000',
          paddingTop: 10,
          marginTop: 8,
        }}
      >
        <p
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: 8,
            color: '#4B5563',
            lineHeight: 1.45,
            margin: 0,
          }}
        >
          NON-DIAGNOSTIC NOTICE: This summary is generated by OcuTrack, an investigational
          research prototype. It does not constitute a medical diagnosis, clinical triage decision,
          or treatment recommendation. All findings require independent interpretation by a
          licensed healthcare professional. Raw ocular video is destroyed immediately following
          feature extraction; participant records are strictly pseudonymous.
        </p>
      </div>
    </div>
  );
});

ClinicalHandoffTemplate.displayName = 'ClinicalHandoffTemplate';
