import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Shield, Trash2, Sliders, Scale } from 'lucide-react';
import { soundFx } from '../../lib/soundFx';
import { useTranslation } from '../../i18n';

export const HelloMondayScience: React.FC = () => {
  const { t } = useTranslation();
  const [caliperWidth, setCaliperWidth] = useState<number>(180); // Pixels corresponding to 11.7mm
  const [isPurging, setIsPurging] = useState<boolean>(false);
  const [purgeCompleted, setPurgeCompleted] = useState<boolean>(false);

  const mmRatio = (11.7 / caliperWidth).toFixed(3);

  const handleTriggerPurge = () => {
    soundFx.playFlash();
    setIsPurging(true);
    setPurgeCompleted(false);
    setTimeout(() => {
      setIsPurging(false);
      setPurgeCompleted(true);
      soundFx.playSuccess();
    }, 1200);
  };

  return (
    <div className="space-y-0 text-[#0F172A] bg-[#F8FAFC]">

      {/* 1. Editorial Scientific Statement Block */}
      <section className="py-20 sm:py-28 bg-[#F1F5F9] border-b border-[#E2E8F0] flex items-center justify-center text-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto space-y-6"
        >
          <span className="inline-flex px-2.5 py-1 rounded-md text-[10px] font-mono font-semibold bg-white text-[#0F172A] border border-[#E2E8F0] shadow-xs">
            {t('science.quoteBadge')}
          </span>
          <blockquote className="font-serif text-2xl sm:text-4xl lg:text-5xl font-normal italic leading-[1.22] text-[#0F172A] tracking-tight">
            {t('science.quote')}
          </blockquote>
          <cite className="font-mono text-xs text-[#475569] block not-italic pt-2">
            {t('science.quoteCite')}
          </cite>
        </motion.div>
      </section>

      {/* 2. Interactive Metrology: The 11.7 mm Iris Standard */}
      <section className="py-20 sm:py-28 px-6 sm:px-10 lg:px-12 border-b border-[#E2E8F0]">
        <div className="max-w-[1440px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

            {/* Left: Graphic Metrological Study with Interactive Caliper */}
            <div className="lg:col-span-6 panel-ramp p-8 space-y-6 shadow-ramp-card bg-white">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] text-xs font-mono">
                <span className="text-[#64748B] uppercase tracking-wider text-[10px] font-semibold flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-[#0F766E]" />
                  {t('science.constantLabel')}
                </span>
                <span className="text-[#0F172A] font-semibold">Ø = 11.70 mm</span>
              </div>

              {/* Technical Diagram of Iris Ruler */}
              <div className="relative aspect-[4/3] bg-[#0F1117] rounded-lg border border-[#27282D] flex items-center justify-center p-6 overflow-hidden shadow-inner">
                <svg className="w-full h-full max-w-sm transition-all duration-75" viewBox="0 0 280 200">
                  {/* Caliper Reference Lines */}
                  <line
                    x1={140 - caliperWidth / 2}
                    y1="20"
                    x2={140 - caliperWidth / 2}
                    y2="180"
                    stroke="#0F766E"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                  <line
                    x1={140 + caliperWidth / 2}
                    y1="20"
                    x2={140 + caliperWidth / 2}
                    y2="180"
                    stroke="#0F766E"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />

                  {/* Horizontal Dimension Arrow */}
                  <line
                    x1={140 - caliperWidth / 2}
                    y1="100"
                    x2={140 + caliperWidth / 2}
                    y2="100"
                    stroke="#0F766E"
                    strokeWidth="1.5"
                  />
                  {/* Arrows */}
                  <polygon points={`${140 - caliperWidth / 2},100 ${140 - caliperWidth / 2 + 8},96 ${140 - caliperWidth / 2 + 8},104`} fill="#0F766E" />
                  <polygon points={`${140 + caliperWidth / 2},100 ${140 + caliperWidth / 2 - 8},96 ${140 + caliperWidth / 2 - 8},104`} fill="#0F766E" />

                  {/* Biological Iris Ellipse */}
                  <ellipse cx="140" cy="100" rx={caliperWidth / 2} ry={caliperWidth / 2} fill="#1E232F" stroke="#FFFFFF" strokeWidth="1" />
                  {/* Inner Pupil Ellipse */}
                  <ellipse cx="140" cy="100" rx={caliperWidth * 0.22} ry={caliperWidth * 0.22} fill="#090A0D" />
                  {/* Sub-pixel Landmarks dots */}
                  <circle cx={140 - caliperWidth / 2} cy="100" r="3.5" fill="#0F766E" />
                  <circle cx={140 + caliperWidth / 2} cy="100" r="3.5" fill="#0F766E" />

                  {/* Dimension Text */}
                  <rect x="100" y="86" width="80" height="26" rx="4" fill="#0F172A" stroke="#27282D" />
                  <text x="140" y="103" fill="#FFFFFF" fontSize="11" fontFamily="JetBrains Mono" fontWeight="600" textAnchor="middle">
                    11.70 mm
                  </text>
                </svg>
              </div>

              {/* Presets and Slider for Caliper Width Adjustment */}
              <div className="space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between text-[#475569]">
                  <span className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-[#0F172A]" />
                    {t('science.pixelPitch')}
                  </span>
                  <span className="text-[#0F172A] font-semibold">{caliperWidth} px (1 px = {mmRatio} mm)</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCaliperWidth(140)}
                    className={`px-2 py-0.5 rounded text-[10px] ${caliperWidth === 140 ? 'bg-[#0F172A] text-[#0F766E]' : 'bg-[#F1F5F9] text-[#475569]'}`}
                  >
                    {t('science.presetFar')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCaliperWidth(180)}
                    className={`px-2 py-0.5 rounded text-[10px] ${caliperWidth === 180 ? 'bg-[#0F172A] text-[#0F766E]' : 'bg-[#F1F5F9] text-[#475569]'}`}
                  >
                    {t('science.presetNominal')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCaliperWidth(220)}
                    className={`px-2 py-0.5 rounded text-[10px] ${caliperWidth === 220 ? 'bg-[#0F172A] text-[#0F766E]' : 'bg-[#F1F5F9] text-[#475569]'}`}
                  >
                    {t('science.presetMacro')}
                  </button>
                </div>

                <input
                  type="range"
                  min="120"
                  max="240"
                  value={caliperWidth}
                  onChange={(e) => setCaliperWidth(parseInt(e.target.value))}
                  className="w-full accent-[#0F172A] bg-[#E2E8F0] h-2 rounded appearance-none cursor-pointer"
                />
              </div>

              <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] text-[11px] font-mono text-[#475569] flex items-center justify-between">
                <span>{t('science.scalingFactor')}</span>
                <span className="font-semibold text-[#0F172A]">{mmRatio} mm / pixel</span>
              </div>
            </div>

            {/* Right: Architectural Monograph on Biological Ruler */}
            <div className="lg:col-span-6 space-y-6">
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#64748B] font-semibold">
                {t('science.eyebrow')}
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-[#0F172A]">
                {t('science.headingMain')} <span className="italic text-[#475569]">{t('science.headingItalic')}</span>
              </h2>
              <div className="space-y-4 text-sm text-[#475569] font-normal leading-relaxed">
                <p>{t('science.p1')}</p>
                <p>
                  {t('science.p2Prefix')} <strong>{t('science.p2Strong')}</strong>.
                </p>
                <p>{t('science.p3')}</p>
              </div>

              <div className="pt-2">
                <Link
                  to="/about#iris-standard"
                  className="btn-ramp-secondary text-xs py-2 px-3 inline-flex items-center gap-1.5"
                >
                  <span>{t('science.readProof')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. Ephemeral Video Architecture & Privacy Destruction */}
      <section className="py-20 sm:py-28 px-6 sm:px-10 lg:px-12 border-b border-[#E2E8F0] bg-[#F8FAFC]">
        <div className="max-w-[1440px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

            <div className="lg:col-span-6 space-y-6">
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#64748B] font-semibold">
                {t('science.privacyEyebrow')}
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-[#0F172A]">
                {t('science.privacyHeadingMain')} <span className="italic text-[#475569]">{t('science.privacyHeadingItalic')}</span>
              </h2>
              <div className="space-y-4 text-sm text-[#475569] font-normal leading-relaxed">
                <p>{t('science.privacyP1')}</p>
                <p>
                  {t('science.privacyP2Prefix')} <strong>{t('science.privacyP2Strong')}</strong>{t('science.privacyP2Suffix')}
                </p>
                <p>{t('science.privacyP3')}</p>
              </div>

              <div className="pt-2">
                <Link
                  to="/about#privacy"
                  className="btn-ramp-secondary text-xs py-2 px-3 inline-flex items-center gap-1.5"
                >
                  <span>{t('science.inspectPolicy')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Interactive Raw Video Purge Simulator */}
            <div className="lg:col-span-6 panel-ramp p-8 space-y-6 shadow-ramp-card bg-white">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#0F766E]" />
                  <span className="font-mono text-xs uppercase tracking-wider text-[#0F172A] font-semibold">
                    {t('science.destructionTitle')}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-[#0F766E] bg-[#F0FDF4] px-2 py-0.5 rounded border border-[#BBF7D0]">
                  {t('science.activeZeroRetention')}
                </span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg flex items-center justify-between">
                  <span className="text-[#475569]">{t('science.step1Label')}</span>
                  <span className="text-[#0F172A] font-medium">{t('science.step1Val')}</span>
                </div>
                <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg flex items-center justify-between">
                  <span className="text-[#475569]">{t('science.step2Label')}</span>
                  <span className="text-[#0F172A] font-medium">{t('science.step2Val')}</span>
                </div>
                <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg flex items-center justify-between">
                  <span className="text-[#475569]">{t('science.step3Label')}</span>
                  <span className={purgeCompleted ? 'text-[#0F766E] font-semibold' : 'text-[#B45309]'}>
                    {isPurging
                      ? t('science.step3Purging')
                      : purgeCompleted
                      ? t('science.step3Destroyed')
                      : t('science.step3Pending')}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleTriggerPurge}
                  disabled={isPurging}
                  className="btn-ramp-primary w-full justify-center text-xs py-2.5"
                >
                  <Trash2 className="w-3.5 h-3.5 text-[#0F766E]" />
                  <span>{isPurging ? t('science.zeroingBuffers') : t('science.triggerPurge')}</span>
                </motion.button>
              </div>

              {purgeCompleted && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg text-xs font-mono text-[#0F766E] flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{t('science.verifiedBanner')}</span>
                </motion.div>
              )}
            </div>

          </div>
        </div>
      </section>

    </div>
  );
};

export default HelloMondayScience;
