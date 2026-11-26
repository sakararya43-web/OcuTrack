export interface TechnicalParameter {
  label: string;
  value: string;
  unit?: string;
  note?: string;
}

export interface ProtocolSection {
  id: string;
  title: string;
  category: 'Access' | 'Registry' | 'Capture Setup' | 'Instrumentation' | 'Clinical Review' | 'Governance';
  routeKey: string;
  description: string;
  parameters: TechnicalParameter[];
  checklist: string[];
  referenceStandard: string;
  routeMatch: (pathname: string) => boolean;
}

export interface TroubleshootingCard {
  id: string;
  question: string;
  cause: string;
  remedy: string[];
  tags: string[];
}

export const CLINICAL_PROTOCOLS: ProtocolSection[] = [
  {
    id: 'protocol-login',
    title: 'Hospital Staff Authentication & Evaluator Fast-Track',
    category: 'Access',
    routeKey: '/login',
    description:
      'Governs authorized clinical personnel and community health screener authentication. Evaluators may utilize instantaneous fast-track bypass to evaluate without database credentials.',
    parameters: [
      { label: 'Security Model', value: 'Pseudonymous Staff Identity & Supabase Auth' },
      { label: 'Persistence Key', value: 'ocutrack_staff_session in browser storage' },
      { label: 'Supported Roles', value: 'Supervising Clinician, Community Health Worker' },
      { label: 'Fast-Track Bypass', value: 'Active (Pre-configured clinical credentials)' },
    ],
    checklist: [
      'Confirm clinical facility code matches authorized testing ward or mobile field station.',
      'Ensure role selection reflects screening responsibility (Clinician vs Community Screener).',
      'For hackathon and evaluation access, select One-Click Demo Staff Login bypass.',
      'Acknowledge investigational, non-diagnostic prototype scope upon entry.',
    ],
    referenceStandard: 'OcuTrack Access Protocol 1.2 (HIPAA pseudonymous proxy guideline)',
    routeMatch: (pathname) => pathname === '/login',
  },
  {
    id: 'protocol-dashboard',
    title: 'Clinical Workspace & Triage Navigation',
    category: 'Registry',
    routeKey: '/',
    description:
      'Central coordination workspace for tracking active patient rosters, initiating calibrated test sessions, and monitoring longitudinal attention queues.',
    parameters: [
      { label: 'Protocol ID', value: 'ocutrack-protocol-0.1' },
      { label: 'Sync Mechanism', value: '30-second automated backend health heartbeat' },
      { label: 'Registry Mode', value: 'Pseudonymous identifiers without PII storage' },
      { label: 'Flagging Engine', value: 'Quality check thresholds & intra-individual deltas' },
    ],
    checklist: [
      'Verify backend API status beacon indicates Connected (teal beacon) before screening.',
      'Review Attention Priority count for patient records showing longitudinal feature shift.',
      'Confirm browser ambient environment has stable illumination before initiating tests.',
      'Use quick search to pull existing pseudonymous records before creating duplicates.',
    ],
    referenceStandard: 'Standard Triage Practice SOP-001 (Community Neuro-Ophthalmic Screening)',
    routeMatch: (pathname) => pathname === '/' || pathname === '/dashboard',
  },
  {
    id: 'protocol-patients',
    title: 'Pseudonymous Patient Profiles & Baseline Tracking',
    category: 'Registry',
    routeKey: '/patients',
    description:
      'Management of pseudonymous patient records, explicit consent capture, and historical longitudinal ocular measurement trajectories.',
    parameters: [
      { label: 'Identifier Standard', value: 'Pseudonymous alphanumeric format (e.g. PT-2026-0812)' },
      { label: 'Consent States', value: 'Granted, Denied, Withdrawn, Not Recorded' },
      { label: 'Baseline Anchor', value: 'Initial acceptable quality session per battery type' },
      { label: 'Longitudinal View', value: 'Intra-individual percent change tracking over time' },
    ],
    checklist: [
      'Never input real names, national identity numbers, or contact details into ID fields.',
      'Verify explicit patient informed consent is documented prior to optical recording.',
      'Confirm patient has at least one baseline test before evaluating comparative deltas.',
      'Inspect historical visit trajectory charts to evaluate measurement consistency across dates.',
    ],
    referenceStandard: 'ISO/TR 24971 Medical Device Risk Management (Pseudonymization Guidelines)',
    routeMatch: (pathname) => pathname.startsWith('/patients'),
  },
  {
    id: 'protocol-assessment-new',
    title: 'Test Battery Configuration & Environmental Pre-Flight',
    category: 'Capture Setup',
    routeKey: '/assessments/new',
    description:
      'Pre-flight setup protocol for configuring ocular measurement sessions: selecting test batteries, verifying lighting, and positioning patient.',
    parameters: [
      { label: 'Available Batteries', value: 'Pupil Light Reflex, Smooth Pursuit, Combined' },
      { label: 'Ambient Lux', value: 'Diffuse daylight or indoor bulb (CLAHE low-light lift enabled)' },
      { label: 'Capture Hardware', value: 'Basic webcam or budget smartphone (≥ 320×240 QVGA; 480p recommended)' },
      { label: 'Required FPS', value: '8–30 FPS adaptive (8 FPS rural-clinic floor; 24–30 FPS ideal)' },
    ],
    checklist: [
      'Select registered pseudonymous patient from roster.',
      'Choose indicated test battery (Pupil Light Reflex for autonomic/parasympathetic, Smooth Pursuit for ocular kinematics).',
      'Ensure room lights are indirect; close window blinds to eliminate sunlight reflections.',
      'Position display directly perpendicular to subject eye level.',
    ],
    referenceStandard: 'Ophthalmic Optical Capture Protocol SOP-004',
    routeMatch: (pathname) => pathname === '/assessments/new',
  },
  {
    id: 'protocol-pupil-test',
    title: 'Standardized Pupillary Light Reflex (PLR) Protocol',
    category: 'Instrumentation',
    routeKey: '/pupil-test',
    description:
      'Quantitative 5-stage optical protocol tracking pupillary constriction dynamics following a standardized full-screen photic stimulus flash.',
    parameters: [
      { label: 'Subject Distance', value: '45-60 cm from webcam lens' },
      { label: 'Dark Adaptation', value: '5.0 seconds baseline recording' },
      { label: 'Stimulus Flash', value: 'Full-screen white flash at 5.0 s (approx. 0.8 s duration)' },
      { label: 'Constriction Window', value: '10.0 seconds optical recovery monitoring' },
      { label: 'Sampling Frequency', value: '8–30 FPS adaptive (rural-clinic compatible)' },
    ],
    checklist: [
      'Position subject face centered inside the onscreen guide oval.',
      'Ensure both pupils are unobstructed by eyelids, heavy eyelashes, or glasses frames.',
      'Instruct subject to fixate on the screen center and avoid head turning.',
      'Warn subject that screen will flash brightly at 5 seconds; subject must resist blinking.',
      'Maintain steady capture through the full 15-second duration until automatic finalization.',
    ],
    referenceStandard: 'Standardized Pupil Light Reflex Guidelines (International Neuro-Ophthalmology)',
    routeMatch: (pathname) => pathname.startsWith('/pupil-test'),
  },
  {
    id: 'protocol-pursuit-test',
    title: 'Horizontal Smooth-Pursuit Kinematics Protocol',
    category: 'Instrumentation',
    routeKey: '/pursuit-test',
    description:
      'Continuous eye-tracking protocol assessing ocular smooth-pursuit kinematics and gaze velocity alignment across calibrated sinusoidal sweeps.',
    parameters: [
      { label: 'Viewing Distance', value: '50-60 cm perpendicular to monitor' },
      { label: 'Stimulus Trajectory', value: 'Horizontal sinusoidal sweep (0.2-0.4 Hz)' },
      { label: 'Sweeping Velocity', value: '15-30 deg/sec visual angle' },
      { label: 'Target Morphology', value: 'High-contrast clinical fixation point (teal reticle)' },
      { label: 'Sampling Requirement', value: '≥ 8 FPS adaptive (≥ 15 FPS recommended)' },
    ],
    checklist: [
      'Seat subject with head stationary and chin level.',
      'Instruct subject to track the moving circle using eyes only, without moving head or neck.',
      'Ensure no overhead lamps create specular glare spots on the cornea.',
      'Verify subject tracking follows the reticle continuously across the full horizontal sweep.',
    ],
    referenceStandard: 'Visual Kinematic Assessment Standard SOP-008',
    routeMatch: (pathname) => pathname.startsWith('/pursuit-test'),
  },
  {
    id: 'protocol-reports',
    title: 'Feature Extraction & Longitudinal Delta Interpretation',
    category: 'Clinical Review',
    routeKey: '/reports',
    description:
      'Comprehensive report interface displaying extracted ocular parameters, within-session TCN temporal results, and intra-individual baseline percent changes.',
    parameters: [
      { label: 'Baseline Diameter', value: 'Mean resting pupil diameter during pre-flash window (mm)' },
      { label: 'Minimum Diameter', value: 'Peak constriction trough diameter reached (mm)' },
      { label: 'Constriction Velocity', value: 'Maximum rate of pupil diameter narrowing (mm/s)' },
      { label: 'Constriction Latency', value: 'Time from stimulus flash onset to constriction start (ms)' },
      { label: 'Quality Criterion', value: 'Acceptable when usable eye frame ratio >= 60% (ideal >= 80%)' },
    ],
    checklist: [
      'Inspect Recording Quality status: do not base review on "Insufficient Quality" captures.',
      'Review Baseline Comparison table: observe percent change deltas (FR-22) vs historical reference.',
      'Evaluate Temporal Convolutional Network (TCN) multi-frame kinematics curve.',
      'Export CSV or print structured summary for institutional record keeping.',
      'Strict clinical reminder: measurements support clinical review and are non-diagnostic.',
    ],
    referenceStandard: 'Clinical Report Generation Specification SOP-012',
    routeMatch: (pathname) => pathname.startsWith('/reports') || pathname.startsWith('/processing'),
  },
  {
    id: 'protocol-clinic-overview',
    title: 'Clinic-Wide Triage & Capture Quality Monitoring',
    category: 'Governance',
    routeKey: '/clinic-overview',
    description:
      'Collective administrative telemetry dashboard enabling clinical leads to track assessment volume, capture quality pass rates, and review queues without cross-patient pupil averaging.',
    parameters: [
      { label: 'Target Pass Rate', value: '>= 90% acceptable captures across clinic units' },
      { label: 'Longitudinal Cohort', value: 'Patients with 2 or more comparable test sessions' },
      { label: 'Triage Queue', value: 'Assessments flagged with "Change detected" status' },
      { label: 'Data Segregation', value: 'Real backend records with opt-in sample dataset toggle' },
    ],
    checklist: [
      'Review daily Attention Priority Queue for patients exhibiting significant baseline shifts.',
      'Investigate root causes for any dips in Recording Quality pass rate (lighting, motion).',
      'Schedule follow-up repeat measurements for flagged patients to verify repeatability.',
      'Audit community health worker screening cadence across wards.',
    ],
    referenceStandard: 'Clinic Quality Assurance & Triage SOP-015',
    routeMatch: (pathname) => pathname.startsWith('/clinic-overview'),
  },
  {
    id: 'protocol-about',
    title: 'System Methodology, Boundaries & Regulatory Transparency',
    category: 'Governance',
    routeKey: '/about',
    description:
      'Core documentation defining the scientific rationale for intra-individual baseline monitoring, computer vision extraction pipeline, and non-diagnostic boundaries.',
    parameters: [
      { label: 'Regulatory Classification', value: 'Investigational Clinical Decision Support Tool' },
      { label: 'Raw Video Retention', value: 'Zero permanent storage (raw video deleted post-extraction)' },
      { label: 'Diagnostic Claims', value: 'Strictly prohibited: no disease identification claims' },
      { label: 'Auditing Framework', value: 'Open mathematical extraction and telemetry inspection' },
    ],
    checklist: [
      'Ensure all clinic personnel understand OcuTrack is not an autonomous diagnostic device.',
      'Verify patients understand raw video is processed in memory and promptly discarded.',
      'Refer to /limitations for complete regulatory and sensor boundary disclosures.',
    ],
    referenceStandard: 'FDA Guidance on Clinical Decision Support Software (2022) Compliance Architecture',
    routeMatch: (pathname) => pathname.startsWith('/about') || pathname.startsWith('/limitations') || pathname.startsWith('/privacy') || pathname.startsWith('/terms'),
  },
];

