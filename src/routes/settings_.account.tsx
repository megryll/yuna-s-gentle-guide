import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SquarePen } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { Checkbox } from "@/components/Checkbox";
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
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings_/account")({
  head: () => ({ meta: [{ title: "Account Settings — Yuna" }] }),
  component: AccountSettingsRoute,
});

function AccountSettingsRoute() {
  const navigate = useNavigate();
  const mode = useAppMode();
  const bgImage = useModeImage();

  const [email, setEmail] = useState("megan@yuna.io");
  const [phone, setPhone] = useState("+ 1 6477782199");
  const [emailOpen, setEmailOpen] = useState(false);
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <PhoneFrame>
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ backgroundImage: `url(${bgImage})`, backgroundSize: "cover", backgroundPosition: "center" }}
      />

      <div
        className={
          "relative flex-1 flex flex-col text-foreground min-h-0 " +
          (mode === "dark" ? "overlay-on-dark" : "")
        }
      >
        <PageHeader
          title="Account Settings"
          tone="ink"
          onBack={() => navigate({ to: "/settings" })}
        />

        <div className="flex-1 overflow-y-auto px-6 pt-4 pb-10 flex flex-col gap-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="shrink-0 rounded-2xl overflow-hidden hairline bg-background/40 backdrop-blur-md flex flex-col">
            <FieldRow label="Name" value="Megan" />
            <FieldRow label="Email" value={email} onEdit={() => setEmailOpen(true)} />
            <FieldRow label="Age" value="Missing age" muted />
            <FieldRow label="Gender" value="Missing gender" muted />
            <FieldRow label="Phone number" value={phone} onEdit={() => setPhoneOpen(true)} last />
          </div>

          <Button
            variant="destructive"
            size="sm"
            className="self-center"
            onClick={() => setDeleteOpen(true)}
          >
            Delete Account
          </Button>
        </div>
      </div>

      <UpdateEmailDrawer
        open={emailOpen}
        onOpenChange={setEmailOpen}
        onSave={(next) => {
          setEmail(next);
          setEmailOpen(false);
          flagSettingsSaved("Your email has been updated.");
        }}
      />

      <UpdatePhoneDrawer
        open={phoneOpen}
        current={phone}
        onOpenChange={setPhoneOpen}
        onSave={(next) => {
          setPhone(next);
          setPhoneOpen(false);
          flagSettingsSaved("Your phone number has been updated.");
        }}
      />

      <DeleteAccountDrawer
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDelete={() => {
          setDeleteOpen(false);
          navigate({ to: "/" });
        }}
      />
    </PhoneFrame>
  );
}

// ─── Field row ───────────────────────────────────────────────────────────────

function FieldRow({
  label,
  value,
  muted,
  onEdit,
  last,
}: {
  label: string;
  value: string;
  muted?: boolean;
  onEdit?: () => void;
  last?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 px-4 py-3.5 shrink-0",
        !last && "border-b border-border",
      )}
    >
      <div className="min-w-0">
        <p className="text-xs leading-4 text-foreground/60">{label}</p>
        <p className={cn("mt-0.5 text-base leading-6 truncate", muted ? "text-foreground/60" : "text-foreground")}>
          {value}
        </p>
      </div>
      {onEdit && (
        <Button surface="light" variant="plain" size="icon-sm" aria-label={`Edit ${label}`} onClick={onEdit}>
          <SquarePen strokeWidth={1.75} />
        </Button>
      )}
    </div>
  );
}

// ─── Update Email drawer ─────────────────────────────────────────────────────

