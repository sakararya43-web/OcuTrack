import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Lock,
  Cpu,
  Video,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { APP_NAME, NON_DIAGNOSTIC_DISCLAIMER } from '../lib/constants';
import { soundFx } from '../lib/soundFx';

export const AboutLimitationsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-10 text-[#0F172A]">
      {/* Page Header */}
      <div className="space-y-3 border-b border-[#E2E8F0] pb-6">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#F1F5F9] text-[#0F172A] border border-[#E2E8F0]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E]" />
            Regulatory &amp; Methodological Scope
          </span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-normal text-[#0F172A] tracking-tight">
          About {APP_NAME} &amp; System Limitations
        </h1>
        <p className="text-sm sm:text-base text-[#475569] font-normal leading-relaxed font-sans max-w-2xl">
          OcuTrack is an investigational research prototype for quantitative ocular measurement and longitudinal observation. This document details the clinical scope, privacy architecture, capture constraints, and machine learning boundaries.
        </p>
      </div>

      {/* Mandatory Non-Diagnostic Notice */}
      <div className="panel-ramp p-6 sm:p-8 space-y-4 shadow-sm border-l-4 border-l-[#B45309]">
        <div className="flex items-start gap-3.5">
          <div className="p-2 rounded-md bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h2 className="font-mono text-xs font-semibold text-[#0F172A] uppercase tracking-wider">
              Investigational Prototype: Not a Diagnostic Medical Device
            </h2>
            <p className="text-xs sm:text-sm text-[#475569] leading-relaxed font-sans font-normal">
              {NON_DIAGNOSTIC_DISCLAIMER}
            </p>
          </div>
        </div>
        <div className="pt-3 text-xs text-[#475569] border-t border-[#E2E8F0] font-sans font-normal">
          <strong className="text-[#0F172A] font-mono uppercase text-[10px] block mb-0.5">Intended Scope:</strong> OcuTrack supports clinical research and clinician review by extracting repeatable ocular dynamics and computing longitudinal change metrics. All clinical diagnoses, management plans, and referral decisions must be made by a licensed healthcare professional.
        </div>
      </div>

      {/* Scope Comparison Table: Can vs Cannot */}
      <div className="panel-ramp p-6 sm:p-8 space-y-6 shadow-sm">
        <div>
          <h2 className="font-mono text-xs uppercase tracking-wider text-[#64748B] font-semibold">
            System Scope &amp; Functional Boundaries
          </h2>
          <p className="text-xs text-[#475569] mt-0.5 font-normal font-sans">
            Delineation of automated measurement capabilities versus clinical diagnostic restrictions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
          {/* What OcuTrack Does */}
          <div className="bg-[#F8FAFC] border border-[#BBF7D0] rounded-xl p-5 space-y-3.5">
            <div className="flex items-center gap-2 text-[#0F766E] uppercase tracking-wider text-[11px] font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>What OcuTrack Measures</span>
            </div>
            <ul className="text-[#475569] space-y-2.5 leading-relaxed font-sans text-xs font-normal">
              <li className="flex items-start gap-2">
                <span className="text-[#0F766E] font-bold">&bull;</span>
                <span><strong className="text-[#0F172A] font-medium font-mono">Pupil Constriction Dynamics:</strong> Quantifies baseline diameter (mm), onset latency (ms), constriction velocity (mm/s), and constriction amplitude (%).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#0F766E] font-bold">&bull;</span>
                <span><strong className="text-[#0F172A] font-medium font-mono">Smooth-Pursuit Kinematics:</strong> Evaluates horizontal gaze velocity ratio (gain), position root-mean-square error (RMSE), and catch-up saccade occurrences.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#0F766E] font-bold">&bull;</span>
                <span><strong className="text-[#0F172A] font-medium font-mono">Longitudinal Change Tracking:</strong> Computes feature-level deltas (&Delta;) against an established baseline across standardized visits.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#0F766E] font-bold">&bull;</span>
                <span><strong className="text-[#0F172A] font-medium font-mono">Quality Usability Gating:</strong> Automatically evaluates frame usability ratio, illumination consistency, and head stability.</span>
              </li>
            </ul>
          </div>

          {/* What OcuTrack Does NOT Do */}
          <div className="bg-[#F8FAFC] border border-[#FECACA] rounded-xl p-5 space-y-3.5">
            <div className="flex items-center gap-2 text-[#B91C1C] uppercase tracking-wider text-[11px] font-semibold">
              <XCircle className="w-4 h-4" />
              <span>What OcuTrack Does NOT Conclude</span>
            </div>
            <ul className="text-[#475569] space-y-2.5 leading-relaxed font-sans text-xs font-normal">
              <li className="flex items-start gap-2">
                <span className="text-[#B91C1C] font-bold">&bull;</span>
                <span><strong className="text-[#0F172A] font-medium font-mono">No Disease Diagnosis:</strong> Does NOT diagnose Parkinson&apos;s disease, concussion, diabetic autonomic neuropathy, or multiple sclerosis.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#B91C1C] font-bold">&bull;</span>
                <span><strong className="text-[#0F172A] font-medium font-mono">No &quot;Healthy&quot; Assurances:</strong> A stable measurement or absence of longitudinal change does not prove that a participant is free of neurological impairment.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#B91C1C] font-bold">&bull;</span>
                <span><strong className="text-[#0F172A] font-medium font-mono">No Autonomous Triage:</strong> Does NOT output emergency urgency flags or treatment recommendations solely from unvalidated model scores.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#B91C1C] font-bold">&bull;</span>
                <span><strong className="text-[#0F172A] font-medium font-mono">No Uncalibrated Claims:</strong> Pixel measurements are never converted to absolute millimetres without iris-calibrated scaling.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Hardware & Constraints */}
      <div className="panel-ramp p-6 sm:p-8 space-y-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-[#F1F5F9] border border-[#E2E8F0] text-[#0F172A] flex items-center justify-center">
            <Video className="w-4 h-4 text-[#475569]" />
          </div>
          <div>
            <h2 className="font-mono text-xs uppercase tracking-wider text-[#0F172A] font-semibold">
              Hardware, Illumination &amp; Temporal Constraints
            </h2>
            <p className="text-xs text-[#475569] font-normal font-sans">
              Technical limitations inherent to consumer browser and webcam capture.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4 space-y-1.5">
            <h3 className="text-[#0F172A] flex items-center gap-1.5 font-semibold uppercase text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5 text-[#B45309]" />
              Frame Rate Sampling Resolution
            </h3>
            <p className="text-[#475569] leading-relaxed font-sans font-normal">
              Consumer webcams typically capture at 25–30 frames per second (FPS), resulting in an intrinsic temporal uncertainty window of ~33–40 ms. Constriction latency measurements must be interpreted within this sampling resolution.
            </p>
          </div>

          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4 space-y-1.5">
            <h3 className="text-[#0F172A] flex items-center gap-1.5 font-semibold uppercase text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5 text-[#B45309]" />
              Auto-Exposure &amp; Gain Compensation
            </h3>
            <p className="text-[#475569] leading-relaxed font-sans font-normal">
              Standard laptop webcams apply automatic exposure and gain compensation. Sudden ambient light fluctuations can affect iris contrast. The test protocol mandates uniform, diffuse room illumination.
            </p>
          </div>
        </div>
      </div>

      {/* Machine Learning Status */}
      <div className="panel-ramp p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-[#F1F5F9] border border-[#E2E8F0] text-[#0F172A] flex items-center justify-center">
            <Cpu className="w-4 h-4 text-[#475569]" />
          </div>
          <div>
            <h2 className="font-mono text-xs uppercase tracking-wider text-[#0F172A] font-semibold">
              Machine Learning Role &amp; Experimental TCN Status
            </h2>
            <p className="text-xs text-[#475569] font-normal font-sans">
              Role of the Temporal Convolutional Network (TCN) in sequence evaluation.
            </p>
          </div>
        </div>

        <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs space-y-2 font-mono">
          <div className="flex items-center justify-between">
            <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-white text-[#0F172A] border border-[#E2E8F0] uppercase">
              Current Model Status: Experimental
            </span>
            <span className="text-[10px] text-[#64748B]">TCN-v0.1</span>
          </div>
          <p className="leading-relaxed text-[#475569] font-sans font-normal">
            The neural network sequence model outputs trajectory consistency indices for research comparison. It has not undergone clinical trial validation. In compliance with project guidelines, model outputs are explicitly labelled as experimental and are never translated into clinical probabilities.
          </p>
        </div>
      </div>

      {/* Privacy & Data Governance */}
      <div className="panel-ramp p-6 sm:p-8 space-y-4 shadow-sm" id="privacy">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-[#F1F5F9] border border-[#E2E8F0] text-[#0F172A] flex items-center justify-center">
            <Lock className="w-4 h-4 text-[#475569]" />
          </div>
          <div>
            <h2 className="font-mono text-xs uppercase tracking-wider text-[#0F172A] font-semibold">
              Privacy, De-Identification &amp; Ephemeral Retention
            </h2>
            <p className="text-xs text-[#475569] font-normal font-sans">
              Protection of participant privacy and research data handling standards.
            </p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-[#475569] leading-relaxed font-sans font-normal">
          <p>
            OcuTrack implements privacy-by-design principles:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-1 font-mono text-[11px] text-[#475569]">
            <li><strong className="text-[#0F172A]">Pseudonymous Identifiers:</strong> Only synthetic research codes (e.g., <code className="bg-[#F8FAFC] px-1.5 py-0.5 rounded text-[#0F172A] border border-[#E2E8F0]">OT-0001</code>) and approximate age bands are collected. No direct personal health information (PHI) is recorded.</li>
            <li><strong className="text-[#0F172A]">Explicit Consent Gate:</strong> Recording cannot proceed without an affirmative confirmation of informed participant consent.</li>
            <li><strong className="text-[#0F172A]">Ephemeral Video Retention:</strong> Video recordings are streamed securely, analyzed for feature extraction, and deleted by default immediately following analysis completion.</li>
            <li><strong className="text-[#0F172A]">No Third-Party Analytics:</strong> Raw video blobs and biometric time-series are never transmitted to third-party ad networks or tracking services.</li>
          </ul>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#E2E8F0] text-xs font-mono">
        <Link
          to="/console"
          onClick={() => soundFx.playClick()}
          className="link-editorial font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Console</span>
        </Link>
        <Link
          to="/"
          onClick={() => soundFx.playClick()}
          className="btn-ramp-primary text-xs py-2 px-4 shadow-sm"
        >
          <span>Explore Interactive Landing</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};

export default AboutLimitationsPage;
