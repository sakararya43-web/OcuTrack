import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import { AssessmentDetail } from '../../types/api';
import {
  computeSequenceDynamics,
  computeSequencePhases,
  SequenceDynamicsMetric,
} from '../../lib/clinicalSummary';

interface SequenceDynamicsSectionProps {
  assessment: AssessmentDetail;
  isInsufficientQuality: boolean;
  modelPrefixLabel: string;
  experimentalBadgeLabel: string;
  defaultNotes: string;
}

export const SequenceDynamicsSection: React.FC<SequenceDynamicsSectionProps> = ({
  assessment,
  isInsufficientQuality,
  modelPrefixLabel,
  experimentalBadgeLabel,
  defaultNotes,
}) => {
  const dynamics = isInsufficientQuality ? [] : computeSequenceDynamics(assessment);
  const phases = isInsufficientQuality ? [] : computeSequencePhases(assessment);

  const [selectedMetricId, setSelectedMetricId] = useState<string>(dynamics[0]?.id || '');
  const [selectedPhaseIdx, setSelectedPhaseIdx] = useState<number>(0);
  const [showTechDetails, setShowTechDetails] = useState<boolean>(false);

  const activeMetric: SequenceDynamicsMetric | undefined =
    dynamics.find((d) => d.id === selectedMetricId) || dynamics[0];
  const activePhase = phases[selectedPhaseIdx] || phases[0];

  const overallAvg =
    dynamics.length > 0
      ? Math.round(dynamics.reduce((s, d) => s + d.scorePct, 0) / dynamics.length)
      : null;

  const overallBadge =
    overallAvg === null
      ? { text: 'Waiting for Valid Frames', cls: 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]' }
      : overallAvg >= 75
      ? { text: `Steady Rhythm (${overallAvg}%)`, cls: 'bg-[#F0FDF4] text-[#0F766E] border-[#BBF7D0]' }
      : overallAvg >= 50
      ? { text: `Moderate Stability (${overallAvg}%)`, cls: 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]' }
      : { text: `Irregular Rhythm (${overallAvg}%)`, cls: 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]' };

  const barColor = (pct: number) =>
    pct >= 75 ? '#0F766E' : pct >= 50 ? '#D97706' : '#B91C1C';

  return (
    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-5 sm:p-6 text-xs space-y-5 font-mono">
      {/* Header with Plain-Language Rhythm Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-sans text-sm font-semibold text-[#0F172A]">
              Eye Movement & Recovery Rhythm
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${overallBadge.cls}`}>
              {overallBadge.text}
            </span>
          </div>
          <p className="font-sans text-xs text-[#475569]">
            Click any card or phase bar below to see how steadily the eyes reacted from start to finish.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowTechDetails((v) => !v)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white border border-[#E2E8F0] text-[11px] text-[#475569] hover:text-[#0F172A] hover:border-[#94A3B8] transition-colors self-start sm:self-auto"
        >
          <Info className="w-3.5 h-3.5" />
          <span>AI Model Info</span>
          {showTechDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Interactive Metric Cards */}
      {dynamics.length > 0 ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {dynamics.map((dyn) => {
              const isSelected = activeMetric?.id === dyn.id;
              return (
                <button
                  key={dyn.id}
                  type="button"
                  onClick={() => setSelectedMetricId(dyn.id)}
                  className={`text-left rounded-lg p-3.5 border transition-all space-y-2 ${
                    isSelected
                      ? 'bg-white border-[#0F172A] shadow-sm ring-1 ring-[#0F172A]'
                      : 'bg-white border-[#E2E8F0] hover:border-[#94A3B8]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[10px] uppercase tracking-wider text-[#64748B] font-semibold">
                      {dyn.label}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        dyn.tone === 'good'
                          ? 'bg-[#0F766E]'
                          : dyn.tone === 'warn'
                          ? 'bg-[#D97706]'
                          : 'bg-[#B91C1C]'
                      }`}
                    />
                  </div>
                  <span className="text-sm font-semibold text-[#0F172A] block">{dyn.value}</span>
                  {/* Visual comfort/stability progress bar */}
                  <div className="w-full h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.max(4, Math.min(100, dyn.scorePct))}%`,
                        backgroundColor: barColor(dyn.scorePct),
                      }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Card Explanation Strip */}
          {activeMetric && (
            <div className="bg-white border border-[#E2E8F0] rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-sans text-xs">
              <div className="space-y-0.5">
                <span className="font-semibold text-[#0F172A] block">
                  {activeMetric.label}: {activeMetric.value}
                </span>
                <p className="text-[#475569]">{activeMetric.meaning}</p>
              </div>
              <span className="px-2.5 py-1 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-[11px] text-[#334155] shrink-0">
                {activeMetric.tip}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 text-xs text-[#475569] font-sans">
          Sequence rhythm metrics require an acceptable-quality recording with multiple valid frames.
        </div>
      )}

      {/* Interactive 3-Phase Stability Breakdown */}
      {phases.length > 0 && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="font-sans text-xs font-semibold text-[#0F172A]">
                Start → Middle → End Stability Breakdown
              </h4>
              <p className="font-sans text-[11px] text-[#64748B]">
                Click a phase button or bar to see how eye tracking held up across the test.
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {phases.map((p, idx) => (
                <button
                  key={p.shortLabel}
                  type="button"
                  onClick={() => setSelectedPhaseIdx(idx)}
                  className={`px-2.5 py-1 rounded border text-[10px] transition-colors ${
                    selectedPhaseIdx === idx
                      ? 'bg-[#0F172A] text-white border-[#0F172A] font-semibold'
                      : 'bg-[#F8FAFC] text-[#475569] border-[#E2E8F0] hover:border-[#94A3B8]'
                  }`}
                >
                  {p.shortLabel}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-7 h-36">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={phases}
                  margin={{ top: 6, right: 12, left: -18, bottom: 0 }}
                  onClick={(state) => {
                    const idx = typeof state?.activeTooltipIndex === 'number' ? state.activeTooltipIndex : -1;
                    if (idx >= 0 && idx < phases.length) setSelectedPhaseIdx(idx);
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#ECEBE5" vertical={false} />
                  <XAxis dataKey="shortLabel" stroke="#64748B" fontSize={10} tickLine={false} />
                  <YAxis domain={[0, 100]} unit="%" stroke="#64748B" fontSize={10} tickLine={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const pt = payload[0].payload;
                        return (
                          <div className="bg-white border border-[#E2E8F0] p-2 rounded-lg text-[11px] shadow-sm font-mono space-y-0.5">
                            <p className="font-semibold text-[#0F172A]">{pt.phase}</p>
                            <p className="text-[#0F766E]">Stability: {pt.stabilityPct}%</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="stabilityPct" radius={[6, 6, 0, 0]} maxBarSize={48}>
                    {phases.map((entry, idx) => (
                      <Cell
                        key={entry.shortLabel}
                        fill={barColor(entry.stabilityPct)}
                        fillOpacity={selectedPhaseIdx === idx ? 1 : 0.45}
                        cursor="pointer"
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {activePhase && (
              <div className="md:col-span-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3.5 space-y-2 font-sans">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-semibold text-[#0F172A]">
                    {activePhase.phase}
                  </span>
                  <span className="font-mono text-xs font-bold text-[#0F766E]">
                    {activePhase.stabilityPct}%
                  </span>
                </div>
                <p className="text-xs text-[#475569] leading-relaxed">{activePhase.plainNote}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Honest AI Status Bar (compact by default; expandable technical details) */}
      <div className="pt-2 border-t border-[#E2E8F0] space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[#475569] font-medium text-[11px]">
            {modelPrefixLabel} <span className="text-[#0F172A] font-semibold">{assessment.temporal_model?.model_name || 'TCN-Temporal-Evaluator-v0.1'}</span>
          </span>
          <div className="flex items-center gap-2">
            <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-white text-[#475569] border border-[#E2E8F0]">
              {experimentalBadgeLabel}
            </span>
          </div>
        </div>

        {showTechDetails && (
          <div className="bg-white border border-[#E2E8F0] rounded-lg p-3.5 space-y-2 font-sans text-xs text-[#475569]">
            <p>{assessment.temporal_model?.notes || defaultNotes}</p>
            {assessment.temporal_model?.output && typeof assessment.temporal_model.output === 'object' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 font-mono">
                {Object.entries(assessment.temporal_model.output as Record<string, unknown>).map(([k, v]) => (
                  <div key={k} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded p-2">
                    <span className="text-[10px] text-[#64748B] block uppercase">{k.replace(/_/g, ' ')}</span>
                    <span className="text-xs font-semibold text-[#0F172A]">{String(v)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-[#64748B]">
                The neural-network classifier is kept off (`not_configured`) because no clinically labeled webcam dataset is loaded. Instead, the interactive cards and phase chart above show direct, transparent measurements from your eye recordings.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
