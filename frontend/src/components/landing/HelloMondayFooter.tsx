import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, ShieldCheck, Lock } from 'lucide-react';
import { APP_NAME, PROTOCOL_VERSION } from '../../lib/constants';

export const HelloMondayFooter: React.FC = () => {
  return (
    <footer className="bg-slate-50 text-[#0F172A] border-t border-slate-200">
      {/* 1. Structured Closing Section */}
      <section className="py-20 sm:py-24 px-6 sm:px-10 lg:px-12 border-b border-slate-200 bg-white">
        <div className="max-w-[1440px] mx-auto">
          <div className="max-w-3xl space-y-6">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#64748B] font-semibold">
              Deployment and Observation
            </span>
            <h2 className="font-sans text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#0F172A] leading-tight">
              Clinical Precision through Consumer Optical Hardware
            </h2>
            <p className="font-sans text-base sm:text-lg text-[#475569] leading-relaxed">
              Deploy repeatable ocular reflex screening and longitudinal tracking without dedicated diagnostic hardware. Open the research console or initiate your first screening session.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/assessments/new"
                className="btn-ramp-primary text-xs py-2.5 px-5 shadow-sm flex items-center gap-2"
              >
                <span>Initiate Clinical Assessment</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/patients"
                className="btn-ramp-secondary text-xs py-2.5 px-5"
              >
                <span>Explore Cohort Registry</span>
              </Link>
              <Link
                to="/console"
                className="btn-ramp-secondary text-xs py-2.5 px-5"
              >
                <span>Open Research Console</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Structured Institutional Columns */}
      <div className="py-16 px-6 sm:px-10 lg:px-12 max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-200 text-xs">
          {/* Brand & Mission Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-sans font-bold text-base text-[#0F172A]">
                {APP_NAME}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-white text-[#475569] border border-slate-200">
                {PROTOCOL_VERSION}
              </span>
            </div>
            <p className="text-[#475569] leading-relaxed font-normal">
              Hardware-agnostic optical pupillometry and smooth pursuit kinematics for investigational longitudinal tracking.
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#F0FDF4] text-[#0F766E] border border-[#BBF7D0]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E]" />
                Protocol Active &amp; Validated
              </span>
            </div>
          </div>

          {/* Protocols */}
          <div className="space-y-3">
            <span className="font-mono uppercase tracking-[0.08em] font-semibold text-[11px] text-[#0F172A] block">
              Core Protocols
            </span>
            <ul className="space-y-2 text-[#475569]">
              <li>
                <Link to="/assessments/new" className="hover:text-[#0F172A] transition-colors flex items-center gap-1">
                  <span>Protocol 0.1: Pupil Light Reflex</span>
                  <ArrowUpRight className="w-3 h-3 opacity-50" />
                </Link>
              </li>
              <li>
                <Link to="/assessments/new" className="hover:text-[#0F172A] transition-colors flex items-center gap-1">
                  <span>Protocol 0.2: Smooth Pursuit</span>
                  <ArrowUpRight className="w-3 h-3 opacity-50" />
                </Link>
              </li>
              <li>
                <Link to="/console" className="hover:text-[#0F172A] transition-colors flex items-center gap-1">
                  <span>Protocol 0.3: Longitudinal Delta</span>
                  <ArrowUpRight className="w-3 h-3 opacity-50" />
                </Link>
              </li>
              <li>
                <Link to="/about#tcn-model" className="hover:text-[#0F172A] transition-colors flex items-center gap-1">
                  <span>Protocol 0.4: TCN Evaluator</span>
                  <ArrowUpRight className="w-3 h-3 opacity-50" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Standards & Metrology */}
          <div className="space-y-3">
            <span className="font-mono uppercase tracking-[0.08em] font-semibold text-[11px] text-[#0F172A] block">
              Standards &amp; Metrology
            </span>
            <ul className="space-y-2 text-[#475569]">
              <li>
                <Link to="/about#iris-standard" className="hover:text-[#0F172A] transition-colors flex items-center gap-1">
                  <span>11.7 mm Iris Calibration Standard</span>
                  <ArrowUpRight className="w-3 h-3 opacity-50" />
                </Link>
              </li>
              <li>
                <Link to="/about#privacy" className="hover:text-[#0F172A] transition-colors flex items-center gap-1">
                  <span>Ephemeral Client Video Destruction</span>
                  <ArrowUpRight className="w-3 h-3 opacity-50" />
                </Link>
              </li>
              <li>
                <Link to="/about#quality" className="hover:text-[#0F172A] transition-colors flex items-center gap-1">
                  <span>Frame Sampling Floor (&ge; 25 FPS)</span>
                  <ArrowUpRight className="w-3 h-3 opacity-50" />
                </Link>
              </li>
              <li>
                <Link to="/about#limitations" className="hover:text-[#0F172A] transition-colors flex items-center gap-1">
                  <span>Hardware &amp; Lighting Constraints</span>
                  <ArrowUpRight className="w-3 h-3 opacity-50" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Governance & Legal Policies */}
          <div className="space-y-3">
            <span className="font-mono uppercase tracking-[0.08em] font-semibold text-[11px] text-[#0F172A] block">
              Governance &amp; Legal
            </span>
            <p className="text-[11px] text-[#475569] leading-relaxed">
              Investigational software instrument. For clinical research and non-diagnostic observational monitoring only. Not an FDA cleared medical diagnostic device.
            </p>
            <ul className="space-y-2 text-[#475569] pt-1">
              <li>
                <Link to="/privacy" className="hover:text-[#0F172A] transition-colors flex items-center gap-1 font-medium text-[#0F172A]">
                  <Lock className="w-3 h-3 text-[#0F766E]" />
                  <span>Privacy Policy</span>
                  <ArrowUpRight className="w-3 h-3 opacity-50" />
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-[#0F172A] transition-colors flex items-center gap-1 font-medium text-[#0F172A]">
                  <ShieldCheck className="w-3 h-3 text-[#0F766E]" />
                  <span>Terms and Conditions</span>
                  <ArrowUpRight className="w-3 h-3 opacity-50" />
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#0F172A] transition-colors flex items-center gap-1">
                  <span>Regulatory Notice</span>
                  <ArrowUpRight className="w-3 h-3 opacity-50" />
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright, Legal Links, Protocol Status */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-[#64748B] gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <p>&copy; {new Date().getFullYear()} OcuTrack Clinical Biometrics Consortium. All rights reserved.</p>
            <div className="flex items-center gap-3">
              <Link to="/privacy" className="hover:text-[#0F172A] transition-colors underline underline-offset-2">
                Privacy Policy
              </Link>
              <span>&bull;</span>
              <Link to="/terms" className="hover:text-[#0F172A] transition-colors underline underline-offset-2">
                Terms &amp; Conditions
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span>Protocol {PROTOCOL_VERSION}</span>
            <span>&bull;</span>
            <span>Investigational Use Only</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default HelloMondayFooter;
