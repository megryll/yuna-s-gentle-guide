import { useState } from "react";
import { Card, CardCTA, CardFooter, CardHeader } from "yuna-design-system";

// Card photos live in the app's public/ dir and don't ship to the bundle, so a
// `naturePath` tile falls back to its black wash (still white-on-dark and
// legible). The solid-fill cards render exactly as in the app, so the previews
// lean on those.

function DarkSolidCard() {
  const [saved, setSaved] = useState(false);
  return (
    <div className="max-w-[300px]">
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
    </div>
  );
}

function LightSolidCard() {
  const [saved, setSaved] = useState(false);
  return (
    <div className="max-w-[300px]">
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
    </div>
  );
}

export function SolidDark() {
  return (
    <div className="p-4 grid place-items-center">
      <DarkSolidCard />
    </div>
  );
}

export function SolidLight() {
  return (
    <div className="p-4 grid place-items-center">
      <LightSolidCard />
    </div>
  );
}

export function NewFlag() {
  return (
    <div className="p-4 pt-6 grid place-items-center">
      <div className="max-w-[300px]">
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
      </div>
    </div>
  );
}

export function Completed() {
  return (
    <div className="p-4 pt-6 grid place-items-center">
      <div className="max-w-[300px]">
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
      </div>
    </div>
  );
}
