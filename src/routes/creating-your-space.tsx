import { createFileRoute } from "@tanstack/react-router";
import { LeafSpinner } from "@/components/LeafSpinner";
import { useDarkBlurImage } from "@/lib/theme-prefs";

export const Route = createFileRoute("/creating-your-space")({
  head: () => ({ meta: [{ title: "Creating Your Space — Yuna" }] }),
  component: CreatingYourSpace,
});

function CreatingYourSpace() {
  const darkBg = useDarkBlurImage();
  return (
    // Full-screen "creating" moment on the dark photo (mode-locked, no nav
    // shell) — the web analog to its PhoneFrame, scaling to any viewport. Keeps
    // a heavier tint than other funnel screens to read as a dimmed transition.
    <div
      className="min-h-[100svh] w-full flex flex-col items-center justify-center gap-5 bg-cover bg-center text-white yuna-fade-in"
      style={{
        backgroundImage: `linear-gradient(rgba(0,0,0,0.42), rgba(0,0,0,0.42)), url(${darkBg})`,
      }}
      aria-live="polite"
      aria-label="Creating Your Space"
    >
      <LeafSpinner size={64} surface="dark" />
      <p className="text-white/95 text-sm tracking-[0.04em]">
        Creating Your Space
      </p>
    </div>
  );
}
