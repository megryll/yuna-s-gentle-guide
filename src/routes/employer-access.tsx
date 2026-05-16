import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Check, ChevronLeft, Lock } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { KEYBOARD_HEIGHT } from "@/components/KeyboardSimulator";

export const Route = createFileRoute("/employer-access")({
  head: () => ({
    meta: [
      { title: "Your benefit is waiting — Yuna" },
      {
        name: "description",
        content:
          "Enter your employer access code or work email to unlock your Yuna pass.",
      },
    ],
  }),
  component: EmployerAccessScreen,
});

// How far to slide the screen up when the keyboard is showing. We don't push
// up by the full keyboard height — keeping ~70px of breathing room above the
// input feels closer to native iOS behavior.
const FOCUS_SHIFT = KEYBOARD_HEIGHT - 70;

function EmployerAccessScreen() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  const unlock = () => {
    if (!code.trim()) return;
    (document.activeElement as HTMLElement | null)?.blur?.();
    setUnlocked(true);
  };

  return (
    <PhoneFrame backgroundImage="/background.png">
      <div
        className="flex-1 flex flex-col px-8 pt-14 pb-10 text-white yuna-fade-in transition-transform duration-200 ease-out"
        style={
          inputFocused && !unlocked
            ? { transform: `translateY(-${FOCUS_SHIFT}px)` }
            : undefined
        }
      >
        <div className="flex items-center justify-between">
          <Button
            surface="dark"
            variant="secondary"
            size="icon"
            onClick={() => navigate({ to: "/" })}
            aria-label="Back"
          >
            <ChevronLeft size={14} strokeWidth={1.5} />
          </Button>
          <span className="h-9 w-9" />
        </div>

        <div className="mt-8 text-center yuna-rise">
          <h1 className="font-serif text-[30px] leading-[1.1] tracking-tight">
            {unlocked ? "You're in." : "Your benefit is waiting."}
          </h1>
          <p className="mt-3 text-[15px] leading-snug text-white/80">
            {unlocked
              ? "Your pass is ready to claim!"
              : "Enter the email linked to your benefits or your access code to unlock your pass."}
          </p>
        </div>

        <div className="mt-9 flex-1 flex flex-col justify-center">
          <PassCard unlocked={unlocked} />
        </div>

        <div className="mt-6">
          {unlocked ? (
            <div className="flex flex-col items-center gap-4 yuna-rise">
              <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-white">
                100% Private, guaranteed
                <Lock size={13} strokeWidth={1.75} />
              </p>
              <p className="text-center text-[13px] leading-relaxed text-white/75">
                Your organization pays for your access, but they won't see who
                claims an account or anything you discuss with Yuna.
              </p>
              <Button
                surface="dark"
                variant="primary"
                fullWidth
                className="mt-2"
                onClick={() => navigate({ to: "/auth" })}
              >
                Create your private account
              </Button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                unlock();
              }}
              className="flex flex-col gap-3"
            >
              <TextField
                surface="dark"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder="Enter your email or access code here"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
              <Button
                surface="dark"
                variant="primary"
                fullWidth
                type="submit"
                disabled={!code.trim()}
              >
                Unlock my pass
              </Button>
              <p className="mt-2 text-center text-sm text-white/70">
                Not sure?{" "}
                <button type="button" className="font-semibold text-white">
                  Get Help
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </PhoneFrame>
  );
}

// Soft outer halo that fans above/below the card edges when unlocked.
const HALO_GRADIENT =
  "linear-gradient(90deg, transparent 0%, rgba(140, 230, 80, 0.45) 22%, rgba(210, 255, 160, 0.7) 50%, rgba(140, 230, 80, 0.45) 78%, transparent 100%)";
// Inner edge bar — clipped by the card's rounded corners, so the gradient
// hugs the curve instead of floating above as a flat hairline.
const EDGE_BAR_GRADIENT =
  "linear-gradient(90deg, rgba(38, 78, 22, 0.92) 0%, rgba(102, 186, 36, 0.96) 22%, rgba(190, 250, 140, 1) 50%, rgba(102, 186, 36, 0.96) 78%, rgba(38, 78, 22, 0.92) 100%)";

function PassCard({ unlocked }: { unlocked: boolean }) {
  return (
    <div className="relative" style={{ perspective: 1400 }}>
      {/* Soft green outer halos — bleed beyond the card to suggest light
          escaping past the gradient bars. Sit outside the flip container so
          they don't rotate with the card. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-1.5 inset-x-4 h-2.5"
        style={{
          background: HALO_GRADIENT,
          filter: "blur(6px)",
          opacity: unlocked ? 1 : 0,
          transition: "opacity 700ms ease 450ms",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-1.5 inset-x-4 h-2.5"
        style={{
          background: HALO_GRADIENT,
          filter: "blur(6px)",
          opacity: unlocked ? 1 : 0,
          transition: "opacity 700ms ease 450ms",
        }}
      />

      {/* Flip container — two faces sharing the same footprint, rotating
          around the Y axis when the unlock state flips. */}
      <div
        className="relative"
        style={{
          transformStyle: "preserve-3d",
          transform: unlocked ? "rotateY(180deg)" : "rotateY(0deg)",
          transition: "transform 900ms cubic-bezier(0.7, 0, 0.3, 1)",
        }}
      >
        <div
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          <PassFace unlocked={false} />
        </div>
        <div
          className="absolute inset-0"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <PassFace unlocked={true} />
        </div>
      </div>
    </div>
  );
}

