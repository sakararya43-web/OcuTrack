import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { soundFx } from '../../lib/soundFx';
import { useTranslation } from '../../i18n';

interface PatientProfile {
  id: string;
  name: string;
  condition: string;
  severity: 'normal' | 'moderate' | 'abnormal';
  latencyMs: number;
  velocityMms: number;
  gainRatio: number;
  saccadeCount: number;
  tcnResearchIndex: number;
  clinicalInterpretation: string;
  recommendation: string;
}

export const JudgeBenchmarkSimulator: React.FC = () => {
  const { t, dict } = useTranslation();
  const [selectedId, setSelectedId] = useState<string>('healthy');
  const [activeTab, setActiveTab] = useState<'pupil' | 'pursuit'>('pupil');
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number; t: number; val: string } | null>(null);

  const profiles: Record<string, PatientProfile> = {
    healthy: {
      id: 'healthy',
      ...dict.simulator.profiles.healthy,
      severity: 'normal',
      latencyMs: 236,
      velocityMms: 4.9,
      gainRatio: 0.96,
      saccadeCount: 0,
      tcnResearchIndex: 0.95,
    },
    concussion: {
      id: 'concussion',
      ...dict.simulator.profiles.concussion,
      severity: 'moderate',
      latencyMs: 282,
      velocityMms: 3.4,
      gainRatio: 0.81,
      saccadeCount: 4,
      tcnResearchIndex: 0.68,
    },
    cerebellar: {
      id: 'cerebellar',
      ...dict.simulator.profiles.cerebellar,
      severity: 'abnormal',
      latencyMs: 242,
      velocityMms: 4.6,
      gainRatio: 0.67,
      saccadeCount: 9,
      tcnResearchIndex: 0.52,
    },
  };

  const current = profiles[selectedId];

  // Dynamic SVG Pupillary curve calculation
  const getPupilCurve = (profile: PatientProfile) => {
    const points: string[] = [];
    const baselineD = 5.2;
    const latencySec = profile.latencyMs / 1000;
    const minD = profile.severity === 'abnormal' ? 3.6 : profile.severity === 'moderate' ? 3.2 : 2.5;

    for (let i = 0; i <= 60; i++) {
      const tSec = (i / 60) * 2.5; // 0 to 2.5s
      let d = baselineD;
      if (tSec > latencySec && tSec <= latencySec + 0.8) {
        const p = (tSec - latencySec) / 0.8;
        d = baselineD - (baselineD - minD) * Math.sin((p * Math.PI) / 2);
      } else if (tSec > latencySec + 0.8) {
        const p = (tSec - (latencySec + 0.8)) / 1.0;
        d = minD + (baselineD - minD) * 0.4 * (1 - Math.exp(-p * 2));
      }
      const x = 30 + (tSec / 2.5) * 540;
      const y = 160 - ((d - 2.0) / 3.6) * 120;
      points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return points.join(' ');
  };

  // Dynamic SVG Smooth Pursuit calculation
  const getPursuitCurves = (profile: PatientProfile) => {
    const targetPoints: string[] = [];
    const eyePoints: string[] = [];
    for (let i = 0; i <= 80; i++) {
      const tSec = (i / 80) * 3.0; // 0 to 3s
      const targetPos = Math.sin(tSec * 2.2);
      let eyePos = targetPos * profile.gainRatio;

      // Add saccades if abnormal/moderate
      if (profile.saccadeCount > 0 && i % 18 === 0 && i > 10) {
        eyePos += (targetPos - eyePos) * 0.8; // catch up jump
      }

      const x = 30 + (tSec / 3.0) * 540;
      const ty = 100 - targetPos * 60;
      const ey = 100 - eyePos * 60;

      targetPoints.push(`${x.toFixed(1)},${ty.toFixed(1)}`);
      eyePoints.push(`${x.toFixed(1)},${ey.toFixed(1)}`);
    }
    return { target: targetPoints.join(' '), eye: eyePoints.join(' ') };
  };

  const pursuitData = getPursuitCurves(current);

  const handleGraphMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const pct = relX / rect.width;
    const tSec = pct * (activeTab === 'pupil' ? 2.5 : 3.0);
    const svgX = 30 + pct * 540;

    let val = '';
    if (activeTab === 'pupil') {
      const latencySec = current.latencyMs / 1000;
      const d = tSec < latencySec ? 5.2 : Math.max(2.5, 5.2 - (tSec - latencySec) * 3.2);
      val = `${d.toFixed(2)} mm`;
    } else {
      const err = ((1 - current.gainRatio) * 100).toFixed(1);
      val = `${t('simulator.labelPursuitGain')}: ${current.gainRatio} (${err}%)`;
    }

    setHoverCoord({ x: svgX, y: 100, t: tSec, val });
  };

  return (
    <section id="clinical-simulator" className="py-20 sm:py-28 px-6 sm:px-10 lg:px-12 bg-[#F8FAFC] border-b border-[#E2E8F0]">
      <div className="max-w-[1440px] mx-auto space-y-12">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#E2E8F0] pb-6"
        >
          <div className="space-y-3 max-w-2xl">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#64748B] font-semibold">
              {t('simulator.eyebrow')}
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-[#0F172A]">
              {t('simulator.headingMain')} <span className="italic text-[#475569]">{t('simulator.headingItalic')}</span>
            </h2>
            <p className="font-sans text-sm text-[#475569] leading-relaxed">
              {t('simulator.subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-medium bg-[#F0FDF4] text-[#0F766E] border border-[#BBF7D0]">
              <Sparkles className="w-3.5 h-3.5" />
              {t('simulator.badgeLive')}
            </span>
          </div>
        </motion.div>

        {/* 1. Patient Profile Selectors (3 Interactive Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {Object.values(profiles).map((p) => {
            const isSelected = p.id === selectedId;
            return (
              <motion.button
                key={p.id}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedId(p.id);
                  soundFx.playClick();
                }}
                className={`text-left p-5 rounded-xl border transition-all relative ${
                  isSelected
                    ? 'bg-white border-[#0F172A] shadow-md ring-1 ring-[#0F172A]'
                    : 'bg-[#F1F5F9] border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]/60 mb-3">
                  <span className="font-mono text-[11px] text-[#64748B]">{p.name}</span>
                  <span
                    className={`font-mono text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
                      p.severity === 'normal'
                        ? 'bg-[#F0FDF4] text-[#0F766E] border border-[#BBF7D0]'
                        : p.severity === 'moderate'
                        ? 'bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]'
                        : 'bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]'
                    }`}
                  >
                    {dict.simulator.severityLabels[p.severity]}
                  </span>
                </div>

                <h4 className="font-serif text-lg font-normal text-[#0F172A] mb-1">
                  {p.condition}
                </h4>

                <div className="grid grid-cols-2 gap-2 pt-2 font-mono text-[11px] text-[#475569]">
                  <div>
                    <span className="text-[#64748B] block text-[9px] uppercase">{t('simulator.labelLatency')}</span>
                    <span className="font-bold text-[#0F172A]">{p.latencyMs} ms</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block text-[9px] uppercase">{t('simulator.labelPursuitGain')}</span>
                    <span className="font-bold text-[#0F172A]">{p.gainRatio.toFixed(2)}</span>
                  </div>
                </div>

                {isSelected && (
                  <motion.div
                    layoutId="activeBenchmarkPill"
                    className="absolute -bottom-[1px] left-4 right-4 h-0.5 bg-[#0F172A]"
                  />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* 2. Interactive Telemetry Visualizer Deck */}
        <div className="panel-ramp p-6 sm:p-8 space-y-6 shadow-ramp-card bg-white">
          {/* Deck Header & Mode Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                    current.severity === 'normal'
                      ? 'bg-[#0F766E]'
                      : current.severity === 'moderate'
                      ? 'bg-[#D97706]'
                      : 'bg-[#DC2626]'
                  }`}
                />
                <h3 className="font-serif text-xl sm:text-2xl text-[#0F172A] font-normal">
                  {current.condition} {t('simulator.telemetrySuffix')}
                </h3>
              </div>
              <span className="font-mono text-xs text-[#64748B]">
                {t('simulator.syntheticStream')}
              </span>
            </div>

            {/* View Mode Toggle: Pupil Reflex vs Smooth Pursuit */}
            <div className="flex items-center gap-1 bg-[#F1F5F9] p-1 rounded-lg border border-[#E2E8F0]">
              <button
                onClick={() => {
                  setActiveTab('pupil');
                  soundFx.playClick();
                }}
                className={`px-3 py-1.5 rounded text-xs font-mono transition-colors ${
                  activeTab === 'pupil'
                    ? 'bg-[#0F172A] text-[#0F766E] font-semibold shadow-xs'
                    : 'text-[#475569] hover:text-[#0F172A]'
                }`}
              >
                {t('simulator.tabPupil')}
              </button>
              <button
                onClick={() => {
                  setActiveTab('pursuit');
                  soundFx.playClick();
                }}
                className={`px-3 py-1.5 rounded text-xs font-mono transition-colors ${
                  activeTab === 'pursuit'
                    ? 'bg-[#0F172A] text-[#0F766E] font-semibold shadow-xs'
                    : 'text-[#475569] hover:text-[#0F172A]'
                }`}
              >
                {t('simulator.tabPursuit')}
              </button>
            </div>
          </div>

          {/* Interactive Screen Chart (High-Contrast Precision Display) */}
          <div className="relative aspect-[16/8] sm:aspect-[16/7] w-full bg-[#0F1117] rounded-xl border border-[#27282D] p-4 sm:p-6 flex flex-col justify-between overflow-hidden shadow-inner">
            {/* Top Metric Bar inside Display */}
            <div className="flex justify-between items-center text-xs font-mono text-[#64748B] pb-2 border-b border-white/10">
              <div className="flex items-center gap-4">
                <span>{t('simulator.labelPatient')} <strong className="text-white">{current.name}</strong></span>
                <span>{t('simulator.labelSampling')} <strong className="text-[#38BDF8]">{t('simulator.samplingVal')}</strong></span>
              </div>
              <div className="flex items-center gap-3">
                {hoverCoord && (
                  <span className="text-[#38BDF8] font-mono text-xs">
                    t = {hoverCoord.t.toFixed(2)}s &bull; {hoverCoord.val}
                  </span>
                )}
                <span className="text-[#0F766E] font-bold">
                  {activeTab === 'pupil'
                    ? t('simulator.labelLatencyUpper', { ms: current.latencyMs })
                    : t('simulator.labelGainRatio', { gain: current.gainRatio.toFixed(2) })}
                </span>
              </div>
            </div>

            {/* SVG Waveform Rendering with Live Crosshair */}
            <div className="relative flex-1 w-full flex items-center justify-center my-2 cursor-crosshair">
              <svg
                onMouseMove={handleGraphMouseMove}
                onMouseLeave={() => setHoverCoord(null)}
                className="w-full h-full"
                viewBox="0 0 600 200"
                preserveAspectRatio="none"
              >
                {/* Grid Lines */}
                <line x1="30" y1="40" x2="570" y2="40" stroke="#27282D" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="30" y1="100" x2="570" y2="100" stroke="#27282D" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="30" y1="160" x2="570" y2="160" stroke="#27282D" strokeWidth="1" strokeDasharray="3 3" />

                {/* Stimulus Flash Onset Line */}
                <line x1="120" y1="20" x2="120" y2="180" stroke="#0F766E" strokeWidth="1.5" strokeDasharray="4 4" />
                <text x="126" y="32" fill="#0F766E" fontSize="10" fontFamily="JetBrains Mono">
                  {t('simulator.stimulusOnset')}
                </text>

                {activeTab === 'pupil' ? (
                  <>
                    {/* Latency Mark */}
                    <line
                      x1={120 + (current.latencyMs / 1000) * 180}
                      y1="20"
                      x2={120 + (current.latencyMs / 1000) * 180}
                      y2="180"
                      stroke="#F87171"
                      strokeWidth="1.5"
                    />
                    <text
                      x={126 + (current.latencyMs / 1000) * 180}
                      y="50"
                      fill="#F87171"
                      fontSize="10"
                      fontFamily="JetBrains Mono"
                    >
                      {t('simulator.constrictionInitiates', { ms: current.latencyMs })}
                    </text>

                    {/* Dynamic Pupil Diameter Curve */}
                    <polyline
                      fill="none"
                      stroke="#38BDF8"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={getPupilCurve(current)}
                    />
                  </>
                ) : (
                  <>
                    {/* Target Trajectory (Dashed Gold) */}
                    <polyline
                      fill="none"
                      stroke="#0F766E"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                      points={pursuitData.target}
                    />
                    {/* Eye Gaze Trajectory (Solid Blue) */}
                    <polyline
                      fill="none"
                      stroke="#38BDF8"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={pursuitData.eye}
                    />
                  </>
                )}

                {/* Live hover crosshair */}
                {hoverCoord && (
                  <line
                    x1={hoverCoord.x}
                    y1="10"
                    x2={hoverCoord.x}
                    y2="190"
                    stroke="#FFFFFF"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    opacity="0.75"
                  />
                )}
              </svg>
            </div>

            {/* Bottom Legend */}
            <div className="flex justify-between items-center text-[11px] font-mono text-[#64748B] pt-2 border-t border-white/10">
              {activeTab === 'pupil' ? (
                <>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-[#38BDF8]" />
                    {t('simulator.pupilLegend')}
                  </span>
                  <span>{t('simulator.hoverHint')}</span>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-0.5 bg-[#0F766E]" />
                      {t('simulator.targetTrajectory')}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-0.5 bg-[#38BDF8]" />
                      {t('simulator.gazeFollower', { count: current.saccadeCount })}
                    </span>
                  </div>
                  <span>{t('simulator.sinusoidHz')}</span>
                </>
              )}
            </div>
          </div>

          {/* Clinical Interpretation Card */}
          <div className="p-4 sm:p-5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-2 font-mono text-xs">
            <span className="text-[#64748B] block uppercase tracking-wider text-[10px] font-semibold">
              {t('simulator.findingHeader')}
            </span>
            <p className="font-sans text-xs text-[#0F172A] leading-relaxed">
              {current.clinicalInterpretation}
            </p>
            <div className="pt-2 flex items-center justify-between text-[11px] border-t border-[#E2E8F0]/80">
              <span className="text-[#475569] font-sans">
                <strong>{t('simulator.nextStep')}</strong> {current.recommendation}
              </span>
              <Link
                to="/assessments/new"
                onClick={() => soundFx.playClick()}
                className="text-[#0F766E] font-semibold hover:underline flex items-center gap-1 shrink-0"
              >
                <span>{t('simulator.runScreening')}</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

export default JudgeBenchmarkSimulator;