export const TROUBLESHOOTING_ITEMS: TroubleshootingCard[] = [
  {
    id: 'trouble-camera',
    question: 'Camera permission denied or video device not detected',
    cause:
      'Browser permissions have blocked webcam access, or another application (such as Zoom, Microsoft Teams, or Meet) is currently locking the video hardware.',
    remedy: [
      'Click the site security / lock icon located on the left side of your browser URL bar.',
      'Locate "Camera" permissions and explicitly change the state to "Allow".',
      'Verify no background video conferencing applications are holding the camera device.',
      'Reload the browser tab and re-initiate assessment setup.',
    ],
    tags: ['Camera', 'Permissions', 'Hardware', 'Browser'],
  },
  {
    id: 'trouble-quality',
    question: 'Why was my recording marked "Insufficient Recording Quality"?',
    cause:
      'OcuTrack is optimized for rural clinics (accepting ≥ 320×240, ≥ 8 FPS, and ≥ 60% usable frames with low-light enhancement). However, unreadable/empty video streams, extreme darkness where pupils are invisible, < 8 FPS freezes, or severe motion blur will still trigger a quality flag.',
    remedy: [
      'Check subject distance: reposition face between 45-60 cm from the camera.',
      'Instruct the subject not to talk, squint, or turn their head during the capture countdown.',
      'Adjust room lighting: switch off direct spotlights behind the subject and turn on indirect front illumination.',
      'For subjects with reflective glasses, tilt glasses slightly down or adjust screen angle to remove specular reflections.',
    ],
    tags: ['Quality', 'Lighting', 'Blinking', 'Positioning'],
  },
  {
    id: 'trouble-lighting',
    question: 'Comparing visits across different ambient lighting conditions',
    cause:
      'Resting pupil diameter is fundamentally dependent on ambient photon flux. If visit 1 was captured in a dark room and visit 2 under harsh sunlight, resting diameter will vary due to ambient light rather than autonomic physiology.',
    remedy: [
      'Standardize the capture location: perform all assessments in a dedicated screening room.',
      'Maintain uniform indirect room lighting (approximately 300 to 500 lux).',
      'Avoid placing the screening terminal directly opposite an exterior window with changing sunlight.',
      'Ensure the subject has spent at least 2 minutes in the room prior to recording to stabilize adaptation.',
    ],
    tags: ['Illumination', 'Baseline', 'Longitudinal', 'Lux'],
  },
  {
    id: 'trouble-delta',
    question: 'How are personal baseline deltas calculated and interpreted?',
    cause:
      'Population pupil size distributions have wide standard deviations. Comparing an individual against a global mean creates high false positive rates.',
    remedy: [
      'OcuTrack calculates delta percentage as: ((Follow-Up Metric - Baseline Metric) / Baseline Metric) * 100%.',
      'The patient acts as their own physiological reference control across longitudinal visits.',
      'A feature change warning is triggered only when metrics shift significantly beyond normal diurnal variance.',
      'Always confirm that recording quality for both the baseline and follow-up session is marked "Acceptable".',
    ],
    tags: ['Delta', 'Baseline', 'Calculation', 'Math'],
  },
  {
    id: 'trouble-privacy',
    question: 'Why does OcuTrack use pseudonymous patient IDs instead of names?',
    cause:
      'Facial video and biometric eye-tracking telemetry constitute sensitive health data. Storing direct identifiers creates compliance vulnerabilities.',
    remedy: [
      'OcuTrack adopts a Privacy-by-Design approach using random or alphanumeric pseudonyms (e.g. PT-2026-0812).',
      'The clinic maintains its internal master patient index separately from the OcuTrack database.',
      'Raw video streams are processed in temporary memory for mathematical feature extraction and deleted post-upload.',
      'All stored records contain only extracted telemetry coordinates and numerical scalar features.',
    ],
    tags: ['Privacy', 'HIPAA', 'Pseudonym', 'Security'],
  },
];
