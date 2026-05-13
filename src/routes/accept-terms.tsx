import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 6l-6 6 6 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
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
      className="flex items-center justify-center h-7 w-7 rounded-full shrink-0"
      style={{ backgroundColor: "#66BA24" }}
    >
      <svg width="15" height="15" viewBox="0 0 17 17" fill="none">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M14.7759 4.77699L14.7763 4.77645C15.1466 4.35163 15.1027 3.70704 14.6781 3.33639C14.2538 2.96609 13.6101 3.00924 13.239 3.43244L6.82275 9.87881C6.619 10.0835 6.30128 10.1213 6.05518 9.97019L3.25594 8.25106C2.8228 7.89368 2.18177 7.95315 1.82187 8.38504C1.46126 8.81778 1.5193 9.46069 1.95125 9.82189L5.53724 13.4722L5.53992 13.4745C6.25505 14.0704 7.3152 13.9862 7.92735 13.2849L14.7759 4.77699Z"
          fill="#FFFFFF"
        />
      </svg>
    </span>
  );
}
