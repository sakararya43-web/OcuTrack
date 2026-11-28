import { useState, useRef, useEffect, useCallback } from 'react';

export type CameraErrorType =
  | 'permission_denied'
  | 'not_found'
  | 'already_in_use'
  | 'unsupported'
  | 'unknown';

export interface CameraError {
  type: CameraErrorType;
  message: string;
}

export type CaptureProfile = 'rural_clinic' | 'standard';

export interface ObservedCameraSettings {
  width?: number;
  height?: number;
  frameRate?: number;
  hasTorch: boolean;
}

export interface UseCameraReturn {
  stream: MediaStream | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  isCameraActive: boolean;
  isLoading: boolean;
  error: CameraError | null;
  observedSettings: ObservedCameraSettings | null;
  captureProfile: CaptureProfile;
  setCaptureProfile: (profile: CaptureProfile) => void;
  startCamera: (constraints?: MediaStreamConstraints) => Promise<boolean>;
  stopCamera: () => void;
  toggleTorch: (enabled: boolean) => Promise<boolean>;
  getStream: () => MediaStream | null;
}

/**
 * Rural-clinic friendly defaults: 640x480 @ 24fps ideal, accepting down to 320x240 @ 8fps
 * so entry-level laptops, budget USB webcams, and low-end phones connect reliably without CPU overload.
 */
const RURAL_CLINIC_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    width: { ideal: 640, min: 320 },
    height: { ideal: 480, min: 240 },
    frameRate: { ideal: 24, min: 8 },
    facingMode: 'user',
  },
  audio: false,
};

const STANDARD_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    width: { ideal: 1280, min: 320 },
    height: { ideal: 720, min: 240 },
    frameRate: { ideal: 30, min: 8 },
    facingMode: 'user',
  },
  audio: false,
};

const RELAXED_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    width: { ideal: 640 },
    height: { ideal: 480 },
    frameRate: { ideal: 15 },
  },
  audio: false,
};

export function useCamera(initialProfile: CaptureProfile = 'rural_clinic'): UseCameraReturn {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<CameraError | null>(null);
  const [observedSettings, setObservedSettings] = useState<ObservedCameraSettings | null>(null);
  const [captureProfile, setCaptureProfile] = useState<CaptureProfile>(initialProfile);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const getStream = useCallback(() => streamRef.current, []);

  // Re-sync srcObject whenever stream changes or video element mounts/updates
  useEffect(() => {
    const videoEl = videoRef.current;
    if (videoEl && stream && videoEl.srcObject !== stream) {
      videoEl.srcObject = stream;
      videoEl.play().catch(() => {
        // Auto-play prevented; video starts on user gesture
      });
    }
  }, [stream, isCameraActive]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      const tracks =
        typeof streamRef.current.getTracks === 'function'
          ? streamRef.current.getTracks()
          : [];
      (tracks || []).forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setStream(null);
    setIsCameraActive(false);
    setObservedSettings(null);
  }, []);

  const startCamera = useCallback(
    async (customConstraints?: MediaStreamConstraints): Promise<boolean> => {
      const targetConstraints =
        customConstraints ??
        (captureProfile === 'standard' ? STANDARD_CONSTRAINTS : RURAL_CLINIC_CONSTRAINTS);
      // First clean up any existing stream
      stopCamera();
      setError(null);
      setIsLoading(true);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError({
          type: 'unsupported',
          message: 'Browser does not support media device capture (navigator.mediaDevices.getUserMedia is unavailable).',
        });
        setIsLoading(false);
        return false;
      }

      try {
        let mediaStream: MediaStream;
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia(targetConstraints);
        } catch (constraintErr: unknown) {
          if (
            constraintErr instanceof DOMException &&
            (constraintErr.name === 'OverconstrainedError' || constraintErr.name === 'ConstraintNotSatisfiedError')
          ) {
            try {
              mediaStream = await navigator.mediaDevices.getUserMedia(RELAXED_CONSTRAINTS);
            } catch {
              mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            }
          } else {
            throw constraintErr;
          }
        }

        streamRef.current = mediaStream;
        setStream(mediaStream);
        setIsCameraActive(true);

        // Bind stream to video element if ready
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(() => {
            // Auto-play was prevented; video will start on user action
          });
        }

        // Inspect observed track settings and handle unexpected track disconnection
        const videoTrack = mediaStream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.onended = () => {
            streamRef.current = null;
            setStream(null);
            setIsCameraActive(false);
            setObservedSettings(null);
          };

          const settings = videoTrack.getSettings ? videoTrack.getSettings() : {};
          const capabilities =
            typeof (videoTrack as any).getCapabilities === 'function'
              ? (videoTrack as any).getCapabilities()
              : {};

          setObservedSettings({
            width: settings.width,
            height: settings.height,
            frameRate: settings.frameRate,
            hasTorch: Boolean(capabilities.torch),
          });
        }

        setIsLoading(false);
        return true;
      } catch (err: unknown) {
        setIsLoading(false);
        setIsCameraActive(false);

        if (err instanceof DOMException) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setError({
              type: 'permission_denied',
              message: 'Camera permission denied. Please allow camera access in browser settings to continue.',
            });
            return false;
          }
          if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            setError({
              type: 'not_found',
              message: 'No video capture device detected on this system. Connect a webcam or use sample fallback.',
            });
            return false;
          }
          if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
            setError({
              type: 'already_in_use',
              message: 'Camera is currently in use by another application or tab. Please close other apps and retry.',
            });
            return false;
          }
        }

        setError({
          type: 'unknown',
          message: err instanceof Error ? err.message : 'Unable to initialize webcam capture.',
        });
        return false;
      }
    },
    [captureProfile, stopCamera]
  );

  const toggleTorch = useCallback(
    async (enabled: boolean): Promise<boolean> => {
      if (!streamRef.current) return false;
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (!videoTrack || typeof (videoTrack as any).applyConstraints !== 'function') {
        return false;
      }

      try {
        await (videoTrack as any).applyConstraints({
          advanced: [{ torch: enabled }],
        });
        return true;
      } catch {
        return false;
      }
    },
    []
  );

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    stream,
    videoRef,
    isCameraActive,
    isLoading,
    error,
    observedSettings,
    captureProfile,
    setCaptureProfile,
    startCamera,
    stopCamera,
    toggleTorch,
    getStream,
  };
}
