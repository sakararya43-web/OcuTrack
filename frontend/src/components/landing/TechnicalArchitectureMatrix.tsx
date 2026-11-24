import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  Code2,
  CheckCircle2,
  Copy,
  Check,
} from 'lucide-react';
import { soundFx } from '../../lib/soundFx';
import { useTranslation } from '../../i18n';

const CODE_SNIPPETS: Record<string, string> = {
  frontend: `// Client-Side Scientific Quality Gate
const validateRecording = (frames: VideoFrame[], lux: number) => {
  const fps = frames.length / (durationMs / 1000);
  if (fps < 25.0) throw new QualityError("FPS_FLOOR_VIOLATION");
  if (lux < 0.28) throw new QualityError("SCOTOPIC_AMBIENT_UNDEREXPOSURE");
  return { status: "QUALIFIED_FOR_PIPELINE", fps, lux };
};`,
  cv: `// 11.7 mm Anthropometric Ruler Normalization
const IRIS_DIAMETER_MM = 11.70;
const calculateScale = (irisPoints: Point3D[]) => {
  const pixelDiameter = euclideanDistance(irisPoints[468], irisPoints[473]);
  const mmPerPixel = IRIS_DIAMETER_MM / pixelDiameter;
  return { mmPerPixel, irisDiameterPx: pixelDiameter };
};`,
  backend: `// Longitudinal Intra-Patient Baseline Comparator
def compute_longitudinal_delta(current_session, baseline_session):
    delta_latency = current_session.latency_ms - baseline_session.latency_ms
    delta_gain = current_session.pursuit_gain - baseline_session.pursuit_gain
    is_deviated = (delta_latency > 15.0) or (delta_gain < -0.08)
    return LongitudinalResult(delta_latency=delta_latency, alert=is_deviated)`,
  privacy: `// Burn-After-Reading Video File Destruction
async def process_and_destroy_video(temp_video_path: Path):
    try:
        landmarks = extract_mediapipe_landmarks(temp_video_path)
        biometrics = calculate_kinematics(landmarks)
        return biometrics
    finally:
        if temp_video_path.exists():
            temp_video_path.unlink() # Permanent unrecoverable deletion`,
};

export const TechnicalArchitectureMatrix: React.FC = () => {
  const { t, dict } = useTranslation();
  const [activeLayerId, setActiveLayerId] = useState<string>('frontend');
  const [copied, setCopied] = useState<boolean>(false);

  const layers = dict.techArch.layers.map((layer) => ({
    ...layer,
    codeSnippet: CODE_SNIPPETS[layer.id] || '',
  }));

  const current = layers.find((l) => l.id === activeLayerId) || layers[0];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(current.codeSnippet);
    soundFx.playClick();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="technical-architecture" className="py-20 sm:py-28 px-6 sm:px-10 lg:px-12 bg-[#F1F5F9] border-b border-[#E2E8F0]">
      <div className="max-w-[1440px] mx-auto space-y-12">

        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#E2E8F0] pb-6"
        >
          <div className="space-y-3 max-w-2xl">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#64748B] font-semibold">
              {t('techArch.eyebrow')}
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-[#0F172A]">
              {t('techArch.headingMain')} <span className="italic text-[#475569]">{t('techArch.headingItalic')}</span>
            </h2>
            <p className="font-sans text-sm text-[#475569] leading-relaxed">
              {t('techArch.subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-medium bg-white text-[#0F172A] border border-[#E2E8F0]">
              <Layers className="w-3.5 h-3.5 text-[#0F766E]" />
              {t('techArch.tiersBadge')}
            </span>
          </div>
        </motion.div>

        {/* Architecture Navigation Tabs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {layers.map((l) => {
            const isActive = l.id === activeLayerId;
            return (
              <motion.button
                key={l.id}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setActiveLayerId(l.id);
                  soundFx.playClick();
                }}
                className={`text-left p-4 rounded-xl border transition-all relative ${
                  isActive
                    ? 'bg-white border-[#0F172A] shadow-md ring-1 ring-[#0F172A]'
                    : 'bg-[#EAE9E2]/70 border-[#E2E8F0] hover:bg-white hover:border-[#CBD5E1]'
                }`}
              >
                <span className="font-mono text-[10px] text-[#64748B] block mb-1">
                  {t('techArch.tierPrefix', { num: l.number })}
                </span>
                <span className="font-serif text-base font-normal text-[#0F172A] block leading-snug">
                  {l.name.split('&')[0]}
                </span>
                <span className="font-mono text-[10px] text-[#0F766E] block mt-2">
                  {l.tech.split('·')[0]}
                </span>

                {isActive && (
                  <motion.div
                    layoutId="activeArchPill"
                    className="absolute -bottom-[1px] left-3 right-3 h-0.5 bg-[#0F172A]"
                  />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Active Layer Deep Dive Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="panel-ramp p-6 sm:p-8 space-y-8 shadow-ramp-card bg-white"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

              {/* Left: Description & Key Innovations */}
              <div className="lg:col-span-7 space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#0F766E] animate-pulse" />
                    <span className="font-mono text-xs uppercase tracking-wider text-[#64748B] font-semibold">
                      {current.lead}
                    </span>
                  </div>
                  <h3 className="font-serif text-2xl sm:text-3xl text-[#0F172A] font-normal">
                    {current.name}
                  </h3>
                  <span className="inline-block px-2.5 py-1 rounded bg-[#F1F5F9] border border-[#E2E8F0] font-mono text-xs text-[#0F766E]">
                    {current.tech}
                  </span>
                </div>

                <p className="font-sans text-sm text-[#475569] leading-relaxed">
                  {current.summary}
                </p>

                {/* Key Architectural Innovations */}
                <div className="space-y-3 pt-2">
                  <span className="font-mono text-xs uppercase tracking-wider text-[#0F172A] font-bold block">
                    {t('techArch.coreCapabilities')}
                  </span>
                  <div className="space-y-2.5">
                    {current.keyInnovations.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 font-sans text-xs text-[#475569]">
                        <CheckCircle2 className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Code Implementation Artifact with Copy Button */}
              <div className="lg:col-span-5 space-y-3">
                <div className="flex items-center justify-between font-mono text-xs text-[#64748B] px-1">
                  <span className="flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-[#0F766E]" />
                    {t('techArch.prodLogic')}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1 text-[11px] text-[#475569] hover:text-[#0F172A] transition-colors p-1 rounded"
                    title={t('techArch.copyTitle')}
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#0F766E]" />
                        <span className="text-[#0F766E]">{t('techArch.copied')}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>{t('techArch.copy')}</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-[#0F1117] border border-[#27282D] overflow-x-auto shadow-inner">
                  <pre className="font-mono text-xs text-[#0F766E] leading-relaxed">
                    <code>{current.codeSnippet}</code>
                  </pre>
                </div>

                <p className="font-mono text-[10px] text-[#64748B] text-right">
                  {t('techArch.synthesizedNote')}
                </p>
              </div>

            </div>
          </motion.div>
        </AnimatePresence>

      </div>
    </section>
  );
};

export default TechnicalArchitectureMatrix;
