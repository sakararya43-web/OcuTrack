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
import { ApiClientError } from '../services/apiClient';
import { soundFx } from '../lib/soundFx';

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
    soundFx.playClick();
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
    soundFx.playTick();
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
        soundFx.playTick();
        return prev - 1;
      });
    }, 1000);
  };

  const handleStopRecording = () => {
    soundFx.playClick();
    setIsTargetActive(false);
    recorder.stopRecording();
  };

  const handleTargetComplete = (meta: TargetTrajectoryMetadata) => {
    setTrajectoryMetadata(meta);
  };

  const handleSampleSelected = (sampleVideo: RecordedVideo) => {
    soundFx.playClick();
    recorder.discardRecording();
    setIsFallbackMode(true);
    (recorder as any).recordedVideo = sampleVideo;

    // Use standardized reference trajectory for benchmark
    const referenceTraj = generateFullTrajectory();
    setTrajectoryMetadata(referenceTraj);
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

  const handleUploadAndAnalyze = async () => {
    if (!assessmentId || !recordedVideo) return;
    setIsUploading(true);
    setUploadError(null);

    try {
      const trajectoryPayload = trajectoryMetadata || generateFullTrajectory();

      await uploadPursuitVideo(assessmentId, recordedVideo.blob, {
        is_fallback_benchmark: isFallbackMode,
        trajectory: trajectoryPayload,
        protocol_version: PROTOCOL_VERSION,
        source: isFallbackMode ? 'synthetic_benchmark' : 'webcam_live',
      });

      // Trigger asynchronous analysis
      await triggerAnalysis(assessmentId);
      soundFx.playSuccess();

      // Navigate to processing screen
      navigate(`/assessments/${assessmentId}/processing`);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setUploadError({ message: err.message, isUnavailable: err.isUnavailable });
      } else if (err instanceof Error) {
        setUploadError({ message: err.message, isUnavailable: false });
      } else {
        setUploadError({ message: 'Pursuit recording upload could not be completed.', isUnavailable: true });
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-[#0F172A]">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E2E8F0] pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#F1F5F9] text-[#0F172A] border border-[#E2E8F0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E]" />
              Protocol Test 02 · Smooth Pursuit Kinematics
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-normal text-[#0F172A] tracking-tight">
            Smooth-Pursuit <span className="italic text-[#475569]">Kinematics Test</span>
          </h1>
          <p className="text-sm text-[#475569] font-normal font-sans">
            Calibrated 10-second harmonic target sweep across the horizontal visual arena.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs">
          <span className="text-[#64748B]">TARGET:</span>
          <span className="px-2.5 py-1 bg-white border border-[#E2E8F0] rounded text-[#0F172A] font-semibold">
            {TARGET_DURATION_S}s @ 30 FPS
          </span>
        </div>
      </div>

      {/* Instructions Card */}
      <div className="panel-ramp p-5 flex items-start gap-3.5 text-xs leading-relaxed font-sans shadow-sm">
        <div className="p-2 rounded-md bg-[#F1F5F9] text-[#0F172A] border border-[#E2E8F0] shrink-0">
          <Crosshair className="w-4 h-4" />
        </div>
        <div className="space-y-0.5 text-[#475569]">
          <strong className="text-[#0F172A] font-mono text-xs uppercase block font-semibold">Participant Instruction:</strong>
          Keep your head steady. Follow the moving target dot across the screen with your eyes smoothly. Do not anticipate movement or make premature saccadic jumps.
        </div>
      </div>

      {/* Capture Arena */}
      {recordedVideo ? (
        /* Video Review & Upload Phase */
        <div className="panel-ramp p-8 space-y-6 shadow-ramp-card">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-[#0F172A]" />
              <h2 className="font-mono text-xs uppercase tracking-wider text-[#0F172A] font-semibold">
                Review Recorded Pursuit Sequence
              </h2>
            </div>
            {isFallbackMode && (
              <span className="px-2 py-0.5 text-[10px] font-semibold font-mono rounded bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Video preview */}
            <div className="bg-[#0F1117] overflow-hidden aspect-video border border-[#27282D] rounded-lg shadow-sm">
              <video
                src={recordedVideo.previewUrl}
                controls
                className="w-full h-full object-cover"
              />
            </div>

            {/* Trajectory & recording metadata summary */}
            <div className="space-y-4 font-mono text-xs">
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Video Duration:</span>
                  <span className="font-semibold text-[#0F172A]">{(recordedVideo.durationMs / 1000).toFixed(2)}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Target Coordinates:</span>
                  <span className="font-semibold text-[#0F172A]">
                    {trajectoryMetadata ? `${trajectoryMetadata.coordinates_normalized.length} logged` : 'Standard sweep'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Container:</span>
                  <span className="font-semibold text-[#0F172A]">{recordedVideo.mimeType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Path Version:</span>
                  <span className="font-semibold text-[#0F172A]">{PURSUIT_PATH_VERSION}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Protocol:</span>
                  <span className="font-semibold text-[#0F172A]">{PROTOCOL_VERSION}</span>
                </div>
              </div>

              {/* Quality Feedback */}
              {qualityFeedback && (
                <div
                  className={`p-3.5 rounded-lg border text-xs space-y-1.5 ${
                    qualityFeedback.isAcceptable
                      ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#0F172A]'
                      : 'bg-[#FEF2F2] border-[#FECACA] text-[#0F172A]'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span className="flex items-center gap-1.5">
                      {qualityFeedback.isAcceptable ? (
                        <CheckCircle2 className="w-4 h-4 text-[#0F766E]" />
                      ) : (
                        <ShieldAlert className="w-4 h-4 text-[#B91C1C]" />
                      )}
                      Capture Quality Assessment:
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        qualityFeedback.isAcceptable
                          ? 'bg-white text-[#0F766E] border border-[#BBF7D0]'
                          : 'bg-white text-[#B91C1C] border border-[#FECACA]'
                      }`}
                    >
                      {qualityFeedback.reviewMessage}
                    </span>
                  </div>
                  {qualityFeedback.warnings.length > 0 && (
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] text-[#475569] font-sans">
                      {qualityFeedback.warnings.map((w, idx) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
                  )}
                  {!qualityFeedback.isAcceptable && (
                    <p className="text-[11px] font-semibold text-[#B91C1C]">
                      Quality check failed. Please discard and retake before sending for analysis.
                    </p>
                  )}
                </div>
              )}

              <p className="text-xs text-[#475569] leading-relaxed font-sans">
                Both test recordings are now ready. Clicking <strong>Upload &amp; Trigger Analysis</strong> will transmit the video files and trajectory coordinates to the backend to begin computer vision extraction.
              </p>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    recorder.discardRecording();
                    setIsFallbackMode(false);
                    setTrajectoryMetadata(null);
                    setUploadError(null);
                  }}
                  disabled={isUploading}
                  className="btn-ramp-secondary py-2 px-3.5 text-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Discard &amp; Retake</span>
                </button>

                <button
                  type="button"
                  onClick={handleUploadAndAnalyze}
                  disabled={isUploading}
                  className="btn-ramp-primary py-2 px-4 ml-auto text-xs shadow-sm"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading &amp; Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Upload &amp; Trigger Analysis</span>
                      <ArrowRight className="w-3.5 h-3.5" />
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
          {/* Target Arena */}
          <div className="rounded-xl overflow-hidden shadow-ramp-card">
            <SmoothPursuitTarget
              isActive={isTargetActive}
              onComplete={handleTargetComplete}
            />
          </div>

          {/* Picture-in-Picture or camera preview below target */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-2">
              <h4 className="text-xs font-mono uppercase tracking-wider text-[#64748B] font-semibold">
                Participant Camera Preview
              </h4>
              <div className="rounded-xl overflow-hidden shadow-sm">
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
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-mono uppercase tracking-wider text-[#64748B] font-semibold">
                Session Controls
              </h4>

              <div className="panel-ramp p-6 space-y-4">
                <div className="text-xs text-[#475569] leading-relaxed font-sans">
                  Clicking <strong>Start Pursuit Recording</strong> will initialize camera capture and synchronize the 10-second target sweep.
                </div>

                {recorder.isRecording ? (
                  <div className="space-y-3 font-mono">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#B91C1C] font-semibold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#B91C1C] animate-pulse" />
                        SYNCHRONIZED RECORDING
                      </span>
                      <span className="text-[#0F172A] font-semibold">
                        {(recorder.elapsedMs / 1000).toFixed(1)}s / {TARGET_DURATION_S}.0s
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleStopRecording}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-xs font-medium text-white bg-[#B91C1C] hover:bg-[#991B1B] transition-colors shadow-sm"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Stop Pursuit Recording</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartCountdown}
                    className="btn-ramp-primary w-full justify-center text-xs py-2.5 shadow-sm"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start Pursuit Recording (10s)</span>
                  </button>
                )}
              </div>

              {countdown !== null && (
                <div className="p-5 panel-ramp text-center space-y-1 font-mono shadow-sm">
                  <span className="text-4xl font-sans font-bold text-[#0F172A]">{countdown}</span>
                  <p className="text-xs text-[#64748B]">Synchronizing target sweep...</p>
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
