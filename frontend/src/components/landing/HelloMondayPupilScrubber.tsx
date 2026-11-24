import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { soundFx } from '../../lib/soundFx';
import { useTranslation } from '../../i18n';

export const HelloMondayPupilScrubber: React.FC = () => {
  const { t } = useTranslation();
  const [time, setTime] = useState<number>(0.92);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const sectionRef = useRef<HTMLElement>(null);
  const isVisibleRef = useRef<boolean>(true);

  // Clinical Pupillary Light Reflex curve:
  // Baseline (0-400ms) -> Flash at 400ms -> Latency window (400-620ms, ~220ms) -> Constriction (620-1150ms) -> Recovery
  const calculatePupilDiameter = useCallback((t: number): number => {
    if (t < 0.4) return 4.85;
    if (t < 0.62) return 4.85; // Latency window (~220ms)
    if (t <= 1.15) {
      const progress = (t - 0.62) / (1.15 - 0.62);
      return 4.85 - 2.2 * Math.sin((progress * Math.PI) / 2);
    }
    const recoveryProgress = (t - 1.15) / (3.0 - 1.15);
    return 2.65 + 1.85 * (1 - Math.exp(-recoveryProgress * 2.2));
  }, []);

  const calculateVelocity = (t: number): number => {
    const dt = 0.02;
    const d1 = calculatePupilDiameter(Math.max(0, t - dt));
    const d2 = calculatePupilDiameter(Math.min(3, t + dt));
    return (d2 - d1) / (2 * dt);
  };

  const currentDiameter = calculatePupilDiameter(time);
  const currentVelocity = calculateVelocity(time);

  let phaseLabel = t('pupilScrubber.phaseBaseline');
  let phaseStatus = 'baseline';
  if (time >= 0.4 && time < 0.62) {
    phaseLabel = t('pupilScrubber.phaseLatency');
    phaseStatus = 'latency';
  } else if (time >= 0.62 && time < 1.15) {
    phaseLabel = t('pupilScrubber.phaseConstriction');
    phaseStatus = 'constriction';
  } else if (time >= 1.15) {
    phaseLabel = t('pupilScrubber.phaseRecovery');
    phaseStatus = 'recovery';
  }

  // Safe IntersectionObserver to avoid background CPU load
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.IntersectionObserver !== 'function') return;
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
        if (!entry.isIntersecting && isPlaying) {
          setIsPlaying(false);
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [isPlaying]);

  // Animation Loop for Playback ONLY active when isPlaying is true
  useEffect(() => {
    if (!isPlaying) return;

    let animId: number;
    let lastStamp: number | null = null;

    const tick = (now: number) => {
      if (!lastStamp) lastStamp = now;
      const dt = (now - lastStamp) / 1000;
      lastStamp = now;

      if (isVisibleRef.current) {
        setTime((prev) => {
          const next = prev + dt;
          if (next >= 3.0) {
            setIsPlaying(false);
            return 3.0;
          }
          return next;
        });
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  // Generate SVG curve points for 0 to 3 seconds
  const curvePoints: { x: number; y: number }[] = [];
  const svgW = 600;
  const svgH = 180;
  for (let s = 0; s <= 3.0; s += 0.05) {
    const d = calculatePupilDiameter(s);
    const px = 30 + (s / 3.0) * (svgW - 60);
    const py = 30 + ((5.2 - d) / (5.2 - 2.5)) * (svgH - 60);
    curvePoints.push({ x: px, y: py });
  }
  const pathD = curvePoints.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(' ');

  // Current scrubber X position on SVG
  const currentScrubberX = 30 + (time / 3.0) * (svgW - 60);
  const currentScrubberY = 30 + ((5.2 - currentDiameter) / (5.2 - 2.5)) * (svgH - 60);

  return (
    <section
      ref={sectionRef}
      id="pupil-chapter"
      className="py-20 sm:py-28 px-6 sm:px-10 lg:px-12 border-b border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A]"
    >
      <div className="max-w-[1440px] mx-auto space-y-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#E2E8F0] pb-6"
        >
          <div className="space-y-2 max-w-2xl">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#64748B] font-semibold">
              {t('pupilScrubber.eyebrow')}
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-[#0F172A]">
              {t('pupilScrubber.headingMain')} <span className="italic text-[#475569]">{t('pupilScrubber.headingItalic')}</span>
            </h2>
            <p className="font-sans text-sm text-[#475569] leading-relaxed">
              {t('pupilScrubber.subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono font-medium bg-white text-[#0F172A] border border-[#E2E8F0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E]" />
              {t('pupilScrubber.resolutionBadge')}
            </span>
          </div>
        </motion.div>

        {/* Ramp Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Interactive Oscilloscope Curve */}
          <div className="lg:col-span-8 panel-ramp p-6 sm:p-8 space-y-6 bg-white shadow-ramp-card">

            {/* Top Bar with Phase Badge and Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono font-medium ${
                  phaseStatus === 'latency'
                    ? 'bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]'
                    : phaseStatus === 'constriction'
                    ? 'bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA]'
                    : 'bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    phaseStatus === 'latency' ? 'bg-[#B45309]' : phaseStatus === 'constriction' ? 'bg-[#B91C1C]' : 'bg-[#0F766E]'
                  }`} />
                  {phaseLabel}
                </span>
              </div>

              <div className="flex items-center gap-2 font-mono text-xs">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setIsPlaying(!isPlaying);
                  }}
                  className="btn-ramp-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlaying ? t('pupilScrubber.pause') : t('pupilScrubber.playSweep')}</span>
                </motion.button>
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setTime(0);
                    setIsPlaying(false);
                  }}
                  className="p-1.5 rounded-md border border-[#E2E8F0] hover:border-[#CBD5E1] bg-white text-[#475569] hover:text-[#0F172A] transition-colors"
                  title={t('pupilScrubber.resetTitle')}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* SVG Interactive Wave Graph */}
            <div className="relative bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4 overflow-hidden select-none shadow-inner">
              <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto max-h-[220px]">
                {/* Horizontal reference grid lines */}
                <line x1="30" y1="30" x2={svgW - 30} y2="30" stroke="#E2E8F0" strokeDasharray="3 3" />
                <line x1="30" y1={svgH / 2} x2={svgW - 30} y2={svgH / 2} stroke="#E2E8F0" strokeDasharray="3 3" />
                <line x1="30" y1={svgH - 30} x2={svgW - 30} y2={svgH - 30} stroke="#E2E8F0" strokeDasharray="3 3" />

                {/* Stimulus flash zone (0.4s to 1.4s) */}
                <rect
                  x={30 + (0.4 / 3.0) * (svgW - 60)}
                  y="20"
                  width={(1.0 / 3.0) * (svgW - 60)}
                  height={svgH - 40}
                  fill="#FFFBEB"
                  opacity="0.85"
                />
                <text
                  x={30 + (0.4 / 3.0) * (svgW - 60) + 6}
                  y="35"
                  fill="#B45309"
                  fontSize="9"
                  fontFamily="JetBrains Mono"
                  fontWeight="600"
                >
                  {t('pupilScrubber.flashOnsetLabel')}
                </text>

                {/* Primary Constriction Curve Line */}
                <path d={pathD} fill="none" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />

                {/* Scrubber vertical line indicator */}
                <line
                  x1={currentScrubberX}
                  y1="20"
                  x2={currentScrubberX}
                  y2={svgH - 20}
                  stroke="#0F766E"
                  strokeWidth="2"
                />
                <circle cx={currentScrubberX} cy={currentScrubberY} r="5" fill="#0F766E" stroke="#FFFFFF" strokeWidth="2" />

                {/* Axis Labels */}
                <text x="32" y={svgH - 10} fill="#64748B" fontSize="9" fontFamily="JetBrains Mono">0.0s</text>
                <text x={30 + (1.0 / 3.0) * (svgW - 60)} y={svgH - 10} fill="#64748B" fontSize="9" fontFamily="JetBrains Mono">1.0s</text>
                <text x={30 + (2.0 / 3.0) * (svgW - 60)} y={svgH - 10} fill="#64748B" fontSize="9" fontFamily="JetBrains Mono">2.0s</text>
                <text x={svgW - 55} y={svgH - 10} fill="#64748B" fontSize="9" fontFamily="JetBrains Mono">3.0s</text>
              </svg>
            </div>

            {/* Slider Control & Epoch Presets */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#475569]">{t('pupilScrubber.scrubTime')}</span>
                <span className="text-[#0F172A] font-semibold text-sm">{time.toFixed(2)}s ({Math.round(time * 1000)} ms)</span>
              </div>

              {/* Epoch Presets */}
              <div className="flex items-center gap-1.5 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setTime(0.2);
                    setIsPlaying(false);
                    soundFx.playClick();
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] ${time < 0.35 ? 'bg-[#0F172A] text-[#0F766E]' : 'bg-[#F1F5F9] text-[#475569]'}`}
                >
                  {t('pupilScrubber.presetBaseline')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTime(0.5);
                    setIsPlaying(false);
                    soundFx.playClick();
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] ${time >= 0.4 && time < 0.62 ? 'bg-[#0F172A] text-[#0F766E]' : 'bg-[#F1F5F9] text-[#475569]'}`}
                >
                  {t('pupilScrubber.presetLatency')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTime(0.85);
                    setIsPlaying(false);
                    soundFx.playClick();
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] ${time >= 0.7 && time < 1.15 ? 'bg-[#0F172A] text-[#0F766E]' : 'bg-[#F1F5F9] text-[#475569]'}`}
                >
                  {t('pupilScrubber.presetVelocity')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTime(1.8);
                    setIsPlaying(false);
                    soundFx.playClick();
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] ${time >= 1.4 ? 'bg-[#0F172A] text-[#0F766E]' : 'bg-[#F1F5F9] text-[#475569]'}`}
                >
                  {t('pupilScrubber.presetRedilation')}
                </button>
              </div>

              <input
                type="range"
                min="0"
                max="3"
                step="0.01"
                value={time}
                onChange={(e) => {
                  setTime(parseFloat(e.target.value));
                  if (isPlaying) setIsPlaying(false);
                }}
                className="w-full accent-[#0F172A] bg-[#E2E8F0] h-2 rounded appearance-none cursor-pointer"
              />
            </div>

          </div>

          {/* Right Column: Quantitative Telemetry Panel */}
          <div className="lg:col-span-4 panel-ramp p-6 sm:p-8 space-y-6 bg-white shadow-ramp-card">

            <h3 className="font-mono text-xs uppercase tracking-wider text-[#64748B] font-semibold pb-3 border-b border-[#E2E8F0]">
              {t('pupilScrubber.telemetryHeader')}
            </h3>

            {/* Pupil Visual Crosshair Viewfinder */}
            <div className="relative aspect-video w-full rounded-lg bg-[#0F1117] border border-[#27282D] flex items-center justify-center overflow-hidden shadow-inner">
              {/* Outer iris outline */}
              <div className="relative w-36 h-36 rounded-full border border-gray-600 flex items-center justify-center">
                {/* Iris ring */}
                <div className="w-28 h-28 rounded-full bg-[#1F2430] border border-gray-500 flex items-center justify-center">
                  {/* Dynamic pupil circle */}
                  <div
                    className="rounded-full bg-[#090A0D] transition-all duration-75 flex items-center justify-center shadow-inner"
                    style={{
                      width: `${(currentDiameter / 5.2) * 72}px`,
                      height: `${(currentDiameter / 5.2) * 72}px`,
                    }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-white/70 -translate-x-1 -translate-y-1" />
                  </div>
                </div>
                {/* Crosshairs */}
                <div className="absolute inset-x-0 h-px bg-white/20" />
                <div className="absolute inset-y-0 w-px bg-white/20" />
              </div>

              <div className="absolute top-2 right-2 text-[9px] font-mono text-[#0F766E] bg-black/60 px-1.5 py-0.5 rounded">
                {t('pupilScrubber.calibratedBadge')}
              </div>
            </div>

            {/* Quantitative Numbers */}
            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                <span className="text-[#475569]">{t('pupilScrubber.diameter')}</span>
                <span className="text-base font-semibold text-[#0F172A]">{currentDiameter.toFixed(2)} mm</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                <span className="text-[#475569]">{t('pupilScrubber.velocity')}</span>
                <span className={`text-base font-semibold ${currentVelocity < -0.5 ? 'text-[#B91C1C]' : 'text-[#0F172A]'}`}>
                  {currentVelocity.toFixed(2)} mm/s
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                <span className="text-[#475569]">{t('pupilScrubber.latencyWindow')}</span>
                <span className="text-base font-semibold text-[#0F766E]">220 ms</span>
              </div>
            </div>

            <p className="text-xs text-[#475569] leading-relaxed font-normal">
              {t('pupilScrubber.clinicalNote')}
            </p>

          </div>

        </div>

      </div>
    </section>
  );
};

export default HelloMondayPupilScrubber;
