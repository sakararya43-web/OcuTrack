import React, { useState } from 'react';
import { Film, Upload } from 'lucide-react';
import { RecordedVideo, getBestSupportedMimeType } from '../../hooks/useMediaRecorder';
import { soundFx } from '../../lib/soundFx';
import { useTranslation } from '../../i18n';

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
  const { t } = useTranslation();
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
      const bestMime = getBestSupportedMimeType();
      let recorder: MediaRecorder;
      try {
        recorder = bestMime ? new MediaRecorder(stream, { mimeType: bestMime }) : new MediaRecorder(stream);
      } catch {
        recorder = new MediaRecorder(stream);
      }
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      const durationMs = testType === 'pupil_reflex' ? 5000 : 5000;
      const startTime = Date.now();

      recorder.start();

      // Render synthetic face frames compatible with OcuTrack's computer-vision localizer
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const t = elapsed / 1000;

        // Light studio background for clean foreground face segmentation
        ctx.fillStyle = '#F0F0F0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const fx = Math.round(canvas.width * 0.2);
        const fy = Math.round(canvas.height * 0.15);
        const fw = Math.round(canvas.width * 0.6);
        const fh = Math.round(canvas.height * 0.7);

        // Synthetic face oval
        ctx.fillStyle = '#C8B4A0';
        ctx.beginPath();
        ctx.ellipse(fx + fw / 2, fy + fh / 2, fw / 2, fh / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        const eyeW = 86;
        const eyeH = 54;
        const leftEyeX = fx + Math.round(fw * 0.16);
        const rightEyeX = fx + Math.round(fw * 0.58);
        const eyeY = fy + Math.round(fh * 0.28);

        // Sclera regions for both eyes
        ctx.fillStyle = '#DCDCDC';
        ctx.fillRect(leftEyeX, eyeY, eyeW, eyeH);
        ctx.fillRect(rightEyeX, eyeY, eyeW, eyeH);

        if (testType === 'pupil_reflex') {
          // Diffuse flash stimulus at 2.0s - 2.5s
          if (elapsed >= 2000 && elapsed <= 2500) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }

          // Smooth physiological constriction after 2.2s, gradual redilation after 3.5s
          let pupilRadius = 15;
          if (elapsed > 2200 && elapsed <= 3500) {
            const frac = Math.min(1, (elapsed - 2200) / 500);
            pupilRadius = 15 - frac * 6.5;
          } else if (elapsed > 3500) {
            const frac = Math.min(1, (elapsed - 3500) / 1500);
            pupilRadius = 8.5 + frac * 4.5;
          }

          ctx.fillStyle = '#141414';
          ctx.beginPath();
          ctx.arc(leftEyeX + eyeW / 2, eyeY + eyeH / 2, pupilRadius, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.arc(rightEyeX + eyeW / 2, eyeY + eyeH / 2, pupilRadius, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Smooth pursuit horizontal oscillation synchronized with 10s sweep
          const normOffset = 0.5 + 0.3 * Math.sin(t * 2.0);
          const pupilXLeft = leftEyeX + Math.round(eyeW * (0.2 + 0.6 * normOffset));
          const pupilXRight = rightEyeX + Math.round(eyeW * (0.2 + 0.6 * normOffset));

          ctx.fillStyle = '#141414';
          ctx.beginPath();
          ctx.arc(pupilXLeft, eyeY + eyeH / 2, 12, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.arc(pupilXRight, eyeY + eyeH / 2, 12, 0, Math.PI * 2);
          ctx.fill();
        }

        if (elapsed >= durationMs) {
          clearInterval(interval);
          recorder.stop();
        }
      }, 33);

      recorder.onstop = () => {
        const finalMime = recorder.mimeType || bestMime || 'video/webm';
        const blob = new Blob(chunks, { type: finalMime });
        const previewUrl = URL.createObjectURL(blob);
        const recorded: RecordedVideo = {
          blob,
          previewUrl,
          durationMs,
          mimeType: finalMime,
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
            {t('capture.fallback.title')}
          </h4>
        </div>
        <span className="text-[10px] font-mono text-[#64748B]">
          {t('capture.fallback.subtitle')}
        </span>
      </div>

      <p className="text-xs text-[#475569] font-normal font-sans leading-relaxed">
        {t('capture.fallback.desc')}
      </p>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          type="button"
          onClick={handleGenerateSyntheticSample}
          disabled={isGenerating}
          className="btn-ramp-secondary text-xs py-2 px-3.5 flex items-center gap-1.5"
        >
          <span>{isGenerating ? t('capture.fallback.rendering') : t('capture.fallback.generateBtn')}</span>
        </button>

        <label className="btn-ramp-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 cursor-pointer">
          <Upload className="w-3.5 h-3.5 text-[#475569]" />
          <span>{selectedFileName ? t('capture.fallback.loadedPrefix', { name: selectedFileName }) : t('capture.fallback.uploadBtn')}</span>
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
