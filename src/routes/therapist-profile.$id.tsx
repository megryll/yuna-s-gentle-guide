import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bookmark, MapPin, Clock, Video, Globe, Phone } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { PageHeader } from "@/components/PageHeader";
import { Tag } from "@/components/Tag";
import { Divider } from "@/components/Divider";
import { Toast, ToastViewport } from "@/components/Toast";
import { TextField } from "@/components/TextField";
import { TextArea } from "@/components/TextArea";
import { YunaAvatar } from "@/components/YunaAvatar";
import { frostedPanel, TherapistPhoto } from "@/components/TherapistCard";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { useAppMode } from "@/lib/theme-prefs";
import { useTransientToast } from "@/lib/use-transient-toast";
import { useSavedIds, toggleSaved } from "@/lib/therapist-prefs";
import { getTherapist, matchedTherapists, type Therapist } from "@/lib/therapist-data";

export const Route = createFileRoute("/therapist-profile/$id")({
  head: () => ({ meta: [{ title: "Therapist Profile — Yuna" }] }),
  component: ProfileRoute,
});

function ProfileRoute() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const surface = useAppMode() === "light" ? "light" : "dark";
  const savedIds = useSavedIds();

  const therapist = getTherapist(id) ?? matchedTherapists()[0];

  const [emailOpen, setEmailOpen] = useState(false);
  const { message: sentToast, show: showSentToast, dismiss: dismissSentToast } =
    useTransientToast();

  const saved = savedIds.includes(therapist.id);
  const firstName = therapist.name.replace(/^Dr\.\s+/, "").split(" ")[0];

  const facts = [
    { icon: <Clock size={20} aria-hidden />, value: `${therapist.yearsInPractice} yrs`, label: "In practice" },
    { icon: <Video size={20} aria-hidden />, value: therapist.sessionFormats.join(" & "), label: "Sessions" },
    { icon: <Globe size={20} aria-hidden />, value: therapist.languages.join(", "), label: therapist.languages.length > 1 ? "Languages" : "Language" },
  ];

  return (
    <PhoneFrame themed>
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden text-white [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* Hero */}
        <PageHeader
          surface={surface}
          onBack={() => navigate({ to: "/therapist-recommendations" })}
          trailing={
            <Button
              surface={surface}
              variant="plain"
              size="icon"
              aria-pressed={saved}
              aria-label={saved ? "Remove bookmark" : "Save therapist"}
              onClick={() => toggleSaved(therapist.id)}
            >
              <Bookmark strokeWidth={1.75} fill={saved ? "currentColor" : "none"} />
            </Button>
          }
        />

        <div className="flex flex-col items-center text-center px-8 pb-4">
          <TherapistPhoto src={therapist.photo} size={128} />
          <h1 className="mt-4 font-display text-3xl tracking-tight text-white">{therapist.name}</h1>
          <p className="mt-1.5 text-sm text-white/85">{therapist.credentials}</p>
          <div className="mt-3">
            <Tag surface={surface} variant="informational" icon={<MapPin />}>
              {therapist.location}
            </Tag>
          </div>
        </div>

        <div className="px-6 pb-10 flex flex-col gap-6 yuna-fade-in">
          {/* About */}
          <section>
            <SectionTitle>About {firstName}</SectionTitle>
            <p className="text-sm leading-relaxed text-white/85">{therapist.bio}</p>
          </section>

          {/* Quick facts */}
          <div className="grid grid-cols-3 gap-2">
            {facts.map((f) => (
              <div
                key={f.label}
                className={`rounded-2xl ${frostedPanel(surface)} p-3 flex flex-col items-center text-center gap-1`}
              >
                <span className="text-white/85">{f.icon}</span>
                <span className="text-sm font-semibold leading-tight">{f.value}</span>
                <span className="text-xs text-white/75 leading-tight">{f.label}</span>
              </div>
            ))}
          </div>

          {/* Issues */}
          <section>
            <SectionTitle>Issues {firstName} treats</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {therapist.issues.map((i) => (
                <Tag key={i} surface={surface} variant="informational">{i}</Tag>
              ))}
            </div>
          </section>

          {/* Approach */}
          <section>
            <SectionTitle>Therapy approach</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {therapist.modalities.map((m) => (
                <Tag key={m} surface={surface} variant="informational">{m}</Tag>
              ))}
            </div>
          </section>

          {/* Who they work with */}
          <section>
            <SectionTitle>Who {firstName} works with</SectionTitle>
            <ul className="flex flex-col gap-2.5">
              {[...therapist.ageGroups, ...therapist.communities].map((g) => (
                <li key={g} className="flex items-center gap-3">
                  <Badge icon size="sm" />
                  <span className="text-sm text-white/85">{g}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Fees & insurance */}
          <section>
            <SectionTitle>Fees &amp; insurance</SectionTitle>
            <InfoRows
              surface={surface}
              rows={[
                ["Session fee", therapist.fee.range],
                ["Sliding scale", therapist.fee.slidingScale ? "Available" : "Not available"],
                ["Insurance", therapist.insurance.join(", ")],
              ]}
            />
          </section>

          {/* Education */}
          <section>
            <SectionTitle>Education</SectionTitle>
            <InfoRows
              surface={surface}
              rows={[
                ["Degree", therapist.education.degree],
                ["School", `${therapist.education.school}, ${therapist.education.year}`],
                ["License", therapist.education.license],
              ]}
            />
          </section>

          {/* Contact CTA */}
          <section className={`rounded-3xl ${frostedPanel(surface)} p-6 flex flex-col items-center gap-4`}>
            <Button surface={surface} variant="link" asChild>
              <a href="tel:+15555555555" className="flex items-center gap-2 text-base font-semibold">
                <Phone size={18} strokeWidth={2} aria-hidden /> Call (555) 555-5555
              </a>
            </Button>
            <Button surface={surface} variant="primary" fullWidth onClick={() => setEmailOpen(true)}>
              Draft an email with Yuna
            </Button>
            <Button surface={surface} variant="secondary" fullWidth onClick={() => navigate({ to: "/therapist-schedule/$id", params: { id: therapist.id } })}>
              Schedule a call
            </Button>
          </section>
        </div>
      </div>

      {sentToast && (
        <ToastViewport>
          <Toast
            surface={surface}
            variant="success"
            message="Your message has been sent."
            onDismiss={dismissSentToast}
            className="yuna-fade-in"
          />
        </ToastViewport>
      )}

      <EmailDrawer
        open={emailOpen}
        onOpenChange={setEmailOpen}
        therapist={therapist}
        firstName={firstName}
        onSent={() => {
          setEmailOpen(false);
          showSentToast("Your message has been sent.");
        }}
      />
    </PhoneFrame>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-xl tracking-tight text-white mb-3">{children}</h2>;
}

function InfoRows({ surface, rows }: { surface: "dark" | "light"; rows: [string, string][] }) {
  return (
    <div className="flex flex-col">
      {rows.map(([label, value], i) => (
        <div key={label}>
          <div className="flex items-start justify-between gap-4 py-2.5">
            <span className="text-sm text-white/75 shrink-0">{label}</span>
            <span className="text-sm font-semibold text-white text-right">{value}</span>
          </div>
          {i < rows.length - 1 && <Divider surface={surface} />}
        </div>
      ))}
    </div>
  );
}

// ─── Email draft drawer ──────────────────────────────────────────────────────
// One-off multiline message field, kept inline (single call site). If a second
// place needs a multiline input, promote this to a `TextArea` DS primitive.

function EmailDrawer({
  open,
  onOpenChange,
  therapist,
  firstName,
  onSent,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  therapist: Therapist;
  firstName: string;
  onSent: () => void;
}) {
  const surface = useAppMode();
  const dark = surface === "dark";
  const focus = therapist.issues[0]?.toLowerCase() ?? "what I have been working through";

  const [subject, setSubject] = useState("Connecting through Yuna about working together");
  const [message, setMessage] = useState(
    `Hi ${firstName},\n\nMy name is Megan. I was matched with you through Yuna, my wellness companion, and your profile resonated with what I have been working through.\n\nLately I have been focused on ${focus}, and your approach stood out to me. I would love to find out whether you are taking on new clients, and what a good first step might look like.\n\nThank you for your time,\nMegan`,
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90%]">
        <DrawerHeader className="px-6 pt-3 pb-2 text-left">
          <div className="flex items-center gap-3">
            <YunaAvatar size={40} />
            <div>
              <DrawerTitle>Drafted by Yuna</DrawerTitle>
              <DrawerDescription className="mt-1">
                Yuna pulled from what you have shared. Edit anything before you send.
              </DrawerDescription>
            </div>
          </div>
        </DrawerHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-2 flex flex-col gap-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className={"flex items-center gap-2 rounded-2xl px-4 py-3 " + (dark ? "bg-white/10" : "bg-foreground/5")}>
            <span className="text-uppercase font-semibold uppercase tracking-[0.12em] text-muted-foreground">To</span>
            <span className="text-sm font-semibold truncate">{therapist.name}</span>
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-uppercase font-semibold uppercase tracking-[0.12em] text-muted-foreground">Subject</span>
            <TextField surface={surface} value={subject} onChange={(e) => setSubject(e.target.value)} />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-uppercase font-semibold uppercase tracking-[0.12em] text-muted-foreground">Message</span>
            <TextArea
              surface={surface}
              rows={9}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </label>
        </div>

        <DrawerFooter className="px-6 pb-8 gap-2">
          <Button surface={surface} variant="primary" fullWidth onClick={onSent}>
            Send email
          </Button>
          <Button surface={surface} variant="link" onClick={() => onOpenChange(false)} className="mx-auto">
            Cancel
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
