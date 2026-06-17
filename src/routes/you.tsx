import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ScreenChrome } from "@/components/ScreenChrome";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { CardRow, MetaDot } from "@/components/Card";
import { IconMedallion } from "@/components/IconMedallion";
import { Surface } from "@/components/Surface";
import { useUserType } from "@/lib/user-type";
import { useStartChat } from "@/lib/chat-launch";
import { getProfileData, getInsightCategory } from "@/lib/profile-data";
import { SURVEY_LIBRARY, type LibrarySurvey } from "@/lib/survey-library";
import { FocusAreaBentoCard, InsightCategoryTile } from "@/components/profile-components";

const INSIGHT_CATEGORIES = ["breakthroughs", "beliefs", "basics"] as const;

export const Route = createFileRoute("/you")({
  head: () => ({
    meta: [
      { title: "You — Yuna" },
      { name: "description", content: "What Yuna has noticed about you." },
    ],
  }),
  component: YouRoute,
});

function YouRoute() {
  const userType = useUserType();
  const navigate = useNavigate();

  if (userType === "new") return <YouEmptyState />;
  const data = getProfileData(userType);
  // Returning users have history, so their clinical measures read as "taken"
  // (trend + history link); everyone else sees the baseline framing.
  const taken = userType === "returning";

  const openSurvey = (s: LibrarySurvey) => {
    if (s.assessmentId && taken) {
      navigate({ to: "/assessment/$id", params: { id: s.assessmentId } });
      return;
    }
    navigate({ to: s.to, params: s.params });
  };

  // Suggested surveys lead the list; a Suggested badge (not a section header)
  // is what sets them apart. Returning users have already set their baseline, so
  // the onboarding starting-point survey drops off their list.
  const surveys = [
    ...SURVEY_LIBRARY.filter((s) => s.suggested),
    ...SURVEY_LIBRARY.filter((s) => !s.suggested),
  ].filter((s) => !(taken && s.id === "your-starting-point"));

  return (
    <ScreenChrome hideHeader surface="dark">
      <div className="flex-1 flex flex-col px-6 pt-2 pb-12 text-white yuna-fade-in overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex flex-col items-center text-center pt-4">
          <h1 className="font-display text-2xl leading-tight tracking-tight">
            What Yuna knows about you
          </h1>
          <p className="mt-2 text-sm font-medium text-white/60">
            {data.conversations} conversations · {data.messages} messages
          </p>
        </div>

        <div className="mt-8">
          <Section heading="Your Focus Areas">
            <div className="flex gap-2">
              <FocusAreaBentoCard
                num={1}
                title={data.focusArea1.title}
                taskCount={data.tasks1.length}
              />
              <FocusAreaBentoCard
                num={2}
                title={data.focusArea2.title}
                taskCount={data.tasks2.length}
              />
            </div>
          </Section>
        </div>

        <div className="mt-10">
          <Section heading="Insights">
            <div className="flex gap-2">
              {INSIGHT_CATEGORIES.map((cat) => {
                const { title, insights } = getInsightCategory(userType, cat);
                return (
                  <InsightCategoryTile
                    key={cat}
                    category={cat}
                    label={title}
                    count={insights.length}
                  />
                );
              })}
            </div>
          </Section>
        </div>

        <div className="mt-10">
          <Section heading="Try A Questionnaire">
            <div className="flex flex-col gap-4 mt-1">
              {surveys.map((s) => (
                <SurveyLibraryCard key={s.id} survey={s} onOpen={() => openSurvey(s)} />
              ))}
            </div>
          </Section>
        </div>

        <div className="flex flex-col items-center gap-3 mt-10">
          <p className="font-display text-xl leading-7 text-white/90 text-center">
            Something feel off?
          </p>
          <p className="text-sm leading-[22px] text-white/75 text-center max-w-[20rem]">
            Yuna's understanding grows over time. If anything here doesn't feel right, you can help
            refine it.
          </p>
          <Button surface="dark" variant="secondary" size="md" className="mt-1">
            Help Yuna understand you better
          </Button>
        </div>
      </div>
    </ScreenChrome>
  );
}

function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-display text-xl leading-7 text-white text-center">{heading}</h2>
      {children}
    </div>
  );
}

