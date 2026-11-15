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
        setIsStimulusActive(true);
        setTimeout(() => setIsStimulusActive(false), 1500);
      }, 5000);

      return () => clearTimeout(stimulusTimer);
    } else {
      setIsStimulusActive(false);
    }
  }, [recorder.isRecording]);

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
          }
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSampleSelected = (sampleVideo: RecordedVideo) => {
    setIsFallbackMode(true);
    recorder.discardRecording();
    (recorder as any).recordedVideo = sampleVideo;
    camera.stopCamera();
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
        notes: isFallbackMode ? 'Labelled Benchmark Sample Fallback' : 'Standard live diffuse ambient session',
      },
    };

    try {
      await uploadPupilVideo(assessmentId, recorder.recordedVideo.blob, metadata);
      navigate(`/assessments/${assessmentId}/pursuit-test`);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setUploadError({ message: err.message, isUnavailable: err.isUnavailable });
      } else if (err instanceof Error) {
        setUploadError({ message: err.message, isUnavailable: false });
      } else {
        setUploadError({ message: 'Failed to upload pupil video to backend server.', isUnavailable: true });
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
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-sky-700">Test 1 of 2</span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Eye className="w-6 h-6 text-sky-600" />
            Pupil Light Reflex Recording
          </h1>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono text-slate-500">Session: {assessmentId?.slice(0, 8)}...</span>
        </div>
      </div>

      {/* Safety Instructions Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-start gap-3">
          <SunMedium className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-900">Standardized Controlled-Lighting Protocol</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Sit approximately 50cm from your webcam with uniform, diffuse ambient lighting. At the 5-second mark of the 15-second recording, a white stimulus banner will flash on screen.
            </p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200/80 rounded-lg p-3 text-xs text-amber-900 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Safety Notice:</strong> Never direct high-intensity laser or torch light directly into the eye. Rely on the standard diffuse screen flash stimulus.
          </span>
        </div>
      </div>

      {/* Stimulus Flash Overlay */}
      {isStimulusActive && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center pointer-events-none transition-opacity duration-300">
          <span className="text-slate-900 font-bold text-2xl tracking-wider">LIGHT STIMULUS (KEEP EYES OPEN)</span>
        </div>
      )}

      {/* Capture or Review Arena */}
      {recordedVideo ? (
        /* Video Review State */
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h3 className="font-semibold text-slate-900 text-base">Pupil Recording Captured</h3>
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
              onRetry={handleUploadAndProceed}
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Video playback */}
            <div className="bg-slate-950 rounded-xl overflow-hidden aspect-video border border-slate-800">
              <video
                src={recordedVideo.previewUrl}
                controls
                className="w-full h-full object-cover"
              />
            </div>

            {/* Video metadata summary */}
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Actual Duration:</span>
                  <span className="font-semibold text-slate-900">{(recordedVideo.durationMs / 1000).toFixed(2)}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">File Size:</span>
                  <span className="font-semibold text-slate-900">{(recordedVideo.sizeBytes / 1024).toFixed(1)} KB</span>
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
                        <ShieldAlert className="w-4 h-4 text-rose-600" />
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
                Review the recorded pupil video. Verify that the eye is in focus and visible throughout the duration. Click below to upload video to the backend and advance to the smooth-pursuit evaluation.
              </p>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    recorder.discardRecording();
                    setIsFallbackMode(false);
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
                  onClick={handleUploadAndProceed}
                  disabled={isUploading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-sm transition-colors ml-auto disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading Video...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      Upload &amp; Continue to Pursuit
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Live Recording Camera Preview */
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

            {/* Countdown Overlay */}
            {countdown !== null && (
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center text-white z-20">
                <span className="text-7xl font-extrabold animate-bounce text-sky-400">{countdown}</span>
                <span className="text-sm font-medium text-slate-300 mt-2">Get ready: Look into camera</span>
              </div>
            )}
          </div>

          {/* Recording Timer & Progress Bar */}
          {recorder.isRecording && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-rose-600 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                  RECORDING IN PROGRESS
                </span>
                <span className="text-slate-700 font-bold">
                  {(recorder.elapsedMs / 1000).toFixed(1)}s / {TARGET_DURATION_S}.0s
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-rose-500 h-full transition-all duration-100 ease-linear"
                  style={{ width: `${Math.min(100, (recorder.elapsedMs / (TARGET_DURATION_S * 1000)) * 100)}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Controls Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
            <div className="text-xs text-slate-500">
              {recorder.isRecording
                ? 'Recording will auto-stop after 15 seconds.'
                : 'Click Record to start a 3-second countdown.'}
            </div>

            <div className="flex items-center gap-3">
              {recorder.isRecording ? (
                <button
                  type="button"
                  onClick={recorder.stopRecording}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors"
                >
                  <Square className="w-4 h-4 fill-current" />
                  Stop Recording
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStartCountdown}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-sm transition-colors"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Start 15s Recording
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
