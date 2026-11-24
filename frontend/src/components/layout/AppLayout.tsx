import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Header } from './Header';
import { DisclaimerBanner } from './DisclaimerBanner';
import { APP_NAME, PROTOCOL_VERSION } from '../../lib/constants';
import { ArrowUpRight, Lock, ShieldCheck } from 'lucide-react';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-[#0F172A] selection:bg-[#0F172A] selection:text-white relative">
      <DisclaimerBanner />
      <Header />

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-6 sm:px-10 lg:px-12 py-10">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white py-12 mt-auto">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-10 border-b border-slate-200 text-xs">

            {/* Column 1: Brand & Identity */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-sans font-bold text-base text-[#0F172A]">
                  {APP_NAME}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-50 text-[#475569] border border-slate-200">
                  {PROTOCOL_VERSION}
                </span>
              </div>
              <p className="text-[#475569] leading-relaxed font-normal">
                Hardware-agnostic optical pupillometry and smooth pursuit kinematics for investigational longitudinal tracking.
              </p>
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#0F766E] font-medium pt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E]" />
                <span>Active Telemetry Engine</span>
              </div>
            </div>

            {/* Column 2: Clinical Navigation */}
            <div className="space-y-3">
              <span className="font-mono uppercase tracking-[0.08em] font-semibold text-[11px] text-[#0F172A] block">
                Clinical Navigation
              </span>
              <ul className="space-y-2 text-[#475569]">
                <li><Link to="/clinic-overview" className="hover:text-[#0F172A] transition-colors flex items-center gap-1">Clinic Overview <ArrowUpRight className="w-3 h-3 opacity-50" /></Link></li>
                <li><Link to="/console" className="hover:text-[#0F172A] transition-colors flex items-center gap-1">Clinical Console <ArrowUpRight className="w-3 h-3 opacity-50" /></Link></li>
                <li><Link to="/patients" className="hover:text-[#0F172A] transition-colors flex items-center gap-1">Cohort Registry <ArrowUpRight className="w-3 h-3 opacity-50" /></Link></li>
                <li><Link to="/login" className="hover:text-[#0F172A] transition-colors flex items-center gap-1">Staff Portal <ArrowUpRight className="w-3 h-3 opacity-50" /></Link></li>
                <li><Link to="/assessments/new" className="hover:text-[#0F172A] transition-colors flex items-center gap-1">Initiate Screening <ArrowUpRight className="w-3 h-3 opacity-50" /></Link></li>
                <li><Link to="/about" className="hover:text-[#0F172A] transition-colors flex items-center gap-1">Protocol Methodology <ArrowUpRight className="w-3 h-3 opacity-50" /></Link></li>
              </ul>
            </div>

            {/* Column 3: Quality & Calibration */}
            <div className="space-y-3">
              <span className="font-mono uppercase tracking-[0.08em] font-semibold text-[11px] text-[#0F172A] block">
                Quality &amp; Standards
              </span>
              <ul className="space-y-2 text-[#475569]">
                <li><span className="text-[#0F172A] font-medium">Ephemeral Video:</span> Instant raw deletion</li>
                <li><span className="text-[#0F172A] font-medium">Calibration:</span> 11.7 mm iris standard</li>
                <li><span className="text-[#0F172A] font-medium">Frame Floor:</span> &ge; 25 FPS validation</li>
                <li><Link to="/about#disclaimer" className="text-[#0F172A] hover:underline font-medium">Regulatory Scope Notice</Link></li>
              </ul>
            </div>

            {/* Column 4: Regulatory & Legal Policies */}
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
              </ul>
            </div>

          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-[#64748B] gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <span>&copy; {new Date().getFullYear()} OcuTrack Clinical Biometrics. All rights reserved.</span>
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
              <span className="text-[#0F172A] font-medium">Protocol {PROTOCOL_VERSION}</span>
              <span>&bull;</span>
              <span>Webcam Reflex Diagnostics</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AppLayout;
