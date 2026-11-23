import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Info,
  CheckCircle2,
  XCircle,
  Camera,
  Activity,
  GitCompare,
  Lock,
  UserCheck,
  Stethoscope,
  ChevronRight,
} from 'lucide-react';
import { PROTOCOL_VERSION, NON_DIAGNOSTIC_DISCLAIMER } from '../lib/constants';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { OpticalPupilLoader } from '../components/common/OpticalPupilLoader';
import { ScrollReveal, StaggerContainer, StaggerItem, AnimatedPLRPath, PulseIndicator } from '../components/motion';

interface PipelineStepDetail {
  number: string;
  title: string;
  shortDesc: string;
  fullDesc: string;
  technology: string;
  parameters: string[];
  qualityControl: string;
}

const PIPELINE_STEPS: PipelineStepDetail[] = [
  {
    number: '01',
    title: 'Standardized Capture',
    shortDesc: 'Browser-based video recording under a documented illumination protocol.',
    fullDesc:
      'Video is captured directly through standard webcam hardware using HTML5 MediaDevices at 30 frames per second. The 15-second protocol includes a 5-second baseline dark adaptation phase, a calibrated diffuse screen stimulus flash at second 5, and a 10-second pupil recovery period, or horizontal sinusoidal smooth-pursuit target tracking.',
    technology: 'WebRTC MediaStream Recording API (WebM/MP4, VP8/H.264)',
    parameters: [
      'Duration: 15.0 seconds per modality',
      'Target Frame Rate: 30 FPS (33.3 ms sampling interval)',
      'Illumination: Uniform diffuse ambient room lighting',
      'Stimulus: Full-screen white flash at T=5.0s',
    ],
    qualityControl:
      'Real-time face detection, head motion bounds checking, and illumination constancy monitoring before video acceptance.',
  },
  {
    number: '02',
    title: 'Computer Vision Extraction',
    shortDesc: 'MediaPipe Face Landmarker localization and OpenCV pupil and pursuit tracking.',
    fullDesc:
      'MediaPipe extracts 478 3D facial landmarks with dedicated eye contour sub-meshes. OpenCV applies sub-pixel thresholding, ellipse contour fitting, and iris-diameter normalization to convert pixel coordinates into millimeter-calibrated pupil diameters and gaze position trajectories.',
    technology: 'MediaPipe Face Landmarker v2 + OpenCV 4.x Sub-Pixel Contour Fitting',
    parameters: [
      'Eye Contour Landmarks: 71 points per ocular region',
      'Pupil Center Resolution: Sub-pixel ellipse fitting',
      'Iris Diameter Normalization: Standard human anatomical mean (11.7 mm)',
      'Gaze Angle Estimation: Vector from eye center to corneal reflection',
    ],
    qualityControl:
      'Automated usable frame ratio evaluation. Sessions with usable frame ratio below 70% are flagged as insufficient.',
  },
  {
    number: '03',
    title: 'Within-Session Temporal Analysis',
    shortDesc: 'Experimental PyTorch TCN sequence analysis compared against a transparent statistical baseline.',
    fullDesc:
      'Extracted time series are evaluated across two complementary analytical paths: a deterministic statistical baseline measuring latency, velocity, and amplitude; and an experimental Temporal Convolutional Network (TCN) with dilated causal convolutions for multi-timescale sequence dynamics.',
    technology: 'PyTorch Temporal Convolutional Network (TCN) + NumPy / SciPy Signal Processing',
    parameters: [
      'Constriction Latency: Milliseconds from stimulus onset to initial velocity inflection',
      'Peak Constriction Velocity: Maximum negative rate of diameter change (mm/s)',
      'Constriction Amplitude: Percentage reduction relative to baseline diameter',
      'Pursuit Velocity Gain: Ratio of gaze velocity to moving target velocity',
    ],
    qualityControl:
      'Deterministic algorithmic outputs are prioritized. TCN neural network inferences are clearly tagged as experimental.',
  },
  {
    number: '04',
    title: 'Longitudinal Baseline Comparison',
    shortDesc: 'Comparing current visits against the individual\'s own prior accepted baseline.',
    fullDesc:
      'Rather than relying on uncalibrated cross-sectional population distributions, OcuTrack calculates feature-level differences against the participant\'s verified baseline. Standardized z-scores and percentage changes highlight individual trajectory shifts across longitudinal checkups.',
    technology: 'Longitudinal Trajectory Comparison Engine (Euclidean Delta + Standardized Deviation)',
    parameters: [
      'Baseline Anchor: Earliest clinician-verified assessment',
      'Feature Deltas: Absolute difference and percentage delta per parameter',
      'Change Significance: Parameter drift compared against within-subject variance',
      'Visual Reporting: Interactive time-series trajectory charts',
    ],
    qualityControl:
      'Clinicians retain manual control to designate, update, or re-evaluate the baseline assessment at any time.',
  },
];

