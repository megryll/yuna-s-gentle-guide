import { useEffect, useRef } from "react";

const WAVE_BAR_COUNT = 36;

type WaveformProps = {
  analyser?: AnalyserNode | null;
  className?: string;
  barClassName?: string;
};

export function Waveform({ analyser, className, barClassName }: WaveformProps) {
  const barsRef = useRef<Array<HTMLSpanElement | null>>([]);

  useEffect(() => {
    if (!analyser) return;
    const buf = new Uint8Array(analyser.fftSize);
    let raf = 0;
    const tick = () => {
      analyser.getByteTimeDomainData(buf);
      const chunk = Math.floor(buf.length / WAVE_BAR_COUNT);
      for (let i = 0; i < WAVE_BAR_COUNT; i++) {
        let peak = 0;
        const start = i * chunk;
        for (let j = 0; j < chunk; j++) {
          // 128 is silence in 8-bit time domain. Center on 0 then normalize.
          const v = Math.abs(buf[start + j] - 128) / 128;
          if (v > peak) peak = v;
        }
        // Aggressive compression curve so normal speech fills most of the
        // range. Small noise floor keeps the bars at rest when silent.
        const cleaned = Math.max(0, peak - 0.015);
        const boosted = Math.pow(cleaned, 0.35) * 1.8;
        const h = Math.max(0.1, Math.min(1, boosted));
        const el = barsRef.current[i];
        if (el) el.style.height = `${Math.round(h * 100)}%`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [analyser]);

  return (
    <div
      aria-hidden="true"
      className={"flex items-center justify-between overflow-hidden " + (className ?? "flex-1 h-6")}
    >
      {Array.from({ length: WAVE_BAR_COUNT }).map((_, i) => (
        <span
          key={i}
          ref={(el) => {
            barsRef.current[i] = el;
          }}
          className={"w-[2px] rounded-full " + (barClassName ?? "bg-white")}
          style={{ height: "12%", transition: "height 70ms linear" }}
        />
      ))}
    </div>
  );
}
