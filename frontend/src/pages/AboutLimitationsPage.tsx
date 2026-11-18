import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Info,
  Lock,
  Cpu,
  Video,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { APP_NAME, NON_DIAGNOSTIC_DISCLAIMER } from '../lib/constants';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export const AboutLimitationsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="space-y-3">
        <Badge variant="medical">
          <Info className="w-3.5 h-3.5" aria-hidden="true" />
          Regulatory &amp; Methodological Transparency
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          About {APP_NAME} &amp; System Limitations
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          OcuTrack is an investigational software prototype for quantitative ocular measurement and
          longitudinal observation. This document details the clinical scope, privacy architecture,
          capture constraints, and machine learning boundaries.
        </p>
      </div>

      {/* Mandatory Non-Diagnostic Notice */}
      <div className="bg-slate-100 border border-slate-300 rounded-md p-6 space-y-3">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-6 h-6 text-slate-800 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Investigational Prototype: Not a Diagnostic Medical Device
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {NON_DIAGNOSTIC_DISCLAIMER}
            </p>
          </div>
        </div>
        <div className="pt-3 text-xs text-slate-700 border-t border-slate-200">
          <strong>Intended Use:</strong> OcuTrack supports clinical research and clinician review by
          extracting repeatable ocular dynamics and computing longitudinal change metrics. All
          clinical diagnoses, management plans, and referral decisions must be made by a licensed
          healthcare professional.
        </div>
      </div>

      {/* Scope Comparison Table: Can vs Cannot */}
      <Card>
        <CardContent className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              System Scope &amp; Functional Boundaries
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Clear delineation of automated measurement capabilities versus clinical diagnostic
              restrictions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* What OcuTrack Does */}
            <div className="bg-teal-50/50 border border-teal-200 rounded-md p-5 space-y-3">
              <div className="flex items-center gap-2 text-teal-900 font-semibold text-sm">
                <CheckCircle2 className="w-4 h-4 text-teal-700" aria-hidden="true" />
                <span>What OcuTrack Measures</span>
              </div>
              <ul className="text-xs text-slate-800 space-y-2 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-teal-700 font-bold">&bull;</span>
                  <span>
                    <strong>Pupil Constriction Dynamics:</strong> Quantifies baseline diameter (mm),
                    onset latency (ms), constriction velocity (mm/s), and constriction amplitude
                    (%).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-700 font-bold">&bull;</span>
                  <span>
                    <strong>Smooth-Pursuit Kinematics:</strong> Evaluates horizontal gaze velocity
                    ratio (gain), position root-mean-square error (RMSE), and catch-up saccade
                    occurrences.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-700 font-bold">&bull;</span>
                  <span>
                    <strong>Longitudinal Change Tracking:</strong> Computes feature-level deltas
                    (Delta) against an established baseline across standardized visits.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-700 font-bold">&bull;</span>
                  <span>
                    <strong>Quality Usability Gating:</strong> Automatically evaluates frame
                    usability ratio, illumination consistency, and head stability.
                  </span>
                </li>
              </ul>
            </div>

            {/* What OcuTrack Does NOT Do */}
            <div className="bg-rose-50/50 border border-rose-200 rounded-md p-5 space-y-3">
              <div className="flex items-center gap-2 text-rose-900 font-semibold text-sm">
                <XCircle className="w-4 h-4 text-rose-700" aria-hidden="true" />
                <span>What OcuTrack Does NOT Conclude</span>
              </div>
              <ul className="text-xs text-slate-800 space-y-2 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-rose-700 font-bold">&bull;</span>
                  <span>
                    <strong>No Disease Diagnosis:</strong> Does NOT diagnose Parkinson&apos;s
                    disease, concussion, diabetic autonomic neuropathy, or multiple sclerosis.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-700 font-bold">&bull;</span>
                  <span>
                    <strong>No &quot;Healthy&quot; Assurances:</strong> A stable measurement or
                    absence of longitudinal change does not prove that a participant is free of
                    neurological impairment.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-700 font-bold">&bull;</span>
                  <span>
                    <strong>No Autonomous Triage:</strong> Does NOT output emergency urgency flags
                    or treatment recommendations solely from unvalidated model scores.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-700 font-bold">&bull;</span>
                  <span>
                    <strong>No Uncalibrated Medical Claims:</strong> Pixel measurements are never
                    converted to absolute millimetres without iris-calibrated scaling.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hardware & Environmental Limitations */}
      <Card>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
              <Video className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Hardware, Illumination &amp; Temporal Constraints
              </h2>
              <p className="text-xs text-slate-500">
                Technical limitations inherent to consumer browser and webcam capture.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-1.5">
              <h3 className="font-semibold text-slate-900 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-sky-700" aria-hidden="true" />
                Temporal Frame Rate Sampling
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Consumer webcams typically capture at 25-30 frames per second (FPS), resulting in an
                intrinsic temporal uncertainty window of 33-40 ms. Constriction latency measurements
                must be interpreted within this sampling resolution.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-1.5">
              <h3 className="font-semibold text-slate-900 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-sky-700" aria-hidden="true" />
                Auto-Exposure &amp; Illumination Drift
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Standard laptop webcams apply automatic exposure and gain compensation. Sudden
                ambient light fluctuations can affect iris contrast. The test protocol mandates
                uniform, diffuse room illumination.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-1.5">
              <h3 className="font-semibold text-slate-900 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-sky-700" aria-hidden="true" />
                Light Stimulus Safety Protocol
              </h3>
              <p className="text-slate-600 leading-relaxed">
                High-intensity lights or direct torch/laser stimulus must never be directed into the
                participant&apos;s eyes. OcuTrack uses a diffuse white screen flash stimulus at the
                5-second mark of the 15-second recording.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-1.5">
              <h3 className="font-semibold text-slate-900 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-sky-700" aria-hidden="true" />
                Calibrated Benchmark Fallback
              </h3>
              <p className="text-slate-600 leading-relaxed">
                For environments lacking uniform lighting or supported webcam access, an explicitly
                labelled benchmark sample is provided. Benchmark data is clearly tagged as synthetic
                and never misrepresented as live participant capture.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Machine Learning & TCN Architecture */}
      <Card>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-sky-50 border border-sky-200 text-sky-800 flex items-center justify-center">
              <Cpu className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Machine Learning Role &amp; Experimental TCN Status
              </h2>
              <p className="text-xs text-slate-500">
                Role of the Temporal Convolutional Network (TCN) in sequence evaluation.
              </p>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            OcuTrack employs a Temporal Convolutional Network (TCN) designed for evaluating
            multi-timescale sequence dynamics in pupil recovery and smooth-pursuit trajectories.
          </p>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold text-slate-900">
                Current Model Status: Experimental
              </span>
              <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-slate-300 text-slate-800">
                TCN-Temporal-Evaluator-v0.1
              </span>
            </div>
            <p className="leading-relaxed text-slate-600">
              The neural network sequence model outputs trajectory consistency indices for research
              comparison. It has not undergone clinical trial validation. In compliance with project
              guidelines, model outputs are explicitly labelled as experimental and are never
              translated into clinical probabilities.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Data Governance */}
      <Card>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center">
              <Lock className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Privacy, De-Identification &amp; Ephemeral Retention
              </h2>
              <p className="text-xs text-slate-500">
                Protection of participant privacy and research data handling standards.
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
            <p>OcuTrack implements privacy-by-design principles:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-1 text-slate-700">
              <li>
                <strong>Pseudonymous Identifiers:</strong> Only synthetic research codes (e.g.,{' '}
                <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">
                  OT-0001
                </code>
                ) and approximate age bands are collected. No names, phone numbers, or direct
                personal health information (PHI) are recorded.
              </li>
              <li>
                <strong>Explicit Consent Gate:</strong> Recording cannot proceed without an
                affirmative confirmation of informed participant consent.
              </li>
              <li>
                <strong>Ephemeral Video Retention:</strong> Video recordings are streamed securely
                to the private backend processing container, analyzed for feature extraction, and
                deleted by default immediately following analysis completion.
              </li>
              <li>
                <strong>No Third-Party Analytics:</strong> Raw video blobs and biometric time-series
                are never transmitted to third-party ad networks or tracking services.
              </li>
            </ul>
            <p className="pt-1">
              Review the full{' '}
              <Link to="/privacy" className="text-sky-800 hover:underline font-medium">
                Privacy Policy
              </Link>{' '}
              and{' '}
              <Link to="/terms" className="text-sky-800 hover:underline font-medium">
                Terms and Conditions
              </Link>
              .
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Footer Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 text-xs">
        <Link
          to="/"
          className="text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 font-medium"
        >
          &larr; Return to Workspace Dashboard
        </Link>
        <div className="flex items-center gap-4">
          <Link
            to="/patients"
            className="text-sky-800 hover:text-sky-900 font-semibold inline-flex items-center gap-1"
          >
            Open Patient Registry &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AboutLimitationsPage;
