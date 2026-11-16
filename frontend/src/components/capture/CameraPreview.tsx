import React from 'react';
import { Camera, CameraOff, AlertCircle, Zap, ZapOff } from 'lucide-react';
import { CameraError, ObservedCameraSettings } from '../../hooks/useCamera';

interface CameraPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
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
  return (
    <div className={`relative bg-slate-950 rounded-2xl overflow-hidden aspect-video flex items-center justify-center border border-slate-800 shadow-inner ${className}`}>
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
          <div className="relative w-72 sm:w-96 h-36 border-2 border-dashed border-sky-400/60 rounded-full flex items-center justify-around px-8 shadow-sm">
            {/* Left Eye guide */}
            <div className="w-16 h-12 border border-sky-400/80 rounded-full flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400/90"></span>
            </div>
            {/* Center crosshair */}
            <div className="w-4 h-4 border-t border-b border-sky-400/40"></div>
            {/* Right Eye guide */}
            <div className="w-16 h-12 border border-sky-400/80 rounded-full flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400/90"></span>
            </div>

            <span className="absolute -top-7 text-[11px] font-medium tracking-wide uppercase text-sky-300/90 bg-slate-950/80 px-2.5 py-0.5 rounded-full border border-sky-500/30">
              Align Eyes Inside Guide
            </span>
          </div>

          {/* Recording Border Pulse */}
          {isRecording && (
            <div className="absolute inset-0 border-4 border-rose-500/80 animate-pulse pointer-events-none"></div>
          )}
        </div>
      )}

      {/* Live Stream Metadata Badges */}
      {isCameraActive && observedSettings && (
        <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-900/80 text-slate-300 border border-slate-700/60 backdrop-blur-sm">
            {observedSettings.width || '1280'} &times; {observedSettings.height || '720'}
            {observedSettings.frameRate ? ` @ ${Math.round(observedSettings.frameRate)}fps` : ''}
          </span>
          {isRecording ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-900/90 text-rose-100 border border-rose-600/60 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-400"></span>
              REC
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-700/50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Live Preview
            </span>
          )}
        </div>
      )}

      {/* Torch Toggle if supported */}
      {isCameraActive && observedSettings?.hasTorch && onToggleTorch && (
        <button
          type="button"
          onClick={() => onToggleTorch(!torchActive)}
          className={`absolute top-3 right-3 p-2 rounded-lg text-xs font-medium transition-colors ${
            torchActive
              ? 'bg-amber-400 text-slate-950 shadow-md'
              : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-700'
          }`}
          title="Toggle camera illuminator/torch"
        >
          {torchActive ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
        </button>
      )}

      {/* Placeholder / Inactive State */}
      {!isCameraActive && (
        <div className="p-8 text-center max-w-sm space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mx-auto">
            {error ? <AlertCircle className="w-7 h-7 text-rose-400" /> : <Camera className="w-7 h-7" />}
          </div>

          <div className="space-y-1">
            <h4 className="text-base font-semibold text-white">
              {error ? 'Camera Unavailable' : 'Webcam Preview Off'}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {error
                ? error.message
                : 'Click below to request camera permission and initialize live ocular preview.'}
            </p>
          </div>

          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onStartCamera}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              <Camera className="w-4 h-4" />
              {isLoading ? 'Requesting Access...' : error ? 'Retry Camera Permission' : 'Enable Webcam'}
            </button>
          </div>
        </div>
      )}

      {/* Active stop camera pill button */}
      {isCameraActive && (
        <button
          type="button"
          onClick={onStopCamera}
          className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-slate-900/80 hover:bg-slate-900 text-slate-300 rounded-md border border-slate-700 backdrop-blur-sm transition-colors"
        >
          <CameraOff className="w-3.5 h-3.5 text-slate-400" />
          Mute Camera
        </button>
      )}
    </div>
  );
};
