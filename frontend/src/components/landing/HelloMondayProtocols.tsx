import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { soundFx } from '../../lib/soundFx';
import { useTranslation } from '../../i18n';

const PROTOCOL_HREFS: Record<string, string> = {
  'pupil-reflex': '/assessments/new',
  'smooth-pursuit': '/assessments/new',
  'longitudinal-drift': '/console',
  'causal-tcn': '/about#tcn-model',
};

export const HelloMondayProtocols: React.FC = () => {
  const { t, dict } = useTranslation();
  const [activeCard, setActiveCard] = useState<string>('pupil-reflex');

  const protocols = dict.protocolsSection.items.map((item) => ({
    ...item,
    href: PROTOCOL_HREFS[item.id] || '/assessments/new',
  }));

  const current = protocols.find((p) => p.id === activeCard) || protocols[0];

  return (
    <section id="protocols-catalog" className="py-20 sm:py-28 px-6 sm:px-10 lg:px-12 border-b border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A]">
      <div className="max-w-[1440px] mx-auto space-y-12">

        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#E2E8F0] pb-6"
        >
          <div className="space-y-2 max-w-2xl">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#64748B] font-semibold">
              {t('protocolsSection.eyebrow')}
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-[#0F172A]">
              {t('protocolsSection.headingMain')} <span className="italic text-[#475569]">{t('protocolsSection.headingItalic')}</span>
            </h2>
            <p className="font-sans text-sm text-[#475569] leading-relaxed">
              {t('protocolsSection.subtitle')}
            </p>
          </div>

          <Link
            to="/assessments/new"
            onClick={() => soundFx.playClick()}
            className="btn-ramp-primary group text-xs py-2.5 px-4 self-start md:self-end flex items-center gap-2"
          >
            <span>{t('protocolsSection.launchBtn')}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </motion.div>

        {/* Interactive Protocol Selector Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {protocols.map((p) => {
            const isSelected = p.id === activeCard;
            return (
              <motion.button
                key={p.id}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setActiveCard(p.id);
                  soundFx.playClick();
                }}
                className={`p-4 rounded-xl text-left transition-all border font-mono relative overflow-hidden ${
                  isSelected
                    ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-md'
                    : 'bg-white text-[#475569] border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-[#FDFCFB]'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] pb-2">
                  <span className={isSelected ? 'text-[#0F766E]' : 'text-[#64748B]'}>
                    {p.number}
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                    isSelected ? 'bg-white/10 text-white' : 'bg-[#F1F5F9] text-[#475569]'
                  }`}>
                    {p.badge}
                  </span>
                </div>
                <div className="font-sans font-semibold text-sm text-[#0F172A] truncate" style={{ color: isSelected ? '#FFFFFF' : '#0F172A' }}>
                  {p.title}
                </div>
                <div className="text-[10px] text-[#64748B] truncate pt-1">
                  {p.primaryBiomarker}
                </div>

                {isSelected && (
                  <motion.div
                    layoutId="activeProtocolGlow"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0F766E]"
                  />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Selected Protocol Deep Dive Showcase */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="panel-ramp p-6 sm:p-8 space-y-8 shadow-ramp-card bg-white"
          >
            {/* Headline and Badges */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-6">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-[#0F766E] uppercase tracking-wider">
                    {current.tag}
                  </span>
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl text-[#0F172A] font-normal">
                  {current.title}
                </h3>
                <p className="font-sans text-sm text-[#475569]">
                  {current.headline}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  to={current.href}
                  onClick={() => soundFx.playClick()}
                  className="btn-ramp-secondary text-xs py-2 px-3 flex items-center gap-1.5"
                >
                  <span>{t('protocolsSection.specBtn')}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Two-Column Specification & Neuro-Anatomical Pathway */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

              {/* Left Column: Clinical Parameters */}
              <div className="lg:col-span-6 space-y-5">
                <p className="font-sans text-sm text-[#475569] leading-relaxed">
                  {current.description}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
                  <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                    <span className="text-[10px] text-[#64748B] uppercase block">{t('protocolsSection.primaryEndpoint')}</span>
                    <span className="font-semibold text-[#0F172A] block">{current.primaryBiomarker}</span>
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                    <span className="text-[10px] text-[#64748B] uppercase block">{t('protocolsSection.referenceBand')}</span>
                    <span className="font-semibold text-[#0F766E] block">{current.healthyRange}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Interactive Anatomical Signal Pathway */}
              <div className="lg:col-span-6 space-y-4">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#64748B] block font-semibold">
                  {t('protocolsSection.pathwayHeader')}
                </span>

                <div className="p-4 rounded-xl bg-[#0F1117] border border-[#27282D] text-white font-mono text-xs space-y-3 shadow-inner">
                  <div className="space-y-2">
                    {current.pathway.map((node, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#1A1F2C] border border-[#38BDF8]/40 flex items-center justify-center text-[10px] text-[#38BDF8] shrink-0 font-bold">
                          {i + 1}
                        </div>
                        <div className="flex-1 p-2 rounded bg-[#1A1F2C]/80 border border-white/5 text-xs flex items-center justify-between">
                          <span>{node}</span>
                          <span className="text-[9px] text-[#0F766E] opacity-70">
                            {i === 0
                              ? t('protocolsSection.stimulusIn')
                              : i === current.pathway.length - 1
                              ? t('protocolsSection.motorOut')
                              : t('protocolsSection.relay')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-[#64748B]">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" />
                      {t('protocolsSection.synapticIntegrity')}
                    </span>
                    <span className="text-white/60">{t('protocolsSection.subMsTiming')}</span>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        </AnimatePresence>

      </div>
    </section>
  );
};

export default HelloMondayProtocols;
