import { AssessmentDetail, FeatureValue } from '../types/api';

export type SituationLevel = 'typical' | 'attention' | 'review' | 'retake';
export type Tone = 'good' | 'warn' | 'alert' | 'neutral';

export interface MetricInterpretation {
  plainLabel: string;
  plainMeaning: string;
  statusLabel: string;
  tone: Tone;
}

export interface PatientSituationSummary {
  level: SituationLevel;
  badgeText: string;
  headline: string;
  summaryText: string;
  highlights: { text: string; tone: Tone }[];
  recommendations: string[];
  disclaimerNote: string;
}

function getNumeric(features: Record<string, FeatureValue> | undefined, keys: string[]): number | null {
  if (!features) return null;
  for (const k of keys) {
    const val = features[k]?.value;
    if (typeof val === 'number' && Number.isFinite(val)) {
      return val;
    }
  }
  return null;
}

/**
 * Translates technical pupillometry & smooth-pursuit biometrics into plain,
 * non-diagnostic language with actionable follow-up steps for rural clinic staff & patients.
 */
export function buildPatientSituationSummary(assessment: AssessmentDetail): PatientSituationSummary {
  const isInsufficient =
    assessment.quality_status === 'insufficient' ||
    assessment.quality?.status === 'insufficient' ||
    assessment.pupil?.status === 'insufficient_quality' ||
    assessment.pursuit?.status === 'insufficient_quality';

  if (isInsufficient) {
    return {
      level: 'retake',
      badgeText: 'Retake Needed',
      headline: 'Video was not clear enough to evaluate the eyes safely',
      summaryText:
        'The camera recording could not capture enough clear eye frames. Do not use these numbers for decisions — please repeat the short recording.',
      highlights: [
        {
          text: `Recording usability was ${
            assessment.quality?.usable_frame_ratio != null
              ? `${(assessment.quality.usable_frame_ratio * 100).toFixed(0)}%`
              : 'too low'
          } (needs steady lighting and visible pupils).`,
          tone: 'alert',
        },
      ],
      recommendations: [
        'Seat the patient facing an open doorway, window, or even indoor lamp (avoid bright light behind their head).',
        'Rest the phone or laptop on a table or stack of books at eye level (~45 cm away) so it does not shake.',
        'Ask the patient to keep both eyes open and avoid talking during the 10–15 second capture.',
        'Repeat the assessment now before making any referral decision.',
      ],
      disclaimerNote:
        'Screening support only — OcuTrack does not diagnose medical conditions.',
    };
  }

  const pupilFeats = assessment.pupil?.features;
  const pursuitFeats = assessment.pursuit?.features;

  const baseDiam = getNumeric(pupilFeats, ['baseline_diameter']);
  const minDiam = getNumeric(pupilFeats, ['minimum_diameter']);
  const amp = getNumeric(pupilFeats, ['constriction_amplitude']);
  const latencySec = getNumeric(pupilFeats, ['response_latency_seconds']);
  const latencyMsDirect = getNumeric(pupilFeats, ['constriction_latency']);
  const latencyMs = latencyMsDirect ?? (latencySec !== null ? latencySec * 1000 : null);

  const trackingError = getNumeric(pursuitFeats, ['mean_tracking_error', 'rmse_error']);
  const continuity = getNumeric(pursuitFeats, ['tracking_continuity']);
  const saccades = getNumeric(pursuitFeats, ['corrective_movement_count', 'saccadic_intrusions']);
  const gain = getNumeric(pursuitFeats, ['tracking_gain']);

  const ampPct =
    baseDiam && baseDiam > 0 && amp !== null
      ? (amp / baseDiam) * 100
      : pupilFeats?.constriction_amplitude?.unit === '%' && amp !== null
      ? amp
      : null;

  const highlights: { text: string; tone: Tone }[] = [];
  let attentionFlags = 0;
  let reviewFlags = 0;

  // 1. Pupil reflex check
  if (ampPct !== null) {
    if (ampPct >= 15) {
      highlights.push({
        text: `Pupil narrowed clearly after the light flash (${ampPct.toFixed(0)}% size change) — healthy light response observed.`,
        tone: 'good',
      });
    } else if (ampPct >= 7) {
      attentionFlags++;
      highlights.push({
        text: `Pupil narrowed only mildly after the light flash (${ampPct.toFixed(0)}% change). Ambient room light may have been bright or response was subtle.`,
        tone: 'warn',
      });
    } else {
      reviewFlags++;
      highlights.push({
        text: `Minimal pupil reaction detected (${ampPct.toFixed(0)}% change) during the light flash.`,
        tone: 'alert',
      });
    }
  } else if (baseDiam !== null && minDiam !== null) {
    const drop = Math.max(0, baseDiam - minDiam);
    if (drop > 0.5) {
      highlights.push({
        text: `Pupil size narrowed from ${baseDiam.toFixed(1)} to ${minDiam.toFixed(1)} units during the flash.`,
        tone: 'good',
      });
    }
  }

  if (latencyMs !== null) {
    if (latencyMs >= 120 && latencyMs <= 420) {
      highlights.push({
        text: `Reaction speed to light was timely (${Math.round(latencyMs)} ms).`,
        tone: 'good',
      });
    } else if (latencyMs > 420 && latencyMs <= 650) {
      attentionFlags++;
      highlights.push({
        text: `Reaction to light started slightly slowly (${Math.round(latencyMs)} ms); note that lower-FPS cameras add ~50–100 ms timing step.`,
        tone: 'warn',
      });
    } else if (latencyMs > 650) {
      reviewFlags++;
      highlights.push({
        text: `Delayed pupil reaction time observed (${Math.round(latencyMs)} ms).`,
        tone: 'alert',
      });
    }
  }

  // 2. Smooth pursuit check
  if (continuity !== null) {
    const pct = Math.round(continuity * 100);
    if (pct >= 75) {
      highlights.push({
        text: `Eye tracking stayed locked on the target for ${pct}% of the test.`,
        tone: 'good',
      });
    } else if (pct >= 50) {
      attentionFlags++;
      highlights.push({
        text: `Eye tracking was intermittent (${pct}% tracked) — possibly due to blinking or head movement.`,
        tone: 'warn',
      });
    } else {
      reviewFlags++;
      highlights.push({
        text: `Eye tracking continuity was low (${pct}% tracked).`,
        tone: 'alert',
      });
    }
  }

  if (trackingError !== null) {
    if (trackingError <= 0.14) {
      highlights.push({
        text: `Gaze followed the moving dot closely (low average drift of ${(trackingError * 100).toFixed(0)}%).`,
        tone: 'good',
      });
    } else if (trackingError <= 0.25) {
      attentionFlags++;
      highlights.push({
        text: `Moderate gaze lag behind the moving dot (${(trackingError * 100).toFixed(0)}% average offset).`,
        tone: 'warn',
      });
    } else {
      reviewFlags++;
      highlights.push({
        text: `Large gaze offset from the moving dot (${(trackingError * 100).toFixed(0)}% average offset).`,
        tone: 'alert',
      });
    }
  }

  if (saccades !== null && saccades > 8) {
    attentionFlags++;
    highlights.push({
      text: `${Math.round(saccades)} quick catch-up eye jumps detected while following the moving dot.`,
      tone: 'warn',
    });
  }

  if (gain !== null) {
    if (gain >= 0.75 && gain <= 1.15) {
      highlights.push({
        text: `Eye speed matched target speed smoothly (gain ${gain.toFixed(2)}).`,
        tone: 'good',
      });
    } else {
      attentionFlags++;
      highlights.push({
        text: `Eye speed differed from target speed (gain ${gain.toFixed(2)}).`,
        tone: 'warn',
      });
    }
  }

  // 3. Longitudinal baseline delta check
  const comp = assessment.longitudinal_comparison;
  if (comp?.status === 'comparable' && comp.feature_deltas) {
    const changed = Object.entries(comp.feature_deltas).filter(
      ([, d]) => d.direction === 'increased' || d.direction === 'decreased'
    );
    if (changed.length > 0) {
      reviewFlags++;
      highlights.push({
        text: `Noticeable change compared with the patient's earlier baseline visit (${changed.length} metric${changed.length > 1 ? 's' : ''} shifted).`,
        tone: 'alert',
      });
    } else {
      highlights.push({
        text: 'Measurements remained stable compared with the patient’s previous baseline visit.',
        tone: 'good',
      });
    }
  }

  if (highlights.length === 0) {
    highlights.push({
      text: 'Recording completed and saved. Review the charts below to inspect frame-by-frame eye movement.',
      tone: 'neutral',
    });
  }

  // Determine overall patient situation & recommendations
  if (reviewFlags > 0) {
    return {
      level: 'review',
      badgeText: 'Clinician Review Advised',
      headline: 'Notable eye-response difference or weak reaction observed',
      summaryText:
        'One or more ocular measurements fell outside the typical screening range or shifted from the patient’s earlier visit. Confirm with a quick repeat check and consult a clinician.',
      highlights,
      recommendations: [
        'Run one quick repeat test in even indoor lighting (and remind the patient not to move their head) to confirm this is consistent.',
        'Ask the patient about recent symptoms: dizziness, headaches, blurred/double vision, fatigue, or recent head bumps.',
        'Share this report (print or export) with the supervising doctor / primary health centre clinician for a full neurological & eye exam.',
      ],
      disclaimerNote:
        'Non-diagnostic screening alert — only a licensed clinician can evaluate or diagnose medical conditions.',
    };
  }

  if (attentionFlags > 0) {
    return {
      level: 'attention',
      badgeText: 'Monitor & Verify',
      headline: 'Mild variation observed — recheck recommended',
      summaryText:
        'Most responses were captured, with minor timing or tracking variation that can happen from blinking, dim lighting, or lower camera frame rates.',
      highlights,
      recommendations: [
        'If this was the patient’s first visit and lighting was dim, consider repeating once in slightly brighter indirect light for a cleaner baseline.',
        'Advise the patient to rest their eyes and return for a routine follow-up check in 2–4 weeks (or sooner if symptoms develop).',
        'Ask whether they feel eye strain, drowsiness, or trouble focusing on moving objects.',
      ],
      disclaimerNote:
        'Non-diagnostic observation — interpret low-FPS timing steps alongside clinical context.',
    };
  }

  return {
    level: 'typical',
    badgeText: 'Typical Response',
    headline: 'Pupil reflex and eye tracking look steady and responsive',
    summaryText:
      'Both the light reaction and smooth eye-following measurements fall within the expected observational screening pattern with reliable capture quality.',
    highlights,
    recommendations: [
      comp?.status === 'not_available'
        ? 'This visit is now saved as the patient’s personal baseline for future checkups.'
        : 'Measurements match the patient’s steady baseline trend — continue routine monitoring.',
      'No urgent follow-up action indicated from this screening alone. Schedule the next routine check during their regular clinic visit.',
      'Remind the patient to seek standard medical care if any new vision changes, severe headaches, or dizziness occur.',
    ],
    disclaimerNote:
      'A typical screening result does not rule out all medical conditions; always rely on clinical judgment.',
  };
}

