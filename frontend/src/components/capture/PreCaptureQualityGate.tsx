import React from 'react';
import { Sun, Compass, Eye, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { PreCaptureQualityGateState } from '../../hooks/usePreCaptureQualityGate';
import { useTranslation } from '../../i18n';
import { soundFx } from '../../lib/soundFx';

interface PreCaptureQualityGateProps {
  gate: PreCaptureQualityGateState;
  isOverridden: boolean;
  onOverrideProceed: () => void;
  className?: string;
}

/**
 * Corner alignment reticle overlay rendered inside the CameraPreview container.
 * Shifts smoothly from amber to clinical teal when all pre-capture checks pass.
 */
export const QualityReticleOverlay: React.FC<{
  allPassed: boolean;
  isOverridden?: boolean;
}> = ({ allPassed, isOverridden = false }) => {
  const ready = allPassed || isOverridden;
  const strokeColor = allPassed
    ? 'border-[#14B8A6]'
    : isOverridden
    ? 'border-[#F59E0B]'
    : 'border-[#F59E0B]/85';

  return (
    <div
      data-testid="quality-reticle-overlay"
      data-ready={ready ? 'true' : 'false'}
      className="absolute inset-0 pointer-events-none z-10"
    >
      {/* Top-Left Corner Bracket */}
      <div
        className={`absolute top-12 left-4 w-5 h-5 border-t-2 border-l-2 transition-colors duration-200 ${strokeColor}`}
      />
      {/* Top-Right Corner Bracket */}
      <div
        className={`absolute top-12 right-4 w-5 h-5 border-t-2 border-r-2 transition-colors duration-200 ${strokeColor}`}
      />
      {/* Bottom-Left Corner Bracket */}
      <div
        className={`absolute bottom-10 left-4 w-5 h-5 border-b-2 border-l-2 transition-colors duration-200 ${strokeColor}`}
      />
      {/* Bottom-Right Corner Bracket */}
      <div
        className={`absolute bottom-10 right-4 w-5 h-5 border-b-2 border-r-2 transition-colors duration-200 ${strokeColor}`}
      />
    </div>
  );
};

export const PreCaptureQualityGate: React.FC<PreCaptureQualityGateProps> = ({
  gate,
  isOverridden,
  onOverrideProceed,
  className = '',
}) => {
  const { t } = useTranslation();

  const lightingOk = gate.lighting.status === 'pass';
  const poseOk = gate.headPose.status === 'pass';
  const poseLite = gate.headPose.status === 'lite';
  const eyesOk = gate.eyeVisibility.status === 'pass';
  const eyesLite = gate.eyeVisibility.status === 'lite';

  const lightingStatusTag =
    gate.lighting.code === 'optimal'
      ? t('capture.qualityGate.lightingOptimal')
      : gate.lighting.code === 'low_light'
      ? t('capture.qualityGate.lightingLow')
      : gate.lighting.code === 'high_glare'
      ? t('capture.qualityGate.lightingGlare')
      : t('capture.qualityGate.scanning');

  const poseStatusTag = poseLite
    ? t('capture.qualityGate.liteModeTag')
    : poseOk
    ? t('capture.qualityGate.poseAligned')
    : gate.headPose.code === 'no_face'
    ? t('capture.qualityGate.noFaceTag')
    : t('capture.qualityGate.poseAdjust');

  const eyesStatusTag = eyesLite
    ? t('capture.qualityGate.liteModeTag')
    : eyesOk
    ? t('capture.qualityGate.eyesClear')
    : gate.eyeVisibility.code === 'center_face'
    ? t('capture.qualityGate.centerFaceTag')
    : gate.eyeVisibility.code === 'no_face'
    ? t('capture.qualityGate.noFaceTag')
    : t('capture.qualityGate.eyesObstructed');

  const correctivePrompt = (() => {
    if (gate.allPassed) return null;
    if (gate.lighting.code === 'low_light') return t('capture.qualityGate.promptLowLight');
    if (gate.lighting.code === 'high_glare') return t('capture.qualityGate.promptHighGlare');
    if (gate.headPose.status === 'warn' && gate.headPose.code === 'adjust_pose') {
      return t('capture.qualityGate.promptPose');
    }
    if (gate.eyeVisibility.code === 'center_face') return t('capture.qualityGate.promptCenter');
    return t('capture.qualityGate.promptGeneral');
  })();

  return (
    <div
      data-testid="pre-capture-quality-gate"
      className={`panel-ramp p-3.5 space-y-3 border border-[#CBD5E1] bg-white ${className}`}
    >
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#0F172A]">
            {t('capture.qualityGate.heading')}
          </span>
          {gate.isLiteMode && (
            <span
              data-testid="quality-gate-lite-badge"
              className="px-2 py-0.5 rounded-sm border border-[#CBD5E1] bg-[#F1F5F9] text-[#475569] font-mono text-[10px] font-semibold uppercase"
            >
              {t('capture.qualityGate.liteModeBadge')}
            </span>
          )}
          {!gate.isLiteMode && gate.isModelLoading && (
            <span className="px-2 py-0.5 rounded-sm border border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] font-mono text-[10px]">
              {t('capture.qualityGate.initializingCv')}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px]">
          {gate.allPassed ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-[#F0FDF4] text-[#0F766E] border border-[#BBF7D0] font-semibold">
              <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
              <span>{t('capture.qualityGate.readyBadge')}</span>
            </span>
          ) : isOverridden ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] font-semibold">
              <ShieldAlert className="w-3 h-3" aria-hidden="true" />
              <span>{t('capture.qualityGate.overrideActiveBadge')}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] font-semibold">
              <AlertTriangle className="w-3 h-3" aria-hidden="true" />
              <span>{t('capture.qualityGate.attentionBadge')}</span>
            </span>
          )}
        </div>
      </div>

      {/* 3 Rectangular Telemetry Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono text-xs">
        {/* 1. Ambient Lighting */}
        <div
          data-testid="quality-badge-lighting"
          className={`p-2.5 rounded-sm border flex flex-col justify-between gap-1 ${
            lightingOk
              ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#0F172A]'
              : 'bg-[#FFFBEB] border-[#FDE68A] text-[#0F172A]'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-[#475569]">
              <Sun className={`w-3.5 h-3.5 ${lightingOk ? 'text-[#0F766E]' : 'text-[#B45309]'}`} aria-hidden="true" />
              {t('capture.qualityGate.lightingLabel')}
            </span>
            <span
              className={`px-1.5 py-0.5 rounded-sm text-[10px] font-bold ${
                lightingOk ? 'bg-[#0F766E] text-white' : 'bg-[#B45309] text-white'
              }`}
            >
              {lightingStatusTag}
            </span>
          </div>
          <div className="text-[11px] font-semibold tabular-nums text-[#0F172A]">
            {gate.lighting.meanLuminance} LUM | {Math.round(gate.lighting.overexposedRatio * 100)}% GLARE
          </div>
        </div>

        {/* 2. Head Pose */}
        <div
          data-testid="quality-badge-pose"
          className={`p-2.5 rounded-sm border flex flex-col justify-between gap-1 ${
            poseLite
              ? 'bg-[#F8FAFC] border-[#CBD5E1] text-[#0F172A]'
              : poseOk
              ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#0F172A]'
              : 'bg-[#FFFBEB] border-[#FDE68A] text-[#0F172A]'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-[#475569]">
              <Compass
                className={`w-3.5 h-3.5 ${
                  poseLite ? 'text-[#64748B]' : poseOk ? 'text-[#0F766E]' : 'text-[#B45309]'
                }`}
                aria-hidden="true"
              />
              {t('capture.qualityGate.poseLabel')}
            </span>
            <span
              className={`px-1.5 py-0.5 rounded-sm text-[10px] font-bold ${
                poseLite
                  ? 'bg-[#475569] text-white'
                  : poseOk
                  ? 'bg-[#0F766E] text-white'
                  : 'bg-[#B45309] text-white'
              }`}
            >
              {poseStatusTag}
            </span>
          </div>
          <div className="text-[11px] font-semibold tabular-nums text-[#0F172A]">
            {gate.headPose.formatted}
          </div>
        </div>

        {/* 3. Eye Visibility */}
        <div
          data-testid="quality-badge-eyes"
          className={`p-2.5 rounded-sm border flex flex-col justify-between gap-1 ${
            eyesLite
              ? 'bg-[#F8FAFC] border-[#CBD5E1] text-[#0F172A]'
              : eyesOk
              ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#0F172A]'
              : 'bg-[#FFFBEB] border-[#FDE68A] text-[#0F172A]'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-[#475569]">
              <Eye
                className={`w-3.5 h-3.5 ${
                  eyesLite ? 'text-[#64748B]' : eyesOk ? 'text-[#0F766E]' : 'text-[#B45309]'
                }`}
                aria-hidden="true"
              />
              {t('capture.qualityGate.eyesLabel')}
            </span>
            <span
              className={`px-1.5 py-0.5 rounded-sm text-[10px] font-bold ${
                eyesLite
                  ? 'bg-[#475569] text-white'
                  : eyesOk
                  ? 'bg-[#0F766E] text-white'
                  : 'bg-[#B45309] text-white'
              }`}
            >
              {eyesStatusTag}
            </span>
          </div>
          <div className="text-[11px] font-semibold tabular-nums text-[#0F172A]">
            {eyesLite
              ? 'LITE MODE'
              : gate.eyeVisibility.leftEar !== null && gate.eyeVisibility.rightEar !== null
              ? `EAR L:${gate.eyeVisibility.leftEar.toFixed(2)} R:${gate.eyeVisibility.rightEar.toFixed(2)}`
              : t('capture.qualityGate.awaitingFace')}
          </div>
        </div>
      </div>

      {/* Concise Corrective Prompt + Subtle Rectangular Override Option */}
      {!gate.allPassed && correctivePrompt && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1 text-xs">
          <p className="text-[#92400E] font-sans font-medium leading-snug">
            {correctivePrompt}
          </p>
          {!isOverridden && (
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                onOverrideProceed();
              }}
              className="btn-ramp-secondary rounded-md py-1.5 px-3 text-[11px] font-mono shrink-0 self-start sm:self-auto"
            >
              {t('capture.qualityGate.proceedAnywayBtn')}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
