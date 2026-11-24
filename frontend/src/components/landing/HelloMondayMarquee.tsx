import React from 'react';
import { Activity, ShieldCheck, Zap, Crosshair } from 'lucide-react';
import { useTranslation } from '../../i18n';

export const HelloMondayMarquee: React.FC = () => {
  const { dict } = useTranslation();
  const icons = [Crosshair, Zap, Activity, Activity, ShieldCheck, Activity];

  const tickerItems = dict.marquee.ticker.map((item, idx) => ({
    ...item,
    icon: icons[idx % icons.length],
  }));

  const pillars = dict.marquee.pillars;

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
          {pillars.map((pillar, idx) => (
            <div
              key={idx}
              className={`pt-4 md:pt-0 ${idx === 0 ? 'md:pr-6' : idx === pillars.length - 1 ? 'md:pl-6' : 'md:px-6'} space-y-1.5 group cursor-default`}
            >
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#64748B] block group-hover:text-[#0F172A] transition-colors">
                {pillar.eyebrow}
              </span>
              <div
                className={`text-2xl sm:text-3xl font-bold tracking-tight ${
                  idx === pillars.length - 1 ? 'text-[#0F766E]' : 'text-[#0F172A] group-hover:text-[#0F766E]'
                } transition-colors`}
              >
                {pillar.value}
              </div>
              <p className="text-xs text-[#475569] font-normal leading-relaxed">
                {pillar.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HelloMondayMarquee;