export interface SequenceDynamicsMetric {
  id: string;
  label: string;
  value: string;
  scorePct: number;
  meaning: string;
  tip: string;
  tone: Tone;
}

export interface SequencePhaseBreakdown {
  phase: string;
  shortLabel: string;
  stabilityPct: number;
  pupilAvg: number | null;
  pursuitAlignPct: number | null;
  plainNote: string;
}

/**
 * Computes deterministic, non-diagnostic within-recording sequence dynamics
 * (wave stability, recovery ratio, pursuit rhythm consistency) from the captured time-series.
 */
export function computeSequenceDynamics(assessment: AssessmentDetail): SequenceDynamicsMetric[] {
  const metrics: SequenceDynamicsMetric[] = [];
  const pupilSeries = assessment.pupil?.series || [];
  const pursuitSeries = assessment.pursuit?.series || [];

  const validPupil = pupilSeries.filter(
    (p) => p.valid && typeof p.value === 'number' && Number.isFinite(p.value)
  );
  if (pupilSeries.length >= 3) {
    const validPct = Math.round((validPupil.length / pupilSeries.length) * 100);
    metrics.push({
      id: 'continuity',
      label: 'Pupil Curve Continuity',
      value: `${validPct}% (${validPupil.length}/${pupilSeries.length} frames)`,
      scorePct: validPct,
      meaning: 'Share of recorded frames with a clear, uninterrupted pupil curve.',
      tip:
        validPct >= 75
          ? 'Eyes stayed clearly visible throughout the recording.'
          : 'Blinking or brief head movement interrupted some frames.',
      tone: validPct >= 75 ? 'good' : validPct >= 50 ? 'warn' : 'alert',
    });
  }

  if (validPupil.length >= 5) {
    const vals = validPupil.map((p) => p.value as number);
    const baselineSlice = vals.slice(0, Math.max(2, Math.floor(vals.length * 0.25)));
    const baseline = baselineSlice.reduce((a, b) => a + b, 0) / baselineSlice.length;
    const minVal = Math.min(...vals);
    const minIdx = vals.indexOf(minVal);
    const drop = Math.max(0, baseline - minVal);

    if (drop > 0.2 && minIdx < vals.length - 1) {
      const tailCount = Math.max(1, Math.floor((vals.length - minIdx - 1) * 0.4));
      const tailSlice = vals.slice(vals.length - tailCount);
      const tailMean = tailSlice.reduce((a, b) => a + b, 0) / tailSlice.length;
      const recoveryPct = Math.max(0, Math.min(100, Math.round(((tailMean - minVal) / drop) * 100)));
      metrics.push({
        id: 'recovery',
        label: 'Pupil Recovery Toward Baseline',
        value: `${recoveryPct}%`,
        scorePct: recoveryPct,
        meaning: 'How well the pupil relaxed back toward its resting size after the flash.',
        tip:
          recoveryPct >= 40
            ? 'Healthy rebound back toward resting pupil size was seen.'
            : 'Pupil stayed mostly narrowed until the end of the clip.',
        tone: recoveryPct >= 40 ? 'good' : 'warn',
      });
    }

    // Frame-to-frame smoothness (mean step change relative to baseline)
    let stepSum = 0;
    for (let i = 1; i < vals.length; i++) {
      stepSum += Math.abs(vals[i] - vals[i - 1]);
    }
    const meanJitterPct = baseline > 0 ? (stepSum / (vals.length - 1) / baseline) * 100 : 0;
    const smoothScore = Math.max(0, Math.min(100, Math.round(100 - meanJitterPct * 4)));
    metrics.push({
      id: 'smoothness',
      label: 'Curve Smoothness',
      value: meanJitterPct <= 5 ? 'Smooth' : meanJitterPct <= 12 ? 'Moderate' : 'Jittery',
      scorePct: smoothScore,
      meaning: `Average frame-to-frame pupil variation was ${meanJitterPct.toFixed(1)}%.`,
      tip:
        meanJitterPct <= 5
          ? 'Pupil tracking was very steady with minimal frame-to-frame noise.'
          : 'Noticeable frame-to-frame jitter (often caused by low light or slight camera shake).',
      tone: meanJitterPct <= 5 ? 'good' : meanJitterPct <= 12 ? 'warn' : 'alert',
    });
  }

  const validPursuit = pursuitSeries.filter(
    (p) => p.valid && typeof p.eye_x === 'number' && typeof p.target_x === 'number'
  );
  if (validPursuit.length >= 3) {
    const onTargetCount = validPursuit.filter(
      (p) => Math.abs((p.eye_x as number) - (p.target_x as number)) <= 0.15
    ).length;
    const onTargetPct = Math.round((onTargetCount / validPursuit.length) * 100);
    metrics.push({
      id: 'rhythm',
      label: 'Target Tracking Rhythm',
      value: `${onTargetPct}% on target`,
      scorePct: onTargetPct,
      meaning: 'Percentage of valid frames where eye gaze stayed within 15% of the moving dot.',
      tip:
        onTargetPct >= 75
          ? 'Eyes stayed smoothly synchronized with the moving dot.'
          : 'Eyes lagged behind or made catch-up jumps during part of the sweep.',
      tone: onTargetPct >= 75 ? 'good' : onTargetPct >= 50 ? 'warn' : 'alert',
    });
  }

  return metrics;
}

