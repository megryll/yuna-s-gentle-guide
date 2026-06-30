import { useState } from "react";
import { Card, CardCTA, CardFooter, CardHeader } from "yuna-design-system";
import { darkPanel } from "./_bg";

// Cards sit on the real photo surface (darkPanel). The tile takes its height
// from a square spacer, so it needs a resolved width — w-[280px], not max-w —
// or it collapses to a thin row in the design host. Photo-tinted (`naturePath`)
// cards still fall back to their black wash since public photos don't ship, so
// these previews lean on solid-fill cards, which render exactly as in the app.

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div style={darkPanel} className="rounded-2xl p-6 grid place-items-center">
      <div className="w-[280px]">{children}</div>
    </div>
  );
}

export function SolidDark() {
  const [saved, setSaved] = useState(false);
  return (
    <Panel>
      <Card tone="dark" solidFill="#6E5A6B">
        <CardHeader meta={{ label: "Recommended Skill", tone: "dark" }} />
        <div className="flex-1 flex items-center justify-center px-6 pt-9">
          <h3 className="font-display text-2xl leading-[1.75] tracking-tight text-white text-center">
            The Non-Judgemental Skill
          </h3>
        </div>
        <CardFooter
          isSaved={saved}
          onToggleSave={() => setSaved((v) => !v)}
          primary={
            <CardCTA tone="dark" onClick={() => {}}>
              Learn this
            </CardCTA>
          }
        />
      </Card>
    </Panel>
  );
}

export function SolidLight() {
  const [saved, setSaved] = useState(false);
  return (
    <Panel>
      <Card tone="light" solidFill="#D4E3F4">
        <CardHeader meta={{ label: "Gratitude List", tone: "light" }} cadence="Daily" />
        <div className="flex-1 flex items-center justify-center px-6 pt-9">
          <h3 className="font-display text-2xl leading-[1.75] tracking-tight text-foreground text-center">
            What went quietly right today?
          </h3>
        </div>
        <CardFooter
          tone="light"
          isSaved={saved}
          onToggleSave={() => setSaved((v) => !v)}
          primary={
            <CardCTA tone="light" onClick={() => {}}>
              My gratitude journal
            </CardCTA>
          }
        />
      </Card>
    </Panel>
  );
}

export function NewFlag() {
  return (
    <Panel>
      <Card tone="dark" isNew solidFill="var(--primary-green)">
        <CardHeader meta={{ label: "Questionnaire", tone: "dark" }} />
        <div className="flex-1 flex items-center justify-center px-6 pt-9">
          <h3 className="font-display text-2xl leading-[1.75] tracking-tight text-white text-center">
            How have you been feeling lately?
          </h3>
        </div>
        <CardFooter
          primary={
            <CardCTA tone="dark" onClick={() => {}}>
              Try it now
            </CardCTA>
          }
        />
      </Card>
    </Panel>
  );
}

export function Completed() {
  return (
    <Panel>
      <Card tone="dark" completed solidFill="#6E5A6B">
        <CardHeader meta={{ label: "Recommended Skill", tone: "dark" }} />
        <div className="flex-1 flex items-center justify-center px-6 pt-9">
          <h3 className="font-display text-2xl leading-[1.75] tracking-tight text-white text-center">
            The Non-Judgemental Skill
          </h3>
        </div>
        <CardFooter
          primary={
            <CardCTA tone="dark" onClick={() => {}}>
              Learn this
            </CardCTA>
          }
        />
      </Card>
    </Panel>
  );
}
