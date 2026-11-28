import { useEffect, useRef, useState } from 'react';
import type { FaceLandmarker, NormalizedLandmark } from '@mediapipe/tasks-vision';

export type GateMetricStatus = 'pass' | 'warn' | 'lite';

export interface LightingTelemetry {
  status: 'pass' | 'warn';
  code: 'optimal' | 'low_light' | 'high_glare' | 'pending';
  meanLuminance: number;
  overexposedRatio: number;
}

export interface HeadPoseTelemetry {
  status: GateMetricStatus;
  code: 'aligned' | 'adjust_pose' | 'no_face' | 'lite_mode';
  yaw: number | null;
  pitch: number | null;
  roll: number | null;
  formatted: string;
}

export interface EyeVisibilityTelemetry {
  status: GateMetricStatus;
  code: 'clear' | 'eyes_not_visible' | 'center_face' | 'no_face' | 'lite_mode';
  leftEar: number | null;
  rightEar: number | null;
}

export interface PreCaptureQualityGateState {
  lighting: LightingTelemetry;
  headPose: HeadPoseTelemetry;
  eyeVisibility: EyeVisibilityTelemetry;
  allPassed: boolean;
  isModelLoading: boolean;
  isLiteMode: boolean;
}

// MediaPipe FaceMesh indices aligned with analysis/face_localization.py
const LEFT_EYE_INDICES = [33, 160, 158, 133, 153, 144] as const;
const RIGHT_EYE_INDICES = [362, 385, 387, 263, 373, 380] as const;
const NOSE_TIP_INDEX = 1;
const FOREHEAD_INDEX = 10;
const CHIN_INDEX = 152;
const LEFT_CHEEK_INDEX = 234;
const RIGHT_CHEEK_INDEX = 454;

const MEDIAPIPE_WASM_URL =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/wasm';
const FACE_LANDMARKER_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

const SAMPLE_WIDTH = 160;
const SAMPLE_HEIGHT = 120;
const ANALYSIS_INTERVAL_MS = 110; // ~9 FPS edge CV loop

const YAW_THRESHOLD_DEG = 12;
const PITCH_THRESHOLD_DEG = 12;
const ROLL_THRESHOLD_DEG = 10;
const MIN_OPEN_EAR = 0.16;
const SAFE_FRAME_MIN = 0.12;
const SAFE_FRAME_MAX = 0.88;

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function normalizeZero(n: number): number {
  return Object.is(n, -0) ? 0 : n;
}

function formatSignedDeg(deg: number): string {
  const rounded = normalizeZero(Math.round(deg));
  return `${rounded >= 0 ? '+' : ''}${rounded}°`;
}

export function formatHeadPoseAngles(yaw: number, pitch: number, roll: number): string {
  return `Y:${formatSignedDeg(yaw)} P:${formatSignedDeg(pitch)} R:${formatSignedDeg(roll)}`;
}

/**
 * Computes mean luminance (0..255) and overexposed pixel ratio from RGBA ImageData.
 */
