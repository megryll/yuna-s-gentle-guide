import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Check, X } from "lucide-react";
import { WebShell } from "@/components/WebShell";
import { Button } from "@/components/Button";
import { Switch } from "@/components/Switch";
import { Badge } from "@/components/Badge";
import { TextArea } from "@/components/TextArea";
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
  // In-app paywall — reached from the rail / top-bar "Upgrade" and the Home
  // tap, so it lives inside WebShell (rail stays as the escape) and follows the
  // user's Light/Dark toggle. WebShell paints the mode photo and inverts ink;
  // DS components drop to `surface="light"` in light mode.
  const mode = useAppMode();
  const surface = mode === "dark" ? "dark" : "light";

  const [trial, setTrial] = useState<TrialId>("free");
  const [remind, setRemind] = useState(false);
  const [plansOpen, setPlansOpen] = useState(false);

  const close = () => navigate({ to: "/home" });
  const active = TRIALS[trial];

  return (
    <WebShell>
      {/* Focused in-app paywall: a decision column centered in the content area
          beside the rail. On desktop it widens and scales type and centers
          vertically, rather than the phone-frame's top-aligned, bottom-pushed
          layout. The close returns to Home. */}
      <div className="min-h-screen flex flex-col text-white yuna-fade-in">
        <div className="flex justify-end px-6 md:px-10 pt-6 md:pt-8">
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

        <div className="flex-1 flex items-center justify-center px-6 md:px-8 pb-16">
          <div className="w-full max-w-md md:max-w-lg">
            <div className="yuna-rise">
              <h1 className="font-display text-3xl md:text-4xl leading-tight tracking-tight text-white">
                Design Your Trial
              </h1>
              <p className="mt-3 md:mt-4 text-sm md:text-base leading-relaxed text-white/85 max-w-[19rem] md:max-w-md">
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

            <div className="mt-10 flex flex-col items-center">
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
        </div>
      </div>

      <AllPlansDrawer open={plansOpen} onOpenChange={setPlansOpen} />
    </WebShell>
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

// The drawer hosts two views: the plan picker and a "Can't afford Yuna?"
// message form the user reaches via the link under the plans. The form swaps in
// place rather than opening a second drawer.
type PlansView = "plans" | "afford";

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
  const [view, setView] = useState<PlansView>("plans");
  const [message, setMessage] = useState("");

  // Reset to the plan picker whenever the drawer fully closes.
  const reset = (v: boolean) => {
    if (!v) {
      setView("plans");
      setMessage("");
    }
    onOpenChange(v);
  };

  return (
    <Drawer open={open} onOpenChange={reset}>
      <DrawerContent>
        {view === "plans" ? (
          <>
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

              <Button
                surface={surface}
                variant="link"
                className="mx-auto mt-1"
                onClick={() => setView("afford")}
              >
                I can't afford Yuna
              </Button>
            </div>

            <DrawerFooter className="flex-row items-center justify-center gap-3 pt-6 pb-8">
              <Button surface={surface} variant="link" onClick={() => reset(false)}>
                Reactivate
              </Button>
              <Dot />
              <Button surface={surface} variant="link" onClick={() => reset(false)}>
                Terms &amp; Conditions
              </Button>
              <Dot />
              <Button surface={surface} variant="link" onClick={() => reset(false)}>
                Privacy Policy
              </Button>
            </DrawerFooter>
          </>
        ) : (
          <>
            <DrawerHeader className="text-left px-6 pt-3 pb-2">
              <DrawerTitle>Can't afford Yuna?</DrawerTitle>
              <DrawerDescription className="mt-2 text-white/85">
                Our mission is to make mental health care accessible to the world. If Yuna isn't in
                your budget right now, send us a message explaining your situation and we'll see
                what we can do.
              </DrawerDescription>
            </DrawerHeader>

            <div className="px-6 pt-2">
              <TextArea
                surface={surface}
                rows={5}
                placeholder="Tell us about your situation"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                aria-label="Tell us about your situation"
              />
            </div>

            <DrawerFooter className="px-6 pb-8 gap-2">
              <Button
                surface={surface}
                variant="primary"
                fullWidth
                disabled={message.trim().length === 0}
                onClick={() => reset(false)}
              >
                Send
              </Button>
              <Button
                surface={surface}
                variant="link"
                className="mx-auto"
                onClick={() => setView("plans")}
              >
                Cancel
              </Button>
            </DrawerFooter>
          </>
        )}
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
