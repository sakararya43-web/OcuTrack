import React, { useState } from 'react';
import { Film, Upload, Video, CheckCircle2, AlertCircle } from 'lucide-react';
import { RecordedVideo } from '../../hooks/useMediaRecorder';
import { Button } from '../ui/Button';

interface SampleVideoFallbackProps {
  testType: 'pupil_reflex' | 'smooth_pursuit';
  onSampleSelected: (video: RecordedVideo, isFallback: true) => void;
  className?: string;
}

const BENCHMARK_DURATION_MS = 5000;

export const SampleVideoFallback: React.FC<SampleVideoFallbackProps> = ({
  testType,
  onSampleSelected,
  className = '',
}) => {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [fallbackError, setFallbackError] = useState<string | null>(null);

  /**
   * Generates a real WebM benchmark video using Canvas.captureStream + MediaRecorder
   * when camera hardware or controlled lighting is unavailable.
   */
  const handleGenerateSyntheticSample = async () => {
    setIsGenerating(true);
    setFallbackError(null);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');

      if (!ctx || typeof canvas.captureStream !== 'function' || typeof MediaRecorder === 'undefined') {
        throw new Error(
          'Browser canvas video synthesis is unavailable in this environment. Upload a prepared .webm or .mp4 benchmark video file instead.'
        );
      }

      const stream = canvas.captureStream(30);
      const mimeType = MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : '';
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      const startTime = Date.now();
      recorder.start();

      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '14px sans-serif';
        ctx.fillText('BENCHMARK DEMO SAMPLE (NON-LIVE)', 20, 30);

        if (testType === 'pupil_reflex') {
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.ellipse(320, 240, 160, 90, 0, 0, 2 * Math.PI);
          ctx.stroke();

          ctx.fillStyle = '#0369a1';
          ctx.beginPath();
          ctx.arc(320, 240, 60, 0, 2 * Math.PI);
          ctx.fill();

          const isConstricted = elapsed > 2000 && elapsed < 4000;
          const pupilRadius = isConstricted ? 14 : 30;
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(320, 240, pupilRadius, 0, 2 * Math.PI);
          ctx.fill();

          if (isConstricted) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
        } else {
          const xOffset = Math.sin((elapsed / 1000) * 1.5) * 80;
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.ellipse(320, 240, 160, 90, 0, 0, 2 * Math.PI);
          ctx.stroke();

          ctx.fillStyle = '#0369a1';
          ctx.beginPath();
          ctx.arc(320 + xOffset, 240, 55, 0, 2 * Math.PI);
          ctx.fill();

          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(320 + xOffset, 240, 24, 0, 2 * Math.PI);
          ctx.fill();
        }

        if (elapsed >= BENCHMARK_DURATION_MS) {
          clearInterval(interval);
          recorder.stop();
        }
      }, 33);

      recorder.onstop = () => {
        const finalMime = recorder.mimeType || 'video/webm';
        const blob = new Blob(chunks, { type: finalMime });
        if (blob.size === 0) {
          setIsGenerating(false);
          setFallbackError(
            'Synthetic benchmark recording produced an empty stream. Upload a prepared .webm or .mp4 video file instead.'
          );
          return;
        }
        const previewUrl = URL.createObjectURL(blob);
        const recorded: RecordedVideo = {
          blob,
          previewUrl,
          durationMs: BENCHMARK_DURATION_MS,
          mimeType: finalMime,
          recordedAt: new Date().toISOString(),
          sizeBytes: blob.size,
        };

        setIsGenerating(false);
        onSampleSelected(recorded, true);
      };
    } catch (err: unknown) {
      setIsGenerating(false);
      setFallbackError(
        err instanceof Error
          ? err.message
          : 'Unable to synthesize a benchmark video in this browser. Upload a prepared video file instead.'
      );
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFallbackError(null);
    setSelectedFileName(file.name);
    const previewUrl = URL.createObjectURL(file);

    const recorded: RecordedVideo = {
      blob: file,
      previewUrl,
      durationMs: testType === 'pupil_reflex' ? 15000 : 10000,
      mimeType: file.type || 'video/webm',
      recordedAt: new Date().toISOString(),
      sizeBytes: file.size,
    };

    onSampleSelected(recorded, true);
  };

  return (
    <div
      className={`bg-slate-900 border border-slate-700 rounded-md p-5 text-slate-200 space-y-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <Film className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-semibold text-white">
              Prepared Demonstration Sample Fallback
            </h4>
            <span className="text-[11px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-sky-300 border border-slate-600">
              Clearly Labelled Non-Live
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            If webcam hardware or uniform ambient illumination is unavailable, you may use a
            calibrated synthetic benchmark or upload a prepared video file. Fallback samples are
            explicitly flagged in session metadata and never misrepresented as live capture.
          </p>
        </div>
      </div>

      {fallbackError && (
        <div
          role="alert"
          className="flex items-start gap-2 text-xs text-rose-200 bg-rose-950/60 px-3 py-2 rounded border border-rose-800"
        >
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <span>{fallbackError}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <Button
          type="button"
          variant="teal"
          size="sm"
          onClick={handleGenerateSyntheticSample}
          disabled={isGenerating}
        >
          <Video className="w-4 h-4" aria-hidden="true" />
          {isGenerating ? 'Synthesizing Benchmark...' : 'Generate Synthetic Benchmark'}
        </Button>

        <label className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-100 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-md cursor-pointer transition-colors duration-150">
          <Upload className="w-4 h-4" aria-hidden="true" />
          <span>Upload Prepared Video (.webm / .mp4)</span>
          <input
            type="file"
            accept="video/webm,video/mp4"
            onChange={handleFileUpload}
            className="sr-only"
          />
        </label>
      </div>

      {selectedFileName && (
        <div className="flex items-center gap-2 text-xs text-teal-300 bg-slate-800 px-3 py-1.5 rounded border border-teal-700/60">
          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Loaded file: {selectedFileName} (flagged as fallback)</span>
        </div>
      )}
    </div>
  );
};
