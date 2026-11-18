import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Play,
  Square,
  RotateCcw,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  SunMedium,
  Eye,
  UploadCloud,
  Loader2,
} from 'lucide-react';
import { useCamera } from '../hooks/useCamera';
import { useMediaRecorder, RecordedVideo } from '../hooks/useMediaRecorder';
import { useRecordingQuality } from '../hooks/useRecordingQuality';
import { CameraPreview } from '../components/capture/CameraPreview';
import { SampleVideoFallback } from '../components/capture/SampleVideoFallback';
import { uploadPupilVideo, triggerAnalysis } from '../services/assessmentService';
import { PROTOCOL_VERSION } from '../lib/constants';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { ApiClientError } from '../services/apiClient';

export const PupilTestPage: React.FC = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const isPupilOnlyMode = searchParams.get('mode') === 'pupil_only';

  const [countdown, setCountdown] = useState<number | null>(null);
  const [isStimulusActive, setIsStimulusActive] = useState<boolean>(false);
  const [isFallbackMode, setIsFallbackMode] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<{ message: string; isUnavailable: boolean } | null>(null);

  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const TARGET_DURATION_S = 15;

  const camera = useCamera();
  const recorder = useMediaRecorder({
    maxDurationSeconds: TARGET_DURATION_S,
  });

  // Clean up countdown timer on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  // Schedule diffuse screen flash stimulus at 5-second mark
  useEffect(() => {
    if (recorder.isRecording) {
      let endTimer: ReturnType<typeof setTimeout> | null = null;
      const stimulusTimer = setTimeout(() => {
        setIsStimulusActive(true);
        endTimer = setTimeout(() => setIsStimulusActive(false), 1500);
      }, 5000);

      return () => {
        clearTimeout(stimulusTimer);
        if (endTimer) clearTimeout(endTimer);
      };
    } else {
      setIsStimulusActive(false);
    }
  }, [recorder.isRecording]);

  const triggerCountdown = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    setCountdown(3);
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          if (camera.stream) {
            recorder.startRecording(camera.stream);
          }
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleStartCountdown = () => {
    if (!camera.isCameraActive) {
      camera.startCamera().then((success) => {
        if (success) {
          triggerCountdown();
        }
      });
    } else {
      triggerCountdown();
    }
  };

  const handleSampleSelected = (sampleVideo: RecordedVideo) => {
    setIsFallbackMode(true);
    setUploadError(null);
    camera.stopCamera();
    recorder.setExternalRecording(sampleVideo);
  };

  const handleUploadAndProceed = async () => {
    if (!assessmentId || !recorder.recordedVideo) return;

    setIsUploading(true);
    setUploadError(null);

    const metadata = {
      protocol_version: PROTOCOL_VERSION,
      test_type: 'pupil_reflex',
      captured_at: recorder.recordedVideo.recordedAt,
      duration_ms: recorder.recordedVideo.durationMs,
      mime_type: recorder.recordedVideo.mimeType,
      is_fallback: isFallbackMode,
      device_metadata: {
        user_agent: navigator.userAgent,
        width: camera.observedSettings?.width || 1280,
        height: camera.observedSettings?.height || 720,
        frame_rate: camera.observedSettings?.frameRate || 30,
      },
      lighting_metadata: {
        method: 'controlled_ambient_screen_flash',
        notes: isFallbackMode
          ? 'Labelled Benchmark Sample Fallback'
          : 'Standard live diffuse ambient session',
      },
    };

    try {
      await uploadPupilVideo(assessmentId, recorder.recordedVideo.blob, metadata);
      if (isPupilOnlyMode) {
        await triggerAnalysis(assessmentId);
        navigate(`/assessments/${assessmentId}/processing`);
      } else {
        navigate(`/assessments/${assessmentId}/pursuit-test`);
      }
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setUploadError({ message: err.message, isUnavailable: err.isUnavailable });
      } else if (err instanceof Error) {
        setUploadError({ message: err.message, isUnavailable: false });
      } else {
        setUploadError({
          message: 'Failed to upload pupil video to backend server.',
          isUnavailable: true,
        });
      }
    } finally {
      setIsUploading(false);
    }
  };

  const recordedVideo = recorder.recordedVideo;

  const qualityFeedback = useRecordingQuality(
    recordedVideo
      ? {
          durationMs: recordedVideo.durationMs,
          sizeBytes: recordedVideo.sizeBytes,
          observedSettings: camera.observedSettings,
          testType: 'pupil_reflex',
          isFallback: isFallbackMode,
        }
      : null
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-sky-800">
            {isPupilOnlyMode ? 'Single-Test Protocol' : 'Test 1 of 2'}
          </span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Eye className="w-6 h-6 text-sky-700" aria-hidden="true" />
            Pupil Light Reflex Recording
          </h1>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono text-slate-500">
            Session: {assessmentId?.slice(0, 8)}...
          </span>
        </div>
      </div>

      {/* Safety Instructions */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-start gap-3">
            <SunMedium className="w-5 h-5 text-sky-700 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-slate-900">
                Standardized Controlled-Lighting Protocol
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Position the participant approximately 50 cm from the webcam under uniform, diffuse
                ambient lighting. At the 5-second mark of the 15-second recording, a white screen
                stimulus will appear briefly for 1.5 seconds.
              </p>
            </div>
          </div>

          <Alert
            variant="clinical"
            icon={<ShieldAlert className="w-4 h-4 text-slate-700" aria-hidden="true" />}
          >
            <strong>Safety Notice:</strong> Never direct high-intensity flashlight, torch, or laser
            beams directly into the eye. Rely on the controlled diffuse screen flash stimulus.
          </Alert>
        </CardContent>
      </Card>

      {/* Stimulus Flash Overlay */}
      {isStimulusActive && (
        <div
          role="status"
          aria-live="assertive"
          className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center pointer-events-none transition-opacity duration-150"
        >
          <span className="text-slate-900 font-bold text-2xl tracking-wider">
            LIGHT STIMULUS (KEEP EYES OPEN)
          </span>
        </div>
      )}

      {/* Capture or Review Arena */}
      {recordedVideo ? (
        <Card>
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-teal-700" aria-hidden="true" />
                <h2 className="font-semibold text-slate-900 text-base">
                  Pupil Recording Captured
                </h2>
              </div>
              {isFallbackMode && <Badge variant="medical">Fallback Benchmark Sample</Badge>}
            </div>

            {uploadError && (
              <ErrorAlert
                message={uploadError.message}
                isUnavailable={uploadError.isUnavailable}
                onRetry={handleUploadAndProceed}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div className="bg-slate-950 rounded-md overflow-hidden aspect-video border border-slate-800">
                <video
                  src={recordedVideo.previewUrl}
                  controls
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Actual Duration:</span>
                    <span className="font-semibold text-slate-900">
                      {(recordedVideo.durationMs / 1000).toFixed(2)}s
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">File Size:</span>
                    <span className="font-semibold text-slate-900">
                      {(recordedVideo.sizeBytes / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">MIME Container:</span>
                    <span className="font-semibold text-slate-900">{recordedVideo.mimeType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Protocol Version:</span>
                    <span className="font-semibold text-slate-900">{PROTOCOL_VERSION}</span>
                  </div>
                </div>

                {qualityFeedback && (
                  <Alert
                    variant={qualityFeedback.isAcceptable ? 'teal' : 'destructive'}
                    icon={
                      qualityFeedback.isAcceptable ? (
                        <CheckCircle2 className="w-4 h-4 text-teal-700" aria-hidden="true" />
                      ) : (
                        <ShieldAlert className="w-4 h-4 text-rose-700" aria-hidden="true" />
                      )
                    }
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2 font-semibold">
                        <span>Capture Quality Assessment</span>
                        <Badge variant={qualityFeedback.isAcceptable ? 'teal' : 'destructive'}>
                          {qualityFeedback.reviewMessage}
                        </Badge>
                      </div>
                      {qualityFeedback.warnings.length > 0 && (
                        <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                          {qualityFeedback.warnings.map((w, idx) => (
                            <li key={idx}>{w}</li>
                          ))}
                        </ul>
                      )}
                      {!qualityFeedback.isAcceptable && (
                        <p className="text-[11px] font-medium text-rose-800">
                          Quality check failed. Discard and retake before sending for analysis.
                        </p>
                      )}
                    </div>
                  </Alert>
                )}

                <p className="text-xs text-slate-600 leading-relaxed">
                  Review the recorded pupil video to verify focus and consistent eye visibility.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      recorder.discardRecording();
                      setIsFallbackMode(false);
                      setUploadError(null);
                    }}
                    disabled={isUploading}
                  >
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                    Discard &amp; Retake
                  </Button>

                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleUploadAndProceed}
                    disabled={isUploading}
                    className="ml-auto"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        Uploading Video...
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4" aria-hidden="true" />
                        {isPupilOnlyMode
                          ? 'Upload & Trigger Analysis'
                          : 'Upload & Continue to Pursuit'}
                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          <div className="relative">
            <CameraPreview
              videoRef={camera.videoRef}
              isCameraActive={camera.isCameraActive}
              isLoading={camera.isLoading}
              error={camera.error}
              observedSettings={camera.observedSettings}
              onStartCamera={camera.startCamera}
              onStopCamera={camera.stopCamera}
              onToggleTorch={camera.toggleTorch}
              isRecording={recorder.isRecording}
            />

            {countdown !== null && (
              <div
                role="status"
                aria-live="assertive"
                className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center text-white z-20 rounded-md"
              >
                <span className="text-7xl font-bold font-mono text-sky-400">{countdown}</span>
                <span className="text-sm font-medium text-slate-200 mt-2">
                  Get ready: look directly toward the camera
                </span>
              </div>
            )}
          </div>

          {recorder.isRecording && (
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-rose-700 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-sm bg-rose-600" aria-hidden="true"></span>
                    RECORDING IN PROGRESS
                  </span>
                  <span className="text-slate-800 font-bold">
                    {(recorder.elapsedMs / 1000).toFixed(1)}s / {TARGET_DURATION_S}.0s
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-sm overflow-hidden">
                  <div
                    className="bg-rose-600 h-full"
                    style={{
                      width: `${Math.min(100, (recorder.elapsedMs / (TARGET_DURATION_S * 1000)) * 100)}%`,
                    }}
                  ></div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Controls Bar */}
          <Card>
            <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-600">
                {recorder.isRecording
                  ? 'Recording will stop automatically at 15 seconds.'
                  : 'Click Start to run a 3-second countdown before capture.'}
              </div>

              <div>
                {recorder.isRecording ? (
                  <Button type="button" variant="destructive" size="sm" onClick={recorder.stopRecording}>
                    <Square className="w-4 h-4 fill-current" aria-hidden="true" />
                    Stop Recording
                  </Button>
                ) : (
                  <Button type="button" variant="primary" onClick={handleStartCountdown}>
                    <Play className="w-4 h-4 fill-current" aria-hidden="true" />
                    Start 15s Recording
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <SampleVideoFallback testType="pupil_reflex" onSampleSelected={handleSampleSelected} />
        </div>
      )}
    </div>
  );
};
