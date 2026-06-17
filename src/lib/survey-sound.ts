// Synthesized questionnaire sound effects (Web Audio API), same idiom as
// bubble-sound.ts. Three sounds, all quiet — the register beat of the survey's
// interaction grammar (see QUESTIONNAIRE-UX-APPROACH.md):
//   - playSelectPop:     bright C5→G5 sine sweep when an answer is picked.
//   - playSliderTick:    near-subliminal blip per slider step, scroll-wheel feel.
//   - playCompleteSwell: soft C-E-G arpeggio, reserved for the completion
//     moment (the flow's single celebration).

let ctxSingleton: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctxSingleton) return ctxSingleton;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctx) return null;
  try {
    ctxSingleton = new Ctx();
  } catch {
    return null;
  }
  return ctxSingleton;
}

function withCtx(opts: { muted?: boolean }, fn: (ctx: AudioContext) => void) {
  if (opts.muted) return;
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  try {
    fn(ctx);
  } catch {
    // ignore
  }
}

export function playSelectPop(opts: { muted?: boolean } = {}) {
  withCtx(opts, (ctx) => {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(523, t); // C5
    osc.frequency.exponentialRampToValueAtTime(784, t + 0.06); // G5
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.16, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.2);
  });
}

export function playCompleteSwell(opts: { muted?: boolean } = {}) {
  withCtx(opts, (ctx) => {
    const t0 = ctx.currentTime;
    [523, 659, 784].forEach((freq, i) => {
      // C5 → E5 → G5
      const t = t0 + i * 0.09;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.6);
    });
  });
}

export function playSliderTick(opts: { muted?: boolean } = {}) {
  withCtx(opts, (ctx) => {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(880, t);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.05, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.05);
  });
}
