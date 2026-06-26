import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Lock } from "lucide-react";
import { WebShell, WebContent } from "@/components/WebShell";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { useAppMode, useModeImage } from "@/lib/theme-prefs";
import { flagSettingsSaved } from "@/lib/settings-saved-toast";

export const Route = createFileRoute("/settings_/subscription")({
  head: () => ({ meta: [{ title: "Subscription — Yuna" }] }),
  component: SubscriptionRoute,
});

function SubscriptionRoute() {
  const navigate = useNavigate();
  const mode = useAppMode();

  const [plan, setPlan] = useState("Limited Access");
  const [codeOpen, setCodeOpen] = useState(false);

  return (
    <WebShell>
      <div className={"text-foreground " + (mode === "dark" ? "overlay-on-dark" : "")}>
        <WebContent width="max-w-2xl">
          <PageHeader
            title="Subscription"
            tone="ink"
            layout="inline"
            className="px-0 pt-0 pb-0"
            onBack={() => navigate({ to: "/settings" })}
          />

          <div className="mt-6 flex flex-col gap-6">
            <div className="rounded-2xl overflow-hidden hairline bg-background/40 backdrop-blur-md">
              <div className="px-4 py-3.5">
                <p className="text-xs leading-4 text-foreground/60">Subscription</p>
                <p className="mt-0.5 text-base leading-6 text-foreground">{plan}</p>
              </div>
            </div>

            <Button surface="light" variant="link" className="self-center" onClick={() => setCodeOpen(true)}>
              <Lock size={15} strokeWidth={1.75} aria-hidden />
              Apply your access code
            </Button>
          </div>
        </WebContent>
      </div>

      <AccessCodeDrawer
        open={codeOpen}
        onOpenChange={setCodeOpen}
        onApply={() => {
          setPlan("Full Access");
          setCodeOpen(false);
          flagSettingsSaved("Your access code has been applied.");
        }}
      />
    </WebShell>
  );
}

function AccessCodeDrawer({
  open,
  onOpenChange,
  onApply,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onApply: () => void;
}) {
  const mode = useAppMode();
  const [code, setCode] = useState("");

  const reset = (v: boolean) => {
    if (!v) setCode("");
    onOpenChange(v);
  };

  return (
    <Drawer open={open} onOpenChange={reset}>
      <DrawerContent className="max-h-[90%]">
        <DrawerHeader className="px-6 pt-3 pb-2 text-left">
          <DrawerTitle>Apply Access Code</DrawerTitle>
          <DrawerDescription className="mt-1">
            Enter the access code from your employer or provider to unlock full access.
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-6 pb-2">
          <TextField
            surface={mode}
            autoComplete="off"
            placeholder="Access code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            aria-label="Access code"
          />
        </div>

        <DrawerFooter className="px-6 pb-8 gap-2">
          <Button surface={mode} variant="primary" fullWidth disabled={code.trim().length === 0} onClick={onApply}>
            Apply code
          </Button>
          <Button surface={mode} variant="link" onClick={() => reset(false)} className="mx-auto">
            Cancel
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
