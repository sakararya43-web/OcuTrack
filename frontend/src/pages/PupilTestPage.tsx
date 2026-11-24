import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { uploadPupilVideo } from '../services/assessmentService';
import { PROTOCOL_VERSION } from '../lib/constants';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { ApiClientError } from '../services/apiClient';
import { soundFx } from '../lib/soundFx';

export const PupilTestPage: React.FC = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();

  const [countdown, setCountdown] = useState<number | null>(null);
  const [isStimulusActive, setIsStimulusActive] = useState<boolean>(false);
  const [isFallbackMode, setIsFallbackMode] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<{ message: string; isUnavailable: boolean } | null>(null);

  const TARGET_DURATION_S = 15;

  const camera = useCamera();
  const recorder = useMediaRecorder({
    maxDurationSeconds: TARGET_DURATION_S,
  });

  // Schedule diffuse screen flash stimulus at 5-second mark
  useEffect(() => {
    if (recorder.isRecording) {
      const stimulusTimer = setTimeout(() => {
        soundFx.playFlash();
        setIsStimulusActive(true);
        setTimeout(() => setIsStimulusActive(false), 1500);
      }, 5000);

      return () => clearTimeout(stimulusTimer);
    } else {
      setIsStimulusActive(false);
    }
  }, [recorder.isRecording]);

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
          }
          return null;
        }
        soundFx.playTick();
        return prev - 1;
      });
    }, 1000);
  };

  const handleSampleSelected = (sampleVideo: RecordedVideo) => {
    soundFx.playClick();
    recorder.discardRecording();
    setIsFallbackMode(true);
    (recorder as any).recordedVideo = sampleVideo;
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

  const handleUploadAndProceed = async () => {
    if (!assessmentId || !recordedVideo) return;
    setIsUploading(true);
    setUploadError(null);

    try {
      await uploadPupilVideo(assessmentId, recordedVideo.blob, {
        is_fallback_benchmark: isFallbackMode,
        stimulus_onset_seconds: 5.0,
        protocol_version: PROTOCOL_VERSION,
        source: isFallbackMode ? 'synthetic_benchmark' : 'webcam_live',
      });
      soundFx.playSuccess();
      navigate(`/assessments/${assessmentId}/pursuit-test`);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setUploadError({ message: err.message, isUnavailable: err.isUnavailable });
      } else if (err instanceof Error) {
        setUploadError({ message: err.message, isUnavailable: false });
      } else {
        setUploadError({ message: 'Video upload could not be completed.', isUnavailable: true });
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-[#0F172A]">
      {/* Diffuse Stimulus Flash Overlay */}
      {isStimulusActive && (
        <div
          role="region"
          aria-label="Light stimulus active"
          className="fixed inset-0 bg-white z-50 pointer-events-none transition-opacity duration-200 opacity-95 flex items-center justify-center text-[#0F172A] font-mono text-sm font-bold tracking-wider uppercase shadow-2xl"
        >
          <span>[ Diffuse Light Stimulus Active: Hold Gaze ]</span>
        </div>
      )}

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E2E8F0] pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#F1F5F9] text-[#0F172A] border border-[#E2E8F0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E]" />
              Protocol Test 01 · Pupillometry
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-normal text-[#0F172A] tracking-tight">
            Autonomic Pupillary <span className="italic text-[#475569]">Light Reflex Test</span>
          </h1>
          <p className="text-sm text-[#475569] font-normal font-sans">
            Calibrated 15-second recording. A diffuse screen illumination pulse occurs automatically at second 5.0.
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
        <div className="p-2 rounded-md bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] shrink-0">
          <SunMedium className="w-4 h-4" />
        </div>
        <div className="space-y-0.5 text-[#475569]">
          <strong className="text-[#0F172A] font-mono text-xs uppercase block font-semibold">Participant Instruction:</strong>
          Sit approximately 45–50 cm from the camera. Look straight ahead into the reticle guide. Keep eyes open and steady. At second 5.0, the screen will illuminate briefly to measure constriction onset latency and velocity.
        </div>
      </div>

      {/* Capture Arena */}
      {recordedVideo ? (
        /* Video Review & Upload Phase */
        <div className="panel-ramp p-8 space-y-6 shadow-ramp-card">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#0F172A]" />
              <h2 className="font-mono text-xs uppercase tracking-wider text-[#0F172A] font-semibold">
                Review Recorded Pupil Sequence
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
              onRetry={handleUploadAndProceed}
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Video playback */}
            <div className="bg-[#0F1117] overflow-hidden aspect-video border border-[#27282D] rounded-lg shadow-sm">
              <video
                src={recordedVideo.previewUrl}
                controls
                className="w-full h-full object-cover"
              />
            </div>

            {/* Video metadata summary */}
            <div className="space-y-4 font-mono text-xs">
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Actual Duration:</span>
                  <span className="font-semibold text-[#0F172A]">{(recordedVideo.durationMs / 1000).toFixed(2)}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">File Size:</span>
                  <span className="font-semibold text-[#0F172A]">{(recordedVideo.sizeBytes / 1024).toFixed(1)} KB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Container:</span>
                  <span className="font-semibold text-[#0F172A]">{recordedVideo.mimeType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Protocol Version:</span>
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
                Review the recorded pupil video. Verify that the eye is in focus and visible throughout the duration. Click below to upload video to the backend and advance to the smooth-pursuit evaluation.
              </p>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    recorder.discardRecording();
                    setIsFallbackMode(false);
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
                  onClick={handleUploadAndProceed}
                  disabled={isUploading}
                  className="btn-ramp-primary py-2 px-4 ml-auto text-xs shadow-sm"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading Video...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Upload &amp; Continue to Pursuit</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Live Recording Camera Preview */
        <div className="space-y-6">
          <div className="relative rounded-xl overflow-hidden shadow-ramp-card">
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

            {/* Countdown Overlay */}
            {countdown !== null && (
              <div className="absolute inset-0 bg-[#0F1117]/90 backdrop-blur-sm flex flex-col items-center justify-center text-white z-20">
                <span className="text-7xl font-sans font-bold text-[#0F766E]">{countdown}</span>
                <span className="text-xs font-mono uppercase tracking-wider text-gray-300 mt-3 font-semibold">
                  Get ready: Look into camera reticle
                </span>
              </div>
            )}
          </div>

          {/* Recording Timer & Progress Bar */}
          {recorder.isRecording && (
            <div className="panel-ramp p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#B91C1C] font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#B91C1C] animate-pulse" />
                  RECORDING IN PROGRESS
                </span>
                <span className="text-[#0F172A] font-semibold">
                  {(recorder.elapsedMs / 1000).toFixed(1)}s / {TARGET_DURATION_S}.0s
                </span>
              </div>
              <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#0F172A] h-full transition-all duration-100 ease-linear"
                  style={{ width: `${Math.min(100, (recorder.elapsedMs / (TARGET_DURATION_S * 1000)) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Controls Bar */}
          <div className="panel-ramp p-4 flex items-center justify-between">
            <div className="text-xs font-mono text-[#475569]">
              {recorder.isRecording
                ? 'Recording will auto-stop after 15 seconds.'
                : 'Click Record to start a 3-second countdown.'}
            </div>

            <div className="flex items-center gap-3">
              {recorder.isRecording ? (
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    recorder.stopRecording();
                  }}
                  className="px-4 py-2 rounded-md bg-[#B91C1C] hover:bg-[#991B1B] text-white font-medium text-xs tracking-normal transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Square className="w-3 h-3 fill-current" />
                  <span>Stop Recording</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStartCountdown}
                  className="btn-ramp-primary text-xs py-2 px-4 shadow-sm"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start 15s Recording</span>
                </button>
              )}
            </div>
          </div>

          {/* Labelled Fallback Section */}
          <SampleVideoFallback
            testType="pupil_reflex"
            onSampleSelected={handleSampleSelected}
          />
        </div>
      )}
    </div>
  );
};
