import React from 'react';
import { Camera, CameraOff, AlertCircle, Zap, ZapOff } from 'lucide-react';
import { CameraError, ObservedCameraSettings } from '../../hooks/useCamera';
import { Button } from '../ui/Button';

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
    <div
      className={`relative bg-slate-950 rounded-md overflow-hidden aspect-video flex items-center justify-center border border-slate-800 ${className}`}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        aria-label="Live participant camera preview"
        className={`w-full h-full object-cover transform -scale-x-100 ${
          isCameraActive ? 'block' : 'hidden'
        }`}
      />

      {/* Positioning Guide Overlay */}
      {isCameraActive && showOverlay && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="relative w-72 sm:w-96 h-36 border-2 border-dashed border-sky-400/70 rounded-md flex items-center justify-around px-8">
            <div className="w-16 h-12 border border-sky-400/80 rounded-md flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-sm bg-sky-400"></span>
            </div>
            <div className="w-4 h-4 border-t border-b border-sky-400/50"></div>
            <div className="w-16 h-12 border border-sky-400/80 rounded-md flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-sm bg-sky-400"></span>
            </div>

            <span className="absolute -top-7 text-[11px] font-medium tracking-wide uppercase text-sky-200 bg-slate-950/90 px-2.5 py-0.5 rounded border border-sky-500/40">
              Align Eyes Inside Guide
            </span>
          </div>

          {isRecording && (
            <div className="absolute inset-0 border-4 border-rose-600 pointer-events-none"></div>
          )}
        </div>
      )}

      {/* Live Stream Metadata Badges */}
      {isCameraActive && observedSettings && (
        <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-900/90 text-slate-200 border border-slate-700">
            {observedSettings.width || '1280'} &times; {observedSettings.height || '720'}
            {observedSettings.frameRate ? ` @ ${Math.round(observedSettings.frameRate)}fps` : ''}
          </span>
          {isRecording ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-900 text-rose-100 border border-rose-600">
              <span className="w-2 h-2 rounded-sm bg-rose-400" aria-hidden="true"></span>
              REC
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-900/90 text-teal-300 border border-teal-700/60">
              <span className="w-1.5 h-1.5 rounded-sm bg-teal-400" aria-hidden="true"></span>
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
          aria-label={torchActive ? 'Turn off camera illuminator' : 'Turn on camera illuminator'}
          aria-pressed={torchActive}
          className={`absolute top-3 right-3 p-2 rounded-md text-xs font-medium transition-colors duration-150 ${
            torchActive
              ? 'bg-sky-600 text-white border border-sky-400'
              : 'bg-slate-900/90 text-slate-200 hover:bg-slate-800 border border-slate-700'
          }`}
          title="Toggle camera illuminator"
        >
          {torchActive ? (
            <Zap className="w-4 h-4 fill-current" aria-hidden="true" />
          ) : (
            <ZapOff className="w-4 h-4" aria-hidden="true" />
          )}
        </button>
      )}

      {/* Placeholder / Inactive State */}
      {!isCameraActive && (
        <div className="p-8 text-center max-w-sm space-y-4">
          <div className="w-12 h-12 rounded-md bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-300 mx-auto">
            {error ? (
              <AlertCircle className="w-6 h-6 text-rose-400" aria-hidden="true" />
            ) : (
              <Camera className="w-6 h-6" aria-hidden="true" />
            )}
          </div>

          <div className="space-y-1">
            <h4 className="text-base font-semibold text-white">
              {error ? 'Camera Unavailable' : 'Webcam Preview Off'}
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {error
                ? error.message
                : 'Click below to request browser camera permission and initialize live ocular preview.'}
            </p>
          </div>

          <div className="pt-2 flex items-center justify-center">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={onStartCamera}
              disabled={isLoading}
            >
              <Camera className="w-4 h-4" aria-hidden="true" />
              {isLoading ? 'Requesting Access...' : error ? 'Retry Camera Permission' : 'Enable Webcam'}
            </Button>
          </div>
        </div>
      )}

      {/* Stop camera control */}
      {isCameraActive && (
        <button
          type="button"
          onClick={onStopCamera}
          aria-label="Stop camera stream"
          className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-slate-900/90 hover:bg-slate-800 text-slate-200 rounded-md border border-slate-700 transition-colors duration-150"
        >
          <CameraOff className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
          Stop Camera
        </button>
      )}
    </div>
  );
};
