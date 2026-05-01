// Synthesized chat-bubble sound effects (Web Audio API).
//
// Two sounds:
//   - playYunaBubbleSound: "Warm pop" — 220→330 Hz sine, soft. Plays on each
//     Yuna message arrival.
//   - playUserSendSound:   "Drop"     — 440→220 Hz descending sine. Plays
//     when the user sends a message.

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

export function playYunaBubbleSound(opts: { muted?: boolean } = {}) {
  withCtx(opts, (ctx) => {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(330, t + 0.08);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.22, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.3);
  });
}

export function playUserSendSound(opts: { muted?: boolean } = {}) {
  withCtx(opts, (ctx) => {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.14);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.23);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.27);
  });
}
