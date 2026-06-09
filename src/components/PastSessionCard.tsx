import { CardRow } from "@/components/Card";
import type { PastSession } from "@/lib/sessions";

const SESSION_NATURE_BGS = [
  "/nature/Background-3.png",
  "/nature/Background-7.png",
  "/nature/Background-11.png",
  "/nature/Background-15.png",
  "/nature/Background-16.png",
];

// A past session is the content card's list-row layout (CardRow): the same
// photo-tinted row as the Home feed, with the date·length as the meta line
// below the title. Fixed-dark like every photo card — white ink on a dark wash
// in both app modes.
export function PastSessionCard({
  session,
  index = 0,
  onClick,
}: {
  session: Pick<PastSession, "id" | "date" | "length" | "title">;
  index?: number;
  onClick?: () => void;
}) {
  const natureBg = SESSION_NATURE_BGS[index % SESSION_NATURE_BGS.length];

  return (
    <CardRow
      title={session.title}
      naturePath={natureBg}
      onClick={onClick}
      interactive={!!onClick}
      meta={
        <span className="text-xs font-medium tracking-[0.08em] uppercase text-white">
          {session.date} · {session.length}
        </span>
      }
    />
  );
}