function UpdateEmailDrawer({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (email: string) => void;
}) {
  const mode = useAppMode();
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const [understood, setUnderstood] = useState(false);

  const matches = next.trim().length > 0 && next.trim() === repeat.trim();
  const canSave = matches && understood;

  // Reset the form whenever the drawer reopens.
  const reset = (v: boolean) => {
    if (!v) {
      setNext("");
      setRepeat("");
      setUnderstood(false);
    }
    onOpenChange(v);
  };

  return (
    <Drawer open={open} onOpenChange={reset}>
      <DrawerContent className="max-h-[90%]">
        <DrawerHeader className="px-6 pt-3 pb-2 text-left">
          <DrawerTitle>Update Email Address</DrawerTitle>
          <DrawerDescription className="mt-1">
            Enter your new email address. You will be logged out and need to sign in with your new email.
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-6 pb-2 flex flex-col gap-3">
          <TextField
            surface={mode}
            type="email"
            inputMode="email"
            autoComplete="off"
            placeholder="New email address"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            aria-label="New email address"
          />
          <TextField
            surface={mode}
            type="email"
            inputMode="email"
            autoComplete="off"
            placeholder="Repeat email address"
            value={repeat}
            onChange={(e) => setRepeat(e.target.value)}
            aria-label="Repeat email address"
          />
          <Checkbox
            surface={mode}
            checked={understood}
            onChange={setUnderstood}
            label="I understand this action can not be undone"
          />
        </div>

        <DrawerFooter className="px-6 pb-8 gap-2">
          <Button surface={mode} variant="primary" fullWidth disabled={!canSave} onClick={() => onSave(next.trim())}>
            Save
          </Button>
          <Button surface={mode} variant="link" onClick={() => reset(false)} className="mx-auto">
            Cancel
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

// ─── Update Phone drawer ─────────────────────────────────────────────────────

function UpdatePhoneDrawer({
  open,
  current,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  current: string;
  onOpenChange: (v: boolean) => void;
  onSave: (phone: string) => void;
}) {
  const mode = useAppMode();
  const [value, setValue] = useState(current);

  const reset = (v: boolean) => {
    if (!v) setValue(current);
    onOpenChange(v);
  };

  const canSave = value.trim().length > 0 && value.trim() !== current.trim();

  return (
    <Drawer open={open} onOpenChange={reset}>
      <DrawerContent className="max-h-[90%]">
        <DrawerHeader className="px-6 pt-3 pb-2 text-left">
          <DrawerTitle>Update Phone Number</DrawerTitle>
          <DrawerDescription className="mt-1">
            Enter the phone number where you'd like to receive account notifications.
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-6 pb-2">
          <TextField
            surface={mode}
            type="tel"
            inputMode="tel"
            autoComplete="off"
            placeholder="Phone number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-label="Phone number"
          />
        </div>

        <DrawerFooter className="px-6 pb-8 gap-2">
          <Button surface={mode} variant="primary" fullWidth disabled={!canSave} onClick={() => onSave(value.trim())}>
            Save
          </Button>
          <Button surface={mode} variant="link" onClick={() => reset(false)} className="mx-auto">
            Cancel
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

// ─── Delete Account drawer ───────────────────────────────────────────────────

function DeleteAccountDrawer({
  open,
  onOpenChange,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDelete: () => void;
}) {
  const mode = useAppMode();
  const [understood, setUnderstood] = useState(false);

  const reset = (v: boolean) => {
    if (!v) setUnderstood(false);
    onOpenChange(v);
  };

  return (
    <Drawer open={open} onOpenChange={reset}>
      <DrawerContent className="max-h-[90%]">
        <DrawerHeader className="px-6 pt-3 pb-2 text-left">
          <DrawerTitle>Delete Account</DrawerTitle>
          <DrawerDescription className="mt-1">
            Your account will be permanently deleted from our database, including your previous chat history with Yuna.
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-6 pb-2">
          <Checkbox
            surface={mode}
            checked={understood}
            onChange={setUnderstood}
            label="I understand that this action cannot be undone"
          />
        </div>

        <DrawerFooter className="px-6 pb-8 gap-2">
          <Button variant="destructive" fullWidth disabled={!understood} onClick={onDelete}>
            Delete account
          </Button>
          <Button surface={mode} variant="link" onClick={() => reset(false)} className="mx-auto">
            Cancel
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