/**
 * Breaks the recorded pupil and pursuit time-series into 3 chronological phases
 * (Start, Middle, End) so users can interactively inspect how stability evolved.
 */
export function computeSequencePhases(assessment: AssessmentDetail): SequencePhaseBreakdown[] {
  const pupilSeries = assessment.pupil?.series || [];
  const pursuitSeries = assessment.pursuit?.series || [];
  if (pupilSeries.length < 3 && pursuitSeries.length < 3) return [];

  const buckets = [
    { phase: 'Start (Resting / Early)', shortLabel: '1. Start' },
    { phase: 'Middle (Flash / Peak Motion)', shortLabel: '2. Middle' },
    { phase: 'End (Recovery / Finish)', shortLabel: '3. End' },
  ];

  const sliceBucket = <T,>(arr: T[], idx: number): T[] => {
    if (arr.length === 0) return [];
    const start = Math.floor((idx * arr.length) / 3);
    const end = idx === 2 ? arr.length : Math.floor(((idx + 1) * arr.length) / 3);
    return arr.slice(start, Math.max(start + 1, end));
  };

  return buckets.map((b, idx) => {
    const pSlice = sliceBucket(pupilSeries, idx);
    const puSlice = sliceBucket(pursuitSeries, idx);

    const pValid = pSlice.filter((p) => p.valid && typeof p.value === 'number');
    const pRate = pSlice.length > 0 ? Math.round((pValid.length / pSlice.length) * 100) : null;
    const pupilAvg =
      pValid.length > 0
        ? Number((pValid.reduce((s, p) => s + (p.value as number), 0) / pValid.length).toFixed(1))
        : null;

    const puValid = puSlice.filter(
      (p) => p.valid && typeof p.eye_x === 'number' && typeof p.target_x === 'number'
    );
    const pursuitAlignPct =
      puValid.length > 0
        ? Math.round(
            (puValid.filter((p) => Math.abs((p.eye_x as number) - (p.target_x as number)) <= 0.15).length /
              puValid.length) *
              100
          )
        : null;

    const stabilityPct =
      pRate !== null && pursuitAlignPct !== null
        ? Math.round((pRate + pursuitAlignPct) / 2)
        : pRate ?? pursuitAlignPct ?? 0;

    let plainNote = 'No phase samples recorded.';
    if (idx === 0) {
      plainNote = `Early stability was ${stabilityPct}%${pupilAvg !== null ? ` (avg pupil ${pupilAvg})` : ''}.`;
    } else if (idx === 1) {
      plainNote = `Mid-test stability was ${stabilityPct}%${pupilAvg !== null ? ` (pupil narrowed to ~${pupilAvg})` : ''}.`;
    } else {
      plainNote = `Final-phase stability was ${stabilityPct}%${pursuitAlignPct !== null ? ` (${pursuitAlignPct}% on target)` : ''}.`;
    }

    return {
      phase: b.phase,
      shortLabel: b.shortLabel,
      stabilityPct,
      pupilAvg,
      pursuitAlignPct,
      plainNote,
    };
  });
}

