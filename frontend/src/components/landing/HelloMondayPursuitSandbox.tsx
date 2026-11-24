import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Crosshair, MousePointer } from 'lucide-react';
import { soundFx } from '../../lib/soundFx';

type TrajectoryType = 'sinusoid' | 'lissajous' | 'stepramp' | 'manual';

export const HelloMondayPursuitSandbox: React.FC = () => {
  const [trajectory, setTrajectory] = useState<TrajectoryType>('sinusoid');
  const [speed, setSpeed] = useState<number>(1.0);
  const [hasOcclusion, setHasOcclusion] = useState<boolean>(false);
  const [trackingStats, setTrackingStats] = useState({
    gainRatio: 0.94,
    rmseNorm: 0.038,
    continuity: 98.6,
    saccades: 2,
    fps: 60,
  });

  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isVisibleRef = useRef<boolean>(true);

  const stateRef = useRef({
    t: 0,
    targetX: 0.5,
    targetY: 0.5,
    eyeX: 0.5,
    eyeY: 0.5,
    saccadeOffset: 0,
    manualTargetX: 0.5,
    manualTargetY: 0.5,
  });

  // Pause canvas loop when section is offscreen to guarantee 0 scroll lag
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.IntersectionObserver !== 'function') return;
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      if (isVisibleRef.current && canvas.offsetWidth > 0) {
        const state = stateRef.current;
        state.t += dt * speed;

        // Trajectory coordinates (normalized 0 to 1)
        let tx = 0.5;
        let ty = 0.5;

        if (trajectory === 'sinusoid') {
          tx = 0.5 + 0.38 * Math.sin(state.t * 1.8);
          ty = 0.5;
        } else if (trajectory === 'lissajous') {
          tx = 0.5 + 0.35 * Math.sin(state.t * 1.5);
          ty = 0.5 + 0.25 * Math.sin(state.t * 3.0);
        } else if (trajectory === 'stepramp') {
          const period = 2.5;
          const phase = (state.t % period) / period;
          tx = 0.15 + phase * 0.7;
          ty = 0.5;
        } else if (trajectory === 'manual') {
          tx = state.manualTargetX;
          ty = state.manualTargetY;
        }

        state.targetX = tx;
        state.targetY = ty;

        // Realistic physiological pursuit lag (~120ms exponential smoothing)
        const lag = 0.12;
        const smoothFactor = 1 - Math.exp(-dt / lag);
        state.eyeX += (state.targetX - state.eyeX) * smoothFactor;
        state.eyeY += (state.targetY - state.eyeY) * smoothFactor;

        // Saccade decay
        state.saccadeOffset *= 0.88;

        // Canvas dimensions & high DPI scaling
        const displayW = canvas.offsetWidth;
        const displayH = canvas.offsetHeight;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        if (canvas.width !== displayW * dpr || canvas.height !== displayH * dpr) {
          canvas.width = displayW * dpr;
          canvas.height = displayH * dpr;
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        ctx.clearRect(0, 0, displayW, displayH);

        // Background
        ctx.fillStyle = '#0F1117';
        ctx.fillRect(0, 0, displayW, displayH);

        // Subtle Reticle Grid
        ctx.strokeStyle = '#1E232F';
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(0, displayH / 2);
        ctx.lineTo(displayW, displayH / 2);
        ctx.moveTo(displayW / 2, 0);
        ctx.lineTo(displayW / 2, displayH);
        ctx.stroke();

        // Horizontal calibration limits (80% width arena)
        ctx.strokeStyle = 'rgba(228, 242, 255, 0.08)';
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(displayW * 0.1, displayH * 0.2, displayW * 0.8, displayH * 0.6);
        ctx.setLineDash([]);

        // Center Occlusion Barrier (if enabled)
        if (hasOcclusion) {
          const occW = displayW * 0.18;
          const occX = (displayW - occW) / 2;
          ctx.fillStyle = 'rgba(185, 28, 28, 0.15)';
          ctx.fillRect(occX, 0, occW, displayH);

          ctx.strokeStyle = 'rgba(185, 28, 28, 0.4)';
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(occX, 0, occW, displayH);
          ctx.setLineDash([]);

          ctx.fillStyle = '#F87171';
          ctx.font = '10px JetBrains Mono';
          ctx.fillText('OCCLUSION GAP', occX + 8, 20);
        }

        const targetPxX = state.targetX * displayW;
        const targetPxY = state.targetY * displayH;
        const eyePxX = (state.eyeX + state.saccadeOffset) * displayW;
        const eyePxY = state.eyeY * displayH;

        // Occlusion check
        const isOccluded = hasOcclusion && Math.abs(state.targetX - 0.5) < 0.09;

        // Draw Target (Chartreuse / Lime dot with reticle)
        if (!isOccluded) {
          ctx.fillStyle = '#0F766E';
          ctx.beginPath();
          ctx.arc(targetPxX, targetPxY, 6, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#0F766E';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(targetPxX - 11, targetPxY - 11, 22, 22);
        }

        // Draw Eye Gaze Point (Crisp White dot with crosshair)
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(eyePxX, eyePxY, 4.5, 0, Math.PI * 2);
        ctx.fill();

        // Vector connection line between target and gaze
        if (!isOccluded) {
          ctx.strokeStyle = 'rgba(228, 253, 83, 0.45)';
          ctx.setLineDash([3, 3]);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(targetPxX, targetPxY);
          ctx.lineTo(eyePxX, eyePxY);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [trajectory, speed, hasOcclusion]);

  const handleTrajectoryChange = (type: TrajectoryType) => {
    soundFx.playHover();
    setTrajectory(type);
    if (type === 'sinusoid') {
      setTrackingStats({ gainRatio: 0.94, rmseNorm: 0.038, continuity: 98.6, saccades: 2, fps: 60 });
    } else if (type === 'lissajous') {
      setTrackingStats({ gainRatio: 0.89, rmseNorm: 0.052, continuity: 96.2, saccades: 4, fps: 60 });
    } else if (type === 'stepramp') {
      setTrackingStats({ gainRatio: 0.91, rmseNorm: 0.045, continuity: 97.4, saccades: 3, fps: 60 });
    } else {
      setTrackingStats({ gainRatio: 0.96, rmseNorm: 0.032, continuity: 99.1, saccades: 1, fps: 60 });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (trajectory !== 'manual') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0.1, Math.min(0.9, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0.15, Math.min(0.85, (e.clientY - rect.top) / rect.height));
    stateRef.current.manualTargetX = x;
    stateRef.current.manualTargetY = y;
  };

  const handleTriggerSaccade = () => {
    soundFx.playClick();
    stateRef.current.saccadeOffset = (Math.random() > 0.5 ? 1 : -1) * 0.12;
    setTrackingStats((prev) => ({ ...prev, saccades: prev.saccades + 1 }));
  };

  return (
    <section
      ref={sectionRef}
      id="pursuit-chapter"
      className="py-20 sm:py-28 px-6 sm:px-10 lg:px-12 border-b border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A]"
    >
      <div className="max-w-[1440px] mx-auto space-y-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#E2E8F0] pb-6"
        >
          <div className="space-y-2 max-w-2xl">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#64748B] font-semibold">
              Chapter 02 · SMOOTH PURSUIT OCULAR MOTOR CONTROL
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-[#0F172A]">
              Smooth Pursuit <span className="italic text-[#475569]">Kinematic Sandbox.</span>
            </h2>
            <p className="font-sans text-sm text-[#475569] leading-relaxed">
              Examine the cerebellar tracking engine across harmonic target sweeps. Benchmark ocular gaze velocity gain ratio and ballistic catch-up saccade occurrences in real time.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono font-medium bg-white text-[#0F172A] border border-[#E2E8F0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E]" />
              Continuous 60 FPS Sweep
            </span>
          </div>
        </motion.div>

        {/* Ramp Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Visual Sweep Arena */}
          <div className="lg:col-span-8 panel-ramp p-6 sm:p-8 space-y-6 bg-white shadow-ramp-card">

            {/* Trajectory Selectors & Canvas Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
              <div className="flex items-center gap-1.5 p-1 bg-[#F1F5F9] rounded-lg border border-[#E2E8F0] text-xs font-mono">
                {(['sinusoid', 'lissajous', 'stepramp', 'manual'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleTrajectoryChange(t)}
                    className={`px-3 py-1 rounded font-medium capitalize transition-colors ${
                      trajectory === t
                        ? 'bg-white text-[#0F172A] shadow-sm font-semibold'
                        : 'text-[#475569] hover:text-[#0F172A]'
                    }`}
                  >
                    {t === 'sinusoid'
                      ? 'Harmonic (0.4 Hz)'
                      : t === 'lissajous'
                      ? 'Lissajous 2D'
                      : t === 'stepramp'
                      ? 'Step-Ramp'
                      : 'Interactive Mouse'}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-[#0F172A] font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0F766E] border border-[#0F172A]" />
                  Stimulus
                </span>
                <span className="flex items-center gap-1.5 text-[#475569]">
                  <span className="w-2.5 h-2.5 rounded-full bg-white border border-[#0F172A]" />
                  Tracked Gaze
                </span>
              </div>
            </div>

            {/* Sweep Canvas Arena */}
            <div className="relative aspect-[16/9] w-full rounded-lg overflow-hidden bg-[#0F1117] border border-[#27282D] flex items-center justify-center shadow-inner cursor-crosshair">
              <canvas
                ref={canvasRef}
                onMouseMove={handleCanvasMouseMove}
                className="w-full h-full block"
              />

              {trajectory === 'manual' && (
                <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-xs px-2.5 py-1 rounded text-[11px] font-mono text-[#0F766E] border border-white/10 flex items-center gap-1.5">
                  <MousePointer className="w-3 h-3" />
                  <span>Move cursor in arena to steer target</span>
                </div>
              )}
            </div>

            {/* Controls Bar Below Arena */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 font-mono text-xs">
              {/* Velocity Sweep Rate Slider */}
              <div className="flex items-center gap-3">
                <span className="text-[#475569]">Sweep Frequency:</span>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  className="w-28 accent-[#0F172A] bg-[#E2E8F0] h-1.5 rounded appearance-none cursor-pointer"
                />
                <span className="font-semibold text-[#0F172A]">{speed.toFixed(1)}x ({((speed * 0.4).toFixed(2))} Hz)</span>
              </div>

              <div className="flex items-center gap-3">
                {/* Occlusion Toggle */}
                <label className="flex items-center gap-1.5 cursor-pointer text-[#475569] hover:text-[#0F172A]">
                  <input
                    type="checkbox"
                    checked={hasOcclusion}
                    onChange={(e) => setHasOcclusion(e.target.checked)}
                    className="accent-[#0F172A] rounded cursor-pointer"
                  />
                  <span>Test Occlusion Gap</span>
                </label>

                {/* Induce Saccade Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleTriggerSaccade}
                  className="btn-ramp-secondary text-xs py-1 px-3 flex items-center gap-1"
                >
                  <Crosshair className="w-3 h-3 text-[#B91C1C]" />
                  <span>Induce Saccade</span>
                </motion.button>
              </div>
            </div>

          </div>

          {/* Right Column: Quantitative Telemetry Panel */}
          <div className="lg:col-span-4 panel-ramp p-6 sm:p-8 space-y-6 bg-white shadow-ramp-card">

            <h3 className="font-mono text-xs uppercase tracking-wider text-[#64748B] font-semibold pb-3 border-b border-[#E2E8F0]">
              Kinematic Telemetry
            </h3>

            {/* Quantitative Numbers */}
            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                <span className="text-[#475569]">Velocity Gain:</span>
                <span className="text-base font-semibold text-[#0F766E]">{trackingStats.gainRatio.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                <span className="text-[#475569]">RMSE Error:</span>
                <span className="text-base font-semibold text-[#0F172A]">{trackingStats.rmseNorm.toFixed(3)}</span>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                <span className="text-[#475569]">Catch-Up Saccades:</span>
                <span className="text-base font-semibold text-[#B45309]">{trackingStats.saccades} jumps</span>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                <span className="text-[#475569]">Sampling Floor:</span>
                <span className="text-base font-semibold text-[#0F172A]">{trackingStats.fps} FPS</span>
              </div>
            </div>

            <p className="text-xs text-[#475569] leading-relaxed font-normal">
              A pursuit gain ratio below 0.85 accompanied by elevated catch-up saccade counts suggests potential disruption within the cerebellar or vestibulocerebellar motor control pathway.
            </p>

          </div>

        </div>

      </div>
    </section>
  );
};

export default HelloMondayPursuitSandbox;
