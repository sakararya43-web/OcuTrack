import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Lock } from 'lucide-react';
import { APP_NAME, PROTOCOL_VERSION } from '../lib/constants';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-10 text-[#0F172A] py-6">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-mono text-[#64748B]">
        <Link to="/" className="hover:text-[#0F172A] transition-colors flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
        <span>/</span>
        <span className="text-[#0F172A] font-medium">Privacy Policy</span>
      </div>

      {/* Page Header */}
      <div className="space-y-3 border-b border-[#E2E8F0] pb-6">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-medium bg-[#F1F5F9] text-[#0F172A] border border-[#E2E8F0]">
            <Lock className="w-3 h-3 text-[#0F766E]" />
            Regulatory Compliance and Data Governance
          </span>
          <span className="font-mono text-[11px] text-[#64748B]">
            Protocol {PROTOCOL_VERSION}
          </span>
        </div>
        <h1 className="font-sans text-3xl sm:text-4xl font-bold text-[#0F172A] tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-sm sm:text-base text-[#475569] font-normal leading-relaxed max-w-2xl">
          Operational data protection framework for the {APP_NAME} quantitative ocular telemetry system. This policy outlines how participant video, biometric landmark time-series, and session telemetry are handled.
        </p>
        <p className="text-xs font-mono text-[#64748B]">
          Effective Date: November 2026 | Draft Version 1.0 (Editable Operational Document)
        </p>
      </div>

      {/* Burn-After-Reading Architecture Highlight */}
      <div className="panel-ramp p-6 space-y-3 border-l-4 border-l-[#0F766E]">
        <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-[#0F766E]">
          <ShieldCheck className="w-4 h-4" />
          <span>Core Privacy Architecture: Ephemeral Video Destruction</span>
        </div>
        <p className="text-sm text-[#475569] leading-relaxed">
          Participant video captured during pupil reflex or smooth pursuit tests is processed in volatile memory. Facial landmark coordinates (MediaPipe FaceMesh 468–477) are extracted in real time, and the raw video file is deleted immediately. No raw facial recordings or biometric image libraries are permanently stored.
        </p>
      </div>

      {/* Policy Sections */}
      <div className="space-y-8 text-sm text-[#475569] leading-relaxed">
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-[#0F172A] font-sans flex items-center gap-2">
            <span className="font-mono text-xs text-[#0F766E] font-bold">01.</span>
            Data Collection Scope
          </h2>
          <p>
            {APP_NAME} collects only the minimum technical and kinematic data necessary to compute objective oculomotor metrics:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#475569]">
            <li><strong>De-Identified Participant Token:</strong> Pseudonymous subject identifier assigned by the research clinician (e.g., OT-4091). No names, email addresses, or social security numbers are collected.</li>
            <li><strong>Demographic Stratifier:</strong> Optional age band (e.g., 40-49) used exclusively for normative reference distribution comparison.</li>
            <li><strong>Coordinate Landmark Series:</strong> 2D sub-pixel coordinates representing pupil rim contours and horizontal gaze tracking positions.</li>
            <li><strong>Signal Quality Telemetry:</strong> Usable frame ratio, ambient lux estimate, and camera sampling frequency (FPS).</li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="space-y-3 border-t border-[#E2E8F0] pt-6">
          <h2 className="text-base font-semibold text-[#0F172A] font-sans flex items-center gap-2">
            <span className="font-mono text-xs text-[#0F766E] font-bold">02.</span>
            Purpose of Processing
          </h2>
          <p>
            Collected telemetry is processed strictly for clinical research and investigational analysis:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#475569]">
            <li>Computing pupil constriction latency (ms), constriction velocity (mm/s), and dilation recovery time.</li>
            <li>Measuring smooth pursuit velocity gain ratio and count of corrective catch-up saccades.</li>
            <li>Calculating longitudinal intra-patient baseline drift across serial clinic visits.</li>
            <li>Evaluating frame stability against the standard 25.0 FPS recording threshold.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-3 border-t border-[#E2E8F0] pt-6">
          <h2 className="text-base font-semibold text-[#0F172A] font-sans flex items-center gap-2">
            <span className="font-mono text-xs text-[#0F766E] font-bold">03.</span>
            Data Retention and Deletion
          </h2>
          <p>
            Numerical time-series curves and derived clinical metrics are stored in an encrypted database for longitudinal comparison. Clinicians retain full administrative authority to export or purge participant records at any time. Raw camera frames are purged immediately upon feature extraction completion.
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-3 border-t border-[#E2E8F0] pt-6">
          <h2 className="text-base font-semibold text-[#0F172A] font-sans flex items-center gap-2">
            <span className="font-mono text-xs text-[#0F766E] font-bold">04.</span>
            Participant Rights and Inquiries
          </h2>
          <p>
            Participants enrolled in clinical studies utilizing {APP_NAME} may request access, modification, or deletion of their de-identified session telemetry through the principal investigator conducting the study.
          </p>
          <div className="panel-ramp p-4 mt-2 text-xs font-mono text-[#64748B]">
            Inquiries: privacy@ocutrack-consortium.org | Clinical Research Data Governance Office
          </div>
        </section>
      </div>

      {/* Bottom Navigation */}
      <div className="border-t border-[#E2E8F0] pt-6 flex flex-wrap items-center justify-between gap-4">
        <Link to="/terms" className="btn-ramp-secondary text-xs">
          <span>View Terms and Conditions</span>
        </Link>
        <Link to="/about" className="btn-ramp-secondary text-xs">
          <span>System Limitations and Scope</span>
        </Link>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