export function analyzeFrameLighting(rgba: Uint8ClampedArray): LightingTelemetry {
  const pixelCount = Math.floor(rgba.length / 4);
  if (pixelCount === 0) {
    return {
      status: 'warn',
      code: 'pending',
      meanLuminance: 0,
      overexposedRatio: 0,
    };
  }

  let lumSum = 0;
  let overexposedCount = 0;
  let sampled = 0;

  for (let i = 0; i < pixelCount; i += 2) {
    const base = i * 4;
    const r = rgba[base];
    const g = rgba[base + 1];
    const b = rgba[base + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    lumSum += lum;
    if (lum >= 242 || (r >= 248 && g >= 248 && b >= 248)) {
      overexposedCount += 1;
    }
    sampled += 1;
  }

  const meanLuminance = Math.round(lumSum / Math.max(1, sampled));
  const overexposedRatio = Number((overexposedCount / Math.max(1, sampled)).toFixed(3));

  if (meanLuminance < 65) {
    return { status: 'warn', code: 'low_light', meanLuminance, overexposedRatio };
  }
  if (meanLuminance > 215 || overexposedRatio > 0.22) {
    return { status: 'warn', code: 'high_glare', meanLuminance, overexposedRatio };
  }
  return { status: 'pass', code: 'optimal', meanLuminance, overexposedRatio };
}

/**
 * Extracts Yaw, Pitch, Roll (degrees) from MediaPipe 4x4 facial transformation matrix,
 * falling back to facial landmark geometry if the matrix is unavailable.
 */
export function extractHeadPoseEuler(
  matrix?: { rows: number; columns: number; data: number[] },
  landmarks?: NormalizedLandmark[]
): HeadPoseTelemetry {
  let yaw: number | null = null;
  let pitch: number | null = null;
  let roll: number | null = null;

  if (matrix && matrix.data && matrix.data.length >= 16) {
    const m = matrix.data;
    // Detect column-major (MediaPipe FaceGeometry default: translation at indices 12..14)
    // vs row-major (translation at indices 3, 7, 11).
    const isRowMajor =
      Math.abs(m[11]) > 1e-3 && Math.abs(m[14]) <= 1.01 && Math.abs(m[12]) <= 1e-3;

    const r00 = m[0];
    const r10 = isRowMajor ? m[4] : m[1];
    const r20 = isRowMajor ? m[8] : m[2];
    const r21 = isRowMajor ? m[9] : m[6];
    const r22 = m[10];

    const sy = Math.sqrt(r00 * r00 + r10 * r10);
    if (sy > 1e-6) {
      yaw = (Math.asin(clamp(-r20, -1, 1)) * 180) / Math.PI;
      pitch = (Math.atan2(r21, r22) * 180) / Math.PI;
      roll = (Math.atan2(r10, r00) * 180) / Math.PI;
    } else {
      yaw = (Math.asin(clamp(-r20, -1, 1)) * 180) / Math.PI;
      pitch = (Math.atan2(-(isRowMajor ? m[6] : m[9]), m[5]) * 180) / Math.PI;
      roll = 0;
    }
  } else if (landmarks && landmarks.length >= 455) {
    const nose = landmarks[NOSE_TIP_INDEX];
    const forehead = landmarks[FOREHEAD_INDEX];
    const chin = landmarks[CHIN_INDEX];
    const leftCheek = landmarks[LEFT_CHEEK_INDEX];
    const rightCheek = landmarks[RIGHT_CHEEK_INDEX];
    const leftEyeOuter = landmarks[33];
    const rightEyeOuter = landmarks[263];

    const distLeft = Math.hypot(nose.x - leftCheek.x, nose.y - leftCheek.y);
    const distRight = Math.hypot(nose.x - rightCheek.x, nose.y - rightCheek.y);
    const totalCheek = distLeft + distRight;
    yaw = totalCheek > 0 ? ((distLeft - distRight) / totalCheek) * 45 : 0;

    const faceHeight = Math.hypot(chin.x - forehead.x, chin.y - forehead.y);
    pitch = faceHeight > 0 ? ((nose.y - forehead.y) / faceHeight - 0.5) * 60 : 0;

    roll =
      (Math.atan2(rightEyeOuter.y - leftEyeOuter.y, rightEyeOuter.x - leftEyeOuter.x) * 180) /
      Math.PI;
  }

  if (yaw === null || pitch === null || roll === null) {
    return {
      status: 'warn',
      code: 'no_face',
      yaw: null,
      pitch: null,
      roll: null,
      formatted: 'Y:-- P:-- R:--',
    };
  }

  const yRounded = normalizeZero(Math.round(yaw));
  const pRounded = normalizeZero(Math.round(pitch));
  const rRounded = normalizeZero(Math.round(roll));
  const isAligned =
    Math.abs(yaw) <= YAW_THRESHOLD_DEG &&
    Math.abs(pitch) <= PITCH_THRESHOLD_DEG &&
    Math.abs(roll) <= ROLL_THRESHOLD_DEG;

  return {
    status: isAligned ? 'pass' : 'warn',
    code: isAligned ? 'aligned' : 'adjust_pose',
    yaw: yRounded,
    pitch: pRounded,
    roll: rRounded,
    formatted: formatHeadPoseAngles(yRounded, pRounded, rRounded),
  };
}

function computeEyeAspectRatio(
  landmarks: NormalizedLandmark[],
  indices: readonly [number, number, number, number, number, number]
): number {
  const [i0, i1, i2, i3, i4, i5] = indices;
  const p0 = landmarks[i0];
  const p1 = landmarks[i1];
  const p2 = landmarks[i2];
  const p3 = landmarks[i3];
  const p4 = landmarks[i4];
  const p5 = landmarks[i5];
  if (!p0 || !p1 || !p2 || !p3 || !p4 || !p5) return 0;

  const v1 = Math.hypot(p1.x - p5.x, p1.y - p5.y);
  const v2 = Math.hypot(p2.x - p4.x, p2.y - p4.y);
  const h = Math.hypot(p0.x - p3.x, p0.y - p3.y);
  if (h <= 1e-6) return 0;
  return (v1 + v2) / (2 * h);
}

/**
 * Evaluates eye landmark cluster containment within central safe frame and Eye Aspect Ratio (EAR).
 */
export function evaluateEyeVisibility(landmarks?: NormalizedLandmark[]): EyeVisibilityTelemetry {
  if (!landmarks || landmarks.length < 400) {
    return {
      status: 'warn',
      code: 'no_face',
      leftEar: null,
      rightEar: null,
    };
  }

  const allEyePoints = [...LEFT_EYE_INDICES, ...RIGHT_EYE_INDICES].map((idx) => landmarks[idx]);
  if (allEyePoints.some((pt) => !pt)) {
    return {
      status: 'warn',
      code: 'eyes_not_visible',
      leftEar: null,
      rightEar: null,
    };
  }

  const outOfSafeFrame = allEyePoints.some(
    (pt) =>
      pt.x < SAFE_FRAME_MIN ||
      pt.x > SAFE_FRAME_MAX ||
      pt.y < SAFE_FRAME_MIN ||
      pt.y > SAFE_FRAME_MAX
  );

  const leftEar = Number(computeEyeAspectRatio(landmarks, LEFT_EYE_INDICES).toFixed(3));
  const rightEar = Number(computeEyeAspectRatio(landmarks, RIGHT_EYE_INDICES).toFixed(3));

  if (outOfSafeFrame) {
    return {
      status: 'warn',
      code: 'center_face',
      leftEar,
      rightEar,
    };
  }

  if (leftEar < MIN_OPEN_EAR || rightEar < MIN_OPEN_EAR) {
    return {
      status: 'warn',
      code: 'eyes_not_visible',
      leftEar,
      rightEar,
    };
  }

  return {
    status: 'pass',
    code: 'clear',
    leftEar,
    rightEar,
  };
}

const DEFAULT_PENDING_STATE: PreCaptureQualityGateState = {
  lighting: { status: 'warn', code: 'pending', meanLuminance: 0, overexposedRatio: 0 },
  headPose: {
    status: 'warn',
    code: 'no_face',
    yaw: null,
    pitch: null,
    roll: null,
    formatted: 'Y:-- P:-- R:--',
  },
  eyeVisibility: { status: 'warn', code: 'no_face', leftEar: null, rightEar: null },
  allPassed: false,
  isModelLoading: true,
  isLiteMode: false,
};

const MEDIAPIPE_INIT_TIMEOUT_MS = 3500;

/**
 * Formats pre-capture edge CV telemetry for backend metadata_json without
 * modifying FastAPI endpoints or schemas.
 */
export function buildPreCaptureQualityMetadata(
  gate: PreCaptureQualityGateState,
  overridden: boolean,
  isFallback: boolean
): Record<string, unknown> {
  if (isFallback) return {};
  return {
    pre_capture_quality: {
      all_passed: gate.allPassed,
      is_lite_mode: gate.isLiteMode,
      overridden,
      lighting: gate.lighting.code,
      mean_luminance: gate.lighting.meanLuminance,
      head_pose: gate.headPose.code,
      eye_visibility: gate.eyeVisibility.code,
      ...(overridden ? { note: 'pre_capture_quality_override' } : {}),
    },
    ...(overridden ? { quality_gate_note: 'pre_capture_quality_override' } : {}),
  };
}

/**
 * Real-time client-side Edge CV quality gate running ~9 FPS over videoRef.
 * Falls back cleanly to canvas-only LITE MODE if MediaPipe WASM/model fails to load offline.
 */
export function usePreCaptureQualityGate(
  videoRef: React.RefObject<HTMLVideoElement>,
  isActive: boolean
): PreCaptureQualityGateState {
  const [state, setState] = useState<PreCaptureQualityGateState>(DEFAULT_PENDING_STATE);
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const isLiteModeRef = useRef<boolean>(false);
  const isModelLoadingRef = useRef<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastTimestampRef = useRef<number>(0);

  // Initialize MediaPipe FaceLandmarker when active
  useEffect(() => {
    if (!isActive) {
      setState(DEFAULT_PENDING_STATE);
      return;
    }

    let cancelled = false;
    let timeoutId: number | undefined;
    isModelLoadingRef.current = true;
    isLiteModeRef.current = false;

    const activateLiteMode = () => {
      if (cancelled) return;
      landmarkerRef.current = null;
      isModelLoadingRef.current = false;
      isLiteModeRef.current = true;
      setState((prev) => ({
        ...prev,
        headPose: {
          status: 'lite',
          code: 'lite_mode',
          yaw: null,
          pitch: null,
          roll: null,
          formatted: 'LITE MODE',
        },
        eyeVisibility: {
          status: 'lite',
          code: 'lite_mode',
          leftEar: null,
          rightEar: null,
        },
        allPassed: prev.lighting.status === 'pass',
        isModelLoading: false,
        isLiteMode: true,
      }));
    };

    const initLandmarker = async () => {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        activateLiteMode();
        return;
      }

      try {
        const loadPromise = (async () => {
          const visionPkg = await import('@mediapipe/tasks-vision');
          const vision = await visionPkg.FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL);
          return visionPkg.FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: FACE_LANDMARKER_MODEL_URL,
            },
            runningMode: 'VIDEO',
            numFaces: 1,
            minFaceDetectionConfidence: 0.45,
            minFacePresenceConfidence: 0.45,
            minTrackingConfidence: 0.45,
            outputFacialTransformationMatrixes: true,
          });
        })();

        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = window.setTimeout(() => {
            reject(new Error('MediaPipe initialization timed out'));
          }, MEDIAPIPE_INIT_TIMEOUT_MS);
        });

        const landmarker = await Promise.race([loadPromise, timeoutPromise]);
        if (timeoutId !== undefined) window.clearTimeout(timeoutId);

        if (cancelled) {
          landmarker.close();
          return;
        }
        landmarkerRef.current = landmarker;
        isModelLoadingRef.current = false;
        isLiteModeRef.current = false;
      } catch {
        if (timeoutId !== undefined) window.clearTimeout(timeoutId);
        activateLiteMode();
      }
    };

    void initLandmarker();

    return () => {
      cancelled = true;
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      if (landmarkerRef.current) {
        try {
          landmarkerRef.current.close();
        } catch {
          // ignore close errors during teardown
        }
        landmarkerRef.current = null;
      }
    };
  }, [isActive]);

  // Throttled ~9 FPS edge-CV analysis loop
  useEffect(() => {
    if (!isActive) return;

    if (!canvasRef.current && typeof document !== 'undefined') {
      const c = document.createElement('canvas');
      c.width = SAMPLE_WIDTH;
      c.height = SAMPLE_HEIGHT;
      canvasRef.current = c;
    }

    const canvas = canvasRef.current;
    let ctx: CanvasRenderingContext2D | null = null;
    if (canvas) {
      try {
        ctx = canvas.getContext('2d', { willReadFrequently: true });
      } catch {
        ctx = null;
      }
    }

    const timer = window.setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      const videoEl = videoRef.current;
      if (!videoEl || videoEl.readyState < 2 || videoEl.videoWidth <= 0 || videoEl.videoHeight <= 0) {
        return;
      }

      // 1. Canvas ambient lighting analysis
      let lighting: LightingTelemetry = DEFAULT_PENDING_STATE.lighting;
      if (ctx) {
        try {
          ctx.drawImage(videoEl, 0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);
          const frame = ctx.getImageData(0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);
          lighting = analyzeFrameLighting(frame.data);
        } catch {
          // Keep previous or pending lighting if canvas read fails transiently
        }
      }

      const isLite = isLiteModeRef.current;
      const isLoading = isModelLoadingRef.current;

      // 2. MediaPipe head-pose & eye visibility analysis (or LITE MODE fallback)
      let headPose: HeadPoseTelemetry;
      let eyeVisibility: EyeVisibilityTelemetry;

      if (isLite) {
        headPose = {
          status: 'lite',
          code: 'lite_mode',
          yaw: null,
          pitch: null,
          roll: null,
          formatted: 'LITE MODE',
        };
        eyeVisibility = {
          status: 'lite',
          code: 'lite_mode',
          leftEar: null,
          rightEar: null,
        };
      } else if (landmarkerRef.current) {
        try {
          const ts = Math.max(lastTimestampRef.current + 1, Math.round(Date.now()));
          lastTimestampRef.current = ts;
          const result = landmarkerRef.current.detectForVideo(videoEl, ts);
          const landmarks = result.faceLandmarks?.[0];
          const matrix = result.facialTransformationMatrixes?.[0];

          headPose = extractHeadPoseEuler(matrix, landmarks);
          eyeVisibility = evaluateEyeVisibility(landmarks);
        } catch {
          headPose = DEFAULT_PENDING_STATE.headPose;
          eyeVisibility = DEFAULT_PENDING_STATE.eyeVisibility;
        }
      } else {
        headPose = DEFAULT_PENDING_STATE.headPose;
        eyeVisibility = DEFAULT_PENDING_STATE.eyeVisibility;
      }

      const allPassed = isLite
        ? lighting.status === 'pass'
        : lighting.status === 'pass' &&
          headPose.status === 'pass' &&
          eyeVisibility.status === 'pass';

      setState({
        lighting,
        headPose,
        eyeVisibility,
        allPassed,
        isModelLoading: isLoading,
        isLiteMode: isLite,
      });
    }, ANALYSIS_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [isActive, videoRef]);

  return state;
}
