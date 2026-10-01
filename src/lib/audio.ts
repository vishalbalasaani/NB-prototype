/**
 * Audio feedback utility for NodeBricks
 * ----------------------------------------------------
 * Uses the standard Web Audio API to synthesize a subtle,
 * pleasant confirmation chime without external audio assets.
 * Fails gracefully if device audio is muted or unavailable.
 */

export function playSuccessChime(): void {
  if (typeof window === 'undefined') return;

  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';

    // Harmonic two-tone ascending chime (587.33Hz D5 -> 880Hz A5)
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(587.33, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);

    // Soft, non-intrusive volume curve
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.1, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);

    // Close context after completion
    setTimeout(() => {
      try {
        ctx.close();
      } catch {}
    }, 400);
  } catch {
    // Fail silently without affecting the UI
  }
}
