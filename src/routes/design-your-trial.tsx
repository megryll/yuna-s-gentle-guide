import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Check, X } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Button } from "@/components/Button";
import { Switch } from "@/components/Switch";
import { Badge } from "@/components/Badge";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { useAppMode } from "@/lib/theme-prefs";

export const Route = createFileRoute("/design-your-trial")({
  head: () => ({
    meta: [
      { title: "Design your trial — Yuna" },
      { name: "description", content: "Choose how your free trial starts." },
    ],
  }),
  component: DesignYourTrial,
});

// The two trial options the user picks between. Copy mirrors the post-trial
// price so the footer microcopy and CTA can be derived from the selection.
type TrialId = "free" | "extended";

const TRIALS: Record<
  TrialId,
  { price: string; length: string; cta: string; note: string }
> = {
  free: {
    price: "Free",
    length: "3 day trial",
    cta: "Redeem 3 days for $0.00",
    note: "Free access for 3 days, then $69.99/year. Charged yearly. Cancel anytime.",
  },
  extended: {
    price: "$12.49",
    length: "30 day trial",
    cta: "Start 30 days for $12.49",
    note: "30 days for $12.49, then $69.99/year. Charged yearly. Cancel anytime.",
  },
};

function DesignYourTrial() {
  const navigate = useNavigate();
  // In-app paywall — follows the user's Light/Dark toggle like other in-app
  // screens (Home, Chat). The photo and ink invert via `PhoneFrame themed`;
  // DS components drop to `surface="light"` in light mode.
  const mode = useAppMode();
  const surface = mode === "dark" ? "dark" : "light";

  const [trial, setTrial] = useState<TrialId>("free");
  const [remind, setRemind] = useState(false);
  const [plansOpen, setPlansOpen] = useState(false);

  const close = () => navigate({ to: "/home" });
  const active = TRIALS[trial];

  return (
    <PhoneFrame themed>
      <div className="flex-1 flex flex-col px-8 pt-14 pb-10 text-white min-h-0 yuna-fade-in">
        <div className="flex justify-end">
          <Button
            surface={surface}
            variant="secondary"
            size="icon"
            onClick={close}
            aria-label="Close"
          >
            <X strokeWidth={1.6} aria-hidden />
          </Button>
        </div>

        <div className="mt-4 yuna-rise">
          <h1 className="font-display text-3xl leading-tight tracking-tight text-white">
            Design Your Trial
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-white/85 max-w-[19rem]">
            Manage stress, ease anxiety, and build confidence in just 7 minutes a day.
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-3 yuna-rise">
          {(Object.keys(TRIALS) as TrialId[]).map((id) => (
            <Button
              key={id}
              surface={surface}
              variant="card"
              selected={trial === id}
              subtitle={TRIALS[id].length}
              trailing={<RadioDot selected={trial === id} />}
              onClick={() => setTrial(id)}
            >
              {TRIALS[id].price}
            </Button>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
          <span className="text-base text-white/90">Remind me before my trial ends</span>
          <Switch
            surface={surface}
            checked={remind}
            onChange={setRemind}
            label="Remind me before my trial ends"
          />
        </div>

        <div className="mt-auto pt-8 flex flex-col items-center">
          <Button
            surface={surface}
            variant="link"
            onClick={() => setPlansOpen(true)}
          >
            View all plans
          </Button>

          <Button
            surface={surface}
            variant="primary"
            fullWidth
            onClick={close}
            className="mt-5"
          >
            {active.cta}
          </Button>

          <p className="mt-4 text-center text-xs leading-relaxed text-white/75 max-w-[20rem]">
            {active.note}
          </p>
        </div>
      </div>

      <AllPlansDrawer open={plansOpen} onOpenChange={setPlansOpen} />
    </PhoneFrame>
  );
}

// Radio indicator for the trial-option cards. Selected fills with a white check
// in a bordered circle; unselected is an empty hairline circle. (The card's own
// `selected` highlight handles the surrounding fill/border.)
function RadioDot({ selected }: { selected: boolean }) {
  return (
    <span
      aria-hidden
      className={
        "flex h-7 w-7 items-center justify-center rounded-full border " +
        (selected ? "border-white bg-white/15" : "border-white/40")
      }
    >
      {selected && <Check size={16} strokeWidth={2.5} className="text-white" />}
    </span>
  );
}

// ── View all plans ──────────────────────────────────────────────────────────
// Post-trial plan options, shown in the standard drawer. Follows the app's
// Light/Dark toggle along with the paywall behind it.
type PlanId = "yearly" | "monthly";

function AllPlansDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const mode = useAppMode();
  const surface = mode === "dark" ? "dark" : "light";
  const [plan, setPlan] = useState<PlanId>("yearly");

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="text-center px-6 pt-3 pb-2">
          <DrawerTitle>Choose a plan for after your free trial</DrawerTitle>
          <DrawerDescription className="text-white/75">
            Cancel anytime in the app store
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-3 px-6 pt-2">
          <div className="relative">
            <Badge className="absolute -top-3 right-4 z-10">Save 65%</Badge>
            <Button
              surface={surface}
              variant="card"
              selected={plan === "yearly"}
              subtitle="$69.99 paid annually"
              trailing={<PlanPrice>$5.83/month</PlanPrice>}
              onClick={() => setPlan("yearly")}
            >
              <span className="inline-flex items-baseline gap-2">
                Yearly
                <span className="text-sm font-normal text-white/60 line-through">$264</span>
              </span>
            </Button>
          </div>

          <Button
            surface={surface}
            variant="card"
            selected={plan === "monthly"}
            subtitle="$22.00 paid monthly"
            trailing={<PlanPrice>$22/month</PlanPrice>}
            onClick={() => setPlan("monthly")}
          >
            Monthly
          </Button>
        </div>

        <DrawerFooter className="flex-row items-center justify-center gap-3 pt-6 pb-8">
          <Button surface={surface} variant="link" onClick={() => onOpenChange(false)}>
            Reactivate
          </Button>
          <Dot />
          <Button surface={surface} variant="link" onClick={() => onOpenChange(false)}>
            Terms &amp; Conditions
          </Button>
          <Dot />
          <Button surface={surface} variant="link" onClick={() => onOpenChange(false)}>
            Privacy Policy
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function PlanPrice({ children }: { children: React.ReactNode }) {
  return <span className="text-lg font-semibold text-white">{children}</span>;
}

function Dot() {
  return (
    <span aria-hidden className="text-white/40">
      &middot;
    </span>
  );
}
