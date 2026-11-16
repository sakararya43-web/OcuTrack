export const APP_NAME = 'OcuTrack';
export const APP_TAGLINE = 'Browser-based ocular measurement & longitudinal monitoring prototype';

export const PROTOCOL_VERSION = 'ocutrack-protocol-0.1';

export const NON_DIAGNOSTIC_DISCLAIMER =
  'Hackathon prototype — not a diagnostic device. OcuTrack provides quantitative ocular measurements for research and clinical review. It does not diagnose Parkinson’s disease, concussion, diabetic neuropathy, or any neurological condition.';

export const AGE_BANDS = [
  '18-29',
  '30-39',
  '40-49',
  '50-59',
  '60-69',
  '70+',
] as const;

export const STANDARD_REVIEW_MESSAGES = {
  QUALITY_ACCEPTABLE: 'Recording quality acceptable',
  QUALITY_INSUFFICIENT: 'Insufficient recording quality — repeat test',
  NO_NOTABLE_CHANGE: 'No notable change detected in measured features',
  CHANGE_DETECTED: 'Change detected — consider repeat measurement and clinical review',
  EXPERIMENTAL_OUTPUT: 'Experimental model output; not clinically validated',
  COMPARISON_UNAVAILABLE: 'Comparison unavailable — recordings are not sufficiently comparable',
} as const;
