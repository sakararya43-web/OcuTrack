import React from 'react';
import { Activity, ShieldCheck, Zap, Crosshair } from 'lucide-react';

export const HelloMondayMarquee: React.FC = () => {
  const tickerItems = [
    { label: 'ANATOMICAL RULER', val: '11.70 mm Constant', icon: Crosshair },
    { label: 'CONSTRICTION LATENCY', val: '220-260 ms Normal', icon: Zap },
    { label: 'PURSUIT GAIN RATIO', val: '0.90-1.00 Unity', icon: Activity },
    { label: 'CLIENT-SIDE QUALITY', val: '≥ 25.0 FPS Validated', icon: Activity },
    { label: 'EPHEMERAL PRIVACY', val: '0.00% Video Stored', icon: ShieldCheck },
    { label: 'TEMPORAL ARCHITECTURE', val: 'Causal Dilated TCN', icon: Activity },
  ];

  return (
    <section className="border-b border-slate-200 bg-slate-50 overflow-hidden select-none">
      
      {/* 1. Kinetic Hardware-Accelerated Continuous Telemetry Ribbon */}
      <div className="border-b border-slate-200 bg-[#0F172A] py-3 text-white overflow-hidden relative">
        <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#0F172A] to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#0F172A] to-transparent z-10 pointer-events-none" />
        
        <div className="animate-kinetic-marquee items-center gap-8 text-xs font-mono">
          {[...tickerItems, ...tickerItems, ...tickerItems].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-center gap-3 shrink-0 px-3 py-1 rounded hover:bg-white/10 transition-colors cursor-default"
              >
                <Icon className="w-3.5 h-3.5 text-[#0D9488]" />
                <span className="text-slate-400 uppercase tracking-wider text-[10px]">
                  {item.label}
                </span>
                <span className="font-semibold text-white tracking-wide">
                  {item.val}
                </span>
                <span className="text-white/20 select-none">/</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Four Master Editorial Measurement Pillars */}
      <div className="max-w-[1440px] mx-auto py-10 px-6 sm:px-10 lg:px-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-200">
          
          <div className="pt-4 md:pt-0 md:pr-6 space-y-1.5 group cursor-default">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#64748B] block group-hover:text-[#0F172A] transition-colors">
              Biometric Calibration
            </span>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] group-hover:text-[#0F766E] transition-colors">
              11.70 mm
            </div>
            <p className="text-xs text-[#475569] font-normal leading-relaxed">
              Standard biological iris ruler converting raw sub-pixel boundaries to physical millimeters.
            </p>
          </div>

          <div className="pt-4 md:pt-0 md:px-6 space-y-1.5 group cursor-default">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#64748B] block group-hover:text-[#0F172A] transition-colors">
              Parasympathetic Timing
            </span>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] group-hover:text-[#0F766E] transition-colors">
              220-260 ms
            </div>
            <p className="text-xs text-[#475569] font-normal leading-relaxed">
              Normal autonomic constriction latency interval following luminous photostimulation.
            </p>
          </div>

          <div className="pt-4 md:pt-0 md:px-6 space-y-1.5 group cursor-default">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#64748B] block group-hover:text-[#0F172A] transition-colors">
              Cerebellar Tracking
            </span>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] group-hover:text-[#0F766E] transition-colors">
              0.90-1.00
            </div>
            <p className="text-xs text-[#475569] font-normal leading-relaxed">
              Target velocity gain ratio assessing continuous pursuit stability without catch-up saccades.
            </p>
          </div>

          <div className="pt-4 md:pt-0 md:pl-6 space-y-1.5 group cursor-default">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#64748B] block group-hover:text-[#0F172A] transition-colors">
              Data Governance
            </span>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F766E]">
              0.00% Retention
            </div>
            <p className="text-xs text-[#475569] font-normal leading-relaxed">
              Strict Ephemeral Video Standard: raw facial video streams purged immediately post-extraction.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
};

export default HelloMondayMarquee;
