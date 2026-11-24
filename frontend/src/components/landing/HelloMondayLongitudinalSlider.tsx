import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp, SlidersHorizontal } from 'lucide-react';
import { soundFx } from '../../lib/soundFx';

export const HelloMondayLongitudinalSlider: React.FC = () => {
  const [sliderPos, setSliderPos] = useState<number>(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    soundFx.playClick();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(8, Math.min(92, (x / rect.width) * 100));
    setSliderPos(pct);
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  const setPreset = (pos: number) => {
    soundFx.playClick();
    setSliderPos(pos);
  };

  return (
    <section id="longitudinal-chapter" className="py-20 sm:py-28 px-6 sm:px-10 lg:px-12 border-b border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A]">
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
              Chapter 03 · LONGITUDINAL TEMPORAL DRIFT
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-[#0F172A]">
              Dual-Session <span className="italic text-[#475569]">Longitudinal Comparator.</span>
            </h2>
            <p className="font-sans text-sm text-[#475569] leading-relaxed">
              Drag the vertical divider to evaluate Session 01 (Baseline) against Session 02 (Follow-up Day 60). Observe verified biomarker drift without misleading cross-sectional population assumptions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono font-medium bg-[#F0FDF4] text-[#0F766E] border border-[#BBF7D0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E]" />
              Standardized Intra-Patient Protocol
            </span>
          </div>
        </motion.div>

        {/* Quick Presets Bar */}
        <div className="flex items-center justify-between font-mono text-xs pb-1">
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#475569]" />
            <span className="text-[#64748B] uppercase tracking-wider text-[10px]">Split Presets:</span>
            <button
              onClick={() => setPreset(15)}
              className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                sliderPos < 25 ? 'bg-[#0F172A] text-[#0F766E] font-semibold' : 'bg-white border border-[#E2E8F0] text-[#475569]'
              }`}
            >
              Session 02 View (Day 60)
            </button>
            <button
              onClick={() => setPreset(50)}
              className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                sliderPos >= 45 && sliderPos <= 55 ? 'bg-[#0F172A] text-[#0F766E] font-semibold' : 'bg-white border border-[#E2E8F0] text-[#475569]'
              }`}
            >
              50/50 Dual Split
            </button>
            <button
              onClick={() => setPreset(85)}
              className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                sliderPos > 75 ? 'bg-[#0F172A] text-[#0F766E] font-semibold' : 'bg-white border border-[#E2E8F0] text-[#475569]'
              }`}
            >
              Session 01 View (Baseline)
            </button>
          </div>

          <span className="text-[#64748B] text-[11px] hidden sm:inline">
            Drag divider left / right across canvas
          </span>
        </div>

        {/* Dual Split Comparator Canvas */}
        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="relative w-full border border-[#E2E8F0] rounded-xl overflow-hidden select-none min-h-[420px] cursor-ew-resize shadow-ramp-card bg-white"
        >
          {/* Base Layer: Session 02 (Follow-up Day 60) */}
          <div className="absolute inset-0 p-8 sm:p-12 flex flex-col justify-between bg-[#F8FAFC]">
            <div className="flex items-center justify-end">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono font-semibold bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]">
                SESSION 02 · POST-ACUTE FOLLOW-UP (DAY 60)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-xl ml-auto text-right font-mono">
              <div className="p-4 bg-white border border-[#E2E8F0] rounded-lg space-y-1 shadow-xs">
                <span className="text-[10px] text-[#64748B] uppercase block">Constriction Latency</span>
                <span className="text-2xl font-bold text-[#B45309]">263 ms</span>
                <span className="text-[11px] text-[#B45309] block font-semibold">+25 ms Delta (Delayed)</span>
              </div>
              <div className="p-4 bg-white border border-[#E2E8F0] rounded-lg space-y-1 shadow-xs">
                <span className="text-[10px] text-[#64748B] uppercase block">Constriction Velocity</span>
                <span className="text-2xl font-bold text-[#0F172A]">3.90 mm/s</span>
                <span className="text-[11px] text-[#64748B] block">-0.40 mm/s</span>
              </div>
              <div className="p-4 bg-white border border-[#E2E8F0] rounded-lg space-y-1 shadow-xs">
                <span className="text-[10px] text-[#64748B] uppercase block">Pursuit Gain Ratio</span>
                <span className="text-2xl font-bold text-[#B45309]">0.86</span>
                <span className="text-[11px] text-[#B45309] block font-semibold">-0.08 Saccadic Slip</span>
              </div>
            </div>

            <div className="flex items-center justify-end text-xs text-[#475569] font-mono">
              <span>Patient Ref: OT-4091 &bull; Ambient Lux: 350 lx</span>
            </div>
          </div>

          {/* Overlaid Clipped Layer: Session 01 (Baseline) */}
          <div
            className="absolute inset-0 p-8 sm:p-12 flex flex-col justify-between bg-white border-r border-[#0F172A] overflow-hidden"
            style={{ width: `${sliderPos}%` }}
          >
            <div className="flex items-center justify-start min-w-[500px]">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono font-semibold bg-[#F0FDF4] text-[#0F766E] border border-[#BBF7D0]">
                SESSION 01 · VERIFIED BASELINE (DAY 0)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-xl text-left font-mono min-w-[500px]">
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-1 shadow-xs">
                <span className="text-[10px] text-[#64748B] uppercase block">Constriction Latency</span>
                <span className="text-2xl font-bold text-[#0F766E]">238 ms</span>
                <span className="text-[11px] text-[#0F766E] block font-semibold">Normative Range</span>
              </div>
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-1 shadow-xs">
                <span className="text-[10px] text-[#64748B] uppercase block">Constriction Velocity</span>
                <span className="text-2xl font-bold text-[#0F172A]">4.30 mm/s</span>
                <span className="text-[11px] text-[#64748B] block">Healthy Peak</span>
              </div>
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-1 shadow-xs">
                <span className="text-[10px] text-[#64748B] uppercase block">Pursuit Gain Ratio</span>
                <span className="text-2xl font-bold text-[#0F766E]">0.94</span>
                <span className="text-[11px] text-[#0F766E] block font-semibold">Unity Pursuit</span>
              </div>
            </div>

            <div className="flex items-center justify-start text-xs text-[#475569] font-mono min-w-[500px]">
              <span>Protocol v0.1 &bull; 60 FPS Optical Calibrated</span>
            </div>
          </div>

          {/* Draggable Divider Handle */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-[#0F172A] pointer-events-none"
            style={{ left: `${sliderPos}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#0F172A] text-[#0F766E] flex items-center justify-center shadow-lg font-mono text-xs font-bold border border-white/20">
              ↔
            </div>
          </div>
        </div>

        {/* Clinical Note Below Comparator */}
        <div className="p-5 bg-white border border-[#E2E8F0] rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-[#0F172A] shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-[#0F172A] block font-sans">
                Methodological Principle: Self-Referenced Longitudinal Benchmarking
              </span>
              <p className="text-xs text-[#475569] font-normal leading-relaxed">
                Inter-individual pupil variation is wide across general populations. OcuTrack prioritizes intra-individual change metrics (Δ) over static cross-sectional tables to detect true neurological drift.
              </p>
            </div>
          </div>
          <Link
            to="/console"
            onClick={() => soundFx.playClick()}
            className="btn-ramp-primary text-xs py-2 px-4 shrink-0 shadow-sm"
          >
            <span>Inspect Cohort Delta Engine</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>
    </section>
  );
};

export default HelloMondayLongitudinalSlider;
