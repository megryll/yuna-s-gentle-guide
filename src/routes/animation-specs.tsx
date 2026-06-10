import { createFileRoute } from "@tanstack/react-router";

import {
  getScreenplay,
  type AmbientLoop,
  type Beat,
} from "@/lib/engineer-notes";

// Opened in a new tab from the Implementation panel's "Animation specs" link,
// with ?screen=<pathname>. A plain, self-contained doc for one screen — no app
// chrome (the root hides its sidebars/toggles for this route). Reads as a
// screenplay: an ordered sequence of beats, then the continuous ambient loops.
export const Route = createFileRoute("/animation-specs")({
  validateSearch: (search: Record<string, unknown>) => ({
    screen: typeof search.screen === "string" ? search.screen : "/",
  }),
  head: () => ({ meta: [{ title: "Animation screenplay — Yuna" }] }),
  component: AnimationSpecsPage,
});

function AnimationSpecsPage() {
  const { screen } = Route.useSearch();
  const { label, sequence, ambient } = getScreenplay(screen);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-8 py-14">
        <p className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground">
          Animation screenplay
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">{label}</h1>
        <p className="mt-2 font-mono text-[13px] text-muted-foreground">{screen}</p>

        {sequence.length > 0 && <Sequence beats={sequence} />}
        {ambient.length > 0 && <Ambient loops={ambient} />}
        {sequence.length === 0 && ambient.length === 0 && (
          <p className="mt-10 text-[14px] leading-relaxed text-muted-foreground">
            No animations recorded for this screen.
          </p>
        )}

        <p className="mt-12 border-t border-border pt-4 text-[13px] leading-relaxed text-muted-foreground">
          Timings are grounded in <code className="font-mono">src/styles.css</code>{" "}
          and each screen's own timing logic. Honor{" "}
          <code className="font-mono">prefers-reduced-motion</code> where noted.
        </p>
      </div>
    </main>
  );
}

// The timed entrance choreography, read top-to-bottom. A left cue gutter marks
// when each beat fires; a connector line threads them into one sequence.
function Sequence({ beats }: { beats: Beat[] }) {
  return (
    <section className="mt-10">
      <h2 className="text-lg tracking-tight">Sequence</h2>
      <ol className="mt-4">
        {beats.map((b, i) => {
          const props = [b.motion, b.duration, b.easing].filter(Boolean);
          const last = i === beats.length - 1;
          return (
            <li key={i} className="grid grid-cols-[4.5rem_1fr] gap-4">
              <span className="pt-0.5 text-right font-mono text-[12.5px] tabular-nums text-foreground/80">
                {b.cue}
              </span>
              <div
                className={
                  "relative pl-5 " +
                  (last ? "pb-1" : "pb-7") +
                  (last ? "" : " border-l border-border")
                }
              >
                <span
                  aria-hidden
                  className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-foreground ring-4 ring-background"
                />
                <p className="text-base font-medium leading-snug">{b.event}</p>
                <p className="mt-1 text-[13.5px] leading-relaxed text-foreground/85">
                  {b.element}
                </p>
                {props.length > 0 && (
                  <p className="mt-1.5 font-mono text-[12.5px] text-foreground/70">
                    {props.join("  ·  ")}
                  </p>
                )}
                {b.css && (
                  <p className="mt-1 font-mono text-[12px] text-muted-foreground">
                    {b.css}
                  </p>
                )}
                {b.note && (
                  <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                    {b.note}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

// Continuous loops with no discrete start — they run the whole time the screen
// is visible, so they sit outside the timed sequence.
function Ambient({ loops }: { loops: AmbientLoop[] }) {
  return (
    <section className="mt-12">
      <h2 className="text-lg tracking-tight">Ongoing</h2>
      <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
        Continuous loops — they run the whole time the screen is visible.
      </p>
      <ul className="mt-3 flex flex-col divide-y divide-border border-y border-border">
        {loops.map((l) => (
          <li key={l.name} className="py-4">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-base font-medium">{l.name}</span>
              <code className="shrink-0 font-mono text-[12.5px] text-muted-foreground">
                {l.timing}
              </code>
            </div>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-foreground/85">
              {l.element}
            </p>
            {l.motion && (
              <p className="mt-1 font-mono text-[12.5px] text-foreground/70">
                {l.motion}
              </p>
            )}
            <p className="mt-1 font-mono text-[12px] text-muted-foreground">
              {l.css}
            </p>
            {l.note && (
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                {l.note}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
