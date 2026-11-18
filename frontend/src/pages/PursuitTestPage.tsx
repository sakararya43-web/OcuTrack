import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Play,
  Square,
  RotateCcw,
  CheckCircle2,
  Crosshair,
  UploadCloud,
  Loader2,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { useCamera } from '../hooks/useCamera';
import { useMediaRecorder, RecordedVideo } from '../hooks/useMediaRecorder';
import { useRecordingQuality } from '../hooks/useRecordingQuality';
import { CameraPreview } from '../components/capture/CameraPreview';
import {
  SmoothPursuitTarget,
  TargetTrajectoryMetadata,
  PURSUIT_DURATION_MS,
  PURSUIT_PATH_VERSION,
  generateFullTrajectory,
} from '../components/capture/SmoothPursuitTarget';
import { SampleVideoFallback } from '../components/capture/SampleVideoFallback';
import { uploadPursuitVideo, triggerAnalysis } from '../services/assessmentService';
import { PROTOCOL_VERSION } from '../lib/constants';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { ApiClientError } from '../services/apiClient';

export const PursuitTestPage: React.FC = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();

  const [countdown, setCountdown] = useState<number | null>(null);
  const [isTargetActive, setIsTargetActive] = useState<boolean>(false);
  const [isFallbackMode, setIsFallbackMode] = useState<boolean>(false);
  const [trajectoryMetadata, setTrajectoryMetadata] = useState<TargetTrajectoryMetadata | null>(
    null
  );
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<{ message: string; isUnavailable: boolean } | null>(
    null
  );

  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const TARGET_DURATION_S = PURSUIT_DURATION_MS / 1000;

  const camera = useCamera();
  const recorder = useMediaRecorder({
    maxDurationSeconds: TARGET_DURATION_S,
    onAutoStop: () => {
      setIsTargetActive(false);
    },
  });

  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

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
            setIsTargetActive(true);
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

  const handleStopRecording = () => {
    setIsTargetActive(false);
    recorder.stopRecording();
  };

  const handleTargetComplete = (trajectory: TargetTrajectoryMetadata) => {
    setTrajectoryMetadata(trajectory);
    recorder.stopRecording();
    setIsTargetActive(false);
  };

  const handleSampleSelected = (sampleVideo: RecordedVideo) => {
    setIsFallbackMode(true);
    setUploadError(null);
    camera.stopCamera();
    recorder.setExternalRecording(sampleVideo);
    setTrajectoryMetadata(generateFullTrajectory());
  };

  const handleUploadAndAnalyze = async () => {
    if (!assessmentId || !recorder.recordedVideo) return;

    setIsUploading(true);
    setUploadError(null);

    const activeTrajectory = trajectoryMetadata || generateFullTrajectory();

    const metadata = {
      protocol_version: PROTOCOL_VERSION,
      test_type: 'smooth_pursuit',
      captured_at: recorder.recordedVideo.recordedAt,
      duration_ms: recorder.recordedVideo.durationMs,
      mime_type: recorder.recordedVideo.mimeType,
      is_fallback: isFallbackMode,
      target_path: activeTrajectory,
      device_metadata: {
        user_agent: navigator.userAgent,
        width: camera.observedSettings?.width || 1280,
        height: camera.observedSettings?.height || 720,
        frame_rate: camera.observedSettings?.frameRate || 30,
      },
    };

    try {
      await uploadPursuitVideo(assessmentId, recorder.recordedVideo.blob, metadata);
      await triggerAnalysis(assessmentId);
      navigate(`/assessments/${assessmentId}/processing`);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setUploadError({ message: err.message, isUnavailable: err.isUnavailable });
      } else if (err instanceof Error) {
        setUploadError({ message: err.message, isUnavailable: false });
      } else {
        setUploadError({
          message: 'Failed to upload pursuit video or trigger analysis.',
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
          testType: 'smooth_pursuit',
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
            Test 2 of 2
          </span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Crosshair className="w-6 h-6 text-sky-700" aria-hidden="true" />
            Smooth-Pursuit Eye Movement Test
          </h1>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono text-slate-500">
            Session: {assessmentId?.slice(0, 8)}...
          </span>
        </div>
      </div>

      {/* Protocol Instructions */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <h2 className="text-sm font-semibold text-slate-900">Protocol Instructions</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            When the test starts, a high-contrast target will sweep horizontally across the field
            for 10 seconds. Follow the moving target smoothly with your eyes.{' '}
            <strong>Keep your head still</strong> and minimize blinking during the sweep.
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-md p-3 text-xs text-slate-700 font-mono">
            Target Trajectory ID: <strong className="text-slate-900">{PURSUIT_PATH_VERSION}</strong>{' '}
            &bull; Sweep Duration: <strong className="text-slate-900">10.0s</strong>
          </div>
        </CardContent>
      </Card>

      {/* Review or Capture State */}
      {recordedVideo ? (
        <Card>
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-teal-700" aria-hidden="true" />
                <h2 className="font-semibold text-slate-900 text-base">
                  Pursuit Recording &amp; Trajectory Synchronized
                </h2>
              </div>
              {isFallbackMode && <Badge variant="medical">Fallback Benchmark Sample</Badge>}
            </div>

            {uploadError && (
              <ErrorAlert
                message={uploadError.message}
                isUnavailable={uploadError.isUnavailable}
                onRetry={handleUploadAndAnalyze}
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
                    <span className="text-slate-500">Video Duration:</span>
                    <span className="font-semibold text-slate-900">
                      {(recordedVideo.durationMs / 1000).toFixed(2)}s
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Target Points Logged:</span>
                    <span className="font-semibold text-sky-800">
                      {trajectoryMetadata
                        ? `${trajectoryMetadata.coordinates_normalized.length} coordinates`
                        : 'Standard trajectory'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">MIME Container:</span>
                    <span className="font-semibold text-slate-900">{recordedVideo.mimeType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Target Path Version:</span>
                    <span className="font-semibold text-slate-900">{PURSUIT_PATH_VERSION}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Protocol:</span>
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
                  Recordings are ready. Clicking <strong>Upload &amp; Trigger Analysis</strong>{' '}
                  transmits the video and synchronized target coordinates to the backend pipeline.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      recorder.discardRecording();
                      setIsFallbackMode(false);
                      setTrajectoryMetadata(null);
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
                    onClick={handleUploadAndAnalyze}
                    disabled={isUploading}
                    className="ml-auto"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        Uploading &amp; Analyzing...
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4" aria-hidden="true" />
                        Upload &amp; Trigger Analysis
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
        <div className="space-y-6">
          <SmoothPursuitTarget isActive={isTargetActive} onComplete={handleTargetComplete} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
            <div>
              <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Participant Camera Preview
              </h3>
              <CameraPreview
                videoRef={camera.videoRef}
                isCameraActive={camera.isCameraActive}
                isLoading={camera.isLoading}
                error={camera.error}
                observedSettings={camera.observedSettings}
                onStartCamera={camera.startCamera}
                onStopCamera={camera.stopCamera}
                isRecording={recorder.isRecording}
                showOverlay={false}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Session Controls
              </h3>

              <Card>
                <CardContent className="p-5 space-y-4">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Clicking <strong>Start Pursuit Recording</strong> initializes camera capture and
                    synchronizes the 10-second horizontal target sweep.
                  </p>

                  {recorder.isRecording ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-rose-700 font-semibold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-sm bg-rose-600" aria-hidden="true"></span>
                          SYNCHRONIZED RECORDING
                        </span>
                        <span className="text-slate-900 font-bold">
                          {(recorder.elapsedMs / 1000).toFixed(1)}s / {TARGET_DURATION_S}.0s
                        </span>
                      </div>

                      <Button
                        type="button"
                        variant="destructive"
                        onClick={handleStopRecording}
                        className="w-full"
                      >
                        <Square className="w-4 h-4 fill-current" aria-hidden="true" />
                        Stop Pursuit Recording
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="primary"
                      onClick={handleStartCountdown}
                      className="w-full"
                    >
                      <Play className="w-4 h-4 fill-current" aria-hidden="true" />
                      Start Pursuit Recording (10s)
                    </Button>
                  )}
                </CardContent>
              </Card>

              {countdown !== null && (
                <div
                  role="status"
                  aria-live="assertive"
                  className="p-4 bg-slate-900 text-white rounded-md text-center space-y-1 border border-slate-700"
                >
                  <span className="text-3xl font-bold font-mono text-sky-400">{countdown}</span>
                  <p className="text-xs text-slate-300">Synchronizing target sweep...</p>
                </div>
              )}
            </div>
          </div>

          <SampleVideoFallback testType="smooth_pursuit" onSampleSelected={handleSampleSelected} />
        </div>
      )}
    </div>
  );
};
