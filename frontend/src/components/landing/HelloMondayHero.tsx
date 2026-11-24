import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sliders, Zap, Sun, Moon, Eye } from 'lucide-react';
import { PROTOCOL_VERSION } from '../../lib/constants';
import { useTranslation } from '../../i18n';

export const HelloMondayHero: React.FC = () => {
  const { t } = useTranslation();
  const [ambientLux, setAmbientLux] = useState<number>(0.35); // 0 (dark) to 1 (bright)
  const [isFlashing, setIsFlashing] = useState<boolean>(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [panelTilt, setPanelTilt] = useState({ rx: 0, ry: 0 });
  const [isHoveringCanvas, setIsHoveringCanvas] = useState<boolean>(false);

  const heroSectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const isVisibleRef = useRef<boolean>(true);

  // Pupil millimeter diameter calculation: ~5.6mm in darkness down to ~2.6mm under flash
  const effectiveLux = isFlashing ? 1.0 : ambientLux;
  const pupilDiameterMm = (5.6 - effectiveLux * 3.0).toFixed(2);
  const latencyMs = isFlashing ? 238 : 245;

  const handleSimulateFlash = () => {
    setIsFlashing(true);
    setTimeout(() => {
      setIsFlashing(false);
    }, 1200);
  };

  // IntersectionObserver to pause RAF when Hero is scrolled out of view (Zero Scroll Lag)
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.IntersectionObserver !== 'function') return;
    const section = heroSectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  // Interactive Living Iris Canvas with 60/120 FPS throttling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateCanvasSize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    let angle = 0;
    let currentRadius = 45;
    const targetRadius = isFlashing ? 22 : 55 - ambientLux * 28;

    const render = () => {
      if (isVisibleRef.current && canvas.offsetWidth > 0) {
        const displayW = canvas.offsetWidth;
        const displayH = canvas.offsetHeight;
        ctx.clearRect(0, 0, displayW, displayH);

        // Smooth radius transition
        currentRadius += (targetRadius - currentRadius) * 0.12;
        angle += 0.015;

        const centerX = displayW / 2 + mousePos.x * 14;
        const centerY = displayH / 2 + mousePos.y * 12;

        // Outer Iris Ring (11.7mm Anthropometric Ruler Representation)
        const irisRadius = Math.min(displayW, displayH) * 0.32;
        const irisGrad = ctx.createRadialGradient(centerX, centerY, currentRadius, centerX, centerY, irisRadius);
        irisGrad.addColorStop(0, '#0F172A');
        irisGrad.addColorStop(0.5, '#1E293B');
        irisGrad.addColorStop(0.9, '#334155');
        irisGrad.addColorStop(1, '#475569');

        ctx.fillStyle = irisGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, irisRadius, 0, Math.PI * 2);
        ctx.fill();

        // Dynamic Iris Crypts & Radial Fibers
        const fibers = 36;
        for (let i = 0; i < fibers; i++) {
          const rad = (i / fibers) * Math.PI * 2 + angle * (i % 2 === 0 ? 0.2 : -0.15);
          const x1 = centerX + Math.cos(rad) * (currentRadius + 3);
          const y1 = centerY + Math.sin(rad) * (currentRadius + 3);
          const x2 = centerX + Math.cos(rad) * (irisRadius - 3);
          const y2 = centerY + Math.sin(rad) * (irisRadius - 3);

          ctx.strokeStyle = i % 4 === 0 ? 'rgba(15, 118, 110, 0.7)' : 'rgba(255, 255, 255, 0.18)';
          ctx.lineWidth = i % 2 === 0 ? 1.2 : 0.6;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }

        // Constricted or Dilated Dark Pupil Void
        ctx.fillStyle = '#020617';
        ctx.beginPath();
        ctx.arc(centerX, centerY, currentRadius, 0, Math.PI * 2);
        ctx.fill();

        // Specular Cornea Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.beginPath();
        ctx.arc(centerX - currentRadius * 0.35, centerY - currentRadius * 0.35, currentRadius * 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Precision Caliper Crosshairs (Clinical Instrumentation Reticle)
        ctx.strokeStyle = isHoveringCanvas ? 'rgba(15, 118, 110, 0.9)' : 'rgba(15, 118, 110, 0.5)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(centerX, centerY, irisRadius + 8, 0, Math.PI * 2);
        ctx.stroke();

        // Horizontal caliper tick marks
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(centerX - irisRadius - 14, centerY);
        ctx.lineTo(centerX - irisRadius - 2, centerY);
        ctx.moveTo(centerX + irisRadius + 2, centerY);
        ctx.lineTo(centerX + irisRadius + 14, centerY);
        ctx.stroke();

        // Vertical caliper tick marks
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - irisRadius - 14);
        ctx.lineTo(centerX, centerY - irisRadius - 2);
        ctx.moveTo(centerX, centerY + irisRadius + 2);
        ctx.lineTo(centerX, centerY + irisRadius + 14);
        ctx.stroke();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [ambientLux, isFlashing, mousePos, isHoveringCanvas]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    setMousePos({ x, y });
    setPanelTilt({ rx: -y * 3, ry: x * 4 });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
    setPanelTilt({ rx: 0, ry: 0 });
    setIsHoveringCanvas(false);
  };

  return (
    <section
      ref={heroSectionRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative min-h-[84vh] flex items-center bg-slate-50 text-[#0F172A] border-b border-slate-200 py-16 lg:py-24 overflow-hidden"
    >
      <div className="max-w-[1440px] w-full mx-auto px-6 sm:px-10 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

          {/* Left Column: Direct, Product-Focused Editorial Typography & Action */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 space-y-6"
          >

            {/* Structured Status Badge (Rectangular, NO Pill) */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono font-medium bg-white text-[#0F172A] border border-slate-200 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E]" />
                {t('hero.badgeProtocol', { version: PROTOCOL_VERSION })}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-[#0F766E] font-medium bg-[#F0FDF4] px-2 py-0.5 rounded border border-[#BBF7D0]">
                {t('hero.badgeIris')}
              </span>
            </div>

            {/* Clear, Product-Focused Headline */}
            <h1 className="font-sans text-4xl sm:text-5xl lg:text-[56px] font-bold leading-[1.08] tracking-tight text-[#0F172A]">
              {t('hero.title', 'Quantitative Ocular Telemetry and Involuntary Reflex Screening')}
            </h1>

            {/* Product-Focused Sub-headline */}
            <p className="font-sans text-base sm:text-lg leading-relaxed text-[#475569] font-normal max-w-2xl">
              {t('hero.subtitle', 'A hardware-agnostic clinical screening platform measuring autonomic pupillary constriction latency and cerebellar smooth pursuit gain through standard consumer optical sensors.')}
            </p>

            {/* Action Buttons (Clean Rectangular, Subtle Corner Radii) */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/console"
                className="btn-ramp-primary group text-xs py-3 px-6 shadow-sm flex items-center gap-2 font-medium"
              >
                <span>{t('hero.enterConsole', 'ENTER RESEARCH CONSOLE')}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/assessments/new"
                className="btn-ramp-secondary text-xs py-3 px-6 shadow-xs flex items-center gap-2 font-medium"
              >
                <Eye className="w-3.5 h-3.5 text-[#475569]" />
                <span>{t('hero.startScreening', 'Start Clinical Screening')}</span>
              </Link>
            </div>

            {/* Specifications Strip */}
            <div className="pt-8 border-t border-slate-200 grid grid-cols-3 gap-6 max-w-xl text-[#475569] font-mono text-[11px]">
              <div className="space-y-1">
                <span className="block text-[#64748B] uppercase tracking-wider text-[10px]">{t('hero.specScaleLabel')}</span>
                <span className="text-[#0F172A] font-semibold text-xs sm:text-sm">{t('hero.specScaleVal')}</span>
              </div>
              <div className="space-y-1">
                <span className="block text-[#64748B] uppercase tracking-wider text-[10px]">{t('hero.specSamplingLabel')}</span>
                <span className="text-[#0F172A] font-semibold text-xs sm:text-sm">{t('hero.specSamplingVal')}</span>
              </div>
              <div className="space-y-1">
                <span className="block text-[#64748B] uppercase tracking-wider text-[10px]">{t('hero.specPrivacyLabel')}</span>
                <span className="text-[#0F172A] font-semibold text-xs sm:text-sm">{t('hero.specPrivacyVal')}</span>
              </div>
            </div>

          </motion.div>

          {/* Right Column: Precision Clinical Viewfinder Centerpiece */}
          <div className="lg:col-span-5 perspective-1000">
            <motion.div
              style={{
                transform: `perspective(1000px) rotateX(${panelTilt.rx}deg) rotateY(${panelTilt.ry}deg)`,
                transition: 'transform 0.15s ease-out',
              }}
              className="panel-ramp p-6 space-y-5 shadow-ramp-card will-change-transform bg-white"
            >

              {/* Header of Viewfinder */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#0F766E]" />
                  <span className="font-mono text-xs uppercase tracking-wider text-[#0F172A] font-semibold">
                    {t('hero.simTitle')}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-[#475569] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {t('hero.simFps')}
                </span>
              </div>

              {/* Viewfinder Canvas */}
              <div
                onMouseEnter={() => setIsHoveringCanvas(true)}
                onMouseLeave={() => setIsHoveringCanvas(false)}
                className="relative aspect-square w-full rounded-md overflow-hidden bg-[#090D16] border border-slate-800 flex items-center justify-center cursor-crosshair group shadow-inner"
              >
                <canvas
                  ref={canvasRef}
                  className="w-full h-full block"
                />

                {/* Stimulus Flash Effect */}
                {isFlashing && (
                  <div className="absolute inset-0 bg-white flex items-center justify-center pointer-events-none transition-opacity duration-200 z-20">
                    <span className="px-3 py-1 rounded bg-[#0F172A] text-white font-mono text-xs font-bold tracking-widest">
                      {t('hero.flashBanner')}
                    </span>
                  </div>
                )}

                {/* Overlaid Telemetry Readout */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between px-3 py-2.5 rounded bg-[#0F172A]/90 backdrop-blur-md border border-white/10 text-xs font-mono text-white shadow-lg">
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider block">{t('hero.pupilDia')}</span>
                    <span className="font-bold text-sm text-[#0D9488]">{pupilDiameterMm} mm</span>
                  </div>
                  <div className="space-y-0.5 text-center">
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider block">{t('hero.latency')}</span>
                    <span className="font-bold text-sm text-white">{latencyMs} ms</span>
                  </div>
                  <div className="space-y-0.5 text-right">
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider block">{t('hero.state')}</span>
                    <span className={`text-[10px] font-semibold ${isFlashing ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {isFlashing ? t('hero.constricting') : t('hero.steady')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Viewfinder Interactive Controls */}
              <div className="space-y-3.5 pt-1 font-mono text-xs">
                {/* Quick Presets */}
                <div className="flex items-center justify-between gap-1.5 pt-0.5">
                  <span className="text-[10px] text-[#64748B] uppercase tracking-wider">{t('hero.presets')}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setAmbientLux(0.1)}
                      className={`px-2 py-0.5 rounded text-[10px] transition-colors flex items-center gap-1 ${
                        ambientLux <= 0.15 ? 'bg-[#0F172A] text-white font-semibold' : 'bg-slate-100 text-[#475569] hover:bg-slate-200'
                      }`}
                    >
                      <Moon className="w-2.5 h-2.5" />
                      <span>{t('hero.scotopic')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAmbientLux(0.35)}
                      className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                        ambientLux > 0.25 && ambientLux < 0.55 ? 'bg-[#0F172A] text-white font-semibold' : 'bg-slate-100 text-[#475569] hover:bg-slate-200'
                      }`}
                    >
                      <span>{t('hero.clinic')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAmbientLux(0.85)}
                      className={`px-2 py-0.5 rounded text-[10px] transition-colors flex items-center gap-1 ${
                        ambientLux >= 0.75 ? 'bg-[#0F172A] text-white font-semibold' : 'bg-slate-100 text-[#475569] hover:bg-slate-200'
                      }`}
                    >
                      <Sun className="w-2.5 h-2.5" />
                      <span>{t('hero.photopic')}</span>
                    </button>
                  </div>
                </div>

                {/* Ambient Lux Slider */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[#475569]">
                    <span className="flex items-center gap-1.5 text-[11px]">
                      <Sliders className="w-3.5 h-3.5 text-[#0F172A]" />
                      {t('hero.ambientLux')}
                    </span>
                    <span className="text-[#0F172A] font-semibold">{t('hero.luxUnit', { lux: (ambientLux * 500).toFixed(0) })}</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="1.0"
                    step="0.05"
                    value={ambientLux}
                    onChange={(e) => setAmbientLux(parseFloat(e.target.value))}
                    className="w-full accent-[#0F172A] bg-slate-200 h-2 rounded appearance-none cursor-pointer"
                  />
                </div>

                {/* Stimulus Flash Trigger Button */}
                <button
                  type="button"
                  onClick={handleSimulateFlash}
                  disabled={isFlashing}
                  className="btn-ramp-primary w-full justify-center text-xs py-2.5 shadow-xs"
                >
                  <Zap className={`w-3.5 h-3.5 text-[#0D9488] ${isFlashing ? 'animate-bounce' : ''}`} />
                  <span>{isFlashing ? t('hero.pulseActive') : t('hero.triggerPulse')}</span>
                </button>
              </div>

            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default HelloMondayHero;
