import React, { useState } from 'react';
import { Film, Upload } from 'lucide-react';
import { RecordedVideo } from '../../hooks/useMediaRecorder';
import { soundFx } from '../../lib/soundFx';

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
    soundFx.playClick();
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
        ctx.fillStyle = '#0F1117';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Reticle
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

        if (testType === 'pupil_reflex') {
          // Flash at 2.0s
          const isFlash = elapsed >= 2000 && elapsed <= 2500;
          if (isFlash) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }

          // Pupil diameter dynamic
          let r = 35;
          if (elapsed > 2200) {
            r = 18;
          }

          // Render simulated iris and pupil
          ctx.fillStyle = '#222734';
          ctx.beginPath();
          ctx.arc(320, 240, 65, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#090A0D';
          ctx.beginPath();
          ctx.arc(320, 240, r, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = 'white';
          ctx.beginPath();
          ctx.arc(310, 230, 4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Smooth pursuit target
          const t = elapsed / 1000;
          const x = 320 + Math.sin(t * 2) * 200;
          const y = 240;

          // Eye following
          ctx.fillStyle = '#222734';
          ctx.beginPath();
          ctx.arc(x, y, 50, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#090A0D';
          ctx.beginPath();
          ctx.arc(x, y, 22, 0, Math.PI * 2);
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
        soundFx.playSuccess();
        onSampleSelected(recorded, true);
        setIsGenerating(false);
      };
    } catch {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    soundFx.playClick();
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
    <div className={`panel-ramp p-5 space-y-3 ${className}`}>
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-[#475569]" />
          <h4 className="font-mono text-xs uppercase tracking-wider text-[#0F172A] font-semibold">
            Hardware Fallback &amp; Benchmark Options
          </h4>
        </div>
        <span className="text-[10px] font-mono text-[#64748B]">
          For headless testing or camera-restricted environments
        </span>
      </div>

      <p className="text-xs text-[#475569] font-normal font-sans leading-relaxed">
        If you are evaluating this platform without an active webcam, you can generate a calibrated synthetic video sample or upload a pre-recorded test sequence.
      </p>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          type="button"
          onClick={handleGenerateSyntheticSample}
          disabled={isGenerating}
          className="btn-ramp-secondary text-xs py-2 px-3.5 flex items-center gap-1.5"
        >
          <span>{isGenerating ? 'Rendering Synthetic Video...' : 'Generate Standard Synthetic Benchmark'}</span>
        </button>

        <label className="btn-ramp-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 cursor-pointer">
          <Upload className="w-3.5 h-3.5 text-[#475569]" />
          <span>{selectedFileName ? `Loaded: ${selectedFileName}` : 'Upload Benchmark File'}</span>
          <input
            type="file"
            accept="video/*"
            onChange={handleFileUpload}
            className="sr-only"
          />
        </label>
      </div>
    </div>
  );
};
