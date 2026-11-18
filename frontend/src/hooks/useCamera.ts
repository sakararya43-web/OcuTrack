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
  startCamera: (constraints?: MediaStreamConstraints) => Promise<boolean>;
  stopCamera: () => void;
  toggleTorch: (enabled: boolean) => Promise<boolean>;
}

export function useCamera(): UseCameraReturn {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<CameraError | null>(null);
  const [observedSettings, setObservedSettings] = useState<ObservedCameraSettings | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
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
    async (
      customConstraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30, min: 15 },
          facingMode: 'user',
        },
        audio: false,
      }
    ): Promise<boolean> => {
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
        const mediaStream = await navigator.mediaDevices.getUserMedia(customConstraints);
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

        // Inspect observed track settings
        const videoTrack = mediaStream.getVideoTracks()[0];
        if (videoTrack) {
          const settings = videoTrack.getSettings ? videoTrack.getSettings() : {};
          const capabilities: MediaTrackCapabilities & { torch?: boolean } =
            typeof videoTrack.getCapabilities === 'function'
              ? (videoTrack.getCapabilities() as MediaTrackCapabilities & { torch?: boolean })
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
    [stopCamera]
  );

  const toggleTorch = useCallback(
    async (enabled: boolean): Promise<boolean> => {
      if (!streamRef.current) return false;
      const videoTrack = streamRef.current.getVideoTracks()[0] as
        | (MediaStreamTrack & {
            applyConstraints?: (constraints: MediaTrackConstraints & { advanced?: Array<{ torch?: boolean }> }) => Promise<void>;
          })
        | undefined;
      if (!videoTrack || typeof videoTrack.applyConstraints !== 'function') {
        return false;
      }

      try {
        await videoTrack.applyConstraints({
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
    startCamera,
    stopCamera,
    toggleTorch,
  };
}