export const AboutPage: React.FC = () => {
  const [selectedStage, setSelectedStage] = useState<number>(0);
  const [imageError, setImageError] = useState<boolean>(false);

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-12">
      {/* 1. Clinical Purpose Header */}
      <ScrollReveal className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="teal">
            <Activity className="w-3.5 h-3.5" aria-hidden="true" />
            Clinical Architecture &amp; Methodology
          </Badge>
          <span className="text-xs font-mono text-slate-500">Protocol v{PROTOCOL_VERSION}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
          Addressing the Attention Bottleneck in Community Health
        </h1>

        <p className="text-base sm:text-lg text-slate-700 leading-relaxed max-w-4xl">
          In rural clinics and community health centers, specialized neuro-ophthalmic equipment is
          often inaccessible, creating a persistent diagnostic bottleneck. OcuTrack provides a
          standardized, browser-based measurement protocol that empowers frontline health workers
          to capture reliable, repeatable ocular kinematics and track personal longitudinal baselines
          over time.
        </p>

        {/* Why Personal Baseline Monitoring Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <div className="bg-white border border-slate-200 rounded-md p-5 space-y-2">
            <div className="w-8 h-8 rounded bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center">
              <Camera className="w-4 h-4" aria-hidden="true" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">Accessible Webcam Protocol</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Eliminates the need for costly specialized pupillometers by using standard webcams with
              strict illumination and face alignment verification.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-md p-5 space-y-2">
            <div className="w-8 h-8 rounded bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
              <GitCompare className="w-4 h-4" aria-hidden="true" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">Personal-Baseline Paradigm</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Individuals exhibit natural physiological variance. Comparing a patient to their own
              confirmed baseline is clinically superior to noisy population averages.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-md p-5 space-y-2">
            <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center">
              <Lock className="w-4 h-4" aria-hidden="true" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">Privacy by Design</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Zero biometric face videos retained by default. Records rely solely on synthetic
              pseudonymous IDs and extracted time-series measurements.
            </p>
          </div>
        </div>
      </ScrollReveal>

      {/* Mandatory Non-Diagnostic Disclaimer Box */}
      <ScrollReveal delay={0.1}>
        <div className="bg-slate-900 text-slate-100 rounded-md p-6 space-y-3 border border-slate-800">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1">
              <span className="text-xs font-mono uppercase tracking-wider text-teal-300">
                Regulatory Guardrail
              </span>
              <h2 className="text-base font-bold text-white tracking-tight">
                Investigational Prototype: Non-Diagnostic Clinical Research Tool
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {NON_DIAGNOSTIC_DISCLAIMER}
              </p>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* 2. Authentic Visual Context & User Profile Breakdown */}
      <ScrollReveal delay={0.15} className="space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Clinical Deployment &amp; Frontline Roles
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Engineered for seamless collaboration between frontline community screeners and
            supervising medical clinicians.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Authentic Clinical Photography Container */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="relative rounded-md border border-slate-200 bg-slate-100 overflow-hidden flex-1 flex flex-col">
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-200">
                {!imageError ? (
                  <img
                    src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80"
                    alt="Healthcare clinician reviewing objective biometric data on a tablet in a clinical consultation room"
                    onError={() => setImageError(true)}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  /* High-Fidelity SVG Schematic Fallback for Offline / Error States */
                  <div className="w-full h-full bg-slate-900 p-6 flex flex-col justify-between text-slate-300">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                      <span>SCHEMATIC: STANDARDIZED CLINICAL ENVIRONMENT</span>
                      <span className="text-teal-400">STATUS: CALIBRATED</span>
                    </div>
                    <div className="flex items-center justify-center py-4">
                      <OpticalPupilLoader size="lg" label="Calibrated Optical Capture Setup" />
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 text-center">
                      Webcam Focal Distance: 45-60 cm | Ambient Lux: 300-500 lm | Diffuse White Stimulus
                    </div>
                  </div>
                )}

                {/* Subtle Overlaid Badge */}
                <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white px-2.5 py-1 rounded text-[11px] font-mono border border-slate-700">
                  Clinical Setting: Community Assessment
                </div>
              </div>

              {/* Cool Slate Caption Bar */}
              <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                <span>Figure 1: Standardized browser recording during community health screening.</span>
                <span className="font-mono text-[11px] text-slate-500">ISO 9001 Protocol</span>
              </div>
            </div>
          </div>

          {/* User Profile Cards */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Role 1: Community Health Worker */}
            <div className="bg-white border border-slate-200 rounded-md p-5 space-y-3 flex-1">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Community Health Worker</h3>
                  <span className="text-xs text-slate-500">Primary Screener &amp; Capture Lead</span>
                </div>
              </div>
              <ul className="text-xs text-slate-700 space-y-1.5 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <span className="text-teal-700 font-bold">&bull;</span>
                  <span>Guides participant through informed consent and pseudonym assignment.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-teal-700 font-bold">&bull;</span>
                  <span>Verifies diffuse room illumination and steady 50 cm participant distance.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-teal-700 font-bold">&bull;</span>
                  <span>Administers light reflex and smooth-pursuit video recording protocols.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-teal-700 font-bold">&bull;</span>
                  <span>Reviews automated frame usability score prior to backend submission.</span>
                </li>
              </ul>
            </div>

            {/* Role 2: Supervising Clinician */}
            <div className="bg-white border border-slate-200 rounded-md p-5 space-y-3 flex-1">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center">
                  <Stethoscope className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Supervising Clinician</h3>
                  <span className="text-xs text-slate-500">Neurologist / Primary Care Physician</span>
                </div>
              </div>
              <ul className="text-xs text-slate-700 space-y-1.5 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <span className="text-sky-700 font-bold">&bull;</span>
                  <span>Reviews extracted quantitative latency, velocity, and pursuit gains.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-sky-700 font-bold">&bull;</span>
                  <span>Inspects multi-session longitudinal delta trends against baseline.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-sky-700 font-bold">&bull;</span>
                  <span>Designates or updates accepted patient baseline references.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-sky-700 font-bold">&bull;</span>
                  <span>Makes clinical decisions regarding in-person referral or management.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* 3. Interactive Pipeline Architecture Walkthrough */}
      <ScrollReveal delay={0.2} className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Interactive 4-Stage Pipeline Architecture
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              From raw browser video capture to calibrated longitudinal trajectory evaluation. Click any
              stage to inspect engineering parameters.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">
            Selected: Stage {PIPELINE_STEPS[selectedStage].number} of 04
          </span>
        </div>

        {/* 4 Pipeline Step Navigation Cards */}
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PIPELINE_STEPS.map((step, idx) => {
            const isSelected = selectedStage === idx;
            return (
              <StaggerItem key={step.number}>
                <button
                  type="button"
                  onClick={() => setSelectedStage(idx)}
                  className={`w-full text-left p-4 rounded-md border transition-all duration-150 ease-out active:scale-[0.98] ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
                        isSelected
                          ? 'bg-teal-500 text-slate-950'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      STAGE {step.number}
                    </span>
                    {isSelected && (
                      <PulseIndicator status="active" />
                    )}
                  </div>
                  <h3 className={`text-sm font-bold tracking-tight ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                    {step.title}
                  </h3>
                  <p className={`text-xs mt-1 line-clamp-2 ${isSelected ? 'text-slate-300' : 'text-slate-600'}`}>
                    {step.shortDesc}
                  </p>
                </button>
              </StaggerItem>
            );
          })}
        </StaggerContainer>

        {/* Detailed Stage Interactive Breakdown Card */}
        <Card className="border-slate-300">
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-sky-800">
                    STAGE {PIPELINE_STEPS[selectedStage].number} ARCHITECTURE
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  {PIPELINE_STEPS[selectedStage].title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
                  {PIPELINE_STEPS[selectedStage].fullDesc}
                </p>
              </div>

              {/* Concentric Aperture or Telemetry Waveform Graphic */}
              <div className="w-full sm:w-auto flex items-center justify-center bg-slate-50 border border-slate-200 rounded-md p-3">
                {selectedStage === 0 && (
                  <div className="flex items-center gap-3">
                    <Camera className="w-6 h-6 text-sky-700" aria-hidden="true" />
                    <div className="text-xs font-mono text-slate-700">
                      <div>MediaStream</div>
                      <div className="text-teal-700 font-bold">30 FPS | 15s</div>
                    </div>
                  </div>
                )}
                {selectedStage === 1 && (
                  <div className="flex items-center gap-2">
                    <OpticalPupilLoader size="sm" />
                    <div className="text-xs font-mono text-slate-700">
                      <div>MediaPipe + CV</div>
                      <div className="text-sky-700 font-bold">Sub-pixel fit</div>
                    </div>
                  </div>
                )}
                {selectedStage === 2 && (
                  <div className="w-48">
                    <AnimatedPLRPath variant="reflex" className="w-full" />
                  </div>
                )}
                {selectedStage === 3 && (
                  <div className="flex items-center gap-3">
                    <GitCompare className="w-6 h-6 text-teal-700" aria-hidden="true" />
                    <div className="text-xs font-mono text-slate-700">
                      <div>Delta Engine</div>
                      <div className="text-teal-700 font-bold">Delta &amp; % Delta</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Technical Specifications Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-2">
                <span className="font-semibold text-slate-900 uppercase tracking-wider block">
                  Core Implementation &amp; Stack
                </span>
                <div className="p-3 bg-slate-50 rounded border border-slate-200 font-mono text-slate-800">
                  {PIPELINE_STEPS[selectedStage].technology}
                </div>

                <span className="font-semibold text-slate-900 uppercase tracking-wider block pt-2">
                  Quality Control Safeguard
                </span>
                <div className="p-3 bg-teal-50/50 rounded border border-teal-200 text-slate-800 leading-relaxed">
                  {PIPELINE_STEPS[selectedStage].qualityControl}
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-semibold text-slate-900 uppercase tracking-wider block">
                  Calibrated Parameters &amp; Targets
                </span>
                <ul className="space-y-2">
                  {PIPELINE_STEPS[selectedStage].parameters.map((param, pIdx) => (
                    <li
                      key={pIdx}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded font-mono text-slate-700 flex items-start gap-2"
                    >
                      <span className="text-teal-700 font-bold">&bull;</span>
                      <span>{param}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </ScrollReveal>

      {/* 4. Clinical Safety, Limitations & Privacy Grid */}
      <ScrollReveal delay={0.25} className="space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Clinical Safety, Boundaries &amp; Data Privacy
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Explicit demarcation of analytical scope versus clinical diagnostic restrictions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Column 1: What OcuTrack Supports */}
          <div className="bg-teal-50/40 border border-teal-200 rounded-md p-6 space-y-4">
            <div className="flex items-center gap-2.5 text-teal-900 font-bold text-base">
              <CheckCircle2 className="w-5 h-5 text-teal-700 flex-shrink-0" aria-hidden="true" />
              <span>What OcuTrack Supports</span>
            </div>

            <ul className="text-xs text-slate-800 space-y-3 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-teal-700 font-bold text-sm">&bull;</span>
                <div>
                  <strong className="text-slate-900">Standardized Kinematic Extraction:</strong>{' '}
                  Measures constriction latency (ms), constriction velocity (mm/s), constriction
                  amplitude (%), and smooth-pursuit gain.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-700 font-bold text-sm">&bull;</span>
                <div>
                  <strong className="text-slate-900">Automated Usability Gating:</strong> Rejects or
                  flags recordings with inadequate usable frame ratios, excessive head rotation, or
                  sub-threshold lighting.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-700 font-bold text-sm">&bull;</span>
                <div>
                  <strong className="text-slate-900">Longitudinal Baseline Delta Visibility:</strong>{' '}
                  Computes delta changes against the individual participant&apos;s established
                  reference across serial appointments.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-700 font-bold text-sm">&bull;</span>
                <div>
                  <strong className="text-slate-900">Structured Data Export:</strong> Generates CSV
                  and formatted summary reports for electronic health record documentation.
                </div>
              </li>
            </ul>
          </div>

          {/* Column 2: What OcuTrack Does NOT Conclude */}
          <div className="bg-rose-50/40 border border-rose-200 rounded-md p-6 space-y-4">
            <div className="flex items-center gap-2.5 text-rose-900 font-bold text-base">
              <XCircle className="w-5 h-5 text-rose-700 flex-shrink-0" aria-hidden="true" />
              <span>What OcuTrack Does NOT Conclude</span>
            </div>

            <ul className="text-xs text-slate-800 space-y-3 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-rose-700 font-bold text-sm">&bull;</span>
                <div>
                  <strong className="text-slate-900">No Disease Diagnosis:</strong> Does NOT diagnose
                  Parkinson&apos;s disease, concussion, traumatic brain injury, diabetic neuropathy,
                  or multiple sclerosis.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-700 font-bold text-sm">&bull;</span>
                <div>
                  <strong className="text-slate-900">No Clinician Replacement:</strong> Does NOT
                  replace a comprehensive ophthalmic, neurological, or general clinical examination.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-700 font-bold text-sm">&bull;</span>
                <div>
                  <strong className="text-slate-900">Ephemeral Video Storage:</strong> Raw webcam
                  video files are processed in private memory and permanently deleted by default
                  following extraction.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-700 font-bold text-sm">&bull;</span>
                <div>
                  <strong className="text-slate-900">Strictly Pseudonymous Records:</strong> Only
                  synthetic research IDs (e.g. OT-0001) and coarse age bands are retained. Direct PHI
                  is never recorded.
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Deep Link to Limitations Page */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-md flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <Info className="w-4 h-4 text-sky-700" aria-hidden="true" />
            <span>
              For comprehensive hardware sampling limits, TCN mathematical formulation, and regulatory
              standards:
            </span>
          </div>
          <Link
            to="/limitations"
            className="inline-flex items-center gap-1 font-semibold text-sky-800 hover:text-sky-900 hover:underline"
          >
            Detailed Technical Limitations Page
            <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>
      </ScrollReveal>

      {/* Navigation Footer CTAs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200 text-xs">
        <Link
          to="/"
          className="text-slate-600 hover:text-slate-900 font-medium inline-flex items-center gap-1"
        >
          &larr; Return to Workspace Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <Link
            to="/assessments/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 active:scale-[0.98] rounded-md shadow-sm transition-all duration-150 ease-out"
          >
            Start New Assessment
            <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