function PassFace({ unlocked }: { unlocked: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-[20px] border-t border-white/30 bg-white/[0.11] backdrop-blur-md">
      {/* Greenish sheen — a soft diagonal wash that gives the card a hint of
          living color against the dark forest bg. Slightly punchier when
          unlocked. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: unlocked
            ? "radial-gradient(ellipse 85% 75% at 0% 0%, rgba(125, 210, 55, 0.42) 0%, rgba(102, 186, 36, 0.18) 32%, rgba(102, 186, 36, 0.06) 55%, transparent 75%), radial-gradient(ellipse 75% 65% at 100% 100%, rgba(125, 210, 55, 0.34) 0%, rgba(102, 186, 36, 0.14) 30%, transparent 65%)"
            : "radial-gradient(ellipse 80% 70% at 0% 0%, rgba(102, 186, 36, 0.34) 0%, rgba(102, 186, 36, 0.14) 32%, rgba(102, 186, 36, 0.04) 55%, transparent 75%), radial-gradient(ellipse 70% 60% at 100% 100%, rgba(102, 186, 36, 0.26) 0%, rgba(102, 186, 36, 0.10) 30%, transparent 65%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.18) 0.9px, transparent 1.2px)",
          backgroundSize: "12px 12px",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 65% at 15% 95%, black 0%, transparent 65%), radial-gradient(ellipse 65% 60% at 92% 8%, black 0%, transparent 65%)",
          maskImage:
            "radial-gradient(ellipse 70% 65% at 15% 95%, black 0%, transparent 65%), radial-gradient(ellipse 65% 60% at 92% 8%, black 0%, transparent 65%)",
        }}
      />

      {/* Green gradient edge bars — only on the unlocked face. They sit
          inside the overflow-hidden + rounded container so the corner
          radius clips them, making the gradient hug the curve. */}
      {unlocked && (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute top-0 inset-x-0 h-[5px]"
            style={{ background: EDGE_BAR_GRADIENT }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-0 inset-x-0 h-[5px]"
            style={{ background: EDGE_BAR_GRADIENT }}
          />
        </>
      )}

      {unlocked && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 keepsake-shimmer"
        />
      )}

      <div className="relative px-5 pt-5 pb-4">
        <div className="flex items-start justify-between">
          <h3 className="font-serif text-[22px] leading-[1.05] tracking-tight">
            Unlimited Access
          </h3>
          <img
            src="/yuna-logo.svg"
            alt="Yuna"
            className="h-[18px] w-auto mt-0.5 opacity-95"
          />
        </div>

        <div className="mt-3.5 flex items-center gap-3">
          <span
            className={
              "font-sans-ui text-[10px] tracking-[0.2em] uppercase px-2.5 h-6 inline-flex items-center rounded-full " +
              (unlocked
                ? "bg-success-green text-white shadow-[0_0_10px_rgba(102,186,36,0.55)]"
                : "bg-transparent text-white border border-white/40")
            }
          >
            {unlocked ? "Active" : "Awaiting Verification"}
          </span>
          <span className="font-sans-ui text-[10px] tracking-[0.2em] uppercase text-white/70">
            24/7 · Private
          </span>
        </div>

        <div className="mt-3.5 flex items-center gap-4 text-[13px] text-white/90">
          {["Unlimited sessions", "Anytime", "100% Free"].map((label) => (
            <div key={label} className="flex items-center gap-1.5">
              <Check
                size={13}
                strokeWidth={2.5}
                className={unlocked ? "text-success-green" : "text-white"}
              />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative h-[18px]">
        <div className="absolute inset-x-5 top-1/2 -translate-y-1/2 border-t border-dashed border-white/30" />
      </div>

      <div className="relative px-5 pt-2 pb-5">
        <div className="grid grid-cols-2 gap-4">
          <PassField
            label="Pass Number"
            value="YN-04428-7726"
            unlocked={unlocked}
            redactedWidths={[64, 56]}
          />
          <PassField
            label="Valid Starting"
            value="MAY · 2026 →"
            unlocked={unlocked}
            redactedWidths={[44, 36]}
          />
        </div>

        <div className="mt-5 flex items-end justify-between">
          <Waveform
            pattern={[7, 11, 5, 13, 9, 14, 6, 11, 8, 12, 7, 10, 5, 9]}
            tinted={unlocked}
          />
          <Waveform
            pattern={[10, 6, 13, 8, 14, 7, 11, 9, 5, 12, 8, 10, 6, 11]}
            tinted={unlocked}
          />
        </div>
      </div>
    </div>
  );
}

function PassField({
  label,
  value,
  unlocked,
  redactedWidths,
}: {
  label: string;
  value: string;
  unlocked: boolean;
  redactedWidths: [number, number];
}) {
  return (
    <div>
      <p className="font-sans-ui text-[10px] tracking-[0.22em] uppercase text-white/60">
        {label}
      </p>
      <div className="mt-2 h-[18px] flex items-center">
        {unlocked ? (
          <p className="text-[15px] font-semibold tracking-wide yuna-fade-in">
            {value}
          </p>
        ) : (
          <div className="flex items-center gap-1.5">
            {redactedWidths.map((w, i) => (
              <span
                key={i}
                className="h-[3px] rounded-full bg-white/35"
                style={{ width: w }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Waveform({
  pattern,
  tinted = false,
}: {
  pattern: number[];
  tinted?: boolean;
}) {
  return (
    <div className="flex items-end gap-[3px] h-4">
      {pattern.map((h, i) => (
        <span
          key={i}
          className={
            "w-[2px] rounded-[1px] " +
            (tinted ? "bg-success-green/75" : "bg-white/55")
          }
          style={{ height: `${h}px` }}
        />
      ))}
    </div>
  );
}
