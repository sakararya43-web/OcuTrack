import React from 'react';
import { Camera, CameraOff, AlertCircle, Zap, ZapOff } from 'lucide-react';
import { CameraError, ObservedCameraSettings } from '../../hooks/useCamera';
import { soundFx } from '../../lib/soundFx';
import { useTranslation } from '../../i18n';

interface CameraPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  stream?: MediaStream | null;
  isCameraActive: boolean;
  isLoading: boolean;
  error: CameraError | null;
  observedSettings: ObservedCameraSettings | null;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onToggleTorch?: (enabled: boolean) => void;
  torchActive?: boolean;
  showOverlay?: boolean;
  isRecording?: boolean;
  className?: string;
}

export const CameraPreview: React.FC<CameraPreviewProps> = ({
  videoRef,
  stream = null,
  isCameraActive,
  isLoading,
  error,
  observedSettings,
  onStartCamera,
  onStopCamera,
  onToggleTorch,
  torchActive = false,
  showOverlay = true,
  isRecording = false,
  className = '',
}) => {
  const { t } = useTranslation();

  // Re-attach MediaStream when CameraPreview remounts (e.g., after Discard & Retake)
  React.useEffect(() => {
    const videoEl = videoRef.current;
    if (videoEl && stream && isCameraActive && videoEl.srcObject !== stream) {
      videoEl.srcObject = stream;
      videoEl.play().catch(() => {
        // Auto-play was prevented; video starts on user action
      });
    }
  }, [videoRef, stream, isCameraActive]);

  return (
    <div className={`relative bg-[#0F1117] rounded-xl overflow-hidden aspect-video flex items-center justify-center border border-[#27282D] shadow-ramp-card ${className}`}>
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover transform -scale-x-100 ${
          isCameraActive ? 'block' : 'hidden'
        }`}
      />

      {/* Positioning Guide Overlay */}
      {isCameraActive && showOverlay && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          {/* Eye zone target reticle */}
          <div className="relative w-72 sm:w-88 h-32 border border-dashed border-[#0F766E]/50 rounded-full flex items-center justify-around px-8">
            {/* Left Eye guide */}
            <div className="w-14 h-10 border border-[#0F766E]/70 rounded-full flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E]" />
            </div>
            {/* Center crosshair */}
            <div className="w-3 h-3 border-t border-b border-[#0F766E]/40" />
            {/* Right Eye guide */}
            <div className="w-14 h-10 border border-[#0F766E]/70 rounded-full flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E]" />
            </div>
          </div>

          <div className="absolute bottom-3 left-4 text-[10px] font-mono text-white/70 bg-black/60 px-2 py-0.5 rounded">
            {t('capture.camera.alignEyes')}
          </div>
        </div>
      )}

      {/* Idle / Inactive Overlay */}
      {!isCameraActive && !isLoading && !error && (
        <div className="text-center p-6 space-y-3 font-mono text-xs">
          <div className="w-10 h-10 rounded-lg bg-white/10 text-white flex items-center justify-center mx-auto border border-white/10">
            <Camera className="w-5 h-5 text-gray-300" />
          </div>
          <div>
            <h4 className="font-semibold text-white">{t('capture.camera.inactiveTitle')}</h4>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {t('capture.camera.inactiveDesc')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              onStartCamera();
            }}
            className="btn-ramp-primary text-xs py-2 px-4 shadow-sm"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{t('capture.camera.enableBtn')}</span>
          </button>
        </div>
      )}

      {/* Loading Stream State */}
      {isLoading && (
        <div className="text-center p-6 space-y-2 font-mono text-xs text-white">
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-400">{t('capture.camera.requestingStream')}</p>
        </div>
      )}

      {/* Error / Permission State */}
      {error && !isLoading && (
        <div className="text-center p-6 space-y-3 font-mono text-xs max-w-md">
          <div className="w-10 h-10 rounded-lg bg-[#FEF2F2]/10 text-[#F87171] border border-[#F87171]/20 flex items-center justify-center mx-auto">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-[#F87171]">{t('capture.camera.errorTitle')}</h4>
            <p className="text-[11px] text-gray-300 mt-1 leading-relaxed">
              {error.message || t('capture.camera.errorDefault')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              onStartCamera();
            }}
            className="btn-ramp-primary text-xs py-2 px-4 shadow-sm"
          >
            <span>{t('capture.camera.retryAccess')}</span>
          </button>
        </div>
      )}

      {/* Floating Diagnostics Strip (When Active) */}
      {isCameraActive && (
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-xs font-mono pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm border border-white/15 text-[#34D399] font-medium flex items-center gap-1.5 text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34D399]" />
              {isRecording ? t('capture.camera.liveRecording') : t('capture.camera.feedActive')}
            </span>

            {observedSettings && (
              <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm border border-white/10 text-gray-300 text-[10px]">
                {observedSettings.width}x{observedSettings.height} @ {Math.round(observedSettings.frameRate || 30)} FPS
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onToggleTorch && (
              <button
                type="button"
                onClick={() => onToggleTorch(!torchActive)}
                className={`p-1.5 rounded bg-black/60 backdrop-blur-sm border border-white/15 transition-colors ${
                  torchActive ? 'text-[#0F766E]' : 'text-gray-300'
                }`}
                title={t('capture.camera.toggleTorch')}
              >
                {torchActive ? <Zap className="w-3.5 h-3.5" /> : <ZapOff className="w-3.5 h-3.5" />}
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                onStopCamera();
              }}
              disabled={isRecording}
              className="px-2 py-0.5 rounded bg-black/60 hover:bg-black/80 backdrop-blur-sm border border-white/15 text-gray-300 text-[10px] transition-colors disabled:opacity-50"
            >
              <CameraOff className="w-3 h-3 inline mr-1" />
              <span>{t('capture.camera.disconnect')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
