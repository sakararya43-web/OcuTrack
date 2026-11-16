import React, { useState } from 'react';
import { Film, Upload, Sparkles, CheckCircle2 } from 'lucide-react';
import { RecordedVideo } from '../../hooks/useMediaRecorder';

interface SampleVideoFallbackProps {
  testType: 'pupil_reflex' | 'smooth_pursuit';
  onSampleSelected: (video: RecordedVideo, isFallback: true) => void;
  className?: string;
}

export const SampleVideoFallback: React.FC<SampleVideoFallbackProps> = ({
  testType,
  onSampleSelected,
  className = '',
}) => {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  /**
   * Generates a synthetic benchmark video blob using an offscreen Canvas + MediaRecorder
   * for demonstration and testing when camera hardware or controlled lighting is unavailable.
   */
  const handleGenerateSyntheticSample = async () => {
    setIsGenerating(true);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');

      if (!ctx || typeof canvas.captureStream !== 'function') {
        throw new Error('Canvas stream capture is not supported in this environment.');
      }

      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      const durationMs = testType === 'pupil_reflex' ? 5000 : 5000;
      const startTime = Date.now();

      recorder.start();

      // Render frames
      let frame = 0;
      const interval = setInterval(() => {
        frame++;
        const elapsed = Date.now() - startTime;

        // Background
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Label watermark
        ctx.fillStyle = '#ef4444';
        ctx.font = '14px sans-serif';
        ctx.fillText('BENCHMARK DEMO SAMPLE (NON-LIVE)', 20, 30);

        if (testType === 'pupil_reflex') {
          // Eye outline
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.ellipse(320, 240, 160, 90, 0, 0, 2 * Math.PI);
          ctx.stroke();

          // Iris
          ctx.fillStyle = '#0284c7';
          ctx.beginPath();
          ctx.arc(320, 240, 60, 0, 2 * Math.PI);
          ctx.fill();

          // Pupil (stimulus at 2000ms: constricts from r=30 to r=14)
          const isConstricted = elapsed > 2000 && elapsed < 4000;
          const pupilRadius = isConstricted ? 14 : 30;
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(320, 240, pupilRadius, 0, 2 * Math.PI);
          ctx.fill();

          // Light flash stimulus indicator
          if (isConstricted) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
        } else {
          // Pursuit Eye movement
          const xOffset = Math.sin((elapsed / 1000) * 1.5) * 80;
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.ellipse(320, 240, 160, 90, 0, 0, 2 * Math.PI);
          ctx.stroke();

          // Iris tracking
          ctx.fillStyle = '#0284c7';
          ctx.beginPath();
          ctx.arc(320 + xOffset, 240, 55, 0, 2 * Math.PI);
          ctx.fill();

          // Pupil tracking
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(320 + xOffset, 240, 24, 0, 2 * Math.PI);
          ctx.fill();
        }

        if (elapsed >= durationMs) {
          clearInterval(interval);
          recorder.stop();
        }
      }, 33);

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const previewUrl = URL.createObjectURL(blob);
        const recorded: RecordedVideo = {
          blob,
          previewUrl,
          durationMs,
          mimeType: 'video/webm',
          recordedAt: new Date().toISOString(),
          sizeBytes: blob.size,
        };

        setIsGenerating(false);
        onSampleSelected(recorded, true);
      };
    } catch {
      // In case canvas capture stream is blocked/unsupported, create a synthetic mock blob
      const dummyBlob = new Blob(['DEMO_VIDEO_FALLBACK_PAYLOAD'], { type: 'video/webm' });
      const recorded: RecordedVideo = {
        blob: dummyBlob,
        previewUrl: '',
        durationMs: 5000,
        mimeType: 'video/webm',
        recordedAt: new Date().toISOString(),
        sizeBytes: dummyBlob.size,
      };
      setIsGenerating(false);
      onSampleSelected(recorded, true);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    const previewUrl = URL.createObjectURL(file);

    const recorded: RecordedVideo = {
      blob: file,
      previewUrl,
      durationMs: 10000,
      mimeType: file.type || 'video/webm',
      recordedAt: new Date().toISOString(),
      sizeBytes: file.size,
    };

    onSampleSelected(recorded, true);
  };

  return (
    <div
      className={`bg-slate-900 border border-slate-700/80 rounded-xl p-5 text-slate-300 space-y-4 shadow-sm ${className}`}
    >
      <div className="flex items-start gap-3">
        <Film className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-white">
              Prepared Demonstration Sample Fallback
            </h4>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
              Clearly Labelled Non-Live
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Per team protocol rules, if webcam hardware or controlled lighting is unavailable on your presentation machine, you may use a verified benchmark demonstration sample. Pre-recorded content is never misrepresented as a live test.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleGenerateSyntheticSample}
          disabled={isGenerating}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-white bg-amber-600 hover:bg-amber-500 rounded-lg shadow-sm transition-colors disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" />
          {isGenerating ? 'Synthesizing Benchmark...' : 'Use Calibrated Synthetic Benchmark'}
        </button>

        <label className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg cursor-pointer transition-colors">
          <Upload className="w-4 h-4" />
          <span>Upload Prepared Video File (.webm / .mp4)</span>
          <input
            type="file"
            accept="video/webm,video/mp4"
            onChange={handleFileUpload}
            className="sr-only"
          />
        </label>
      </div>

      {selectedFileName && (
        <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 px-3 py-1.5 rounded border border-emerald-800">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Loaded file: {selectedFileName} (flagged as fallback)</span>
        </div>
      )}
    </div>
  );
};