// ─── Survey library ─────────────────────────────────────────────────────────
// Each entry is the compact (list-row) form of the Questionnaire content card
// (green fill + Yuna watermark). A cadence Tag — not a section header — is what
// separates a one-time discovery quiz from a repeating clinical measure; a
// Suggested Badge sits in the card's top-left corner-flag slot. Tapping a row
// opens the survey (or, for a taken clinical measure, its history).

function SurveyLibraryCard({ survey, onOpen }: { survey: LibrarySurvey; onOpen: () => void }) {
  return (
    // Suggested cards reserve top padding equal to the badge's overhang so the
    // badge sits inside this wrapper's box — the flex gap then separates the
    // full card+badge height instead of letting the badge crowd the card above.
    <div className={`relative ${survey.suggested ? "pt-3" : ""}`}>
      {survey.suggested && <Badge className="absolute z-10 top-0 left-4">Suggested</Badge>}
      <CardRow
        title={survey.title}
        tone="dark"
        solidFill="var(--primary-green)"
        watermark="/yuna-mark.svg"
        onClick={onOpen}
        meta={
          <>
            <span className="text-xs font-medium tracking-[0.08em] uppercase text-white">
              Questionnaire
            </span>
            <MetaDot tone="dark">{survey.cadence}</MetaDot>
          </>
        }
      />
    </div>
  );
}

// ─── Empty state (no conversations yet) ─────────────────────────────────────

function YouEmptyState() {
  const startChat = useStartChat();
  const navigate = useNavigate();
  // Suggested surveys lead; everything's available from day one (nothing taken).
  // For a brand-new user the only thing worth suggesting is the starting point —
  // a clinical measure flagged "Suggested" before they've begun reads wrong, so
  // clear the flag on everything else here.
  const surveys = [
    ...SURVEY_LIBRARY.filter((s) => s.suggested),
    ...SURVEY_LIBRARY.filter((s) => !s.suggested),
  ].map((s) => ({ ...s, suggested: s.id === "your-starting-point" }));
  return (
    <ScreenChrome hideHeader surface="dark">
      <div className="flex-1 flex flex-col px-6 pt-2 pb-12 text-white yuna-fade-in overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex flex-col items-center text-center pt-10">
          <EmptyHeroGlow />
          <h1 className="font-display text-2xl leading-[1.15] tracking-tight mt-6">
            Your space, just beginning
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-white/75 max-w-[18rem]">
            As we talk, this space fills with what I come to understand about you.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-2.5">
          <PreviewRow heading="Your Focus Areas" body="Where we focus our work together" />
          <PreviewRow
            heading="Insights"
            body="The breakthroughs, beliefs, and basics I pick up as we talk"
          />
        </div>

        <div className="mt-8 flex justify-center">
          <Button surface="dark" variant="primary" onClick={() => startChat()}>
            Start your first conversation
          </Button>
        </div>

        <div className="mt-12">
          <Section heading="Try A Questionnaire">
            <div className="flex flex-col gap-4 mt-1">
              {surveys.map((s) => (
                <SurveyLibraryCard
                  key={s.id}
                  survey={s}
                  onOpen={() => navigate({ to: s.to, params: s.params })}
                />
              ))}
            </div>
          </Section>
        </div>
      </div>
    </ScreenChrome>
  );
}

function EmptyHeroGlow() {
  return (
    <div className="relative" style={{ width: 96, height: 96 }}>
      <span
        aria-hidden
        className="absolute left-1/2 top-1/2 pointer-events-none rounded-full"
        style={{
          width: 220,
          height: 220,
          background:
            "radial-gradient(circle, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.14) 28%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0) 70%)",
          animation: "glow-breathe 7.5s ease-in-out infinite",
          filter: "blur(2px)",
          transform: "translate(-50%, -50%)",
          willChange: "transform, opacity",
        }}
      />
      <IconMedallion
        size="xl"
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      >
        <img
          src="/assets/profile/emerging.png"
          alt=""
          aria-hidden="true"
          style={{ width: 56, height: 56 }}
        />
      </IconMedallion>
    </div>
  );
}

function PreviewRow({ heading, body }: { heading: string; body: string }) {
  return (
    <Surface dashed className="px-4 py-3.5">
      <p className="text-uppercase font-semibold tracking-[0.1em] uppercase text-white/75">
        {heading}
      </p>
      <p className="text-sm leading-[20px] text-white/75 mt-1">{body}</p>
    </Surface>
  );
}
