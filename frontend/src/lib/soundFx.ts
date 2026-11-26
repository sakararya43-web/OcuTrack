/**
 * Lightweight Web Audio API UI sound effects with safe no-op fallbacks
 * for headless/test environments or browsers without AudioContext.
 */

type OscillatorWave = OscillatorType;

class SoundEffects {
  private ctx: AudioContext | null = null;
  private muted = false;

  private getContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') {
      return null;
    }

    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) {
        return null;
      }
      try {
        this.ctx = new AudioCtx();
      } catch {
        return null;
      }
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {
        // Ignore autoplay policy restrictions until user interaction
      });
    }

    return this.ctx;
  }

  private playTone(
    startFreq: number,
    durationSec: number,
    wave: OscillatorWave = 'sine',
    peakGain = 0.04,
    endFreq?: number,
    delaySec = 0
  ): void {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime + delaySec;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = wave;
      osc.frequency.setValueAtTime(startFreq, now);
      if (endFreq !== undefined) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + durationSec);
      }

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(peakGain, now + Math.min(0.01, durationSec * 0.25));
      gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + durationSec + 0.01);
    } catch {
      // Never let audio feedback interrupt UI interactions
    }
  }

  playClick(): void {
    // Intentionally silent: button click audio disabled
  }

  playHover(): void {
    // Intentionally silent: hover/selection audio disabled
  }

  playTick(): void {
    this.playTone(880, 0.03, 'sine', 0.025, 660);
  }

  playFlash(): void {
    this.playTone(740, 0.09, 'sine', 0.04, 1120);
  }

  playSuccess(): void {
    this.playTone(523.25, 0.09, 'sine', 0.035);
    this.playTone(659.25, 0.14, 'sine', 0.04, undefined, 0.075);
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
  }
}

export const soundFx = new SoundEffects();
