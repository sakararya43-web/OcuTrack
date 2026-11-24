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
import { useTranslation } from '../../i18n';

interface StoryChapter {
  id: string;
  number: string;
  eyebrow: string;
  tabTitle: string;
  title: string;
  subtitle: string;
}

export const JudgeStoryScroll: React.FC = () => {
  const { t, dict } = useTranslation();
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

  const chapterIds = ['chapter-cost', 'chapter-protocol', 'chapter-math', 'chapter-delta', 'chapter-ethics'];
  const chapters: StoryChapter[] = dict.story.chapters.map((ch, idx) => ({
    ...ch,
    id: chapterIds[idx] || `chapter-${idx}`,
  }));

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
            <span>{t('story.badge')}</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-[#0F172A]">
            {t('story.headingMain')} <br className="hidden sm:block" />
            <span className="italic text-[#475569]">{t('story.headingItalic')}</span>
          </h2>
          <p className="font-sans text-base text-[#475569] leading-relaxed">
            {t('story.subtitle')}
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
                    <span className="hidden sm:inline">{ch.tabTitle}</span>
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
                {t('story.actOf', { current: activeChapter + 1, total: chapters.length })}
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
                {t('story.act1.eyebrowPrefix')} {chapters[0].eyebrow}
              </span>
              <h3 className="font-serif text-3xl sm:text-4xl text-[#0F172A] font-normal leading-tight">
                {t('story.act1.heading')}
              </h3>
              <p className="font-sans text-sm sm:text-base text-[#475569] leading-relaxed">
                {t('story.act1.bodyPrefix')} <strong className="text-[#0F172A] font-semibold">{t('story.act1.bodyStrong')}</strong> {t('story.act1.bodySuffix')}
              </p>
              <div className="p-4 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] text-xs font-mono text-[#92400E] space-y-1 shadow-xs">
                <span className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-[#D97706]" />
                  {t('story.act1.gapTitle')}
                </span>
                <p className="font-sans text-xs text-[#78350F] leading-relaxed">
                  {t('story.act1.gapDesc')}
                </p>
              </div>
            </div>

            {/* Interactive Exhibit 1: Cost & Access Comparator */}
            <div className="lg:col-span-6">
              <div className="panel-ramp p-6 space-y-6 shadow-ramp-card">
                <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                  <span className="font-mono text-xs uppercase tracking-wider text-[#0F172A] font-semibold flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-[#0F766E]" />
                    {t('story.act1.modelTitle')}
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
                      {t('story.act1.btnHospital')}
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
                      {t('story.act1.btnOcutrack')}
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
                          <span className="font-bold">{t('story.act1.hwCost')}</span>
                          <span className="text-2xl font-bold font-serif">{t('story.act1.rigCost')}</span>
                        </div>
                        <p className="font-sans text-xs text-[#7F1D1D]">
                          {t('story.act1.rigDesc')}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 font-mono text-xs text-[#475569]">
                        <div className="p-3 bg-[#F1F5F9] rounded border border-[#E2E8F0]">
                          <span className="block text-[10px] text-[#64748B] uppercase">{t('story.act1.accessibility')}</span>
                          <span className="font-semibold text-[#0F172A]">{t('story.act1.rigAccess')}</span>
                        </div>
                        <div className="p-3 bg-[#F1F5F9] rounded border border-[#E2E8F0]">
                          <span className="block text-[10px] text-[#64748B] uppercase">{t('story.act1.trainingTime')}</span>
                          <span className="font-semibold text-[#0F172A]">{t('story.act1.rigTraining')}</span>
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
                          <span className="font-bold">{t('story.act1.hwCost')}</span>
                          <span className="text-2xl font-bold font-serif">{t('story.act1.ocutrackCost')}</span>
                        </div>
                        <p className="font-sans text-xs text-[#065F46]">
                          {t('story.act1.ocutrackDesc')}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 font-mono text-xs text-[#475569]">
                        <div className="p-3 bg-[#F1F5F9] rounded border border-[#E2E8F0]">
                          <span className="block text-[10px] text-[#64748B] uppercase">{t('story.act1.accessibility')}</span>
                          <span className="font-semibold text-[#0F766E]">{t('story.act1.ocutrackAccess')}</span>
                        </div>
                        <div className="p-3 bg-[#F1F5F9] rounded border border-[#E2E8F0]">
                          <span className="block text-[10px] text-[#64748B] uppercase">{t('story.act1.trainingTime')}</span>
                          <span className="font-semibold text-[#0F766E]">{t('story.act1.ocutrackTraining')}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Interactive Multi-Clinic Scaling Calculator */}
                <div className="p-3 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0] space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between text-[#475569]">
                    <span>{t('story.act1.deployAcross')} <strong className="text-[#0F172A]">{clinicsCount} {t('story.act1.clinicsSuffix')}</strong></span>
                    <span className="font-bold text-[#0F766E]">
                      {t('story.act1.savePrefix')}{(clinicsCount * 25000).toLocaleString()}
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
                  {t('story.act1.toggleHint')}
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
                      {t('story.act2.sandboxTitle')}
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
                      {t('story.act2.tabFlash')}
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
                      {t('story.act2.tabPursuit')}
                    </button>
                  </div>
                </div>

                {demoProtocol === 'pupil' ? (
                  <div className="space-y-4">
                    <div className="relative aspect-[16/9] bg-[#0F1117] rounded-lg border border-[#27282D] flex items-center justify-center overflow-hidden shadow-inner">
                      {flashPhase === 'flashing' && (
                        <div className="absolute inset-0 bg-white flex items-center justify-center z-20">
                          <span className="font-mono text-xs text-[#0F172A] font-bold uppercase tracking-widest bg-white/90 px-3 py-1 rounded shadow-sm">
                            {t('story.act2.flashBanner')}
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
                            <span className="text-[#34D399] font-bold">{t('story.act2.latencyReadout')}</span>
                          ) : (
                            <span>{t('story.act2.baselineReadout')}</span>
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
                      <span>{isSimulating ? t('story.act2.simulating') : t('story.act2.simulateBtn')}</span>
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
                        <span>{t('story.act2.gainUnity')}</span>
                        <span className={pursuitPos.saccade ? 'text-[#F87171] font-bold' : ''}>
                          {pursuitPos.saccade ? t('story.act2.catchUpSaccade') : t('story.act2.smoothTrack')}
                        </span>
                        <span>{t('story.act2.sweepHz')}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-[#F1F5F9] rounded border border-[#E2E8F0] text-xs font-mono text-[#475569] flex items-center justify-between">
                      <span>{t('story.act2.legend')}</span>
                      <span className="text-[#0F766E] font-semibold">{t('story.act2.continuousKinematics')}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Story Text (Right) */}
            <div className="lg:col-span-6 space-y-5 order-1 lg:order-2">
              <span className="font-mono text-[11px] tracking-widest text-[#64748B] uppercase font-semibold">
                {t('story.act2.eyebrowPrefix')} {chapters[1].eyebrow}
              </span>
              <h3 className="font-serif text-3xl sm:text-4xl text-[#0F172A] font-normal leading-tight">
                {t('story.act2.heading')}
              </h3>
              <p className="font-sans text-sm sm:text-base text-[#475569] leading-relaxed">
                {t('story.act2.body')}
              </p>

              <div className="space-y-3 font-mono text-xs">
                <div className="p-3.5 rounded-lg bg-white border border-[#E2E8F0] shadow-xs space-y-1 hover:border-[#0F766E] transition-colors">
                  <div className="flex items-center justify-between text-[#0F172A]">
                    <span className="font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#0F766E]" />
                      {t('story.act2.test1Title')}
                    </span>
                    <span className="text-[#0F766E] font-semibold">{t('story.act2.test1Tag')}</span>
                  </div>
                  <p className="font-sans text-xs text-[#475569]">
                    {t('story.act2.test1Desc')}
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-white border border-[#E2E8F0] shadow-xs space-y-1 hover:border-[#0F766E] transition-colors">
                  <div className="flex items-center justify-between text-[#0F172A]">
                    <span className="font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#0F766E]" />
                      {t('story.act2.test2Title')}
                    </span>
                    <span className="text-[#0F766E] font-semibold">{t('story.act2.test2Tag')}</span>
                  </div>
                  <p className="font-sans text-xs text-[#475569]">
                    {t('story.act2.test2Desc')}
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
                {t('story.act3.eyebrowPrefix')} {chapters[2].eyebrow}
              </span>
              <h3 className="font-serif text-3xl sm:text-4xl text-[#0F172A] font-normal leading-tight">
                {t('story.act3.heading')}
              </h3>
              <p className="font-sans text-sm sm:text-base text-[#475569] leading-relaxed">
                {t('story.act3.body')}
              </p>
              <div className="p-4 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] text-xs font-mono text-[#065F46] space-y-2 shadow-xs">
                <span className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#0F766E]" />
                  {t('story.act3.constantTitle')}
                </span>
                <p className="font-sans text-xs text-[#065F46] leading-relaxed">
                  {t('story.act3.constantDescPrefix')} <strong className="font-semibold">{t('story.act3.constantDescStrong')}</strong> {t('story.act3.constantDescSuffix')}
                </p>
                <div className="p-2.5 bg-white rounded border border-[#BBF7D0] text-[#0F172A] font-mono text-[11px]">
                  {t('story.act3.scaleFormula')}
                </div>
              </div>
            </div>

            {/* Interactive Exhibit 3: Distance Invariance Caliper */}
            <div className="lg:col-span-6">
              <div className="panel-ramp p-6 space-y-6 shadow-ramp-card">
                <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                  <span className="font-mono text-xs uppercase tracking-wider text-[#0F172A] font-semibold">
                    {t('story.act3.normalizerTitle')}
                  </span>
                  <span className="font-mono text-[11px] text-[#0F766E] font-semibold bg-[#F0FDF4] px-2 py-0.5 rounded border border-[#BBF7D0]">
                    {t('story.act3.badgeAbsolute')}
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
                      <span className="text-[9px] text-[#64748B] block uppercase">{t('story.act3.rawPixels')}</span>
                      <span className="font-bold text-[#0F766E]">{irisPixelCount} px</span>
                    </div>
                    <div className="text-center">
                      <span className="text-[9px] text-[#64748B] block uppercase">{t('story.act3.scaleRatio')}</span>
                      <span className="font-bold text-white">{mmPerPixel} mm/px</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-[#64748B] block uppercase">{t('story.act3.normalizedIris')}</span>
                      <span className="font-bold text-[#34D399]">{calculatedMillimeters} mm</span>
                    </div>
                  </div>
                </div>

                {/* Distance Slider Control + Quick Presets */}
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between items-center text-[#475569]">
                    <span>{t('story.act3.distanceLabel')}</span>
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
                      {t('story.act3.presetClose')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPatientDistanceCm(45)}
                      className={`px-2 py-1 rounded text-[10px] transition-colors ${
                        patientDistanceCm === 45 ? 'bg-[#0F172A] text-[#0F766E]' : 'bg-[#F1F5F9] text-[#475569]'
                      }`}
                    >
                      {t('story.act3.presetDesk')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPatientDistanceCm(65)}
                      className={`px-2 py-1 rounded text-[10px] transition-colors ${
                        patientDistanceCm === 65 ? 'bg-[#0F172A] text-[#0F766E]' : 'bg-[#F1F5F9] text-[#475569]'
                      }`}
                    >
                      {t('story.act3.presetArms')}
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
                    {t('story.act3.sliderHint')}
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
                    {t('story.act4.fallacyTitle')}
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
                      {t('story.act4.btnPopulation')}
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
                      {t('story.act4.btnDelta')}
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
                          {t('story.act4.missedTitle')}
                        </span>
                        <p className="font-sans text-xs text-[#7F1D1D] leading-relaxed">
                          {t('story.act4.missedDesc1')} <strong>222 ms</strong>{t('story.act4.missedDesc2')} <strong>258 ms</strong> {t('story.act4.missedDesc3')}
                        </p>
                      </div>

                      <div className="p-4 bg-[#F1F5F9] rounded-lg border border-[#E2E8F0] font-mono text-xs space-y-2">
                        <div className="flex justify-between text-[#64748B]">
                          <span>{t('story.act4.popBandLabel')}</span>
                          <span className="font-semibold text-[#0F172A]">{t('story.act4.popBandVal')}</span>
                        </div>
                        <div className="flex justify-between text-[#64748B]">
                          <span>{t('story.act4.aliceVisitLabel')}</span>
                          <span className="font-semibold text-[#991B1B]">{t('story.act4.aliceVisitVal')}</span>
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
                          {t('story.act4.detectedTitle')}
                        </span>
                        <p className="font-sans text-xs text-[#065F46] leading-relaxed">
                          {t('story.act4.detectedDesc1')} <strong>{t('story.act4.detectedDescStrong')}</strong> {t('story.act4.detectedDesc2')}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                        <div className="p-3 bg-white rounded border border-[#E2E8F0]">
                          <span className="text-[10px] text-[#64748B] block uppercase">{t('story.act4.visit1Label')}</span>
                          <span className="font-bold text-[#0F172A]">222 ms</span>
                        </div>
                        <div className="p-3 bg-[#FFFBEB] rounded border border-[#FDE68A]">
                          <span className="text-[10px] text-[#B45309] block uppercase">{t('story.act4.visit2Label')}</span>
                          <span className="font-bold text-[#B45309]">{t('story.act4.visit2Val')}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="text-right text-[11px] font-mono text-[#64748B]">
                  {t('story.act4.clickHint')}
                </div>
              </div>
            </div>

            {/* Story Text (Right) */}
            <div className="lg:col-span-6 space-y-5 order-1 lg:order-2">
              <span className="font-mono text-[11px] tracking-widest text-[#64748B] uppercase font-semibold">
                {t('story.act4.eyebrowPrefix')} {chapters[3].eyebrow}
              </span>
              <h3 className="font-serif text-3xl sm:text-4xl text-[#0F172A] font-normal leading-tight">
                {t('story.act4.heading')}
              </h3>
              <p className="font-sans text-sm sm:text-base text-[#475569] leading-relaxed">
                {t('story.act4.body')}
              </p>
              <div className="space-y-2 font-sans text-xs text-[#475569]">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#0F172A] text-[#0F766E] flex items-center justify-center shrink-0 font-mono text-[10px] font-bold mt-0.5">
                    1
                  </div>
                  <p>
                    <strong className="text-[#0F172A]">{t('story.act4.step1Title')}</strong> {t('story.act4.step1Desc')}
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#0F172A] text-[#0F766E] flex items-center justify-center shrink-0 font-mono text-[10px] font-bold mt-0.5">
                    2
                  </div>
                  <p>
                    <strong className="text-[#0F172A]">{t('story.act4.step2Title')}</strong> {t('story.act4.step2Desc')}
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
                {t('story.act5.eyebrowPrefix')} {chapters[4].eyebrow}
              </span>
              <h3 className="font-serif text-3xl sm:text-4xl text-[#0F172A] font-normal leading-tight">
                {t('story.act5.heading')}
              </h3>
              <p className="font-sans text-sm sm:text-base text-[#475569] leading-relaxed">
                {t('story.act5.body')}
              </p>

              <div className="space-y-3 font-mono text-xs">
                <div className="p-3.5 rounded-lg bg-white border border-[#E2E8F0] shadow-xs space-y-1 hover:border-[#EA580C] transition-colors">
                  <div className="flex items-center gap-2 text-[#0F172A] font-bold">
                    <Flame className="w-4 h-4 text-[#EA580C]" />
                    <span>{t('story.act5.burnTitle')}</span>
                  </div>
                  <p className="font-sans text-xs text-[#475569]">
                    {t('story.act5.burnDesc')}
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-white border border-[#E2E8F0] shadow-xs space-y-1 hover:border-[#0F766E] transition-colors">
                  <div className="flex items-center gap-2 text-[#0F172A] font-bold">
                    <WifiOff className="w-4 h-4 text-[#0F766E]" />
                    <span>{t('story.act5.offlineTitle')}</span>
                  </div>
                  <p className="font-sans text-xs text-[#475569]">
                    {t('story.act5.offlineDesc')}
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
                    {t('story.act5.lifecycleTitle')}
                  </span>
                  <span className={`font-mono text-[11px] px-2 py-0.5 rounded border ${
                    purgeStatus === 'destroyed'
                      ? 'bg-[#F0FDF4] text-[#0F766E] border-[#BBF7D0]'
                      : 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]'
                  }`}>
                    {purgeStatus === 'destroyed' ? t('story.act5.disk0B') : t('story.act5.processingScratch')}
                  </span>
                </div>

                <div className="relative p-6 bg-[#0F1117] rounded-lg border border-[#27282D] text-white font-mono text-xs space-y-4 shadow-inner">
                  <div className="flex items-center justify-between text-[#64748B] text-[11px]">
                    <span>{t('story.act5.colStep')}</span>
                    <span>{t('story.act5.colState')}</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2.5 rounded bg-[#1A1F2C]">
                      <span>{t('story.act5.step1')}</span>
                      <span className="text-[#38BDF8]">{t('story.act5.state1')}</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded bg-[#1A1F2C]">
                      <span>{t('story.act5.step2')}</span>
                      <span className="text-[#0F766E]">{t('story.act5.state2')}</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded bg-[#1A1F2C]">
                      <span>{t('story.act5.step3')}</span>
                      <span className={purgeStatus === 'destroyed' ? 'text-[#34D399] font-bold' : 'text-[#F87171]'}>
                        {purgeStatus === 'destroyed' ? t('story.act5.state3Destroyed') : t('story.act5.state3Scratch')}
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
                    <span>{purgeStatus === 'purging' ? t('story.act5.purgingBtn') : t('story.act5.triggerPurgeBtn')}</span>
                  </motion.button>
                </div>

                <p className="font-mono text-[11px] text-[#64748B] text-right">
                  {t('story.act5.footerNote')}
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
