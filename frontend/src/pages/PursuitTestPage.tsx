import React, { useState } from 'react';
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
import { ApiClientError } from '../services/apiClient';

export const PursuitTestPage: React.FC = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();

  const [countdown, setCountdown] = useState<number | null>(null);
  const [isTargetActive, setIsTargetActive] = useState<boolean>(false);
  const [isFallbackMode, setIsFallbackMode] = useState<boolean>(false);
  const [trajectoryMetadata, setTrajectoryMetadata] = useState<TargetTrajectoryMetadata | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<{ message: string; isUnavailable: boolean } | null>(null);

  const TARGET_DURATION_S = PURSUIT_DURATION_MS / 1000;

  const camera = useCamera();
  const recorder = useMediaRecorder({
    maxDurationSeconds: TARGET_DURATION_S,
    onAutoStop: () => {
      setIsTargetActive(false);
    },
  });

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

  const triggerCountdown = () => {
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
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
    recorder.discardRecording();
    (recorder as any).recordedVideo = sampleVideo;
    camera.stopCamera();
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
      // Step 1: Upload pursuit video and target coordinates to Parth's FastAPI backend
      await uploadPursuitVideo(assessmentId, recorder.recordedVideo.blob, metadata);

      // Step 2: Trigger analysis pipeline execution
      await triggerAnalysis(assessmentId);

      // Step 3: Transition to honest processing / polling page
      navigate(`/assessments/${assessmentId}/processing`);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setUploadError({ message: err.message, isUnavailable: err.isUnavailable });
      } else if (err instanceof Error) {
        setUploadError({ message: err.message, isUnavailable: false });
      } else {
        setUploadError({ message: 'Failed to upload pursuit video or trigger analysis.', isUnavailable: true });
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
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-sky-700">Test 2 of 2</span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Crosshair className="w-6 h-6 text-sky-600" />
            Smooth-Pursuit Eye Movement Test
          </h1>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono text-slate-500">Session: {assessmentId?.slice(0, 8)}...</span>
        </div>
      </div>

      {/* Protocol Instructions */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">Protocol Instructions</h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          When the test starts, a high-contrast target will sweep horizontally across the screen for 10 seconds.
          Follow the moving target smoothly with your eyes. <strong>Keep your head still</strong> and minimize blinking during the sweep.
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700 flex items-start gap-2 font-mono">
          <span className="text-sky-700 font-bold">&bull;</span>
          <span>Target Trajectory ID: <strong className="text-slate-900">{PURSUIT_PATH_VERSION}</strong> &bull; Sweep Duration: <strong>10.0s</strong></span>
        </div>
      </div>

      {/* Review or Capture State */}
      {recordedVideo ? (
        /* Video Review State */
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h3 className="font-semibold text-slate-900 text-base">Pursuit Recording &amp; Trajectory Synchronized</h3>
            </div>
            {isFallbackMode && (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                Fallback Benchmark Sample
              </span>
            )}
          </div>

          {uploadError && (
            <ErrorAlert
              message={uploadError.message}
              isUnavailable={uploadError.isUnavailable}
              onRetry={handleUploadAndAnalyze}
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Video preview */}
            <div className="bg-slate-950 rounded-xl overflow-hidden aspect-video border border-slate-800">
              <video
                src={recordedVideo.previewUrl}
                controls
                className="w-full h-full object-cover"
              />
            </div>

            {/* Trajectory & recording metadata summary */}
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Video Duration:</span>
                  <span className="font-semibold text-slate-900">{(recordedVideo.durationMs / 1000).toFixed(2)}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Target Points Logged:</span>
                  <span className="font-semibold text-sky-800">
                    {trajectoryMetadata ? `${trajectoryMetadata.coordinates_normalized.length} coordinates` : 'Standard trajectory'}
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

              {/* Basic Capture Quality Feedback */}
              {qualityFeedback && (
                <div
                  className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                    qualityFeedback.isAcceptable
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span className="flex items-center gap-1.5">
                      {qualityFeedback.isAcceptable ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <RotateCcw className="w-4 h-4 text-rose-600" />
                      )}
                      Capture Quality Assessment:
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        qualityFeedback.isAcceptable
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {qualityFeedback.reviewMessage}
                    </span>
                  </div>
                  {qualityFeedback.warnings.length > 0 && (
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] opacity-90">
                      {qualityFeedback.warnings.map((w, idx) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
                  )}
                  {!qualityFeedback.isAcceptable && (
                    <p className="text-[11px] font-medium text-rose-700">
                      Quality check failed. Please discard and retake before sending for analysis.
                    </p>
                  )}
                </div>
              )}

              <p className="text-xs text-slate-500 leading-relaxed">
                Both test recordings are now ready. Clicking <strong>Upload &amp; Trigger Analysis</strong> will transmit the video files and trajectory coordinates to the backend to begin computer vision extraction.
              </p>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    recorder.discardRecording();
                    setIsFallbackMode(false);
                    setTrajectoryMetadata(null);
                    setUploadError(null);
                  }}
                  disabled={isUploading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Discard &amp; Retake
                </button>

                <button
                  type="button"
                  onClick={handleUploadAndAnalyze}
                  disabled={isUploading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-sm transition-colors ml-auto disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading &amp; Analyzing...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      Upload &amp; Trigger Analysis
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Capture Arena */
        <div className="space-y-6">
          {/* Target Arena (displays when recording is active or previewing) */}
          <SmoothPursuitTarget
            isActive={isTargetActive}
            onComplete={handleTargetComplete}
          />

          {/* Picture-in-Picture or camera preview below target */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
            <div>
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Participant Camera Preview
              </h4>
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
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Session Controls
              </h4>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                <div className="text-xs text-slate-600 leading-relaxed">
                  Clicking <strong>Start Pursuit Recording</strong> will initialize camera capture and synchronize the 10-second target sweep.
                </div>

                {recorder.isRecording ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-rose-600 font-semibold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                        SYNCHRONIZED RECORDING
                      </span>
                      <span className="text-slate-800 font-bold">
                        {(recorder.elapsedMs / 1000).toFixed(1)}s / {TARGET_DURATION_S}.0s
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleStopRecording}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors"
                    >
                      <Square className="w-4 h-4 fill-current" />
                      Stop Pursuit Recording
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartCountdown}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-sm transition-colors"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Start Pursuit Recording (10s)
                  </button>
                )}
              </div>

              {countdown !== null && (
                <div className="p-4 bg-slate-900 text-white rounded-xl text-center space-y-1">
                  <span className="text-3xl font-extrabold text-cyan-400">{countdown}</span>
                  <p className="text-xs text-slate-300">Synchronizing target sweep...</p>
                </div>
              )}
            </div>
          </div>

          {/* Fallback Option */}
          <SampleVideoFallback
            testType="smooth_pursuit"
            onSampleSelected={handleSampleSelected}
          />
        </div>
      )}
    </div>
  );
};
