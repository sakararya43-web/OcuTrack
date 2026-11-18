import { useState, useRef, useCallback, useEffect } from 'react';

export interface RecordedVideo {
  blob: Blob;
  previewUrl: string;
  durationMs: number;
  mimeType: string;
  recordedAt: string;
  sizeBytes: number;
}

export interface UseMediaRecorderOptions {
  maxDurationSeconds?: number;
  maxSizeBytes?: number;
  onRecordingComplete?: (recorded: RecordedVideo) => void;
  onAutoStop?: () => void;
}

export interface UseMediaRecorderReturn {
  isRecording: boolean;
  isPaused: boolean;
  elapsedMs: number;
  recordedVideo: RecordedVideo | null;
  error: string | null;
  startRecording: (stream: MediaStream) => boolean;
  stopRecording: () => void;
  discardRecording: () => void;
  setExternalRecording: (video: RecordedVideo) => void;
  supportedMimeType: string | null;
}

const CANDIDATE_MIME_TYPES = [
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
  'video/mp4;codecs=avc1,mp4a.40.2',
  'video/mp4',
];

export function getBestSupportedMimeType(): string | null {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
    return null;
  }
  for (const mimeType of CANDIDATE_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }
  return '';
}

export function useMediaRecorder(options: UseMediaRecorderOptions = {}): UseMediaRecorderReturn {
  const {
    maxDurationSeconds = 15,
    maxSizeBytes = 100 * 1024 * 1024, // 100 MB
    onRecordingComplete,
    onAutoStop,
  } = options;

  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [recordedVideo, setRecordedVideo] = useState<RecordedVideo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chosenMimeTypeRef = useRef<string>('');

  const cleanupTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  const discardRecording = useCallback(() => {
    setRecordedVideo((prev) => {
      if (prev?.previewUrl && typeof URL.revokeObjectURL === 'function') {
        URL.revokeObjectURL(prev.previewUrl);
      }
      return null;
    });
    setElapsedMs(0);
    setError(null);
  }, []);

  const setExternalRecording = useCallback((video: RecordedVideo) => {
    cleanupTimer();
    setIsRecording(false);
    setIsPaused(false);
    setError(null);
    setElapsedMs(video.durationMs);
    setRecordedVideo((prev) => {
      if (
        prev?.previewUrl &&
        prev.previewUrl !== video.previewUrl &&
        typeof URL.revokeObjectURL === 'function'
      ) {
        URL.revokeObjectURL(prev.previewUrl);
      }
      return video;
    });
  }, [cleanupTimer]);

  const stopRecording = useCallback(() => {
    cleanupTimer();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error stopping recorder');
      }
    }
    setIsRecording(false);
    setIsPaused(false);
  }, [cleanupTimer]);

  const startRecording = useCallback(
    (stream: MediaStream): boolean => {
      discardRecording();
      setError(null);
      chunksRef.current = [];

      if (!stream || stream.getTracks().length === 0 || !stream.active) {
        setError('Cannot record: camera stream is not active.');
        return false;
      }

      if (typeof MediaRecorder === 'undefined') {
        setError('MediaRecorder API is not supported in this browser.');
        return false;
      }

      const bestMime = getBestSupportedMimeType();
      chosenMimeTypeRef.current = bestMime || '';

      const recorderOptions: MediaRecorderOptions = {};
      if (bestMime) {
        recorderOptions.mimeType = bestMime;
      }

      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, recorderOptions);
      } catch {
        try {
          recorder = new MediaRecorder(stream);
        } catch (innerErr: unknown) {
          setError(innerErr instanceof Error ? innerErr.message : 'Failed to instantiate MediaRecorder.');
          return false;
        }
      }

      mediaRecorderRef.current = recorder;
      startTimeRef.current = Date.now();
      const isoCapturedAt = new Date().toISOString();

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
          const totalSize = chunksRef.current.reduce((acc, c) => acc + c.size, 0);
          if (totalSize > maxSizeBytes) {
            setError(
              `Recording exceeded maximum allowable file size (${(maxSizeBytes / (1024 * 1024)).toFixed(0)}MB). Auto-stopped.`
            );
            stopRecording();
          }
        }
      };

      recorder.onerror = (event: Event) => {
        const errorEvent = event as Event & { error?: { message?: string } };
        const errorDetail = errorEvent.error?.message || 'Unknown recorder error';
        setError(`Recording failed: ${errorDetail}`);
        cleanupTimer();
        setIsRecording(false);
      };

      recorder.onstop = () => {
        cleanupTimer();
        const duration = Math.max(100, Date.now() - startTimeRef.current);
        const finalMime = recorder.mimeType || chosenMimeTypeRef.current || 'video/webm';
        const blob = new Blob(chunksRef.current, { type: finalMime });
        const previewUrl = URL.createObjectURL(blob);

        const videoResult: RecordedVideo = {
          blob,
          previewUrl,
          durationMs: duration,
          mimeType: finalMime,
          recordedAt: isoCapturedAt,
          sizeBytes: blob.size,
        };

        setRecordedVideo(videoResult);
        setIsRecording(false);

        if (onRecordingComplete) {
          onRecordingComplete(videoResult);
        }
      };

      recorder.start(1000);
      setIsRecording(true);
      setElapsedMs(0);

      timerIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        setElapsedMs(elapsed);

        if (elapsed >= maxDurationSeconds * 1000) {
          cleanupTimer();
          stopRecording();
          if (onAutoStop) {
            onAutoStop();
          }
        }
      }, 100);

      return true;
    },
    [discardRecording, maxDurationSeconds, maxSizeBytes, onRecordingComplete, onAutoStop, cleanupTimer, stopRecording]
  );

  useEffect(() => {
    return () => {
      cleanupTimer();
    };
  }, [cleanupTimer]);

  return {
    isRecording,
    isPaused,
    elapsedMs,
    recordedVideo,
    error,
    startRecording,
    stopRecording,
    discardRecording,
    setExternalRecording,
    supportedMimeType: chosenMimeTypeRef.current || getBestSupportedMimeType(),
  };
}