/**
 * Returns a plain-language label, 1-line meaning, and status pill for each technical feature key.
 */
export function interpretMetric(
  key: string,
  item: FeatureValue,
  allFeatures?: Record<string, FeatureValue>
): MetricInterpretation {
  const val = item.value;

  switch (key) {
    case 'baseline_diameter':
      return {
        plainLabel: 'Resting Pupil Size',
        plainMeaning: 'Average pupil size before the screen flashed.',
        statusLabel: val !== null ? 'Measured' : 'Unavailable',
        tone: val !== null ? 'neutral' : 'warn',
      };
    case 'minimum_diameter':
      return {
        plainLabel: 'Smallest Pupil Size',
        plainMeaning: 'Tightest pupil size reached right after the flash.',
        statusLabel: val !== null ? 'Measured' : 'Unavailable',
        tone: val !== null ? 'neutral' : 'warn',
      };
    case 'constriction_amplitude': {
      const base = getNumeric(allFeatures, ['baseline_diameter']);
      const pct = base && base > 0 && val !== null ? (val / base) * 100 : item.unit === '%' ? val : null;
      if (pct === null) {
        return {
          plainLabel: 'Light Reaction Strength',
          plainMeaning: 'How much the pupil shrank when light flashed.',
          statusLabel: 'Unavailable',
          tone: 'warn',
        };
      }
      return {
        plainLabel: 'Light Reaction Strength',
        plainMeaning: `Pupil shrank by ~${pct.toFixed(0)}% after light flash.`,
        statusLabel: pct >= 15 ? 'Strong' : pct >= 7 ? 'Mild' : 'Weak',
        tone: pct >= 15 ? 'good' : pct >= 7 ? 'warn' : 'alert',
      };
    }
    case 'response_latency_seconds':
    case 'constriction_latency': {
      const ms = key === 'response_latency_seconds' && val !== null ? val * 1000 : val;
      if (ms === null) {
        return {
          plainLabel: 'Reaction Delay',
          plainMeaning: 'How fast the pupil started shrinking after flash.',
          statusLabel: 'Not detected',
          tone: 'warn',
        };
      }
      return {
        plainLabel: 'Reaction Delay',
        plainMeaning: 'Time from light flash to start of pupil narrowing.',
        statusLabel: ms <= 420 ? 'Timely' : ms <= 650 ? 'Slightly Slow' : 'Delayed',
        tone: ms <= 420 ? 'good' : ms <= 650 ? 'warn' : 'alert',
      };
    }
    case 'constriction_velocity':
      return {
        plainLabel: 'Narrowing Speed',
        plainMeaning: 'Peak speed at which the pupil contracted.',
        statusLabel: val !== null && val > 0 ? 'Active' : 'Low / N/A',
        tone: val !== null && val > 0 ? 'good' : 'warn',
      };
    case 'mean_tracking_error':
    case 'rmse_error':
      return {
        plainLabel: 'Target Following Drift',
        plainMeaning: 'Average gap between eye gaze and the moving dot.',
        statusLabel:
          val === null ? 'Unavailable' : val <= 0.14 ? 'On Target' : val <= 0.25 ? 'Slight Drift' : 'Off Target',
        tone: val === null ? 'warn' : val <= 0.14 ? 'good' : val <= 0.25 ? 'warn' : 'alert',
      };
    case 'tracking_continuity': {
      const pct = val !== null ? Math.round(val * 100) : null;
      return {
        plainLabel: 'Eye Tracking Stability',
        plainMeaning: 'Share of video where the eye stayed clearly tracked.',
        statusLabel:
          pct === null ? 'Unavailable' : pct >= 75 ? `Steady (${pct}%)` : pct >= 50 ? `Fair (${pct}%)` : `Low (${pct}%)`,
        tone: pct === null ? 'warn' : pct >= 75 ? 'good' : pct >= 50 ? 'warn' : 'alert',
      };
    }
    case 'corrective_movement_count':
    case 'saccadic_intrusions':
      return {
        plainLabel: 'Catch-Up Eye Jumps',
        plainMeaning: 'Sudden jumps the eye made to catch up to the dot.',
        statusLabel:
          val === null ? 'Unavailable' : val <= 4 ? 'Smooth' : val <= 8 ? 'Moderate' : 'Frequent',
        tone: val === null ? 'warn' : val <= 4 ? 'good' : val <= 8 ? 'warn' : 'alert',
      };
    case 'tracking_gain':
      return {
        plainLabel: 'Eye-to-Target Speed Match',
        plainMeaning: '1.00 means eye speed matched the moving dot.',
        statusLabel:
          val === null ? 'Unavailable' : val >= 0.75 && val <= 1.15 ? 'Matched' : 'Mismatched',
        tone: val === null ? 'warn' : val >= 0.75 && val <= 1.15 ? 'good' : 'warn',
      };
    default:
      return {
        plainLabel: item.label || key.replace(/_/g, ' '),
        plainMeaning: 'Measured ocular biometric indicator.',
        statusLabel: val !== null ? 'Recorded' : 'Unavailable',
        tone: 'neutral',
      };
  }
}
