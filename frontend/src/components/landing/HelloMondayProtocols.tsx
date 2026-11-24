import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { soundFx } from '../../lib/soundFx';

interface ProtocolCard {
  number: string;
  id: string;
  title: string;
  tag: string;
  headline: string;
  primaryBiomarker: string;
  healthyRange: string;
  description: string;
  pathway: string[];
  href: string;
  badge: string;
}

export const HelloMondayProtocols: React.FC = () => {
  const [activeCard, setActiveCard] = useState<string>('pupil-reflex');

  const protocols: ProtocolCard[] = [
    {
      number: '01',
      id: 'pupil-reflex',
      tag: 'PROTOCOL 0.1 · PHOTOSTIMULATION',
      title: 'Pupil Light Reflex Protocol',
      headline: 'Diffuse ambient screen flash (1000 ms photopic square wave)',
      primaryBiomarker: 'Constriction Latency & Velocity',
      healthyRange: 'Latency: 220–260 ms · Velocity: 4.0–5.5 mm/s',
      description: 'Quantifies the autonomic millisecond interval between luminous onset and iris sphincter pupillae contraction, indexing parasympathetic pretectal transmission.',
      pathway: [
        'Optic nerve (CN II)',
        'Pretectal nucleus',
        'Edinger-Westphal',
        'Oculomotor nerve (CN III)',
      ],
      href: '/assessments/new',
      badge: 'Core Battery',
    },
    {
      number: '02',
      id: 'smooth-pursuit',
      tag: 'PROTOCOL 0.2 · KINEMATICS',
      title: 'Smooth Pursuit Kinematics',
      headline: 'Continuous sinusoidal target trajectory (0.4 Hz sweeping vector)',
      primaryBiomarker: 'Velocity Gain Ratio & Catch-up Saccades',
      healthyRange: 'Gain: 0.90–1.00 (Unity) · Saccades: 0–2 per sweep',
      description: 'Evaluates the cerebellar motor loop by measuring how accurately ocular velocity matches a predictable moving target without slipping into corrective saccades.',
      pathway: [
        'Striate cortex (V1)',
        'Middle temporal area (MT/V5)',
        'Pontine nuclei',
        'Cerebellum & Brainstem',
      ],
      href: '/assessments/new',
      badge: 'Motor Kinematics',
    },
    {
      number: '03',
      id: 'longitudinal-drift',
      tag: 'PROTOCOL 0.3 · TEMPORAL ENGINE',
      title: 'Longitudinal Trajectory Delta',
      headline: 'Multi-session personal baseline comparator (Δ Variance)',
      primaryBiomarker: 'Intra-Patient Drift Metric',
      healthyRange: 'Δ Latency: ≤ 15 ms · Δ Gain: ≤ 0.08 variance',
      description: 'Bypasses misleading cross-sectional population distributions by benchmarking each individual strictly against their own historical verified baseline across clinic visits.',
      pathway: [
        'Visit 01 Baseline',
        'Within-Subject Normalization',
        'Variance Confidence Bounds',
        'Automated Drift Alert',
      ],
      href: '/console',
      badge: 'Baseline Comparator',
    },
    {
      number: '04',
      id: 'causal-tcn',
      tag: 'PROTOCOL 0.4 · NEURAL PIPELINE',
      title: 'Causal Dilated Convolution (TCN)',
      headline: '300-frame normalized kinematic trajectory classifier',
      primaryBiomarker: 'Sequence Trajectory Consistency Index',
      healthyRange: 'Non-diagnostic research index (0.00 – 1.00)',
      description: 'Temporal Convolutional Network with causal dilations evaluating velocity wave coherence with zero lookahead bias into future frames.',
      pathway: [
        'Sub-pixel coordinate series',
        'Causal receptive dilations (1,2,4,8,16)',
        'Residual Blocks',
        'Trajectory Coherence Index',
      ],
      href: '/about#tcn-model',
      badge: 'Experimental',
    },
  ];

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
              Standardized Formulations
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-[#0F172A]">
              Clinical Screening <span className="italic text-[#475569]">Protocols.</span>
            </h2>
            <p className="font-sans text-sm text-[#475569] leading-relaxed">
              Standardized optical capture protocols designed for ambient clinical research. Select a protocol to inspect neuro-anatomical pathways and target biomarkers.
            </p>
          </div>

          <Link
            to="/assessments/new"
            onClick={() => soundFx.playClick()}
            className="btn-ramp-primary group text-xs py-2.5 px-4 self-start md:self-end flex items-center gap-2"
          >
            <span>Launch Protocol Session</span>
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
                  <span>Protocol Spec</span>
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
                    <span className="text-[10px] text-[#64748B] uppercase block">Primary Endpoint</span>
                    <span className="font-semibold text-[#0F172A] block">{current.primaryBiomarker}</span>
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                    <span className="text-[10px] text-[#64748B] uppercase block">Reference Band</span>
                    <span className="font-semibold text-[#0F766E] block">{current.healthyRange}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Interactive Anatomical Signal Pathway */}
              <div className="lg:col-span-6 space-y-4">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#64748B] block font-semibold">
                  Anatomical Neural Signal Pathway:
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
                            {i === 0 ? 'Stimulus In' : i === current.pathway.length - 1 ? 'Motor Out' : 'Relay'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-[#64748B]">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" />
                      Continuous Synaptic Signal Integrity
                    </span>
                    <span className="text-white/60">Sub-millisecond Timing</span>
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
