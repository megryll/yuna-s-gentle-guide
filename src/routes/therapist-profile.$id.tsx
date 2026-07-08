import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { Bookmark, MapPin, Clock, Video, Globe } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { PageHeader } from "@/components/PageHeader";
import { Tag } from "@/components/Tag";
import { Divider } from "@/components/Divider";
import { frostedPanel, TherapistPhoto } from "@/components/TherapistCard";
import { useAppMode } from "@/lib/theme-prefs";
import { useSavedIds, toggleSaved } from "@/lib/therapist-prefs";
import { getTherapist, matchedTherapists } from "@/lib/therapist-data";

export const Route = createFileRoute("/therapist-profile/$id")({
  head: () => ({ meta: [{ title: "Therapist Profile — Yuna" }] }),
  component: ProfileRoute,
});

function ProfileRoute() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const router = useRouter();
  const surface = useAppMode() === "light" ? "light" : "dark";
  const savedIds = useSavedIds();

  const therapist = getTherapist(id) ?? matchedTherapists()[0];

  const saved = savedIds.includes(therapist.id);
  const firstName = therapist.name.replace(/^Dr\.\s+/, "").split(" ")[0];

  const facts = [
    { icon: <Clock size={20} aria-hidden />, value: `${therapist.yearsInPractice} yrs`, label: "In practice" },
    { icon: <Video size={20} aria-hidden />, value: therapist.sessionFormats.join(" & "), label: "Sessions" },
    { icon: <Globe size={20} aria-hidden />, value: therapist.languages.join(", "), label: therapist.languages.length > 1 ? "Languages" : "Language" },
  ];

  return (
    <PhoneFrame themed>
      <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden text-white [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* Hero */}
        <PageHeader
          surface={surface}
          onBack={() =>
            router.history.canGoBack()
              ? router.history.back()
              : navigate({ to: "/therapist-recommendations" })
          }
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

        <div className="px-6 pb-6 flex flex-col gap-6 yuna-fade-in">
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

        </div>
      </div>

      {/* Persistent CTA — always in view, no scrolling needed to book. */}
      <footer className="shrink-0 px-6 pb-10 pt-3">
        <Button
          surface={surface}
          variant="primary"
          fullWidth
          onClick={() => navigate({ to: "/therapist-schedule/$id", params: { id: therapist.id } })}
        >
          Schedule a session
        </Button>
      </footer>
      </div>
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
