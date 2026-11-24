import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  AlertTriangle,
  Flame,
  Sparkles,
  WifiOff,
  Zap,
  DollarSign,
  ShieldCheck,
} from 'lucide-react';
import { soundFx } from '../../lib/soundFx';

interface StoryChapter {
  id: string;
  number: string;
  eyebrow: string;
  title: string;
  subtitle: string;
}

export const JudgeStoryScroll: React.FC = () => {
  const [activeChapter, setActiveChapter] = useState<number>(0);
  const chapterRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Interactive Act 1 State (Cost & Access)
  const [costScenario, setCostScenario] = useState<'traditional' | 'ocutrack'>('ocutrack');
  const [clinicsCount, setClinicsCount] = useState<number>(10);

  // Interactive Act 2 State (Active Protocol Demo)
  const [demoProtocol, setDemoProtocol] = useState<'pupil' | 'pursuit'>('pupil');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [flashPhase, setFlashPhase] = useState<'idle' | 'flashing' | 'constricting' | 'recovered'>('idle');
  const [pursuitPos, setPursuitPos] = useState({ target: 50, eye: 50, saccade: false });

  // Interactive Act 3 State (11.7mm Distance Invariance)
  const [patientDistanceCm, setPatientDistanceCm] = useState<number>(45);

  // Interactive Act 4 State (Population vs Longitudinal)
  const [comparatorMode, setComparatorMode] = useState<'population' | 'longitudinal'>('longitudinal');

  // Interactive Act 5 State (Burn After Reading Simulation)
  const [purgeStatus, setPurgeStatus] = useState<'retained' | 'purging' | 'destroyed'>('destroyed');

  const chapters: StoryChapter[] = [
    {
      id: 'chapter-cost',
      number: '01',
      eyebrow: 'THE DIAGNOSTIC DIVIDE',
      title: 'The $25,000 Hospital Wall',
      subtitle: 'Why 99% of clinics have zero objective tools to detect early neurological reflex slowing.',
    },
    {
      id: 'chapter-protocol',
      number: '02',
      eyebrow: 'THE CONSUMER SILICON BREAKTHROUGH',
      title: 'Two Tests. 30 Seconds. Any Laptop.',
      subtitle: 'Replacing hospital infrared rigs with standard consumer optical sensors in modern web browsers.',
    },
    {
      id: 'chapter-math',
      number: '03',
      eyebrow: 'DISTANCE-INVARIANT COMPUTER VISION',
      title: 'The 11.7 mm Universal Iris Caliper',
      subtitle: 'Converting arbitrary webcam pixels into absolute clinical millimeters without calibration cards.',
    },
    {
      id: 'chapter-delta',
      number: '04',
      eyebrow: 'THE CORE CLINICAL DIFFERENTIATOR',
      title: 'Comparing You to Yourself (Δ)',
      subtitle: 'Why static population averages fail, and how intra-patient longitudinal drift catches early decline.',
    },
    {
      id: 'chapter-ethics',
      number: '05',
      eyebrow: 'SECURITY & SCIENTIFIC INTEGRITY',
      title: 'Burn After Reading & Rural Edge',
      subtitle: 'Zero raw video retention on disk, offline queuing, and radical scientific honesty.',
    },
  ];

  // Active smooth pursuit animation loop for Act 2
  useEffect(() => {
    let animId: number;
    let t = 0;
    const loop = () => {
      t += 0.035;
      // Target sweeps between 15% and 85%
      const target = 50 + 35 * Math.sin(t);
      // Eye lags by ~0.18 phase, with slight saccadic correction
      const lagT = t - 0.22;
      let eye = 50 + 35 * Math.sin(lagT);
      const isSaccade = Math.abs(target - eye) > 12;
      if (isSaccade) {
        eye += (target - eye) * 0.45; // Catch-up jump
      }

      setPursuitPos({ target, eye, saccade: isSaccade });
      animId = requestAnimationFrame(loop);
    };

    if (demoProtocol === 'pursuit') {
      animId = requestAnimationFrame(loop);
    }
    return () => cancelAnimationFrame(animId);
  }, [demoProtocol]);

  // Intersection observer to track which chapter is currently in view
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + window.innerHeight * 0.35;
      chapterRefs.current.forEach((el, index) => {
        if (!el) return;
        const top = el.offsetTop;
        const height = el.offsetHeight;
        if (scrollPos >= top && scrollPos < top + height) {
          setActiveChapter(index);
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToChapter = (index: number) => {
    soundFx.playClick();
    const el = chapterRefs.current[index];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Chapter 3 math calculation
  const irisPixelCount = Math.round(180 * (45 / patientDistanceCm));
  const calculatedMillimeters = ((11.7 / irisPixelCount) * irisPixelCount).toFixed(2);
  const mmPerPixel = (11.7 / irisPixelCount).toFixed(3);

  // Chapter 2 flash simulation
  const handleTriggerFlashSim = () => {
    soundFx.playFlash();
    setIsSimulating(true);
    setFlashPhase('flashing');

    setTimeout(() => {
      setFlashPhase('constricting');
    }, 240);

    setTimeout(() => {
      setFlashPhase('recovered');
      setIsSimulating(false);
      soundFx.playSuccess();
    }, 1200);
  };

  // Chapter 5 purge trigger
  const handlePurgeSimulation = () => {
    soundFx.playFlash();
    setPurgeStatus('purging');
    setTimeout(() => {
      setPurgeStatus('destroyed');
      soundFx.playSuccess();
    }, 1100);
  };

  return (
    <section id="story-chronicle" className="relative bg-[#F8FAFC] text-[#0F172A] border-b border-[#E2E8F0] py-20 lg:py-28">
      <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-12">

        {/* Section Master Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mb-16 space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#F1F5F9] border border-[#E2E8F0] text-[11px] font-mono font-medium text-[#0F172A] shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#0F766E]" />
            <span>EXECUTIVE BRIEF FOR JUDGES &amp; CLINICIANS</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-[#0F172A]">
            The OcuTrack Story: <br className="hidden sm:block" />
            <span className="italic text-[#475569]">From $25k Calipers to Consumer Silicon.</span>
          </h2>
          <p className="font-sans text-base text-[#475569] leading-relaxed">
            Follow the 5-act narrative below to understand how OcuTrack transforms standard laptop webcams into objective neuro-reflex screening instruments in under 30 seconds.
          </p>
        </motion.div>

        {/* Interactive Sticky Story Navigation Bar with Progress Spine */}
        <div className="sticky top-20 z-30 bg-[#F8FAFC]/95 backdrop-blur-md py-3.5 border-y border-[#E2E8F0] mb-12 -mx-6 px-6 sm:-mx-10 sm:px-10 lg:-mx-12 lg:px-12 shadow-xs transition-all">
          <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1.5 sm:gap-2">
              {chapters.map((ch, idx) => {
                const isActive = activeChapter === idx;
                return (
                  <button
                    key={ch.id}
                    onClick={() => scrollToChapter(idx)}
                    className={`relative px-3 py-1.5 rounded-md text-xs font-mono transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      isActive
                        ? 'bg-[#0F172A] text-[#0F766E] font-semibold shadow-xs'
                        : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
                    }`}
                  >
                    <span className="opacity-60">{ch.number}</span>
                    <span className="hidden sm:inline">{ch.title.split(' ')[0]}</span>
                    {isActive && (
                      <motion.span
                        layoutId="activeStoryDot"
                        className="w-1.5 h-1.5 rounded-full bg-[#0F766E]"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="font-mono text-[11px] text-[#64748B] hidden md:inline">
                Act {activeChapter + 1} of {chapters.length}
              </span>
              <div className="w-16 h-1 bg-[#E2E8F0] rounded-full overflow-hidden hidden sm:block">
                <div
                  className="h-full bg-[#0F766E] transition-all duration-300"
                  style={{ width: `${((activeChapter + 1) / chapters.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Chapter Container List */}
        <div className="space-y-24 lg:space-y-32">

          {/* =========================================================================
              ACT 01: The $25,000 Hospital Wall
          ========================================================================= */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.55 }}
            ref={(el) => (chapterRefs.current[0] = el)}
            className="scroll-mt-36 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center"
          >
            {/* Story Text */}
            <div className="lg:col-span-6 space-y-5">
              <span className="font-mono text-[11px] tracking-widest text-[#64748B] uppercase font-semibold">
                Act 01 · {chapters[0].eyebrow}
              </span>
              <h3 className="font-serif text-3xl sm:text-4xl text-[#0F172A] font-normal leading-tight">
                Why 99% of Clinics Lack Objective Reflex Diagnostics.
              </h3>
              <p className="font-sans text-sm sm:text-base text-[#475569] leading-relaxed">
                Hospital-grade infrared pupillometers cost upwards of <strong className="text-[#0F172A] font-semibold">$25,000 per unit</strong> and require specialized operator training. As a consequence, rural primary health centers, sports sidelines, and community triage rely exclusively on visual penlight inspection.
              </p>
              <div className="p-4 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] text-xs font-mono text-[#92400E] space-y-1 shadow-xs">
                <span className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-[#D97706]" />
                  THE CLINICAL ACCURACY GAP
                </span>
                <p className="font-sans text-xs text-[#78350F] leading-relaxed">
                  Human visual reaction time cannot reliably perceive millisecond-level autonomic latency shifts (&lt; 50 ms). Subtle autonomic delays caused by acute concussions or neurodegeneration go undetected until gross pathology emerges.
                </p>
              </div>
            </div>

            {/* Interactive Exhibit 1: Cost & Access Comparator */}
            <div className="lg:col-span-6">
              <div className="panel-ramp p-6 space-y-6 shadow-ramp-card">
                <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                  <span className="font-mono text-xs uppercase tracking-wider text-[#0F172A] font-semibold flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-[#0F766E]" />
                    Deployment Economic Model
                  </span>
                  <div className="flex items-center gap-1 bg-[#F1F5F9] p-0.5 rounded border border-[#E2E8F0]">
                    <button
                      onClick={() => {
                        setCostScenario('traditional');
                        soundFx.playClick();
                      }}
                      className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors ${
                        costScenario === 'traditional'
                          ? 'bg-white text-[#0F172A] font-semibold shadow-xs'
                          : 'text-[#64748B] hover:text-[#0F172A]'
                      }`}
                    >
                      Hospital Rig
                    </button>
                    <button
                      onClick={() => {
                        setCostScenario('ocutrack');
                        soundFx.playClick();
                      }}
                      className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors ${
                        costScenario === 'ocutrack'
                          ? 'bg-[#0F172A] text-[#0F766E] font-semibold shadow-xs'
                          : 'text-[#64748B] hover:text-[#0F172A]'
                      }`}
                    >
                      OcuTrack Web
                    </button>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {costScenario === 'traditional' ? (
                    <motion.div
                      key="traditional"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <div className="p-5 rounded-lg bg-[#FEF2F2] border border-[#FECACA] space-y-2">
                        <div className="flex justify-between items-center text-sm font-mono text-[#991B1B]">
                          <span className="font-bold">Hardware Cost</span>
                          <span className="text-2xl font-bold font-serif">$25,000+</span>
                        </div>
                        <p className="font-sans text-xs text-[#7F1D1D]">
                          Dedicated infrared hardware cart. Requires hospital capital procurement budget and proprietary consumables.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 font-mono text-xs text-[#475569]">
                        <div className="p-3 bg-[#F1F5F9] rounded border border-[#E2E8F0]">
                          <span className="block text-[10px] text-[#64748B] uppercase">Accessibility</span>
                          <span className="font-semibold text-[#0F172A]">Top-Tier Neuro ICUs Only</span>
                        </div>
                        <div className="p-3 bg-[#F1F5F9] rounded border border-[#E2E8F0]">
                          <span className="block text-[10px] text-[#64748B] uppercase">Training Time</span>
                          <span className="font-semibold text-[#0F172A]">Dedicated Specialist</span>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="ocutrack"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <div className="p-5 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] space-y-2">
                        <div className="flex justify-between items-center text-sm font-mono text-[#0F766E]">
                          <span className="font-bold">Hardware Cost</span>
                          <span className="text-2xl font-bold font-serif">$0.00 (Zero CapEx)</span>
                        </div>
                        <p className="font-sans text-xs text-[#065F46]">
                          Runs in modern web browsers (Chrome, Edge, Safari) on existing clinic laptops and standard 720p webcams.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 font-mono text-xs text-[#475569]">
                        <div className="p-3 bg-[#F1F5F9] rounded border border-[#E2E8F0]">
                          <span className="block text-[10px] text-[#64748B] uppercase">Accessibility</span>
                          <span className="font-semibold text-[#0F766E]">Universal (Every Village &amp; Sideline)</span>
                        </div>
                        <div className="p-3 bg-[#F1F5F9] rounded border border-[#E2E8F0]">
                          <span className="block text-[10px] text-[#64748B] uppercase">Training Time</span>
                          <span className="font-semibold text-[#0F766E]">Zero Install · 2-Min Guidance</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Interactive Multi-Clinic Scaling Calculator */}
                <div className="p-3 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0] space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between text-[#475569]">
                    <span>Deploy across <strong className="text-[#0F172A]">{clinicsCount} Community Clinics:</strong></span>
                    <span className="font-bold text-[#0F766E]">
                      Save ${(clinicsCount * 25000).toLocaleString()}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={clinicsCount}
                    onChange={(e) => setClinicsCount(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-[#E2E8F0] rounded appearance-none cursor-pointer accent-[#0F172A]"
                  />
                </div>

                <div className="text-right text-[11px] font-mono text-[#64748B]">
                  Tap toggle above to switch economics view
                </div>
              </div>
            </div>
          </motion.div>

          {/* =========================================================================
              ACT 02: Two Tests. 30 Seconds. Any Laptop.
          ========================================================================= */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.55 }}
            ref={(el) => (chapterRefs.current[1] = el)}
            className="scroll-mt-36 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center"
          >
            {/* Interactive Exhibit 2 (Left): Active Protocol Interactive Console */}
            <div className="lg:col-span-6 order-2 lg:order-1">
              <div className="panel-ramp p-6 space-y-5 shadow-ramp-card">
                <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#0F766E] animate-pulse" />
                    <span className="font-mono text-xs uppercase tracking-wider text-[#0F172A] font-semibold">
                      Interactive Protocol Sandbox
                    </span>
                  </div>
                  <div className="flex items-center gap-1 bg-[#F1F5F9] p-0.5 rounded border border-[#E2E8F0]">
                    <button
                      onClick={() => {
                        setDemoProtocol('pupil');
                        soundFx.playClick();
                      }}
                      className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors ${
                        demoProtocol === 'pupil'
                          ? 'bg-[#0F172A] text-[#0F766E] font-semibold shadow-xs'
                          : 'text-[#64748B] hover:text-[#0F172A]'
                      }`}
                    >
                      01 Flash Test
                    </button>
                    <button
                      onClick={() => {
                        setDemoProtocol('pursuit');
                        soundFx.playClick();
                      }}
                      className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors ${
                        demoProtocol === 'pursuit'
                          ? 'bg-[#0F172A] text-[#0F766E] font-semibold shadow-xs'
                          : 'text-[#64748B] hover:text-[#0F172A]'
                      }`}
                    >
                      02 Follow Dot
                    </button>
                  </div>
                </div>

                {demoProtocol === 'pupil' ? (
                  <div className="space-y-4">
                    <div className="relative aspect-[16/9] bg-[#0F1117] rounded-lg border border-[#27282D] flex items-center justify-center overflow-hidden shadow-inner">
                      {flashPhase === 'flashing' && (
                        <div className="absolute inset-0 bg-white flex items-center justify-center z-20">
                          <span className="font-mono text-xs text-[#0F172A] font-bold uppercase tracking-widest bg-white/90 px-3 py-1 rounded shadow-sm">
                            FLASH ONSET · 1000 MS PULSE
                          </span>
                        </div>
                      )}
                      <div className="text-center space-y-3 relative z-10 text-white">
                        <div className="relative w-24 h-24 rounded-full mx-auto border-2 border-[#0F766E] flex items-center justify-center bg-[#1A1F2C]">
                          <motion.div
                            animate={{
                              width: flashPhase === 'constricting' ? '24px' : '56px',
                              height: flashPhase === 'constricting' ? '24px' : '56px',
                            }}
                            transition={{ duration: 0.35, ease: 'easeOut' }}
                            className="rounded-full bg-black shadow-inner"
                          />
                          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#0F172A] text-[#0F766E] border border-white/20">
                            {flashPhase === 'constricting' ? '2.40 mm' : '5.20 mm'}
                          </span>
                        </div>
                        <div className="font-mono text-xs text-[#64748B]">
                          {flashPhase === 'constricting' ? (
                            <span className="text-[#34D399] font-bold">Latency: 238 ms · Constriction Velocity: 4.8 mm/s</span>
                          ) : (
                            <span>Resting Baseline: 5.20 mm · Ready for Pulse</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleTriggerFlashSim}
                      disabled={isSimulating}
                      className="btn-ramp-primary w-full text-xs font-mono py-2.5 flex items-center justify-center gap-2"
                    >
                      <Zap className="w-3.5 h-3.5 text-[#0F766E]" />
                      <span>{isSimulating ? 'Simulating Optical Response…' : 'Simulate Screen Flash Reflex'}</span>
                    </motion.button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative aspect-[16/9] bg-[#0F1117] rounded-lg border border-[#27282D] flex items-center justify-center overflow-hidden p-6 shadow-inner">
                      {/* Guide Track line */}
                      <div className="w-full relative h-1 bg-[#27282D] rounded-full">
                        {/* Sinusoidal Sweeping target dot */}
                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#0F766E] -ml-2 shadow-[0_0_8px_#0F766E]"
                          style={{ left: `${pursuitPos.target}%` }}
                        />
                        {/* Eye tracking marker with lag and saccade catch-up */}
                        <div
                          className={`absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 -ml-[7px] transition-colors duration-100 ${
                            pursuitPos.saccade ? 'border-[#F87171] bg-[#F87171]/20' : 'border-[#38BDF8]'
                          }`}
                          style={{ left: `${pursuitPos.eye}%` }}
                        />
                      </div>

                      <div className="absolute bottom-3 left-4 right-4 flex justify-between font-mono text-[10px] text-[#64748B]">
                        <span>Gain: 0.94 (Unity)</span>
                        <span className={pursuitPos.saccade ? 'text-[#F87171] font-bold' : ''}>
                          {pursuitPos.saccade ? 'Catch-Up Saccade' : 'Smooth Track'}
                        </span>
                        <span>0.4 Hz Sweep</span>
                      </div>
                    </div>

                    <div className="p-3 bg-[#F1F5F9] rounded border border-[#E2E8F0] text-xs font-mono text-[#475569] flex items-center justify-between">
                      <span>Yellow = Moving Target &bull; Blue = Eye Follower</span>
                      <span className="text-[#0F766E] font-semibold">Continuous Kinematics</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Story Text (Right) */}
            <div className="lg:col-span-6 space-y-5 order-1 lg:order-2">
              <span className="font-mono text-[11px] tracking-widest text-[#64748B] uppercase font-semibold">
                Act 02 · {chapters[1].eyebrow}
              </span>
              <h3 className="font-serif text-3xl sm:text-4xl text-[#0F172A] font-normal leading-tight">
                Two Objective Tests Completed in 30 Seconds.
              </h3>
              <p className="font-sans text-sm sm:text-base text-[#475569] leading-relaxed">
                Rather than complex hardware calibrations, the patient completes two simple, non-invasive exercises directly in front of the laptop screen:
              </p>

              <div className="space-y-3 font-mono text-xs">
                <div className="p-3.5 rounded-lg bg-white border border-[#E2E8F0] shadow-xs space-y-1 hover:border-[#0F766E] transition-colors">
                  <div className="flex items-center justify-between text-[#0F172A]">
                    <span className="font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#0F766E]" />
                      Test 1: Pupillary Light Reflex (15s)
                    </span>
                    <span className="text-[#0F766E] font-semibold">Autonomic Loop</span>
                  </div>
                  <p className="font-sans text-xs text-[#475569]">
                    Screen flashes white for 1000 ms. Camera extracts constriction latency (220–260 ms) and peak velocity.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-white border border-[#E2E8F0] shadow-xs space-y-1 hover:border-[#0F766E] transition-colors">
                  <div className="flex items-center justify-between text-[#0F172A]">
                    <span className="font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#0F766E]" />
                      Test 2: Smooth Pursuit Kinematics (15s)
                    </span>
                    <span className="text-[#0F766E] font-semibold">Cerebellar Motor Loop</span>
                  </div>
                  <p className="font-sans text-xs text-[#475569]">
                    Smooth green target sweeps horizontally. Software measures tracking gain and flags jerky catch-up saccades.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* =========================================================================
              ACT 03: The 11.7 mm Universal Iris Caliper
          ========================================================================= */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.55 }}
            ref={(el) => (chapterRefs.current[2] = el)}
            className="scroll-mt-36 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center"
          >
            {/* Story Text */}
            <div className="lg:col-span-6 space-y-5">
              <span className="font-mono text-[11px] tracking-widest text-[#64748B] uppercase font-semibold">
                Act 03 · {chapters[2].eyebrow}
              </span>
              <h3 className="font-serif text-3xl sm:text-4xl text-[#0F172A] font-normal leading-tight">
                The Built-In Human Ruler: Distance Invariance.
              </h3>
              <p className="font-sans text-sm sm:text-base text-[#475569] leading-relaxed">
                If a patient sits closer to the webcam, their pupil appears wider in camera pixels. How can software measure true physiological millimeters without calibration cards or depth sensors?
              </p>
              <div className="p-4 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] text-xs font-mono text-[#065F46] space-y-2 shadow-xs">
                <span className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#0F766E]" />
                  ANATOMICAL CONSTANT
                </span>
                <p className="font-sans text-xs text-[#065F46] leading-relaxed">
                  The adult human white-to-white iris diameter is remarkably constant across world populations: universally approximately <strong className="font-semibold">11.70 millimeters</strong> (±0.4 mm).
                </p>
                <div className="p-2.5 bg-white rounded border border-[#BBF7D0] text-[#0F172A] font-mono text-[11px]">
                  Scale Factor = 11.7 mm / Iris_Pixel_Diameter
                </div>
              </div>
            </div>

            {/* Interactive Exhibit 3: Distance Invariance Caliper */}
            <div className="lg:col-span-6">
              <div className="panel-ramp p-6 space-y-6 shadow-ramp-card">
                <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                  <span className="font-mono text-xs uppercase tracking-wider text-[#0F172A] font-semibold">
                    Live Distance-Invariant Normalizer
                  </span>
                  <span className="font-mono text-[11px] text-[#0F766E] font-semibold bg-[#F0FDF4] px-2 py-0.5 rounded border border-[#BBF7D0]">
                    Ø = 11.70 mm Absolute
                  </span>
                </div>

                {/* Simulated Iris Viewport with Dynamic Caliper Width */}
                <div className="relative aspect-[4/3] bg-[#0F1117] rounded-lg border border-[#27282D] flex items-center justify-center overflow-hidden shadow-inner">
                  <svg className="w-full h-full max-w-xs transition-all duration-75" viewBox="0 0 280 200">
                    {/* Dimension Arrow Lines */}
                    <line x1={140 - irisPixelCount / 2} y1="30" x2={140 - irisPixelCount / 2} y2="170" stroke="#0F766E" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1={140 + irisPixelCount / 2} y1="30" x2={140 + irisPixelCount / 2} y2="170" stroke="#0F766E" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1={140 - irisPixelCount / 2} y1="100" x2={140 + irisPixelCount / 2} y2="100" stroke="#0F766E" strokeWidth="1.5" />

                    {/* Iris Circle */}
                    <circle cx="140" cy="100" r={irisPixelCount / 2} fill="#1E232F" stroke="#0F766E" strokeWidth="1.5" />
                    {/* Pupil Circle */}
                    <circle cx="140" cy="100" r={irisPixelCount * 0.22} fill="#050608" />
                    {/* Center Crosshair */}
                    <circle cx="140" cy="100" r="2" fill="#0F766E" />
                  </svg>

                  {/* Overlaid Readouts */}
                  <div className="absolute bottom-3 left-3 right-3 flex justify-between font-mono text-xs bg-[#0F172A]/92 backdrop-blur-sm p-2.5 rounded border border-white/10 text-white">
                    <div>
                      <span className="text-[9px] text-[#64748B] block uppercase">Raw Camera Pixels</span>
                      <span className="font-bold text-[#0F766E]">{irisPixelCount} px</span>
                    </div>
                    <div className="text-center">
                      <span className="text-[9px] text-[#64748B] block uppercase">Scale Ratio</span>
                      <span className="font-bold text-white">{mmPerPixel} mm/px</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-[#64748B] block uppercase">Normalized Iris</span>
                      <span className="font-bold text-[#34D399]">{calculatedMillimeters} mm</span>
                    </div>
                  </div>
                </div>

                {/* Distance Slider Control + Quick Presets */}
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between items-center text-[#475569]">
                    <span>Patient Distance from Lens:</span>
                    <span className="font-bold text-[#0F172A] text-sm">{patientDistanceCm} cm</span>
                  </div>

                  {/* Preset Pills */}
                  <div className="flex items-center gap-1.5 pb-1">
                    <button
                      type="button"
                      onClick={() => setPatientDistanceCm(35)}
                      className={`px-2 py-1 rounded text-[10px] transition-colors ${
                        patientDistanceCm === 35 ? 'bg-[#0F172A] text-[#0F766E]' : 'bg-[#F1F5F9] text-[#475569]'
                      }`}
                    >
                      Close (35cm)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPatientDistanceCm(45)}
                      className={`px-2 py-1 rounded text-[10px] transition-colors ${
                        patientDistanceCm === 45 ? 'bg-[#0F172A] text-[#0F766E]' : 'bg-[#F1F5F9] text-[#475569]'
                      }`}
                    >
                      Desk (45cm)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPatientDistanceCm(65)}
                      className={`px-2 py-1 rounded text-[10px] transition-colors ${
                        patientDistanceCm === 65 ? 'bg-[#0F172A] text-[#0F766E]' : 'bg-[#F1F5F9] text-[#475569]'
                      }`}
                    >
                      Arms-length (65cm)
                    </button>
                  </div>

                  <input
                    type="range"
                    min="30"
                    max="75"
                    step="1"
                    value={patientDistanceCm}
                    onChange={(e) => setPatientDistanceCm(parseInt(e.target.value))}
                    className="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#0F172A]"
                  />
                  <p className="text-[11px] text-[#64748B] text-right">
                    Drag slider: raw pixel size changes, but normalized millimeters remain rock-solid!
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* =========================================================================
              ACT 04: The Core Differentiator: Comparing You to Yourself (Δ)
          ========================================================================= */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.55 }}
            ref={(el) => (chapterRefs.current[3] = el)}
            className="scroll-mt-36 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center"
          >
            {/* Interactive Exhibit 4 (Left): Population vs Longitudinal */}
            <div className="lg:col-span-6 order-2 lg:order-1">
              <div className="panel-ramp p-6 space-y-5 shadow-ramp-card">
                <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                  <span className="font-mono text-xs uppercase tracking-wider text-[#0F172A] font-semibold">
                    The Population Fallacy Trap
                  </span>
                  <div className="flex items-center gap-1 bg-[#F1F5F9] p-0.5 rounded border border-[#E2E8F0]">
                    <button
                      onClick={() => {
                        setComparatorMode('population');
                        soundFx.playClick();
                      }}
                      className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors ${
                        comparatorMode === 'population'
                          ? 'bg-[#0F172A] text-[#0F766E] font-semibold shadow-xs'
                          : 'text-[#64748B] hover:text-[#0F172A]'
                      }`}
                    >
                      Population Average
                    </button>
                    <button
                      onClick={() => {
                        setComparatorMode('longitudinal');
                        soundFx.playClick();
                      }}
                      className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors ${
                        comparatorMode === 'longitudinal'
                          ? 'bg-[#0F172A] text-[#0F766E] font-semibold shadow-xs'
                          : 'text-[#64748B] hover:text-[#0F172A]'
                      }`}
                    >
                      OcuTrack Delta (Δ)
                    </button>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {comparatorMode === 'population' ? (
                    <motion.div
                      key="pop"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <div className="p-4 bg-[#FEF2F2] rounded-lg border border-[#FECACA] space-y-2 font-mono text-xs text-[#991B1B]">
                        <span className="font-bold block uppercase flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-[#B91C1C]" />
                          MISSED DIAGNOSIS IN POPULATION AVERAGES
                        </span>
                        <p className="font-sans text-xs text-[#7F1D1D] leading-relaxed">
                          Alice's natural baseline latency was <strong>222 ms</strong>. Following a concussion, her latency slows to <strong>258 ms</strong> (+36 ms delay!).
                          Because 258 ms falls within the broad &quot;healthy population band&quot; (220–270 ms), a standard test falsely marks her as &quot;Normal&quot;!
                        </p>
                      </div>

                      <div className="p-4 bg-[#F1F5F9] rounded-lg border border-[#E2E8F0] font-mono text-xs space-y-2">
                        <div className="flex justify-between text-[#64748B]">
                          <span>Population Normal Band:</span>
                          <span className="font-semibold text-[#0F172A]">220 ms: 270 ms</span>
                        </div>
                        <div className="flex justify-between text-[#64748B]">
                          <span>Alice (Visit 02):</span>
                          <span className="font-semibold text-[#991B1B]">258 ms (Falsely Labeled Healthy)</span>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="long"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <div className="p-4 bg-[#F0FDF4] rounded-lg border border-[#BBF7D0] space-y-2 font-mono text-xs text-[#065F46]">
                        <span className="font-bold block uppercase flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-[#0F766E]" />
                          OCUTRACK DETECTS THE REAL SHIFT
                        </span>
                        <p className="font-sans text-xs text-[#065F46] leading-relaxed">
                          OcuTrack compares Alice strictly against Alice. Comparing Visit 2 (258 ms) against her verified Visit 1 baseline (222 ms), OcuTrack immediately flags a <strong>+36 ms statistical shift</strong> and recommends clinical review.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                        <div className="p-3 bg-white rounded border border-[#E2E8F0]">
                          <span className="text-[10px] text-[#64748B] block uppercase">Visit 1 Baseline</span>
                          <span className="font-bold text-[#0F172A]">222 ms</span>
                        </div>
                        <div className="p-3 bg-[#FFFBEB] rounded border border-[#FDE68A]">
                          <span className="text-[10px] text-[#B45309] block uppercase">Visit 2 Follow-Up</span>
                          <span className="font-bold text-[#B45309]">258 ms (+36 ms Δ)</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="text-right text-[11px] font-mono text-[#64748B]">
                  Click buttons above to see why longitudinal delta is essential
                </div>
              </div>
            </div>

            {/* Story Text (Right) */}
            <div className="lg:col-span-6 space-y-5 order-1 lg:order-2">
              <span className="font-mono text-[11px] tracking-widest text-[#64748B] uppercase font-semibold">
                Act 04 · {chapters[3].eyebrow}
              </span>
              <h3 className="font-serif text-3xl sm:text-4xl text-[#0F172A] font-normal leading-tight">
                The Longitudinal Delta Engine: Self-Benchmarking.
              </h3>
              <p className="font-sans text-sm sm:text-base text-[#475569] leading-relaxed">
                Healthy human beings exhibit wide natural variation: Person A might have a baseline latency of 220 ms, while Person B is completely healthy at 268 ms. Single-point population screening is fundamentally flawed.
              </p>
              <div className="space-y-2 font-sans text-xs text-[#475569]">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#0F172A] text-[#0F766E] flex items-center justify-center shrink-0 font-mono text-[10px] font-bold mt-0.5">
                    1
                  </div>
                  <p>
                    <strong className="text-[#0F172A]">Establish Baseline:</strong> Visit 01 logs the patient&apos;s unique personal latency and gain coordinates.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#0F172A] text-[#0F766E] flex items-center justify-center shrink-0 font-mono text-[10px] font-bold mt-0.5">
                    2
                  </div>
                  <p>
                    <strong className="text-[#0F172A]">Detect Micro-Drift:</strong> Subsequent visits measure variance against personal historical confidence bounds, detecting early neurological changes before symptoms worsen.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* =========================================================================
              ACT 05: Burn After Reading & Rural Edge
          ========================================================================= */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.55 }}
            ref={(el) => (chapterRefs.current[4] = el)}
            className="scroll-mt-36 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center"
          >
            {/* Story Text */}
            <div className="lg:col-span-6 space-y-5">
              <span className="font-mono text-[11px] tracking-widest text-[#64748B] uppercase font-semibold">
                Act 05 · {chapters[4].eyebrow}
              </span>
              <h3 className="font-serif text-3xl sm:text-4xl text-[#0F172A] font-normal leading-tight">
                Privacy by Physics &amp; Rural Health Equity.
              </h3>
              <p className="font-sans text-sm sm:text-base text-[#475569] leading-relaxed">
                OcuTrack is designed for real-world deployment in rural and community clinics where internet is fragile and patient privacy is paramount.
              </p>

              <div className="space-y-3 font-mono text-xs">
                <div className="p-3.5 rounded-lg bg-white border border-[#E2E8F0] shadow-xs space-y-1 hover:border-[#EA580C] transition-colors">
                  <div className="flex items-center gap-2 text-[#0F172A] font-bold">
                    <Flame className="w-4 h-4 text-[#EA580C]" />
                    <span>&quot;Burn After Reading&quot; Ephemeral Video Destruction</span>
                  </div>
                  <p className="font-sans text-xs text-[#475569]">
                    Raw facial video is processed in ephemeral scratch memory. Once landmark coordinates are extracted, the video file is permanently erased from disk.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-white border border-[#E2E8F0] shadow-xs space-y-1 hover:border-[#0F766E] transition-colors">
                  <div className="flex items-center gap-2 text-[#0F172A] font-bold">
                    <WifiOff className="w-4 h-4 text-[#0F766E]" />
                    <span>Low-Bandwidth Offline Queuing</span>
                  </div>
                  <p className="font-sans text-xs text-[#475569]">
                    Client-side video quality gate checks FPS and lighting locally before upload. Data synchronizes over lightweight JSON deltas (under 50 KB).
                  </p>
                </div>
              </div>
            </div>

            {/* Interactive Exhibit 5: Burn After Reading Simulator */}
            <div className="lg:col-span-6">
              <div className="panel-ramp p-6 space-y-6 shadow-ramp-card">
                <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                  <span className="font-mono text-xs uppercase tracking-wider text-[#0F172A] font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#0F766E]" />
                    Data Retention Lifecycle
                  </span>
                  <span className={`font-mono text-[11px] px-2 py-0.5 rounded border ${
                    purgeStatus === 'destroyed'
                      ? 'bg-[#F0FDF4] text-[#0F766E] border-[#BBF7D0]'
                      : 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]'
                  }`}>
                    {purgeStatus === 'destroyed' ? '0 B Video on Disk' : 'Processing Scratch…'}
                  </span>
                </div>

                <div className="relative p-6 bg-[#0F1117] rounded-lg border border-[#27282D] text-white font-mono text-xs space-y-4 shadow-inner">
                  <div className="flex items-center justify-between text-[#64748B] text-[11px]">
                    <span>Lifecycle Step</span>
                    <span>Disk State</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2.5 rounded bg-[#1A1F2C]">
                      <span>1. Webcam Optical Stream</span>
                      <span className="text-[#38BDF8]">Client RAM Buffer</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded bg-[#1A1F2C]">
                      <span>2. MediaPipe Landmark Extraction</span>
                      <span className="text-[#0F766E]">478 Coordinate Vectors</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded bg-[#1A1F2C]">
                      <span>3. Raw Face Video Retention</span>
                      <span className={purgeStatus === 'destroyed' ? 'text-[#34D399] font-bold' : 'text-[#F87171]'}>
                        {purgeStatus === 'destroyed' ? 'PERMANENTLY PURGED (0 KB)' : 'Active Ephemeral Scratch'}
                      </span>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handlePurgeSimulation}
                    disabled={purgeStatus === 'purging'}
                    className="w-full py-2.5 rounded bg-[#1E232F] hover:bg-[#283244] text-[#0F766E] font-semibold flex items-center justify-center gap-2 transition-colors border border-white/10"
                  >
                    <Flame className={`w-3.5 h-3.5 text-[#EA580C] ${purgeStatus === 'purging' ? 'animate-bounce' : ''}`} />
                    <span>{purgeStatus === 'purging' ? 'Purging Ephemeral Video…' : 'Trigger Ephemeral Video Destruction'}</span>
                  </motion.button>
                </div>

                <p className="font-mono text-[11px] text-[#64748B] text-right">
                  Only anonymous numeric time-series curves are preserved.
                </p>
              </div>
            </div>
          </motion.div>

        </div>

      </div>
    </section>
  );
};

export default JudgeStoryScroll;
