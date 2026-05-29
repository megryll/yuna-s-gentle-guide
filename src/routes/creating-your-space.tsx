import { createFileRoute } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/PhoneFrame";
import { useDarkBlurImage } from "@/lib/theme-prefs";

export const Route = createFileRoute("/creating-your-space")({
  head: () => ({ meta: [{ title: "Creating Your Space — Yuna" }] }),
  component: CreatingYourSpace,
});

function CreatingYourSpace() {
  const darkBg = useDarkBlurImage();
  return (
    <PhoneFrame backgroundImage={darkBg}>
      <div
        className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-5 yuna-fade-in"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.42), rgba(0,0,0,0.42)), url(${darkBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        aria-live="polite"
        aria-label="Creating Your Space"
      >
        <span
          className="block h-9 w-9 rounded-full border-2 border-white/25 border-t-white"
          style={{ animation: "yuna-spin 800ms linear infinite" }}
          aria-hidden="true"
        />
        <p className="text-white/95 text-sm tracking-[0.04em]">
          Creating Your Space
        </p>
      </div>
    </PhoneFrame>
  );
}
