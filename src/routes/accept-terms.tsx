import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Check, ChevronLeft } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Button } from "@/components/Button";

export const Route = createFileRoute("/accept-terms")({
  head: () => ({
    meta: [
      { title: "Accept terms — Yuna" },
      {
        name: "description",
        content: "Review and accept Yuna's terms before continuing.",
      },
    ],
  }),
  component: AcceptTerms,
});

const TERMS: string[] = [
  "Yuna is only meant for adults",
  "Yuna is not human and can make mistakes",
  "This is not care from a licensed psychologist or therapist",
  "Yuna is not a crisis service",
  "Agree to terms of service",
];

function AcceptTerms() {
  const navigate = useNavigate();
  const [acceptedCount, setAcceptedCount] = useState(0);

  const allAccepted = acceptedCount >= TERMS.length;

  const acceptCurrent = () => {
    setAcceptedCount((n) => Math.min(TERMS.length, n + 1));
  };

  const continueOn = () => {
    if (!allAccepted) return;
    navigate({ to: "/intro" });
  };

  return (
    <PhoneFrame backgroundImage="/background.png">
      <div className="flex-1 flex flex-col px-8 pt-14 pb-10 yuna-fade-in text-white min-h-0">
        <div className="flex items-center justify-between">
          <Button
            surface="dark"
            variant="secondary"
            size="icon"
            onClick={() => navigate({ to: "/auth" })}
            aria-label="Back"
          >
            <ChevronLeft size={14} strokeWidth={1.5} />
          </Button>
          <span className="h-9 w-9" />
        </div>

        <div className="mt-10 yuna-rise text-center">
          <h1 className="text-[32px] leading-tight tracking-tight text-white">
            Let's set up your
            <br />
            private space
          </h1>
          <p className="mt-3 text-sm text-white/75 leading-relaxed max-w-[18rem] mx-auto">
            Please review carefully and accept before continuing with Yuna
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-2.5">
          {TERMS.map((text, i) => {
            if (i < acceptedCount) {
              return <AcceptedTerm key={i} text={text} />;
            }
            if (i === acceptedCount) {
              return (
                <ActiveTerm key={i} text={text} onAgree={acceptCurrent} />
              );
            }
            return null;
          })}
        </div>

        <div className="flex-1" />

        <Button
          surface="dark"
          variant="primary"
          fullWidth
          disabled={!allAccepted}
          onClick={continueOn}
          aria-disabled={!allAccepted}
        >
          Continue
        </Button>
      </div>
    </PhoneFrame>
  );
}

function AcceptedTerm({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm pl-5 pr-3.5 py-3.5 flex items-center gap-3">
      <p className="flex-1 text-[15px] leading-snug text-white/90">{text}</p>
      <CheckBadge />
    </div>
  );
}

function ActiveTerm({
  text,
  onAgree,
}: {
  text: string;
  onAgree: () => void;
}) {
  return (
    <div className="yuna-rise rounded-2xl border border-white/35 bg-white/10 backdrop-blur-sm px-5 pt-4 pb-3 flex flex-col gap-3">
      <p className="text-[15px] leading-snug text-white">{text}</p>
      <div className="flex items-center justify-between">
        <Button
          surface="dark"
          variant="ghost"
          size="sm"
          className="uppercase tracking-[0.14em] font-bold -ml-4"
        >
          Read more
        </Button>
        <Button
          surface="dark"
          variant="primary"
          size="sm"
          onClick={onAgree}
          className="uppercase tracking-[0.14em] font-bold"
        >
          I agree
        </Button>
      </div>
    </div>
  );
}

function CheckBadge() {
  return (
    <span
      aria-hidden="true"
      className="flex items-center justify-center h-7 w-7 rounded-full shrink-0 text-white"
      style={{ backgroundColor: "#66BA24" }}
    >
      <Check size={15} strokeWidth={2.5} />
    </span>
  );
}
